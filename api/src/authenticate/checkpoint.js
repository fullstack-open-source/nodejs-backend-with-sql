/**
 * Authentication Checkpoint Functions
 * Core authentication functions matching FastAPI checkpoint.py
 */

const { v4: uuidv4 } = require('uuid');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { prisma } = require('../db/prisma');
const logger = require('../logger/logger');
const { generateToken } = require('./authenticate');

const SECRET_KEY = process.env.JWT_SECRET_KEY || process.env.JWT_SECRET;
const ALGORITHM = 'HS256';

// Email and phone validators
const emailValidator = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
const phoneValidator = /^\+?[1-9]\d{1,14}$/;

/**
 * Verify password using bcrypt
 * @param {string} plainPassword - Plain text password
 * @param {string} hashedPassword - Hashed password
 * @returns {boolean} True if password matches
 */
function verifyPassword(plainPassword, hashedPassword) {
  if (!hashedPassword || !plainPassword) {
    return false;
  }
  try {
    return bcrypt.compareSync(plainPassword, hashedPassword);
  } catch (error) {
    logger.error('Password verification error', { error: error.message, module: 'Auth', label: 'PASSWORD_VERIFY' });
    return false;
  }
}

/**
 * Hash password using bcrypt
 * @param {string} password - Plain text password
 * @returns {string} Hashed password
 */
function hashPassword(password) {
  try {
    const saltRounds = 10;
    return bcrypt.hashSync(password, saltRounds);
  } catch (error) {
    logger.error('Password hashing error', { error: error.message, module: 'Auth', label: 'PASSWORD_HASH' });
    throw error;
  }
}

/**
 * Get user by email or phone number
 * @param {string} identifier - Email or phone number
 * @returns {Promise<object|null>} User object or null
 */
async function getUserByEmailOrPhone(identifier) {
  try {
    // Determine if identifier is email or phone
    if (identifier.includes('@')) {
      // Email lookup (case-insensitive)
      const user = await prisma.user.findFirst({
        where: {
          email: {
            equals: identifier,
            mode: 'insensitive'
          }
        }
      });
      return user || null;
    } else {
      // Phone number lookup (handle JSON field)
      const phoneClean = identifier.trim().replace('+', '');
      // Use raw query for JSONB field search
      const users = await prisma.$queryRaw`
        SELECT * FROM "user"
        WHERE phone_number->>'phone' LIKE ${`%${phoneClean}%`} 
           OR phone_number->>'phone' LIKE ${`%+${phoneClean}%`}
        LIMIT 1
      `;
      return users[0] || null;
    }
  } catch (error) {
    logger.error('Error fetching user', { error: error.message, module: 'Auth', label: 'FETCH_USER' });
    return null;
  }
}

/**
 * Check user availability in database
 * @param {string} identifier - Email or phone number
 * @returns {Promise<boolean>} True if user exists, false otherwise
 */
async function checkUserAvailabilityInDb(identifier) {
  try {
    if (identifier.includes('@')) {
      const user = await prisma.user.findFirst({
        where: {
          email: {
            equals: identifier,
            mode: 'insensitive'
          }
        },
        select: { user_id: true }
      });
      return !!user;
    } else {
      const phoneClean = identifier.trim().replace('+', '');
      const users = await prisma.$queryRaw`
        SELECT user_id FROM "user" 
        WHERE phone_number->>'phone' LIKE ${`%${phoneClean}%`} 
           OR phone_number->>'phone' LIKE ${`%+${phoneClean}%`}
        LIMIT 1
      `;
      return users.length > 0;
    }
  } catch (error) {
    logger.error('Error checking user availability', { error: error.message, module: 'Auth', label: 'CHECK_AVAILABILITY' });
    return false;
  }
}

/**
 * Authenticate user by email/phone and password
 * @param {string} identifier - Email or phone number
 * @param {string} password - Plain text password
 * @returns {Promise<object|null>} User object if successful, null otherwise
 */
async function authenticateUser(identifier, password) {
  try {
    // Get user from database
    const user = await getUserByEmailOrPhone(identifier);
    
    if (!user) {
      logger.warn(`User not found: ${identifier}`, { module: 'Auth', label: 'AUTH_FAILED' });
      return null;
    }
    
    // Check if user is active and verified
    if (!user.is_active || !user.is_verified) {
      logger.warn(`User account not active or verified: ${identifier}`, { module: 'Auth', label: 'AUTH_FAILED' });
      return null;
    }
    
    const hashedPassword = user.password;
    if (!hashedPassword) {
      logger.warn(`User has no password set: ${identifier}`, { module: 'Auth', label: 'AUTH_FAILED' });
      return null;
    }
    
    if (!verifyPassword(password, hashedPassword)) {
      logger.warn(`Invalid password for user: ${identifier}`, { module: 'Auth', label: 'AUTH_FAILED' });
      return null;
    }
    
    // Update last sign in
    await updateLastSignIn(user.user_id);
    
    return user;
  } catch (error) {
    logger.error('Authentication error', { error: error.message, module: 'Auth', label: 'AUTH_ERROR' });
    return null;
  }
}

/**
 * Update user's last sign in timestamp
 * @param {string} userId - User ID
 */
async function updateLastSignIn(userId) {
  try {
    await prisma.user.update({
      where: { user_id: userId },
      data: { last_sign_in_at: new Date() }
    });
  } catch (error) {
    logger.error('Error updating last sign in', { error: error.message, module: 'Auth', label: 'UPDATE_SIGN_IN' });
    // Don't fail authentication if this fails
  }
}

/**
 * Generate access token with user data
 * @param {object} user - User object
 * @param {string} origin - Request origin (optional)
 * @returns {Promise<string>} JWT token
 */
async function generateAccessToken(user, origin = null) {
  try {
    const userProfile = {
      user_id: String(user.user_id || user.uid),
      email: user.email,
      first_name: user.first_name,
      last_name: user.last_name,
      user_name: user.user_name,
      phone_number: user.phone_number,
      country: user.country,
      dob: user.dob ? (user.dob instanceof Date ? user.dob.toISOString() : user.dob) : null,
      profile_picture_url: user.profile_picture_url,
      bio: user.bio,
      theme: user.theme,
      profile_accessibility: user.profile_accessibility,
      user_type: user.user_type,
      language: user.language,
      status: user.status,
      timezone: user.timezone,
      last_sign_in_at: user.last_sign_in_at ? (user.last_sign_in_at instanceof Date ? user.last_sign_in_at.toISOString() : user.last_sign_in_at) : null,
      email_verified_at: user.email_verified_at ? (user.email_verified_at instanceof Date ? user.email_verified_at.toISOString() : user.email_verified_at) : null,
      created_at: user.created_at ? (user.created_at instanceof Date ? user.created_at.toISOString() : user.created_at) : null,
      last_updated: user.last_updated ? (user.last_updated instanceof Date ? user.last_updated.toISOString() : user.last_updated) : null,
      is_protected: user.is_protected,
      is_trashed: user.is_trashed,
      auth_type: user.auth_type,
      invited_by_user_id: user.invited_by_user_id,
      is_email_verified: user.is_email_verified,
      is_phone_verified: user.is_phone_verified
    };

    // Permissions are determined by groups, not role flags
    const permissions = {};

    // Fetch groups and permissions from database
    let groups = [];
    let permissionCodenames = [];
    try {
      const { getUserGroups, getUserPermissions } = require('../permissions/permissions');
      const userId = String(user.user_id || user.uid);
      groups = await getUserGroups(userId);
      const userPerms = await getUserPermissions(userId);
      permissionCodenames = userPerms.map(p => p.codename);
    } catch (error) {
      logger.warn('Error fetching user groups/permissions for token', { error: error.message, module: 'Auth', label: 'TOKEN_GROUPS' });
    }

    const payload = {
      sub: String(user.user_id || user.uid),
      ...userProfile,
      ...permissions,
      groups: groups.map(g => g.codename),
      permissions: permissionCodenames
    };

    if (origin) {
      payload.origin = origin;
    }

    return generateToken(payload);
  } catch (error) {
    logger.error('Token generation error', { error: error.message, module: 'Auth', label: 'TOKEN_GENERATION' });
    throw error;
  }
}

/**
 * Authenticate user and return token
 * @param {string} identifier - Email or phone number
 * @param {string} password - Plain text password
 * @param {string} origin - Request origin (optional)
 * @returns {Promise<string|null>} JWT token or null
 */
async function authenticateUserDjango(identifier, password, origin = null) {
  try {
    const user = await authenticateUser(identifier, password);
    if (!user) {
      return null;
    }
    return await generateAccessToken(user, origin);
  } catch (error) {
    logger.error('Authentication failed', { error: error.message, module: 'Auth', label: 'AUTH_DJANGO' });
    return null;
  }
}

/**
 * Authenticate user and return token with user data
 * @param {string} identifier - Email or phone number
 * @param {string} password - Plain text password
 * @param {string} origin - Request origin (optional)
 * @returns {Promise<object|null>} Object with JWT access_token and user, or null
 */
async function authenticateUserWithData(identifier, password, origin = null) {
  try {
    const user = await authenticateUser(identifier, password);
    if (!user) {
      return null;
    }
    const accessToken = await generateAccessToken(user, origin);
    return {
      access_token: accessToken,
      user: user
    };
  } catch (error) {
    logger.error('Authentication failed', { error: error.message, module: 'Auth', label: 'AUTH_USER_DATA' });
    return null;
  }
}

/**
 * Update user password
 * @param {string} userId - User ID
 * @param {string} newPassword - New plain text password
 * @returns {Promise<boolean>} True if successful
 */
async function updateUserPassword(userId, newPassword) {
  try {
    const hashedPassword = hashPassword(newPassword);
    await prisma.user.update({
      where: { user_id: userId },
      data: { 
        password: hashedPassword
      }
    });
    return true;
  } catch (error) {
    if (error.code === 'P2025') {
      // Record not found
      return false;
    }
    logger.error('Error updating password', { error: error.message, module: 'Auth', label: 'UPDATE_PASSWORD' });
    return false;
  }
}

/**
 * Create user in database
 * @param {object} payload - User data
 * @returns {Promise<string|null>} User ID if successful, null otherwise
 */
async function createUserInDb(payload) {
  try {
    const userId = uuidv4();
    const hashedPassword = hashPassword(payload.password || '');
    
    // Build user data object
    const userData = {
      user_id: userId,
      password: hashedPassword,
      is_active: true,
      is_verified: true,
      is_protected: false,
      is_trashed: false
    };
    
    // Add email or phone_number
    if (payload.email) {
      userData.email = payload.email;
    }
    
    if (payload.phone_number) {
      userData.phone_number = payload.phone_number;
    }
    
    // Add optional fields
    const optionalFields = ['auth_type', 'profile_accessibility', 'theme', 'user_type', 'language', 'status', 'user_name', 'first_name', 'last_name', 'is_email_verified', 'is_phone_verified'];
    for (const field of optionalFields) {
      if (payload[field] !== undefined) {
        userData[field] = payload[field];
      }
    }
    
    // Add timestamps if provided
    if (payload.email_verified_at) {
      userData.email_verified_at = payload.email_verified_at === 'NOW()' ? new Date() : new Date(payload.email_verified_at);
    }
    
    if (payload.phone_number_verified_at) {
      userData.phone_number_verified_at = payload.phone_number_verified_at === 'NOW()' ? new Date() : new Date(payload.phone_number_verified_at);
    }
    
    const user = await prisma.user.create({
      data: userData
    });
    
    return user.user_id;
  } catch (error) {
    logger.error('Error creating user', { error: error.message, module: 'Auth', label: 'CREATE_USER' });
    return null;
  }
}

module.exports = {
  verifyPassword,
  hashPassword,
  getUserByEmailOrPhone,
  checkUserAvailabilityInDb,
  authenticateUser,
  updateLastSignIn,
  generateAccessToken,
  authenticateUserDjango,
  authenticateUserWithData,
  updateUserPassword,
  createUserInDb
};

