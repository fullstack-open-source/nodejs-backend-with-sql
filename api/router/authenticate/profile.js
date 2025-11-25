/**
 * Profile Management Router
 * All profile endpoints matching FastAPI router/authenticate/profile.py
 */

const express = require('express');
const router = express.Router();
const multer = require('multer');
const { SUCCESS } = require('../../src/response/success');
const { ERROR } = require('../../src/response/error');
const logger = require('../../src/logger/logger');
const { validateRequest } = require('../../src/authenticate/authenticate');
const { checkPermission } = require('../../src/middleware/permissionMiddleware');
const { getUserByUserId } = require('./query');
const { serializeData } = require('./utils');
const { verifyOtp } = require('../../src/authenticate/otp_cache');
const { uploadToGoogleStorageFromString } = require('../../src/storage/storage');
const { validate } = require('./models');
const { changeEmailRequestSchema, changePhoneRequestSchema, userProfileAccessibilitySchema, userProfileLanguageSchema } = require('./models');
const { validatePhone } = require('./utils');
const { sendSMS, sendWhatsApp } = require('../../src/sms/sms');
const { sendOtpEmail } = require('../../src/email/email');
const { setOtp } = require('../../src/authenticate/otp_cache');
const { prisma } = require('../../src/db/prisma');
const { v4: uuidv4 } = require('uuid');

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 15 * 1024 * 1024 // 15MB limit
  }
});

/**
 * @swagger
 * /api/settings/profile:
 *   get:
 *     summary: Get user profile
 *     description: Get current user's profile with paginated posts
 *     tags: [Profile & Settings]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile fetched successfully
 */
router.get('/settings/profile', validateRequest, checkPermission('view_profile'), async (req, res, next) => {
  try {
    const userId = req.user.uid || req.user.user_id;
    
    // Fetch user data
    const userData = await getUserByUserId(userId);
    if (!userData) {
      const errorResponse = ERROR.fromMap('PROFILE_NOT_FOUND', { user_id: userId });
      return res.status(errorResponse.statusCode).json(errorResponse);
    }
    
    const serializedData = serializeData(userData);
    
    return res.status(200).json(
      SUCCESS.response('User profile fetched successfully', serializedData)
    );
  } catch (error) {
    logger.error('Error fetching profile', { error: error.message, module: 'Profile', label: 'GET_PROFILE' });
    const errorResponse = ERROR.fromMap('PROFILE_PROCESSING_ERROR', {}, error);
    return res.status(errorResponse.statusCode).json(errorResponse);
  }
});

/**
 * @swagger
 * /api/settings/profile/{user_id}:
 *   get:
 *     summary: Get user profile by ID
 *     description: Get a specific user's profile with paginated posts
 *     tags: [Profile & Settings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: user_id
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     responses:
 *       200:
 *         description: User profile fetched successfully
 */
router.get('/settings/profile/:user_id', validateRequest, checkPermission('view_user'), async (req, res, next) => {
  try {
    const targetUserId = req.params.user_id;
    
    // Fetch user data
    const userData = await getUserByUserId(targetUserId);
    if (!userData) {
      const errorResponse = ERROR.fromMap('PROFILE_NOT_FOUND', { user_id: targetUserId });
      return res.status(errorResponse.statusCode).json(errorResponse);
    }
    
    const serializedData = serializeData(userData);
    
    return res.status(200).json(
      SUCCESS.response('User profile fetched successfully', serializedData)
    );
  } catch (error) {
    logger.error('Error fetching profile', { error: error.message, module: 'Profile', label: 'GET_PROFILE' });
    const errorResponse = ERROR.fromMap('PROFILE_PROCESSING_ERROR', {}, error);
    return res.status(errorResponse.statusCode).json(errorResponse);
  }
});

/**
 * @swagger
 * /api/settings/update-profile-picture:
 *   post:
 *     summary: Update profile picture
 *     description: Update user's profile picture
 *     tags: [Profile & Settings]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Profile picture updated successfully
 */
router.post('/settings/update-profile-picture', validateRequest, checkPermission('edit_profile'), upload.single('file'), async (req, res, next) => {
  try {
    if (!req.file) {
      const errorResponse = ERROR.fromMap('PROFILE_INVALID_PAYLOAD', { message: 'No file provided' });
      return res.status(errorResponse.statusCode).json(errorResponse);
    }
    
    const userId = req.user.uid || req.user.user_id;
    const fileData = req.file.buffer;
    const extension = req.file.originalname.split('.').pop().toLowerCase();
    const contentType = req.file.mimetype || 'application/octet-stream';
    
    const objectKey = `${req.user.user_name || userId}-user_id_${userId}-|-${uuidv4()}.${extension}`;
    const folder = 'media/users';
    
    // Upload to GCS
    const publicUrl = await uploadToGoogleStorageFromString(fileData, folder, objectKey, contentType);
    
    // Update profile picture in database
    try {
      await prisma.user.update({
        where: { user_id: userId },
        data: { profile_picture_url: publicUrl }
      });
    } catch (error) {
      if (error.code === 'P2025') {
        const errorResponse = ERROR.fromMap('PROFILE_PICTURE_UPDATE_FAILED', { user_id: userId });
        return res.status(errorResponse.statusCode).json(errorResponse);
      }
      throw error;
    }
    
    return res.status(200).json(
      SUCCESS.response('Profile picture updated successfully', {
        profile_picture_url: publicUrl
      })
    );
  } catch (error) {
    logger.error('Error updating profile picture', { error: error.message, module: 'Profile', label: 'UPDATE_PICTURE' });
    const errorResponse = ERROR.fromMap('PROFILE_PROCESSING_ERROR', {}, error);
    return res.status(errorResponse.statusCode).json(errorResponse);
  }
});

/**
 * @swagger
 * /api/settings/update-profile:
 *   post:
 *     summary: Update user profile
 *     description: Partially update user profile fields
 *     tags: [Profile & Settings]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               first_name:
 *                 type: string
 *               last_name:
 *                 type: string
 *               bio:
 *                 type: string
 *               country:
 *                 type: string
 *     responses:
 *       200:
 *         description: User profile updated successfully
 */
router.post('/settings/update-profile', validateRequest, checkPermission('edit_profile'), async (req, res, next) => {
  try {
    const userId = req.user.uid || req.user.user_id;
    const updateData = { ...req.body };
    
    // Remove protected fields
    const protectedFields = ['user_id'];
    if (req.user.email) {
      protectedFields.push('email');
    } else {
      protectedFields.push('phone');
    }
    
    for (const field of protectedFields) {
      delete updateData[field];
    }
    
    if (Object.keys(updateData).length === 0) {
      const errorResponse = ERROR.fromMap('PROFILE_INVALID_PAYLOAD', { user_id: userId });
      return res.status(errorResponse.statusCode).json(errorResponse);
    }
    
    // Build update data object for Prisma
    const updateDataForPrisma = {};
    
    for (const [key, value] of Object.entries(updateData)) {
      if (key === 'phone_number' && typeof value === 'object') {
        updateDataForPrisma[key] = value;
      } else {
        updateDataForPrisma[key] = value;
      }
    }
    
    try {
      await prisma.user.update({
        where: { user_id: userId },
        data: updateDataForPrisma
      });
    } catch (error) {
      if (error.code === 'P2025') {
        const errorResponse = ERROR.fromMap('PROFILE_UPDATE_FAILED', { user_id: userId });
        return res.status(errorResponse.statusCode).json(errorResponse);
      }
      throw error;
    }
    
    // Fetch updated user data
    const userData = await getUserByUserId(userId);
    const serializedData = serializeData(userData);
    
    return res.status(200).json(
      SUCCESS.response('User profile update successfully', serializedData)
    );
  } catch (error) {
    logger.error('Error updating profile', { error: error.message, module: 'Profile', label: 'UPDATE_PROFILE' });
    const errorResponse = ERROR.fromMap('PROFILE_PROCESSING_ERROR', {}, error);
    return res.status(errorResponse.statusCode).json(errorResponse);
  }
});

/**
 * @swagger
 * /api/settings/profile-accessibility:
 *   post:
 *     summary: Update profile accessibility
 *     description: Update user's profile accessibility settings
 *     tags: [Profile & Settings]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               profile_accessibility:
 *                 type: string
 *                 enum: [public, private]
 *     responses:
 *       200:
 *         description: Profile accessibility updated successfully
 */
router.post('/settings/profile-accessibility', validateRequest, checkPermission('edit_profile'), async (req, res, next) => {
  try {
    const { error: validationError, value } = validate(req.body, userProfileAccessibilitySchema);
    if (validationError) {
      const errorResponse = ERROR.fromMap('PROFILE_INVALID_PAYLOAD', { error: validationError });
      return res.status(errorResponse.statusCode).json(errorResponse);
    }
    
    const userId = req.user.uid || req.user.user_id;
    const updateData = value;
    
    await prisma.user.update({
      where: { user_id: userId },
      data: updateData
    });
    
    // Fetch latest user data
    const userData = await getUserByUserId(userId);
    const serializedData = serializeData(userData);
    
    return res.status(200).json(
      SUCCESS.response('Profile accessibility update successfully', serializedData)
    );
  } catch (error) {
    logger.error('Error updating profile accessibility', { error: error.message, module: 'Profile', label: 'UPDATE_ACCESSIBILITY' });
    const errorResponse = ERROR.fromMap('PROFILE_PROCESSING_ERROR', {}, error);
    return res.status(errorResponse.statusCode).json(errorResponse);
  }
});

/**
 * @swagger
 * /api/settings/profile-language:
 *   post:
 *     summary: Update profile language
 *     description: Update user's language preference
 *     tags: [Profile & Settings]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               language:
 *                 type: string
 *                 enum: [en, ar]
 *     responses:
 *       200:
 *         description: Profile language updated successfully
 */
router.post('/settings/profile-language', validateRequest, checkPermission('edit_profile'), async (req, res, next) => {
  try {
    const { error: validationError, value } = validate(req.body, userProfileLanguageSchema);
    if (validationError) {
      const errorResponse = ERROR.fromMap('PROFILE_INVALID_PAYLOAD', { error: validationError });
      return res.status(errorResponse.statusCode).json(errorResponse);
    }
    
    const userId = req.user.uid || req.user.user_id;
    const updateData = value;
    
    await prisma.user.update({
      where: { user_id: userId },
      data: updateData
    });
    
    // Fetch latest user data
    const userData = await getUserByUserId(userId);
    const serializedData = serializeData(userData);
    
    return res.status(200).json(
      SUCCESS.response('Profile language update successfully', serializedData)
    );
  } catch (error) {
    logger.error('Error updating profile language', { error: error.message, module: 'Profile', label: 'UPDATE_LANGUAGE' });
    const errorResponse = ERROR.fromMap('PROFILE_PROCESSING_ERROR', {}, error);
    return res.status(errorResponse.statusCode).json(errorResponse);
  }
});

/**
 * @swagger
 * /api/settings/change-email:
 *   post:
 *     summary: Change email
 *     description: Verify OTP and change email for the logged-in user
 *     tags: [Profile & Settings]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - new_email
 *               - otp
 *             properties:
 *               new_email:
 *                 type: string
 *                 format: email
 *               otp:
 *                 type: string
 *     responses:
 *       200:
 *         description: Email updated and verified successfully
 */
router.post('/settings/change-email', validateRequest, checkPermission('edit_profile'), async (req, res, next) => {
  try {
    const { error: validationError, value } = validate(req.body, changeEmailRequestSchema);
    if (validationError) {
      const errorResponse = ERROR.fromMap('PROFILE_INVALID_PAYLOAD', { error: validationError });
      return res.status(errorResponse.statusCode).json(errorResponse);
    }
    
    const userId = req.user.uid || req.user.user_id;
    const { new_email, otp } = value;
    const newEmailClean = new_email.trim();
    
    // Verify OTP first
    const isValid = await verifyOtp(newEmailClean, otp, false);
    if (!isValid) {
      const errorResponse = ERROR.fromMap('PROFILE_INVALID_OTP', { user_id: userId });
      return res.status(errorResponse.statusCode).json(errorResponse);
    }
    
    // Check if email already exists for another user
    const existingUser = await prisma.user.findFirst({
      where: {
        email: newEmailClean,
        user_id: { not: userId }
      },
      select: { user_id: true, email: true }
    });
    
    if (existingUser) {
      const errorResponse = ERROR.fromMap('EMAIL_ALREADY_EXISTS', { user_id: userId, email: newEmailClean });
      return res.status(errorResponse.statusCode).json(errorResponse);
    }
    
    // Update email and verify email status
    try {
      const updatedUser = await prisma.user.update({
        where: { user_id: userId },
        data: {
          email: newEmailClean,
          is_email_verified: true,
          email_verified_at: new Date()
        },
        select: {
          user_id: true,
          email: true,
          is_email_verified: true,
          email_verified_at: true
        }
      });
      
      // Delete OTP after successful verification
      await verifyOtp(newEmailClean, otp, true);
      
      return res.status(200).json(
        SUCCESS.response('Email updated and verified successfully', {
          user: {
            id: userId,
            email: updatedUser.email,
            is_email_verified: updatedUser.is_email_verified,
            email_verified_at: updatedUser.email_verified_at ? updatedUser.email_verified_at.toISOString() : null
          }
        })
      );
    } catch (error) {
      if (error.code === 'P2025') {
        const errorResponse = ERROR.fromMap('PROFILE_EMAIL_CHANGE_FAILED', { user_id: userId });
        return res.status(errorResponse.statusCode).json(errorResponse);
      }
      throw error;
    }
  } catch (error) {
    logger.error('Error changing email', { error: error.message, module: 'Profile', label: 'CHANGE_EMAIL' });
    const errorResponse = ERROR.fromMap('PROFILE_PROCESSING_ERROR', {}, error);
    return res.status(errorResponse.statusCode).json(errorResponse);
  }
});

/**
 * @swagger
 * /api/settings/change-phone:
 *   post:
 *     summary: Change phone number
 *     description: Verify OTP and change phone number for the logged-in user
 *     tags: [Profile & Settings]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - new_phone
 *               - otp
 *             properties:
 *               new_phone:
 *                 type: string
 *                 pattern: "^\\+?[1-9]\\d{1,14}$"
 *               otp:
 *                 type: string
 *     responses:
 *       200:
 *         description: Phone number updated and verified successfully
 */
router.post('/settings/change-phone', validateRequest, checkPermission('edit_profile'), async (req, res, next) => {
  try {
    const { error: validationError, value } = validate(req.body, changePhoneRequestSchema);
    if (validationError) {
      const errorResponse = ERROR.fromMap('PROFILE_INVALID_PAYLOAD', { error: validationError });
      return res.status(errorResponse.statusCode).json(errorResponse.detail);
    }
    
    const userId = req.user.uid || req.user.user_id;
    const { new_phone, otp } = value;
    
    if (!new_phone || !otp) {
      const errorResponse = ERROR.fromMap('PROFILE_INVALID_PAYLOAD', { message: 'new_phone and otp are required' });
      return res.status(errorResponse.statusCode).json(errorResponse.detail);
    }
    
    const newPhoneClean = new_phone.trim();
    
    if (!validatePhone(newPhoneClean)) {
      const errorResponse = ERROR.fromMap('PROFILE_INVALID_PAYLOAD', { message: 'Invalid phone number format' });
      return res.status(errorResponse.statusCode).json(errorResponse.detail);
    }
    
    const isValid = await verifyOtp(newPhoneClean, otp, false);
    if (!isValid) {
      const errorResponse = ERROR.fromMap('PROFILE_INVALID_OTP', { user_id: userId });
      return res.status(errorResponse.statusCode).json(errorResponse.detail);
    }
    
    const phoneClean = newPhoneClean.replace('+', '');
    const phoneNumberJson = JSON.stringify({ phone: phoneClean });
    
    // Check if phone already exists for another user (using raw query for JSONB)
    const checkResult = await prisma.$queryRaw`
      SELECT user_id, phone_number
      FROM "user"
      WHERE phone_number->>'phone' = ${phoneClean} AND user_id::text != ${userId}
    `;
    
    if (checkResult.length > 0) {
      const errorResponse = ERROR.fromMap('EMAIL_ALREADY_EXISTS', { user_id: userId, phone: newPhoneClean });
      return res.status(errorResponse.statusCode).json(errorResponse.detail);
    }
    
    // Update phone number
    try {
      const updatedUser = await prisma.user.update({
        where: { user_id: userId },
        data: {
          phone_number: { phone: phoneClean },
          is_phone_verified: true,
          phone_number_verified_at: new Date()
        },
        select: {
          user_id: true,
          phone_number: true,
          is_phone_verified: true,
          phone_number_verified_at: true
        }
      });
      
      await verifyOtp(newPhoneClean, otp, true);
      
      return res.status(200).json(
        SUCCESS.response('Phone number updated and verified successfully', {
          user: {
            id: userId,
            phone_number: updatedUser.phone_number,
            is_phone_verified: updatedUser.is_phone_verified,
            phone_number_verified_at: updatedUser.phone_number_verified_at ? updatedUser.phone_number_verified_at.toISOString() : null
          }
        })
      );
    } catch (error) {
      if (error.code === 'P2025') {
        const errorResponse = ERROR.fromMap('PROFILE_UPDATE_FAILED', { user_id: userId });
        return res.status(errorResponse.statusCode).json(errorResponse.detail);
      }
      logger.error('Error changing phone', { error: error.message, module: 'Profile', label: 'CHANGE_PHONE' });
      const errorResponse = ERROR.fromMap('PROFILE_PROCESSING_ERROR', {}, error);
      return res.status(errorResponse.statusCode).json(errorResponse.detail);
    }
  } catch (error) {
    logger.error('Error in change phone route', { error: error.message, module: 'Profile', label: 'CHANGE_PHONE' });
    const errorResponse = ERROR.fromMap('PROFILE_PROCESSING_ERROR', {}, error);
    return res.status(errorResponse.statusCode).json(errorResponse.detail);
  }
});

/**
 * @swagger
 * /api/settings/send-phone-otp:
 *   post:
 *     summary: Send OTP to phone number
 *     description: Send OTP to a phone number for verification (e.g., for changing phone)
 *     tags: [Profile & Settings]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - phone
 *               - channel
 *             properties:
 *               phone:
 *                 type: string
 *               channel:
 *                 type: string
 *                 enum: [sms, whatsapp]
 *     responses:
 *       200:
 *         description: OTP sent successfully
 */
router.post('/settings/send-phone-otp', validateRequest, checkPermission('edit_profile'), async (req, res, next) => {
  try {
    const { phone, channel } = req.body;
    
    if (!phone || !channel) {
      const errorResponse = ERROR.fromMap('PROFILE_INVALID_PAYLOAD', { message: 'phone and channel are required' });
      return res.status(errorResponse.statusCode).json(errorResponse.detail);
    }
    
    if (!['sms', 'whatsapp'].includes(channel)) {
      const errorResponse = ERROR.fromMap('AUTH_CHANNEL_UNSUPPORTED', { channel });
      return res.status(errorResponse.statusCode).json(errorResponse.detail);
    }
    
    const phoneClean = phone.trim();
    if (!validatePhone(phoneClean)) {
      const errorResponse = ERROR.fromMap('PROFILE_INVALID_PAYLOAD', { message: 'Invalid phone number format' });
      return res.status(errorResponse.statusCode).json(errorResponse.detail);
    }
    
    const otp = await setOtp(phoneClean, 600);
    
    if (!otp) {
      const errorResponse = ERROR.fromMap('AUTH_OTP_SEND_FAILED', { user_id: phoneClean });
      return res.status(errorResponse.statusCode).json(errorResponse.detail);
    }
    
    if (channel === 'sms') {
      await sendSMS(phoneClean, `Your OTP is ${otp}. It is valid for 10 minutes.`);
    } else if (channel === 'whatsapp') {
      await sendWhatsApp(phoneClean, otp);
    }
    
    return res.status(200).json(
      SUCCESS.response('OTP sent successfully', { message: 'OTP sent successfully' })
    );
  } catch (error) {
    logger.error('Error sending phone OTP', { error: error.message, module: 'Profile', label: 'SEND_PHONE_OTP' });
    const errorResponse = ERROR.fromMap('PROFILE_PROCESSING_ERROR', {}, error);
    return res.status(errorResponse.statusCode).json(errorResponse.detail);
  }
});

/**
 * @swagger
 * /api/settings/update-theme:
 *   post:
 *     summary: Update user theme
 *     description: Update user's theme preference (light/dark)
 *     tags: [Profile & Settings]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - theme
 *             properties:
 *               theme:
 *                 type: string
 *                 enum: [light, dark]
 *     responses:
 *       200:
 *         description: Theme updated successfully
 */
router.post('/settings/update-theme', validateRequest, checkPermission('edit_profile'), async (req, res, next) => {
  try {
    const { theme } = req.body;
    
    if (!theme || !['light', 'dark'].includes(theme)) {
      const errorResponse = ERROR.fromMap('PROFILE_INVALID_PAYLOAD', { message: 'theme must be "light" or "dark"' });
      return res.status(errorResponse.statusCode).json(errorResponse.detail);
    }
    
    const userId = req.user.uid || req.user.user_id;
    
    try {
      await prisma.user.update({
        where: { user_id: userId },
        data: { theme: theme }
      });
    } catch (error) {
      if (error.code === 'P2025') {
        const errorResponse = ERROR.fromMap('PROFILE_UPDATE_FAILED', { user_id: userId });
        return res.status(errorResponse.statusCode).json(errorResponse.detail);
      }
      throw error;
    }
    
    const userData = await getUserByUserId(userId);
    const serializedData = serializeData(userData);
    
    return res.status(200).json(
      SUCCESS.response('Theme updated successfully', serializedData)
    );
  } catch (error) {
    logger.error('Error updating theme', { error: error.message, module: 'Profile', label: 'UPDATE_THEME' });
    const errorResponse = ERROR.fromMap('PROFILE_PROCESSING_ERROR', {}, error);
    return res.status(errorResponse.statusCode).json(errorResponse.detail);
  }
});


/**
 * @swagger
 * /api/settings/deactivate-account:
 *   post:
 *     summary: Deactivate user account
 *     description: Deactivate the current user's account (sets is_active to false)
 *     tags: [Profile & Settings]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Account deactivated successfully
 */
router.post('/settings/deactivate-account', validateRequest, checkPermission('edit_profile'), async (req, res, next) => {
  try {
    const userId = req.user.uid || req.user.user_id;
    
    try {
      await prisma.user.update({
        where: { user_id: userId },
        data: {
          is_active: false,
          status: 'INACTIVE'
        }
      });
    } catch (error) {
      if (error.code === 'P2025') {
        const errorResponse = ERROR.fromMap('PROFILE_UPDATE_FAILED', { user_id: userId });
        return res.status(errorResponse.statusCode).json(errorResponse.detail);
      }
      throw error;
    }
    
    return res.status(200).json(
      SUCCESS.response('Account deactivated successfully', {
        user_id: userId,
        is_active: false,
        status: 'INACTIVE'
      })
    );
  } catch (error) {
    logger.error('Error deactivating account', { error: error.message, module: 'Profile', label: 'DEACTIVATE_ACCOUNT' });
    const errorResponse = ERROR.fromMap('PROFILE_PROCESSING_ERROR', {}, error);
    return res.status(errorResponse.statusCode).json(errorResponse.detail);
  }
});

/**
 * @swagger
 * /api/settings/delete-account:
 *   post:
 *     summary: Delete user account
 *     description: Deactivate the current user's account (sets is_active to false)
 *     tags: [Profile & Settings]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - confirm
 *             properties:
 *               confirm:
 *                 type: boolean
 *                 description: Must be true to confirm account deletion
 *     responses:
 *       200:
 *         description: Account deactivated successfully
 */
router.post('/settings/delete-account', validateRequest, checkPermission('edit_profile'), async (req, res, next) => {
  try {
    const { confirm } = req.body;
    
    if (confirm !== true) {
      const errorResponse = ERROR.fromMap('PROFILE_INVALID_PAYLOAD', { message: 'Account deletion must be confirmed' });
      return res.status(errorResponse.statusCode).json(errorResponse.detail);
    }
    
    const userId = req.user.uid || req.user.user_id;
    
    try {
      await prisma.user.update({
        where: { user_id: userId },
        data: {
          is_active: false,
          status: 'INACTIVE'
        }
      });
    } catch (error) {
      if (error.code === 'P2025') {
        const errorResponse = ERROR.fromMap('PROFILE_UPDATE_FAILED', { user_id: userId });
        return res.status(errorResponse.statusCode).json(errorResponse.detail);
      }
      throw error;
    }
    
    return res.status(200).json(
      SUCCESS.response('Account deactivated successfully', {
        user_id: userId,
        is_active: false
      })
    );
  } catch (error) {
    logger.error('Error deleting account', { error: error.message, module: 'Profile', label: 'DELETE_ACCOUNT' });
    const errorResponse = ERROR.fromMap('PROFILE_PROCESSING_ERROR', {}, error);
    return res.status(errorResponse.statusCode).json(errorResponse.detail);
  }
});

/**
 * @swagger
 * /api/settings/get-settings:
 *   get:
 *     summary: Get user settings
 *     description: Get all user settings and preferences
 *     tags: [Profile & Settings]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User settings retrieved successfully
 */
router.get('/settings/get-settings', validateRequest, checkPermission('view_profile'), async (req, res, next) => {
  try {
    const userId = req.user.uid || req.user.user_id;
    
    const settings = await prisma.user.findUnique({
      where: { user_id: userId },
      select: {
        user_id: true,
        theme: true,
        language: true,
        profile_accessibility: true,
        timezone: true,
        country: true,
        bio: true,
        is_email_verified: true,
        is_phone_verified: true,
        is_active: true,
        is_verified: true,
        status: true
      }
    });
    
    if (!settings) {
      const errorResponse = ERROR.fromMap('PROFILE_NOT_FOUND', { user_id: userId });
      return res.status(errorResponse.statusCode).json(errorResponse.detail);
    }
    const serializedData = serializeData(settings);
    
    return res.status(200).json(
      SUCCESS.response('User settings retrieved successfully', serializedData)
    );
  } catch (error) {
    logger.error('Error getting settings', { error: error.message, module: 'Profile', label: 'GET_SETTINGS' });
    const errorResponse = ERROR.fromMap('PROFILE_PROCESSING_ERROR', {}, error);
    return res.status(errorResponse.statusCode).json(errorResponse.detail);
  }
});

/**
 * @swagger
 * /api/settings/update-timezone:
 *   post:
 *     summary: Update user timezone
 *     description: Update user's timezone preference
 *     tags: [Profile & Settings]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - timezone
 *             properties:
 *               timezone:
 *                 type: string
 *                 example: "America/New_York"
 *     responses:
 *       200:
 *         description: Timezone updated successfully
 */
router.post('/settings/update-timezone', validateRequest, checkPermission('edit_profile'), async (req, res, next) => {
  try {
    const { timezone } = req.body;
    
    if (!timezone) {
      const errorResponse = ERROR.fromMap('PROFILE_INVALID_PAYLOAD', { message: 'timezone is required' });
      return res.status(errorResponse.statusCode).json(errorResponse.detail);
    }
    
    const userId = req.user.uid || req.user.user_id;
    
    try {
      await prisma.user.update({
        where: { user_id: userId },
        data: { timezone: timezone }
      });
    } catch (error) {
      if (error.code === 'P2025') {
        const errorResponse = ERROR.fromMap('PROFILE_UPDATE_FAILED', { user_id: userId });
        return res.status(errorResponse.statusCode).json(errorResponse.detail);
      }
      throw error;
    }
    
    const userData = await getUserByUserId(userId);
    const serializedData = serializeData(userData);
    
    return res.status(200).json(
      SUCCESS.response('Timezone updated successfully', serializedData)
    );
  } catch (error) {
    logger.error('Error updating timezone', { error: error.message, module: 'Profile', label: 'UPDATE_TIMEZONE' });
    const errorResponse = ERROR.fromMap('PROFILE_PROCESSING_ERROR', {}, error);
    return res.status(errorResponse.statusCode).json(errorResponse.detail);
  }
});

module.exports = router;

