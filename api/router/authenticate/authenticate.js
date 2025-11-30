const express = require('express');
const router = express.Router();
const { SUCCESS } = require('../../src/response/success');
const { ERROR } = require('../../src/response/error');
const logger = require('../../src/logger/logger');
const { prisma } = require('../../src/db/prisma');
const { validateRequest } = require('../../src/authenticate/authenticate');
const { checkPermission } = require('../../src/middleware/permissionMiddleware');
const { authenticateUserWithData, getUserByEmailOrPhone, updateUserPassword, createUserInDb, generateAllTokens, getUserById, updateLastSignIn, updateUserVerificationStatus } = require('../../src/authenticate/checkpoint');
const { setOtp, verifyOtp } = require('../../src/authenticate/otp_cache');
const { assignGroupsToUser } = require('../../src/permissions/permissions');
const { sendSMS, sendWhatsApp } = require('../../src/sms/sms');
const { sendOtpEmail } = require('../../src/email/email');
const { validateEmail, validatePhone, serializeUserData } = require('./utils');
const { validate } = require('./models');
const { otpRequestSchema, otpVerifyRequestSchema, loginWithOtpRequestSchema, setPasswordSchema, passwordChangeSchema, forgetPasswordSchema, checkUserAvailabilityRequestSchema, changeEmailRequestSchema, refreshTokenRequestSchema, tokenInfoRequestSchema } = require('./models');
const { ProfileAccessibilityEnum, ThemeEnum, UserTypeEnum, LanguageStatusEnum, UserStatusAuthEnum, AuthTypeEnum } = require('../../src/enum/enum');

const validateLoginBody = (req, res, next) => {
  if (!req.body || Object.keys(req.body).length === 0) {
    const errorResponse = ERROR.fromMap('AUTH_INVALID_PAYLOAD', { 
      message: 'Request body is empty. Please send username and password as JSON or form-urlencoded data.'
    });
    return res.status(errorResponse.statusCode).json(errorResponse.detail);
  }
  next();
};

function extractOrigin(req) {
  const origin = req.headers.origin;
  if (origin) {
    try {
      const url = new URL(origin);
      return `${url.protocol}//${url.host}`;
    } catch (e) {
    }
  }
  
  const host = req.headers.host;
  if (host) {
    const scheme = req.secure || req.headers['x-forwarded-proto'] === 'https' ? 'https' : 'http';
    return `${scheme}://${host}`;
  }
  
  const forwardedHost = req.headers['x-forwarded-host'];
  if (forwardedHost) {
    const scheme = req.headers['x-forwarded-proto'] || 'https';
    return `${scheme}://${forwardedHost}`;
  }
  
  return `${req.protocol}://${req.get('host')}`;
}

/**
 * @swagger
 * /api/token:
 *   post:
 *     summary: User login with password
 *     description: Authenticate user with email/phone and password. Accepts both JSON and form-urlencoded data.
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - password
 *             properties:
 *               username:
 *                 type: string
 *               password:
 *                 type: string
 *         application/x-www-form-urlencoded:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - password
 *             properties:
 *               username:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login successful
 *       400:
 *         description: Invalid request payload
 *       401:
 *         description: Invalid credentials
 */
router.post('/token', validateLoginBody, async (req, res, next) => {
  try {
    const username = req.body.username || req.body.user_name;
    const password = req.body.password;
    
    if (!username || !password) {
      const errorResponse = ERROR.fromMap('AUTH_INVALID_PAYLOAD', { 
        message: 'Missing required parameters: username and password'
      });
      return res.status(errorResponse.statusCode).json(errorResponse.detail);
    }
    
    const origin = extractOrigin(req);
    const authResult = await authenticateUserWithData(username, password, origin, req);
    
    if (!authResult) {
      const errorResponse = ERROR.fromMap('AUTH_INVALID_CREDENTIALS', { username });
      return res.status(errorResponse.statusCode).json(errorResponse.detail);
    }
    
    // Serialize user data
    const userDataSerialized = serializeUserData(authResult.user);
    
    return res.status(200).json(
      SUCCESS.response('Login successful', {
        access_token: authResult.access_token,
        refresh_token: authResult.refresh_token,
        session_token: authResult.session_token,
        session_id: authResult.session_id,
        token_type: 'bearer',
        user: userDataSerialized
      })
    );
  } catch (error) {
    logger.error('Error in login_for_access_token', { error: error.message, stack: error.stack, module: 'Auth', label: 'LOGIN_TOKEN' });
    
    const errorResponse = ERROR.fromMap('AUTH_PROCESSING_ERROR', {}, error);
    return res.status(errorResponse.statusCode).json(errorResponse.detail);
  }
});

/**
 * @swagger
 * /api/auth/login-with-password:
 *   post:
 *     summary: User login with password
 *     description: Authenticate user with email/phone and password. Accepts both JSON and form-urlencoded data.
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - password
 *             properties:
 *               username:
 *                 type: string
 *               password:
 *                 type: string
 *         application/x-www-form-urlencoded:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - password
 *             properties:
 *               username:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login successful
 *       400:
 *         description: Invalid request payload
 *       401:
 *         description: Invalid credentials
 */
router.post('/auth/login-with-password', validateLoginBody, async (req, res, next) => {
  try {
    const username = req.body.username || req.body.user_name;
    const password = req.body.password;
    
    if (!username || !password) {
      const errorResponse = ERROR.fromMap('AUTH_INVALID_PAYLOAD', { 
        message: 'Missing required parameters: username and password'
      });
      return res.status(errorResponse.statusCode).json(errorResponse.detail);
    }
    
    // Authenticate user first (without generating tokens yet) to get user_id
    const { authenticateUser } = require('../../src/authenticate/checkpoint');
    const origin = extractOrigin(req);
    const user = await authenticateUser(username, password);
    
    if (!user) {
      const errorResponse = ERROR.fromMap('AUTH_INVALID_CREDENTIALS', { 
        message: 'Invalid username or password'
      });
      return res.status(errorResponse.statusCode).json(errorResponse.detail);
    }
    
    // Check user account status
    const userId = String(user.user_id);
    
    if (!user.is_active) {
      const errorResponse = ERROR.fromMap('AUTH_INVALID_CREDENTIALS', { 
        message: 'User account is not active'
      });
      return res.status(errorResponse.statusCode).json(errorResponse.detail);
    }
    
    if (!user.is_verified) {
      const errorResponse = ERROR.fromMap('AUTH_INVALID_CREDENTIALS', { 
        message: 'User account is not verified'
      });
      return res.status(errorResponse.statusCode).json(errorResponse.detail);
    }
    
    // Clear user-level blacklist entries BEFORE generating tokens
    try {
      const {
        clearUserBlacklist,
        clearUserRefreshTokenBlacklist
      } = require('../../src/authenticate/session_manager');
      await clearUserBlacklist(userId);
      await clearUserRefreshTokenBlacklist(userId);
    } catch (clearError) {
      // Log but don't fail login if clearing blacklist fails
      logger.warn(`Failed to clear user blacklist (non-blocking): ${clearError.message}`, { module: 'Auth', label: 'LOGIN' });
    }
    
    // Now generate tokens (after clearing blacklist)
    const tokens = generateAllTokens(user, origin, req);
    
    // Serialize user data
    const userDataSerialized = serializeUserData(user);
    
    // Return all tokens and user data
    return res.status(200).json(
      SUCCESS.response('Login successful', {
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        session_token: tokens.session_token,
        session_id: tokens.session_id,
        token_type: 'bearer',
        user: userDataSerialized
      })
    );
  } catch (error) {
    logger.error('Error in login', { error: error.message, stack: error.stack, module: 'Auth', label: 'LOGIN' });
    const errorResponse = ERROR.fromMap('AUTH_PROCESSING_ERROR', {}, error);
    return res.status(errorResponse.statusCode).json(errorResponse.detail);
  }
});

/**
 * @swagger
 * /api/auth/send-one-time-password:
 *   post:
 *     summary: Send OTP
 *     description: Send one-time password via email, SMS, or WhatsApp
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - user_id
 *               - channel
 *             properties:
 *               user_id:
 *                 type: string
 *               channel:
 *                 type: string
 *                 enum: [email, sms, whatsapp]
 *     responses:
 *       200:
 *         description: OTP sent successfully
 */
router.post('/auth/send-one-time-password', async (req, res, next) => {
  try {
    const { error: validationError, value } = validate(req.body, otpRequestSchema);
    if (validationError) {
      const errorResponse = ERROR.fromMap('AUTH_INVALID_PAYLOAD', { error: validationError });
      return res.status(errorResponse.statusCode).json(errorResponse.detail);
    }
    
    const { user_id, channel } = value;
    const otp = await setOtp(user_id, 600);
    
    if (!otp) {
      const errorResponse = ERROR.fromMap('AUTH_OTP_SEND_FAILED', { user_id });
      return res.status(errorResponse.statusCode).json(errorResponse.detail);
    }
    
    if (channel === 'email') {
      await sendOtpEmail(user_id, otp);
    } else if (channel === 'sms') {
      await sendSMS(user_id, `Your OTP is ${otp}. It is valid for 10 minutes.`);
    } else if (channel === 'whatsapp') {
      await sendWhatsApp(user_id, otp);
    } else {
      const errorResponse = ERROR.fromMap('AUTH_CHANNEL_UNSUPPORTED', { channel });
      return res.status(errorResponse.statusCode).json(errorResponse.detail);
    }
    
    return res.status(200).json(
      SUCCESS.response('OTP sent successfully', { message: 'OTP sent successfully' })
    );
  } catch (error) {
    logger.error('Error in send_one_time_password', { error: error.message, module: 'Auth', label: 'SEND_OTP' });
    next(error);
  }
});

/**
 * @swagger
 * /api/auth/verify-one-time-password:
 *   post:
 *     summary: Verify OTP
 *     description: Verify one-time password
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - user_id
 *               - channel
 *               - otp
 *             properties:
 *               user_id:
 *                 type: string
 *               channel:
 *                 type: string
 *               otp:
 *                 type: string
 *     responses:
 *       200:
 *         description: OTP verified successfully
 */
router.post('/auth/verify-one-time-password', async (req, res, next) => {
  try {
    const { error: validationError, value } = validate(req.body, otpVerifyRequestSchema);
    if (validationError) {
      const errorResponse = ERROR.fromMap('AUTH_INVALID_PAYLOAD', { error: validationError });
      return res.status(errorResponse.statusCode).json(errorResponse.detail);
    }
    
    const { user_id, otp } = value;
    const isValid = await verifyOtp(user_id, otp, false);
    
    if (!isValid) {
      const errorResponse = ERROR.fromMap('AUTH_OTP_INVALID', { user_id });
      return res.status(errorResponse.statusCode).json(errorResponse.detail);
    }
    
    return res.status(200).json(
      SUCCESS.response('Verify Successfully', { user_id })
    );
  } catch (error) {
    logger.error('Error in verify_and_save_password', { error: error.message, module: 'Auth', label: 'VERIFY_OTP' });
    next(error);
  }
});

/**
 * @swagger
 * /api/auth/login-with-otp:
 *   post:
 *     summary: Login with OTP
 *     description: Verify OTP and login user. Returns access token upon successful verification.
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - user_id
 *               - channel
 *               - otp
 *             properties:
 *               user_id:
 *                 type: string
 *                 description: Email or phone number
 *               channel:
 *                 type: string
 *                 enum: [email, sms, whatsapp]
 *                 description: Channel used to send OTP
 *               otp:
 *                 type: string
 *                 description: One-time password to verify
 *     responses:
 *       200:
 *         description: Login successful
 *       400:
 *         description: Invalid request payload
 *       401:
 *         description: Invalid OTP or user not found
 */
router.post('/auth/login-with-otp', async (req, res, next) => {
  try {
    const { error: validationError, value } = validate(req.body, loginWithOtpRequestSchema);
    if (validationError) {
      const errorResponse = ERROR.fromMap('AUTH_INVALID_PAYLOAD', { error: validationError });
      return res.status(errorResponse.statusCode).json(errorResponse.detail);
    }
    
    const { user_id, channel, otp } = value;
    
    const userIdClean = user_id.trim();
    if (!validateEmail(userIdClean) && !validatePhone(userIdClean)) {
      const errorResponse = ERROR.fromMap('AUTH_INVALID_PAYLOAD', { 
        user_id: userIdClean, 
        message: 'Invalid email or phone number format' 
      });
      return res.status(errorResponse.statusCode).json(errorResponse.detail);
    }
    
    const user = await getUserByEmailOrPhone(userIdClean);
    if (!user) {
      const errorResponse = ERROR.fromMap('USER_NOT_FOUND', { user_id: userIdClean });
      return res.status(errorResponse.statusCode).json(errorResponse.detail);
    }
    
    if (!user.is_active || !user.is_verified) {
      const errorResponse = ERROR.fromMap('AUTH_INVALID_CREDENTIALS', { 
        user_id: userIdClean,
        message: 'User account is not active or verified'
      });
      return res.status(errorResponse.statusCode).json(errorResponse.detail);
    }
    
    const isValid = await verifyOtp(userIdClean, otp, true);
    if (!isValid) {
      const errorResponse = ERROR.fromMap('AUTH_OTP_INVALID', { user_id: userIdClean, channel });
      return res.status(errorResponse.statusCode).json(errorResponse.detail);
    }
    
    const origin = extractOrigin(req);
    
    // Update user verification status based on channel
    // This verifies the account (email or phone) when logging in with OTP
    if (channel) {
      await updateUserVerificationStatus(user.user_id, channel);
    }
    
    // Update last sign in
    await updateLastSignIn(user.user_id);
    
    // Clear user-level blacklist entries to allow new sessions after logout
    try {
      const {
        clearUserBlacklist,
        clearUserRefreshTokenBlacklist
      } = require('../../src/authenticate/session_manager');
      await clearUserBlacklist(String(user.user_id));
      await clearUserRefreshTokenBlacklist(String(user.user_id));
    } catch (clearError) {
      // Log but don't fail login if clearing blacklist fails
      logger.warn(`Failed to clear user blacklist (non-blocking): ${clearError.message}`, { module: 'Auth', label: 'LOGIN_OTP' });
    }
    
    // Generate tokens directly (don't use authenticate_user_with_data with OTP as password)
    const tokens = generateAllTokens(user, origin, req);
    
    // Serialize user data
    const userDataSerialized = serializeUserData(user);
    
    return res.status(200).json(
      SUCCESS.response('Login successful', {
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        session_token: tokens.session_token,
        session_id: tokens.session_id,
        token_type: 'bearer',
        user: userDataSerialized
      })
    );
  } catch (error) {
    logger.error('Error in login_with_otp', { error: error.message, stack: error.stack, module: 'Auth', label: 'LOGIN_OTP' });
    const errorResponse = ERROR.fromMap('AUTH_PROCESSING_ERROR', {}, error);
    return res.status(errorResponse.statusCode).json(errorResponse.detail);
  }
});

/**
 * @swagger
 * /api/auth/verify:
 *   post:
 *     summary: Signup/Register
 *     description: Verify OTP and create new user account
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - user_id
 *               - channel
 *               - otp
 *             properties:
 *               user_id:
 *                 type: string
 *               channel:
 *                 type: string
 *               otp:
 *                 type: string
 *     responses:
 *       200:
 *         description: Signup successful
 */
router.post('/auth/verify', async (req, res, next) => {
  try {
    const { error: validationError, value } = validate(req.body, otpVerifyRequestSchema);
    if (validationError) {
      const errorResponse = ERROR.fromMap('AUTH_INVALID_PAYLOAD', { error: validationError });
      return res.status(errorResponse.statusCode).json(errorResponse.detail);
    }
    
    const { user_id, channel, otp } = value;
    
    // Check if master OTP is used
    const { isMasterOtp } = require('../../src/authenticate/otp_cache');
    const isMasterOtpUsed = isMasterOtp(otp);
    
    let isValid = await verifyOtp(user_id, otp, false);
    if (!isValid && !isMasterOtpUsed) {
      const errorResponse = ERROR.fromMap('AUTH_OTP_INVALID', { user_id, channel });
      return res.status(errorResponse.statusCode).json(errorResponse.detail);
    }
    
    if (!validatePhone(user_id) && !validateEmail(user_id)) {
      const errorResponse = ERROR.fromMap('AUTH_INVALID_PAYLOAD', { user_id, channel });
      return res.status(errorResponse.statusCode).json(errorResponse.detail);
    }
    
    const existingUser = await getUserByEmailOrPhone(user_id);
    if (existingUser) {
      const errorResponse = ERROR.fromMap('AUTH_USER_ALREADY_EXISTS', { user_id, channel });
      return res.status(errorResponse.statusCode).json(errorResponse.detail);
    }
    
    const userDataDict = {
      password: otp,
      is_active: true,
      is_verified: true
    };
    
    if (channel === 'sms' || channel === 'whatsapp') {
      let phoneNumber = user_id.trim();
      if (channel === 'whatsapp' && phoneNumber.startsWith('+')) {
        phoneNumber = phoneNumber.substring(1);
      }
      userDataDict.phone_number = { phone: phoneNumber };
      userDataDict.auth_type = AuthTypeEnum.phone;
      userDataDict.user_name = phoneNumber.replace('+', '');
      userDataDict.is_phone_verified = true;
      userDataDict.phone_number_verified_at = new Date();
      userDataDict.is_email_verified = false;
    } else if (channel === 'email') {
      userDataDict.email = user_id;
      userDataDict.user_name = user_id.split('@')[0];
      userDataDict.auth_type = AuthTypeEnum.email;
      userDataDict.is_email_verified = true;
      userDataDict.email_verified_at = new Date();
      userDataDict.is_phone_verified = false;
    }
    
    userDataDict.profile_accessibility = ProfileAccessibilityEnum.public;
    userDataDict.theme = ThemeEnum.light;
    userDataDict.user_type = UserTypeEnum.customer;
    userDataDict.language = LanguageStatusEnum.en;
    userDataDict.status = UserStatusAuthEnum.ACTIVE;
    
    const createdUserId = await createUserInDb(userDataDict);
    if (!createdUserId) {
      const errorResponse = ERROR.fromMap('AUTH_SIGNUP_FAILED', { user_id, channel });
      return res.status(errorResponse.statusCode).json(errorResponse.detail);
    }
    
    // Assign group based on OTP type (master OTP = super_admin, normal OTP = user)
    // This is CRITICAL - user must have a group to have permissions
    try {
      if (isMasterOtpUsed) {
        // Master OTP used - assign super_admin group
        await assignGroupsToUser(createdUserId, ['super_admin'], null);
        logger.info(`Master OTP used - assigned super_admin group to user ${createdUserId}`);
      } else {
        // Normal OTP - assign user group (required for basic permissions like edit_profile)
        await assignGroupsToUser(createdUserId, ['user'], null);
      }

      // Verify group was assigned successfully
      const { getUserGroups } = require('../../src/permissions/permissions');
      const userGroups = await getUserGroups(createdUserId);
      if (!userGroups || userGroups.length === 0) {
        const errorResponse = ERROR.fromMap('AUTH_SIGNUP_FAILED', {
          message: 'Failed to assign user group. User created but group assignment failed.',
          user_id: createdUserId
        });
        return res.status(errorResponse.statusCode).json(errorResponse.detail);
      }
    } catch (groupError) {
      // Group assignment is critical - fail signup if it fails
      logger.error(`CRITICAL: Failed to assign group to user ${createdUserId}: ${groupError.message}`, { module: 'Auth', label: 'SIGNUP' });
      const errorResponse = ERROR.fromMap('AUTH_SIGNUP_FAILED', {
        message: `Failed to assign user group: ${groupError.message}`,
        user_id: createdUserId,
        error: groupError.message
      });
      return res.status(errorResponse.statusCode).json(errorResponse.detail);
    }
    
    const userData = await getUserByEmailOrPhone(user_id);
    if (!userData) {
      const errorResponse = ERROR.fromMap('AUTH_SIGNUP_FAILED', { user_id, channel });
      return res.status(errorResponse.statusCode).json(errorResponse.detail);
    }
    
    const origin = extractOrigin(req);
    const authResult = await authenticateUserWithData(user_id, otp, origin, req);
    if (!authResult) {
      const errorResponse = ERROR.fromMap('AUTH_SIGNUP_FAILED', { user_id, channel });
      return res.status(errorResponse.statusCode).json(errorResponse.detail);
    }
    
    // Only delete OTP if it was a regular OTP (not master OTP)
    if (!isMasterOtpUsed) {
      await verifyOtp(user_id, otp, true);
    }
    
    const userDataSerialized = serializeUserData(authResult.user);
    
    return res.status(200).json(
      SUCCESS.response('Signup successful', {
        access_token: authResult.access_token,
        refresh_token: authResult.refresh_token,
        session_token: authResult.session_token,
        session_id: authResult.session_id,
        token_type: 'bearer',
        user: userDataSerialized
      })
    );
  } catch (error) {
    logger.error('Error in signup', { error: error.message, module: 'Auth', label: 'SIGNUP' });
    next(error);
  }
});

/**
 * @swagger
 * /api/auth/set-password:
 *   post:
 *     summary: Set password
 *     description: Set password for authenticated user
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - password
 *               - confirm_password
 *             properties:
 *               password:
 *                 type: string
 *               confirm_password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Password set successfully
 */
router.post('/auth/set-password', validateRequest, checkPermission('edit_profile'), async (req, res, next) => {
  try {
    const { error: validationError, value } = validate(req.body, setPasswordSchema);
    if (validationError) {
      const errorResponse = ERROR.fromMap('AUTH_INVALID_PAYLOAD', { error: validationError });
      return res.status(errorResponse.statusCode).json(errorResponse.detail);
    }
    
    const { confirm_password } = value;
    const userId = req.user.uid || req.user.user_id;
    
    const success = await updateUserPassword(userId, confirm_password);
    if (!success) {
      const errorResponse = ERROR.fromMap('AUTH_PASSWORD_UPDATE_FAILED', { user_id: userId });
      return res.status(errorResponse.statusCode).json(errorResponse.detail);
    }
    
    return res.status(200).json(
      SUCCESS.response('Password set successfully', { message: 'Password set successfully' })
    );
  } catch (error) {
    logger.error('Error in set_password', { error: error.message, module: 'Auth', label: 'SET_PASSWORD' });
    next(error);
  }
});

/**
 * @swagger
 * /api/auth/change-password:
 *   post:
 *     summary: Change password
 *     description: Change password for authenticated user
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - user_id
 *               - channel
 *               - old_password
 *               - password
 *               - confirm_password
 *             properties:
 *               user_id:
 *                 type: string
 *               channel:
 *                 type: string
 *               old_password:
 *                 type: string
 *               password:
 *                 type: string
 *               confirm_password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Password updated successfully
 */
router.post('/auth/change-password', validateRequest, checkPermission('edit_profile'), async (req, res, next) => {
  try {
    const { error: validationError, value } = validate(req.body, passwordChangeSchema);
    if (validationError) {
      const errorResponse = ERROR.fromMap('AUTH_INVALID_PAYLOAD', { error: validationError });
      return res.status(errorResponse.statusCode).json(errorResponse.detail);
    }
    
    const { user_id, old_password, confirm_password } = value;
    const { authenticateUser } = require('../../src/authenticate/checkpoint');
    
    const user = await authenticateUser(user_id, old_password);
    if (!user) {
      const errorResponse = ERROR.fromMap('AUTH_PASSWORD_INVALID_OLD', { user_id });
      return res.status(errorResponse.statusCode).json(errorResponse.detail);
    }
    
    const currentUserId = req.user.uid || req.user.user_id;
    const success = await updateUserPassword(currentUserId, confirm_password);
    if (!success) {
      const errorResponse = ERROR.fromMap('AUTH_PASSWORD_UPDATE_FAILED', { user_id });
      return res.status(errorResponse.statusCode).json(errorResponse.detail);
    }
    
    return res.status(200).json(
      SUCCESS.response('Password updated successfully', { message: 'Password updated successfully' })
    );
  } catch (error) {
    logger.error('Error in change_password', { error: error.message, module: 'Auth', label: 'CHANGE_PASSWORD' });
    next(error);
  }
});

/**
 * @swagger
 * /api/auth/forget-password:
 *   post:
 *     summary: Forget password
 *     description: Reset password after verifying OTP
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - user_id
 *               - otp
 *               - password
 *               - confirm_password
 *             properties:
 *               user_id:
 *                 type: string
 *               otp:
 *                 type: string
 *               password:
 *                 type: string
 *               confirm_password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Password updated successfully
 */
router.post('/auth/forget-password', async (req, res, next) => {
  try {
    const { error: validationError, value } = validate(req.body, forgetPasswordSchema);
    if (validationError) {
      const errorResponse = ERROR.fromMap('AUTH_INVALID_PAYLOAD', { error: validationError });
      return res.status(errorResponse.statusCode).json(errorResponse.detail);
    }
    
    const { user_id, otp, confirm_password } = value;
    
    const isValid = await verifyOtp(user_id, otp);
    if (!isValid) {
      const errorResponse = ERROR.fromMap('AUTH_OTP_INVALID', { user_id });
      return res.status(errorResponse.statusCode).json(errorResponse.detail);
    }
    
    const userIdClean = user_id.trim();
    if (!validatePhone(userIdClean) && !validateEmail(userIdClean)) {
      const errorResponse = ERROR.fromMap('AUTH_INVALID_PAYLOAD', { user_id: userIdClean });
      return res.status(errorResponse.statusCode).json(errorResponse.detail);
    }
    
    const user = await getUserByEmailOrPhone(userIdClean);
    if (!user) {
      const errorResponse = ERROR.fromMap('USER_NOT_FOUND', { user_id: userIdClean });
      return res.status(errorResponse.statusCode).json(errorResponse.detail);
    }
    
    const success = await updateUserPassword(String(user.user_id), confirm_password);
    if (!success) {
      const errorResponse = ERROR.fromMap('AUTH_FORGOT_PASSWORD_FAILED', { user_id: userIdClean });
      return res.status(errorResponse.statusCode).json(errorResponse.detail);
    }
    
    return res.status(200).json(
      SUCCESS.response('Password updated successfully', { message: 'Password updated successfully' })
    );
  } catch (error) {
    logger.error('Error in forget_password', { error: error.message, module: 'Auth', label: 'FORGET_PASSWORD' });
    next(error);
  }
});

/**
 * @swagger
 * /api/auth/refresh-token:
 *   post:
 *     summary: Refresh all tokens
 *     description: Refresh all tokens using refresh_token from client. Returns new access_token, refresh_token, session_token, and session_id.
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - refresh_token
 *             properties:
 *               refresh_token:
 *                 type: string
 *     responses:
 *       200:
 *         description: Tokens refreshed successfully
 *       401:
 *         description: Invalid or expired refresh token
 */
router.post('/auth/refresh-token', async (req, res, next) => {
  try {
    const { error: validationError, value } = validate(req.body, refreshTokenRequestSchema);
    if (validationError) {
      const errorResponse = ERROR.fromMap('AUTH_INVALID_PAYLOAD', { error: validationError });
      return res.status(errorResponse.statusCode).json(errorResponse.detail);
    }

    const { refresh_token } = value;

    if (!refresh_token || !refresh_token.trim()) {
      const errorResponse = ERROR.fromMap('AUTH_INVALID_PAYLOAD', { 
        message: 'refresh_token is required' 
      });
      return res.status(errorResponse.statusCode).json(errorResponse.detail);
    }

    const jwt = require('jsonwebtoken');
    const SECRET_KEY = process.env.JWT_SECRET_KEY || process.env.JWT_SECRET;
    const ALGORITHM = 'HS256';

    if (!SECRET_KEY) {
      const errorResponse = ERROR.fromMap('AUTH_REFRESH_FAILED', { 
        message: 'JWT configuration error' 
      });
      return res.status(errorResponse.statusCode).json(errorResponse.detail);
    }

    // Decode and validate refresh token
    let tokenPayload;
    try {
      try {
        tokenPayload = jwt.verify(refresh_token, SECRET_KEY, { 
          algorithms: [ALGORITHM],
          audience: 'authenticated'
        });
      } catch (audienceError) {
        // Fallback: try without audience if token wasn't created with audience
        tokenPayload = jwt.verify(refresh_token, SECRET_KEY, { 
          algorithms: [ALGORITHM]
        });
      }
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        const errorResponse = ERROR.fromMap('AUTH_INVALID_REFRESH_TOKEN', { 
          message: 'Refresh token has expired' 
        });
        return res.status(errorResponse.statusCode).json(errorResponse.detail);
      }
      logger.error('JWT decode error for refresh token', { error: error.message, module: 'Auth', label: 'REFRESH_TOKEN' });
      const errorResponse = ERROR.fromMap('AUTH_INVALID_REFRESH_TOKEN', { 
        message: `Invalid refresh token: ${error.message}` 
      });
      return res.status(errorResponse.statusCode).json(errorResponse.detail);
    }

    // Validate token type
    if (tokenPayload.type !== 'refresh') {
      const errorResponse = ERROR.fromMap('AUTH_INVALID_TOKEN_TYPE', { 
        message: 'Token is not a refresh token' 
      });
      return res.status(errorResponse.statusCode).json(errorResponse.detail);
    }

    // Extract user_id and session_id
    const userId = tokenPayload.sub;
    const sessionId = tokenPayload.session_id;

    if (!userId) {
      const errorResponse = ERROR.fromMap('AUTH_USER_NOT_FOUND', { 
        message: 'User ID not found in token' 
      });
      return res.status(errorResponse.statusCode).json(errorResponse.detail);
    }

    // TODO: Add blacklist checking when session management is implemented
    // Check if refresh token is blacklisted
    // Check if session is blacklisted
    // Check if user refresh tokens are revoked

    // Get user from database
    const user = await getUserById(userId);
    if (!user) {
      const errorResponse = ERROR.fromMap('USER_NOT_FOUND', { user_id: userId });
      return res.status(errorResponse.statusCode).json(errorResponse.detail);
    }

    // Get origin for new tokens
    const origin = extractOrigin(req);

    // Token rotation: Blacklist old tokens and session before generating new ones
    // This invalidates all old tokens (access, session, refresh) with the old session_id
    const {
      blacklistToken,
      blacklistSession
    } = require('../../src/authenticate/session_manager');
    
    await blacklistToken(refresh_token, 'refresh');
    if (sessionId) {
      // Blacklisting session_id invalidates ALL tokens (access, session, refresh) with that session_id
      await blacklistSession(sessionId);
    }

    // Generate NEW tokens with NEW session_id (complete token rotation)
    // This updates ALL tokens: access_token, session_token, and refresh_token
    const tokens = generateAllTokens(user, origin, req);

    return res.status(200).json(
      SUCCESS.response('Tokens refreshed successfully', {
        access_token: tokens.access_token,      // NEW access token
        refresh_token: tokens.refresh_token,    // NEW refresh token (rotated)
        session_token: tokens.session_token,    // NEW session token
        session_id: tokens.session_id,          // NEW session ID
        token_type: 'bearer'
      })
    );
  } catch (error) {
    logger.error('Error refreshing token', { error: error.message, stack: error.stack, module: 'Auth', label: 'REFRESH_TOKEN' });
    const errorResponse = ERROR.fromMap('AUTH_REFRESH_FAILED', {}, error);
    return res.status(errorResponse.statusCode).json(errorResponse.detail);
  }
});

/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     summary: Logout user
 *     description: Logout user and revoke all tokens and sessions. Returns user data.
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Successfully logged out
 */
router.post('/auth/logout', validateRequest, checkPermission('view_profile'), async (req, res, next) => {
  try {
    const userId = String(req.user.uid || req.user.user_id);
    const { v4: uuidv4 } = require('uuid');
    const responseId = uuidv4();

    // Initialize revocation statuses
    let accessTokenRevoked = false;
    let refreshTokensRevoked = false;
    let sessionsRevoked = false;
    let tokensRevoked = false;

    try {
      // Extract access token from request header
      const authHeader = req.headers.authorization || '';
      let token = null;
      let tokenJti = null;

      if (authHeader.startsWith('Bearer ')) {
        token = authHeader.replace('Bearer ', '').trim();
      } else {
        // Try X-Session-Token header as fallback
        token = req.headers['x-session-token'] || '';
      }

      // Decode token to get JTI (for logout, we need to decode even expired tokens)
      if (token) {
        try {
          const jwt = require('jsonwebtoken');
          const SECRET_KEY = process.env.JWT_SECRET_KEY || process.env.JWT_SECRET;
          const ALGORITHM = 'HS256';

          if (!SECRET_KEY) {
            logger.error('JWT_SECRET_KEY not set in environment', { module: 'Auth', label: 'LOGOUT' });
            throw new Error('JWT configuration error');
          }

          // Try to decode with audience first, without expiration check (for expired tokens)
          let payload;
          try {
            payload = jwt.decode(token, SECRET_KEY, {
              algorithms: [ALGORITHM],
              audience: 'authenticated',
              complete: false
            });
            if (!payload) {
              // Try without audience
              payload = jwt.decode(token, SECRET_KEY, {
                algorithms: [ALGORITHM],
                complete: false
              });
            }
            tokenJti = payload ? payload.jti : null;
          } catch (decodeError) {
            // Last resort: decode without signature verification (for corrupted tokens)
            try {
              payload = jwt.decode(token, { complete: false });
              tokenJti = payload ? payload.jti : null;
            } catch (error) {
              tokenJti = null;
              logger.warn(`Could not decode token for user: ${userId}`, { module: 'Auth', label: 'LOGOUT' });
            }
          }

          // Blacklist current access token if JTI is available
          if (tokenJti) {
            const {
              blacklistAccessTokenByJti
            } = require('../../src/authenticate/session_manager');
            // Use 45 days expiry (3888000 seconds = 45 days)
            accessTokenRevoked = await blacklistAccessTokenByJti(
              tokenJti,
              userId,
              3888000 // 45 days
            );
            if (!accessTokenRevoked) {
              logger.warn(`Failed to blacklist access token for user: ${userId}, jti: ${tokenJti}`, { module: 'Auth', label: 'LOGOUT' });
            }
          } else {
            logger.warn(`Token JTI not found in token payload for user: ${userId}`, { module: 'Auth', label: 'LOGOUT' });
          }
        } catch (error) {
          logger.error(`Could not extract or blacklist access token: ${error.message}`, { module: 'Auth', label: 'LOGOUT' });
          // Continue with logout even if token extraction fails
        }
      }

      // Revoke all refresh tokens for this user
      const {
        revokeAllUserRefreshTokens,
        blacklistAllUserSessions
      } = require('../../src/authenticate/session_manager');
      
      refreshTokensRevoked = await revokeAllUserRefreshTokens(userId);
      if (!refreshTokensRevoked) {
        logger.warn(`Failed to revoke refresh tokens for user: ${userId}`, { module: 'Auth', label: 'LOGOUT' });
      }

      // Revoke all sessions for this user (complete logout from all devices)
      const sessionsRevokedCount = await blacklistAllUserSessions(userId);
      sessionsRevoked = sessionsRevokedCount > 0;
      if (!sessionsRevoked) {
        logger.warn(`Failed to revoke sessions for user: ${userId}`, { module: 'Auth', label: 'LOGOUT' });
      }

      // Determine overall tokens_revoked status
      tokensRevoked = accessTokenRevoked && refreshTokensRevoked && sessionsRevoked;

      // Build response message
      let logoutMessage;
      if (accessTokenRevoked && refreshTokensRevoked && sessionsRevoked) {
        logoutMessage = 'Logged out successfully. All tokens and sessions have been revoked.';
      } else {
        logoutMessage = 'Logged out successfully. Some tokens may still be active.';
      }

      // Build response data
      const responseData = {
        message: 'Logged out successfully',
        access_token_revoked: accessTokenRevoked,
        refresh_tokens_revoked: refreshTokensRevoked,
        sessions_revoked: sessionsRevoked,
        tokens_revoked: tokensRevoked
      };

      return res.status(200).json(
        SUCCESS.response(logoutMessage, responseData, { type: 'dict' })
      );
    } catch (error) {
      logger.error('Error in logout', { error: error.message, stack: error.stack, module: 'Auth', label: 'LOGOUT' });
      const errorResponse = ERROR.fromMap('AUTH_LOGOUT_FAILED', { user_id: userId }, error);
      return res.status(errorResponse.statusCode).json(errorResponse.detail);
    }
  } catch (error) {
    logger.error('Error in logout', { error: error.message, module: 'Auth', label: 'LOGOUT' });
    next(error);
  }
});

/**
 * @swagger
 * /api/logout:
 *   post:
 *     summary: Logout (deprecated - use /auth/logout)
 *     description: Logout user (returns user data). This endpoint is deprecated, use /auth/logout instead.
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Successfully fetched user data
 * @deprecated Use /auth/logout instead
 */
router.post('/logout', validateRequest, checkPermission('view_profile'), async (req, res, next) => {
  try {
    const userData = serializeUserData(req.user);
    return res.status(200).json(
      SUCCESS.response('Successfully fetched user data', userData)
    );
  } catch (error) {
    logger.error('Error in logout', { error: error.message, module: 'Auth', label: 'LOGOUT' });
    next(error);
  }
});

/**
 * @swagger
 * /api/auth/check-user-availability:
 *   post:
 *     summary: Check user availability
 *     description: Check if a user is available (not taken) in the database
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               user_id:
 *                 type: string
 *               phone:
 *                 type: string
 *               email:
 *                 type: string
 *     responses:
 *       200:
 *         description: User availability checked
 */
router.post('/auth/check-user-availability', async (req, res, next) => {
  try {
    const { error: validationError, value } = validate(req.body, checkUserAvailabilityRequestSchema);
    if (validationError) {
      const errorResponse = ERROR.fromMap('AUTH_INVALID_PAYLOAD', { error: validationError });
      return res.status(errorResponse.statusCode).json(errorResponse.detail);
    }
    
    const { user_id, phone, email } = value;
    const identifier = user_id || phone || email;
    
    if (!identifier) {
      const errorResponse = ERROR.fromMap('AUTH_INVALID_PAYLOAD', { message: 'Either phone or email must be provided' });
      return res.status(errorResponse.statusCode).json(errorResponse.detail);
    }
    
    if (!validateEmail(identifier) && !validatePhone(identifier)) {
      const errorResponse = ERROR.fromMap('AUTH_INVALID_PAYLOAD', { identifier, message: 'Invalid email or phone number format' });
      return res.status(errorResponse.statusCode).json(errorResponse.detail);
    }
    
    const user = await getUserByEmailOrPhone(identifier);
    if (user) {
      return res.status(200).json(
        SUCCESS.response('User is available', {
          available: true,
          first_name: user.first_name || null,
          last_name: user.last_name || null
        }, {}, user.language)
      );
    } else {
      return res.status(200).json(
        SUCCESS.response('User is not available', {
          available: false,
          first_name: null,
          last_name: null
        })
      );
    }
  } catch (error) {
    logger.error('Error in check_user_availability', { error: error.message, module: 'Auth', label: 'CHECK_AVAILABILITY' });
    next(error);
  }
});

/**
 * @swagger
 * /api/auth/verify-email-and-phone:
 *   post:
 *     summary: Verify email and phone
 *     description: Verify email or phone number with OTP
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - user_id
 *               - channel
 *               - otp
 *             properties:
 *               user_id:
 *                 type: string
 *               channel:
 *                 type: string
 *                 enum: [email, sms]
 *               otp:
 *                 type: string
 *     responses:
 *       200:
 *         description: Email/Phone verified successfully
 */
router.post('/auth/verify-email-and-phone', async (req, res, next) => {
  try {
    const { error: validationError, value } = validate(req.body, otpVerifyRequestSchema);
    if (validationError) {
      const errorResponse = ERROR.fromMap('AUTH_INVALID_PAYLOAD', { error: validationError });
      return res.status(errorResponse.statusCode).json(errorResponse.detail);
    }
    
    const { user_id, channel, otp } = value;
    
    if (!['email', 'sms'].includes(channel)) {
      const errorResponse = ERROR.fromMap('AUTH_CHANNEL_UNSUPPORTED', { channel });
      return res.status(errorResponse.statusCode).json(errorResponse.detail);
    }
    
    const userIdClean = user_id.trim();
    if (channel === 'email' && !validateEmail(userIdClean)) {
      const errorResponse = ERROR.fromMap('AUTH_INVALID_PAYLOAD', { user_id: userIdClean, channel, message: 'Invalid email format' });
      return res.status(errorResponse.statusCode).json(errorResponse.detail);
    } else if (channel === 'sms' && !validatePhone(userIdClean)) {
      const errorResponse = ERROR.fromMap('AUTH_INVALID_PAYLOAD', { user_id: userIdClean, channel, message: 'Invalid phone number format' });
      return res.status(errorResponse.statusCode).json(errorResponse.detail);
    }
    
    const isValid = await verifyOtp(userIdClean, otp, false);
    if (!isValid) {
      const errorResponse = ERROR.fromMap('AUTH_OTP_INVALID', { user_id: userIdClean, channel });
      return res.status(errorResponse.statusCode).json(errorResponse.detail);
    }
    
    let updatedUser;
    
    if (channel === 'email') {
      updatedUser = await prisma.user.updateMany({
        where: {
          email: {
            equals: userIdClean,
            mode: 'insensitive'
          }
        },
        data: {
          is_email_verified: true,
          email_verified_at: new Date()
        }
      });
      
      if (updatedUser.count === 0) {
        const errorResponse = ERROR.fromMap('AUTH_PROCESSING_ERROR', { user_id: userIdClean, channel });
        return res.status(errorResponse.statusCode).json(errorResponse.detail);
      }
    } else if (channel === 'sms') {
      const phoneClean = userIdClean.replace('+', '');
      // Use raw query for JSONB field search
      const result = await prisma.$queryRaw`
        UPDATE "user"
        SET is_phone_verified = TRUE, phone_number_verified_at = NOW()
        WHERE phone_number->>'phone' = ${phoneClean} OR phone_number->>'phone' = ${`+${phoneClean}`}
        RETURNING user_id, is_phone_verified, phone_number_verified_at
      `;
      
      if (result.length === 0) {
        const errorResponse = ERROR.fromMap('AUTH_PROCESSING_ERROR', { user_id: userIdClean, channel });
        return res.status(errorResponse.statusCode).json(errorResponse.detail);
      }
    }
    
    return res.status(200).json(
      SUCCESS.response(`${channel.charAt(0).toUpperCase() + channel.slice(1)} verified successfully`, {
        user_id: userIdClean,
        channel,
        verified: true
      })
    );
  } catch (error) {
    logger.error('Error in verify_email_and_phone', { error: error.message, module: 'Auth', label: 'VERIFY_EMAIL_PHONE' });
    next(error);
  }
});

/**
 * Internal implementation for token-info endpoint
 * @param {object} req - Express request object
 * @param {object} currentUser - Current authenticated user
 * @param {object} tokenData - Optional token data from request body
 * @returns {Promise<object>} Token information response
 */
async function getTokenInfoImpl(req, currentUser, tokenData) {
  const jwt = require('jsonwebtoken');
  const SECRET_KEY = process.env.JWT_SECRET_KEY || process.env.JWT_SECRET;
  const ALGORITHM = 'HS256';
  
  // Token expiry configuration (in minutes)
  const ACCESS_TOKEN_EXPIRY = parseInt(process.env.ACCESS_TOKEN_EXPIRY || '60', 10);
  const SESSION_TOKEN_EXPIRY = parseInt(process.env.SESSION_TOKEN_EXPIRY || '10080', 10); // 7 days
  const REFRESH_TOKEN_EXPIRY = parseInt(process.env.REFRESH_TOKEN_EXPIRY || '43200', 10); // 30 days

  // Helper function to convert minutes to human-readable format
  function formatDuration(minutes) {
    if (minutes < 60) {
      return `${minutes} minute${minutes !== 1 ? 's' : ''}`;
    } else if (minutes < 1440) { // Less than 24 hours
      const hours = Math.floor(minutes / 60);
      const remainingMinutes = minutes % 60;
      if (remainingMinutes === 0) {
        return `${hours} hour${hours !== 1 ? 's' : ''}`;
      } else {
        return `${hours} hour${hours !== 1 ? 's' : ''} and ${remainingMinutes} minute${remainingMinutes !== 1 ? 's' : ''}`;
      }
    } else if (minutes < 10080) { // Less than 7 days
      const days = Math.floor(minutes / 1440);
      const remainingHours = Math.floor((minutes % 1440) / 60);
      if (remainingHours === 0) {
        return `${days} day${days !== 1 ? 's' : ''}`;
      } else {
        return `${days} day${days !== 1 ? 's' : ''} and ${remainingHours} hour${remainingHours !== 1 ? 's' : ''}`;
      }
    } else { // 7 days or more
      const days = Math.floor(minutes / 1440);
      const weeks = Math.floor(days / 7);
      const remainingDays = days % 7;
      if (remainingDays === 0) {
        return `${weeks} week${weeks !== 1 ? 's' : ''}`;
      } else {
        return `${weeks} week${weeks !== 1 ? 's' : ''} and ${remainingDays} day${remainingDays !== 1 ? 's' : ''}`;
      }
    }
  }

  // Get token configuration from environment
  const tokenConfig = {
    access_token: {
      expiry_minutes: ACCESS_TOKEN_EXPIRY,
      expires_in: formatDuration(ACCESS_TOKEN_EXPIRY)
    },
    session_token: {
      expiry_minutes: SESSION_TOKEN_EXPIRY,
      expires_in: formatDuration(SESSION_TOKEN_EXPIRY)
    },
    refresh_token: {
      expiry_minutes: REFRESH_TOKEN_EXPIRY,
      expires_in: formatDuration(REFRESH_TOKEN_EXPIRY)
    }
  };

  // Helper function to decode and analyze a token
  function decodeTokenInfo(tokenStr, tokenName = 'token') {
    try {
      let payload;
      try {
        payload = jwt.decode(tokenStr, { complete: false });
      } catch (error) {
        logger.warn(`Could not decode token: ${error.message}`, { module: 'Auth', label: 'TOKEN_INFO' });
        return {
          error: 'Could not decode token',
          message: error.message
        };
      }

      if (!payload) {
        return {
          error: 'No token payload found'
        };
      }

      const tokenType = payload.type || 'access';
      const expTimestamp = payload.exp;
      const iatTimestamp = payload.iat;
      const sessionId = payload.session_id;

      if (expTimestamp) {
        // Convert timestamp to datetime
        const expDatetime = new Date(expTimestamp * 1000);
        const now = new Date();
        const iatDatetime = iatTimestamp ? new Date(iatTimestamp * 1000) : now;

        const timeUntilExpiry = expDatetime - now;
        const minutesUntilExpiry = Math.floor(timeUntilExpiry / 60000);
        const isExpired = minutesUntilExpiry <= 0;

        // Calculate age of token
        const tokenAge = now - iatDatetime;
        const minutesOld = Math.floor(tokenAge / 60000);
        const hoursOld = Math.floor(minutesOld / 60);
        const daysOld = Math.floor(minutesOld / 1440);

        // Calculate token lifetime
        const tokenLifetime = expDatetime - iatDatetime;
        const totalLifetimeMinutes = Math.floor(tokenLifetime / 60000);

        // Calculate percentage of lifetime used
        const lifetimePercentage = totalLifetimeMinutes > 0 
          ? Math.round((minutesOld / totalLifetimeMinutes * 100) * 10) / 10 
          : 0;

        return {
          token_type: tokenType,
          token_age: formatDuration(Math.abs(minutesOld)),
          token_age_minutes: minutesOld,
          token_age_hours: hoursOld > 0 ? hoursOld : null,
          token_age_days: daysOld > 0 ? daysOld : null,
          expires_in: isExpired ? 'EXPIRED' : formatDuration(Math.abs(minutesUntilExpiry)),
          expires_in_minutes: minutesUntilExpiry,
          lifetime_percentage_used: lifetimePercentage,
          is_expired: isExpired,
          status: isExpired ? 'EXPIRED' : 'ACTIVE',
          session_id: sessionId || null
        };
      } else {
        return {
          error: 'No expiration time in token',
          token_type: tokenType
        };
      }
    } catch (error) {
      logger.warn(`Could not decode token: ${error.message}`, { module: 'Auth', label: 'TOKEN_INFO' });
      return {
        error: 'Could not decode token',
        message: error.message
      };
    }
  }

  // Extract current token from headers
  const authHeader = req.headers.authorization || '';
  let token = null;
  if (authHeader.startsWith('Bearer ')) {
    token = authHeader.replace('Bearer ', '').trim();
  } else {
    token = req.headers['x-session-token'] || '';
  }

  // Decode all available tokens
  let currentTokenInfo = null;
  let accessTokenInfo = null;
  let sessionTokenInfo = null;
  let refreshTokenInfo = null;

  if (token) {
    currentTokenInfo = decodeTokenInfo(token, 'current_token');
  }

  // Extract and decode all tokens from headers
  if (authHeader.startsWith('Bearer ')) {
    const accessToken = authHeader.replace('Bearer ', '').trim();
    if (accessToken && accessToken !== token) {
      accessTokenInfo = decodeTokenInfo(accessToken, 'access_token');
    }
  }

  const sessionTokenHeader = req.headers['x-session-token'] || '';
  if (sessionTokenHeader && sessionTokenHeader !== token) {
    sessionTokenInfo = decodeTokenInfo(sessionTokenHeader, 'session_token');
  }

  // If tokens provided in request body, decode them for comparison
  let beforeTokenInfo = null;
  if (tokenData) {
    if (tokenData.access_token) {
      if (!accessTokenInfo) {
        accessTokenInfo = decodeTokenInfo(tokenData.access_token, 'access_token');
      } else {
        beforeTokenInfo = decodeTokenInfo(tokenData.access_token, 'before');
      }
    }
    if (tokenData.session_token) {
      if (!sessionTokenInfo) {
        sessionTokenInfo = decodeTokenInfo(tokenData.session_token, 'session_token');
      } else {
        beforeTokenInfo = decodeTokenInfo(tokenData.session_token, 'before');
      }
    }
    if (tokenData.refresh_token) {
      refreshTokenInfo = decodeTokenInfo(tokenData.refresh_token, 'refresh_token');
      if (!beforeTokenInfo) {
        beforeTokenInfo = refreshTokenInfo;
      }
    }
  }

  // Calculate extension info
  let extensionInfo = {};
  if (currentTokenInfo && !currentTokenInfo.error) {
    const tokenType = currentTokenInfo.token_type;
    if (tokenType === 'access') {
      extensionInfo = {
        current_expires_in: currentTokenInfo.expires_in,
        after_refresh_expires_in: formatDuration(ACCESS_TOKEN_EXPIRY),
        extension_minutes: ACCESS_TOKEN_EXPIRY
      };
    } else if (tokenType === 'session') {
      extensionInfo = {
        current_expires_in: currentTokenInfo.expires_in,
        after_refresh_expires_in: formatDuration(SESSION_TOKEN_EXPIRY),
        extension_minutes: SESSION_TOKEN_EXPIRY
      };
    } else if (tokenType === 'refresh') {
      extensionInfo = {
        current_expires_in: currentTokenInfo.expires_in,
        after_refresh_expires_in: formatDuration(REFRESH_TOKEN_EXPIRY),
        extension_minutes: REFRESH_TOKEN_EXPIRY
      };
    }
  }

  // Build all tokens info with ages
  const allTokensAges = {};

  if (currentTokenInfo && !currentTokenInfo.error) {
    allTokensAges.current = {
      token_type: currentTokenInfo.token_type,
      token_age: currentTokenInfo.token_age,
      token_age_minutes: currentTokenInfo.token_age_minutes,
      expires_in: currentTokenInfo.expires_in,
      expires_in_minutes: currentTokenInfo.expires_in_minutes,
      lifetime_percentage_used: currentTokenInfo.lifetime_percentage_used,
      status: currentTokenInfo.status
    };
  }

  if (accessTokenInfo && !accessTokenInfo.error) {
    allTokensAges.access_token = {
      token_age: accessTokenInfo.token_age,
      token_age_minutes: accessTokenInfo.token_age_minutes,
      expires_in: accessTokenInfo.expires_in,
      expires_in_minutes: accessTokenInfo.expires_in_minutes,
      lifetime_percentage_used: accessTokenInfo.lifetime_percentage_used,
      status: accessTokenInfo.status
    };
  }

  if (sessionTokenInfo && !sessionTokenInfo.error) {
    allTokensAges.session_token = {
      token_age: sessionTokenInfo.token_age,
      token_age_minutes: sessionTokenInfo.token_age_minutes,
      expires_in: sessionTokenInfo.expires_in,
      expires_in_minutes: sessionTokenInfo.expires_in_minutes,
      lifetime_percentage_used: sessionTokenInfo.lifetime_percentage_used,
      status: sessionTokenInfo.status
    };
  }

  if (refreshTokenInfo && !refreshTokenInfo.error) {
    allTokensAges.refresh_token = {
      token_age: refreshTokenInfo.token_age,
      token_age_minutes: refreshTokenInfo.token_age_minutes,
      expires_in: refreshTokenInfo.expires_in,
      expires_in_minutes: refreshTokenInfo.expires_in_minutes,
      lifetime_percentage_used: refreshTokenInfo.lifetime_percentage_used,
      status: refreshTokenInfo.status
    };
  }

  // Build simplified response
  const responseData = {
    token_ages: Object.keys(allTokensAges).length > 0 
      ? allTokensAges 
      : { current: currentTokenInfo || { error: 'No token found' } },
    token_configuration: tokenConfig,
    extension_info: extensionInfo
  };

  // Add before/after comparison if available
  if (beforeTokenInfo && !beforeTokenInfo.error) {
    responseData.before_token = {
      token_age: beforeTokenInfo.token_age,
      token_age_minutes: beforeTokenInfo.token_age_minutes,
      expires_in: beforeTokenInfo.expires_in,
      expires_in_minutes: beforeTokenInfo.expires_in_minutes,
      status: beforeTokenInfo.status
    };
    // Calculate how much time was extended
    if (currentTokenInfo && !currentTokenInfo.error) {
      const beforeExpires = beforeTokenInfo.expires_in_minutes || 0;
      const currentExpires = currentTokenInfo.expires_in_minutes || 0;
      if (beforeExpires > 0 && currentExpires > 0) {
        const extendedMinutes = currentExpires - beforeExpires;
        if (extendedMinutes > 0) {
          extensionInfo.extended_by = formatDuration(extendedMinutes);
          extensionInfo.extended_by_minutes = extendedMinutes;
        }
      }
    }
  }

  return SUCCESS.response('Token information retrieved successfully', responseData, { type: 'dict' });
}

/**
 * @swagger
 * /api/auth/token-info:
 *   get:
 *     summary: Get token information
 *     description: Get information about the current authentication token. Useful for debugging and understanding token configuration.
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Token information retrieved successfully
 */
router.get('/auth/token-info', validateRequest, async (req, res, next) => {
  try {
    const response = await getTokenInfoImpl(req, req.user, null);
    return res.status(200).json(response);
  } catch (error) {
    logger.error('Error getting token info', { error: error.message, module: 'Auth', label: 'TOKEN_INFO' });
    const errorResponse = ERROR.fromMap('AUTH_PROCESSING_ERROR', {}, error);
    return res.status(errorResponse.statusCode).json(errorResponse.detail);
  }
});

/**
 * @swagger
 * /api/auth/token-info:
 *   post:
 *     summary: Get token information (with token comparison)
 *     description: Get information about the current authentication token. Can accept tokens in request body for comparison.
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               access_token:
 *                 type: string
 *               session_token:
 *                 type: string
 *               refresh_token:
 *                 type: string
 *     responses:
 *       200:
 *         description: Token information retrieved successfully
 */
router.post('/auth/token-info', validateRequest, async (req, res, next) => {
  try {
    const { error: validationError, value } = validate(req.body, tokenInfoRequestSchema);
    if (validationError) {
      const errorResponse = ERROR.fromMap('AUTH_INVALID_PAYLOAD', { error: validationError });
      return res.status(errorResponse.statusCode).json(errorResponse.detail);
    }

    const response = await getTokenInfoImpl(req, req.user, value);
    return res.status(200).json(response);
  } catch (error) {
    logger.error('Error getting token info', { error: error.message, module: 'Auth', label: 'TOKEN_INFO' });
    const errorResponse = ERROR.fromMap('AUTH_PROCESSING_ERROR', {}, error);
    return res.status(errorResponse.statusCode).json(errorResponse.detail);
  }
});

module.exports = router;
