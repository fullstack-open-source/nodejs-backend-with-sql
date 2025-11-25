const express = require('express');
const router = express.Router();
const { SUCCESS } = require('../../src/response/success');
const { ERROR } = require('../../src/response/error');
const logger = require('../../src/logger/logger');
const { prisma } = require('../../src/db/prisma');
const { validateRequest } = require('../../src/authenticate/authenticate');
const { checkPermission } = require('../../src/middleware/permissionMiddleware');
const { authenticateUserWithData, getUserByEmailOrPhone, updateUserPassword, createUserInDb, generateAccessToken, updateLastSignIn } = require('../../src/authenticate/checkpoint');
const { setOtp, verifyOtp } = require('../../src/authenticate/otp_cache');
const { assignGroupsToUser } = require('../../src/permissions/permissions');
const { sendSMS, sendWhatsApp } = require('../../src/sms/sms');
const { sendOtpEmail } = require('../../src/email/email');
const { validateEmail, validatePhone, serializeUserData } = require('./utils');
const { validate } = require('./models');
const { otpRequestSchema, otpVerifyRequestSchema, loginWithOtpRequestSchema, setPasswordSchema, passwordChangeSchema, forgetPasswordSchema, checkUserAvailabilityRequestSchema, changeEmailRequestSchema } = require('./models');
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
    const authResult = await authenticateUserWithData(username, password, origin);
    
    if (!authResult) {
      const errorResponse = ERROR.fromMap('AUTH_INVALID_CREDENTIALS', { username });
      return res.status(errorResponse.statusCode).json(errorResponse.detail);
    }
    
    return res.status(200).json(
      SUCCESS.response('Login successful', {
        access_token: authResult.access_token,
        token_type: 'bearer'
      }, {
        type: 'dict'
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
    
    const origin = extractOrigin(req);
    const authResult = await authenticateUserWithData(username, password, origin);
    
    if (!authResult) {
      const errorResponse = ERROR.fromMap('AUTH_INVALID_CREDENTIALS', { username });
      return res.status(errorResponse.statusCode).json(errorResponse.detail);
    }
    
    return res.status(200).json(
      SUCCESS.response('Login successful', {
        access_token: authResult.access_token,
        token_type: 'bearer'
      }, {
        type: 'dict'
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
    
    await updateLastSignIn(user.user_id);
    const accessToken = await generateAccessToken(user, origin);
    const userDataSerialized = serializeUserData(user);
    
    return res.status(200).json(
      SUCCESS.response('Login successful', {
        access_token: accessToken,
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
    const masterOtp = process.env.MASTER_OTP || process.env.MASTER_ADMIN_OTP;
    const isMasterOtp = masterOtp && otp === masterOtp;
    
    let isValid = await verifyOtp(user_id, otp, false);
    if (!isValid && !isMasterOtp) {
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
    
    // If master OTP was used, assign admin group instead of user group
    if (isMasterOtp) {
      try {
        await assignGroupsToUser(createdUserId, ['admin'], null);
        logger.info(`Master OTP used - assigned admin group to user ${createdUserId}`);
      } catch (error) {
        logger.error('Failed to assign admin group for master OTP user', { error: error.message, user_id: createdUserId });
      }
    }
    
    const userData = await getUserByEmailOrPhone(user_id);
    if (!userData) {
      const errorResponse = ERROR.fromMap('AUTH_SIGNUP_FAILED', { user_id, channel });
      return res.status(errorResponse.statusCode).json(errorResponse.detail);
    }
    
    const origin = extractOrigin(req);
    const authResult = await authenticateUserWithData(user_id, otp, origin);
    if (!authResult) {
      const errorResponse = ERROR.fromMap('AUTH_SIGNUP_FAILED', { user_id, channel });
      return res.status(errorResponse.statusCode).json(errorResponse.detail);
    }
    
    // Only delete OTP if it was a regular OTP (not master OTP)
    if (!isMasterOtp) {
      await verifyOtp(user_id, otp, true);
    }
    
    const userDataSerialized = serializeUserData(authResult.user);
    
    return res.status(200).json(
      SUCCESS.response('Signup successful', {
        access_token: authResult.access_token,
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
 * /api/logout:
 *   post:
 *     summary: Logout
 *     description: Logout user (returns user data)
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Successfully fetched user data
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

module.exports = router;
