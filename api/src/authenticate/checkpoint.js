/**
 * Authentication Checkpoint Functions
 * Core authentication functions for user management and token generation
 */

const { v4: uuidv4 } = require('uuid');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { prisma } = require('../db/prisma');
const logger = require('../logger/logger');
const { generateToken } = require('./authenticate');
const {
  ACCESS_TOKEN_EXPIRY,
  SESSION_TOKEN_EXPIRY,
  REFRESH_TOKEN_EXPIRY
} = require('./session_manager');

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
 * Update user verification status based on channel (email or phone)
 * @param {string} userId - User ID (UUID string)
 * @param {string} channel - Verification channel - "email", "sms", or "whatsapp"
 * @returns {Promise<boolean>} True if successful, False otherwise
 */
async function updateUserVerificationStatus(userId, channel) {
  try {
    const channelLower = (channel || '').toLowerCase();

    if (channelLower === 'email') {
      // Verify email
      await prisma.user.update({
        where: { user_id: userId },
        data: {
          is_email_verified: true,
          email_verified_at: new Date(),
          is_verified: true,
          last_updated: new Date()
        }
      });
      return true;
    } else if (channelLower === 'sms' || channelLower === 'whatsapp') {
      // Verify phone
      await prisma.user.update({
        where: { user_id: userId },
        data: {
          is_phone_verified: true,
          phone_number_verified_at: new Date(),
          is_verified: true,
          last_updated: new Date()
        }
      });
      return true;
    } else {
      logger.warn(`Invalid channel for verification update: ${channel} (user: ${userId})`, { module: 'Auth', label: 'UPDATE_VERIFICATION' });
      return false;
    }
  } catch (error) {
    logger.error('Error updating verification status', { error: error.message, module: 'Auth', label: 'UPDATE_VERIFICATION' });
    // Don't fail authentication if this fails
    return false;
  }
}

/**
 * Build user profile payload for tokens
 * @param {object} user - User object
 * @returns {object} User profile payload
 */
function buildUserProfilePayload(user) {
  return {
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
    auth_type: user.auth_type,
    theme: user.theme,
    profile_accessibility: user.profile_accessibility,
    user_type: user.user_type,
    language: user.language,
    status: user.status || 'INACTIVE',
    timezone: user.timezone,
    invited_by_user_id: user.invited_by_user_id ? String(user.invited_by_user_id) : null,
    is_protected: user.is_protected || false,
    is_trashed: user.is_trashed || false,
    last_sign_in_at: user.last_sign_in_at ? (user.last_sign_in_at instanceof Date ? user.last_sign_in_at.toISOString() : user.last_sign_in_at) : null,
    email_verified_at: user.email_verified_at ? (user.email_verified_at instanceof Date ? user.email_verified_at.toISOString() : user.email_verified_at) : null,
    created_at: user.created_at ? (user.created_at instanceof Date ? user.created_at.toISOString() : user.created_at) : null,
    last_updated: user.last_updated ? (user.last_updated instanceof Date ? user.last_updated.toISOString() : user.last_updated) : null
  };
}

/**
 * Build permissions payload for tokens
 * @param {object} user - User object
 * @returns {object} Permissions payload
 */
function buildPermissionsPayload(user) {
  return {
    is_active: user.is_active !== undefined ? user.is_active : true,
    is_verified: user.is_verified !== undefined ? user.is_verified : true
  };
}

/**
 * Generate short-lived access token (1 hour) - Optimized for speed
 * Minimal payload for faster token generation and validation
 * @param {object} user - User object
 * @param {string} origin - Request origin (optional)
 * @param {string} sessionId - Session ID (optional)
 * @returns {string} JWT access token
 */
function generateAccessToken(user, origin = null, sessionId = null) {
  try {
    const now = Math.floor(Date.now() / 1000);
    const exp = now + (ACCESS_TOKEN_EXPIRY * 60);

    // Lightweight payload - only essential fields for access token
    const payload = {
      sub: String(user.user_id || user.uid),
      username: user.user_name,
      email: user.email,
      exp: exp,
      iat: now,
      jti: uuidv4(),
      type: 'access',
      aud: 'authenticated',
      is_active: user.is_active !== undefined ? user.is_active : true,
      is_verified: user.is_verified !== undefined ? user.is_verified : true
    };

    if (origin) {
      payload.origin = origin;
    }
    if (sessionId) {
      payload.session_id = sessionId;
    }

    if (!SECRET_KEY) {
      throw new Error('JWT_SECRET_KEY environment variable is not set');
    }

    return jwt.sign(payload, SECRET_KEY, { algorithm: ALGORITHM });
  } catch (error) {
    logger.error('Error generating access token', { error: error.message, module: 'Auth', label: 'TOKEN_GENERATION' });
    throw error;
  }
}

/**
 * Generate long-lived refresh token (30 days)
 * @param {object} user - User object
 * @param {string} origin - Request origin (optional)
 * @param {string} sessionId - Session ID (optional)
 * @returns {string} JWT refresh token
 */
function generateRefreshToken(user, origin = null, sessionId = null) {
  try {
    const now = Math.floor(Date.now() / 1000);
    const exp = now + (REFRESH_TOKEN_EXPIRY * 60);

    const payload = {
      sub: String(user.user_id || user.uid),
      exp: exp,
      iat: now,
      jti: uuidv4(),
      type: 'refresh',
      aud: 'authenticated'
    };

    if (origin) {
      payload.origin = origin;
    }
    if (sessionId) {
      payload.session_id = sessionId;
    }

    if (!SECRET_KEY) {
      throw new Error('JWT_SECRET_KEY environment variable is not set');
    }

    return jwt.sign(payload, SECRET_KEY, { algorithm: ALGORITHM });
  } catch (error) {
    logger.error('Error generating refresh token', { error: error.message, module: 'Auth', label: 'TOKEN_GENERATION' });
    throw error;
  }
}

/**
 * Generate medium-lived session token (7 days) with full user profile
 * @param {object} user - User object
 * @param {string} origin - Request origin (optional)
 * @param {string} sessionId - Session ID (optional)
 * @returns {string} JWT session token
 */
function generateSessionToken(user, origin = null, sessionId = null) {
  try {
    const userProfile = buildUserProfilePayload(user);
    const permissions = buildPermissionsPayload(user);

    const now = Math.floor(Date.now() / 1000);
    const exp = now + (SESSION_TOKEN_EXPIRY * 60);

    const payload = {
      sub: String(user.user_id || user.uid),
      username: user.user_name,
      first_name: user.first_name,
      last_name: user.last_name,
      email: user.email,
      exp: exp,
      iat: now,
      jti: uuidv4(),
      type: 'session',
      user_profile: userProfile,
      permissions: permissions,
      aud: 'authenticated'
    };

    if (origin) {
      payload.origin = origin;
    }
    if (sessionId) {
      payload.session_id = sessionId;
    }

    if (!SECRET_KEY) {
      throw new Error('JWT_SECRET_KEY environment variable is not set');
    }

    return jwt.sign(payload, SECRET_KEY, { algorithm: ALGORITHM });
  } catch (error) {
    logger.error('Error generating session token', { error: error.message, module: 'Auth', label: 'TOKEN_GENERATION' });
    throw error;
  }
}

/**
 * Generate all tokens (access, refresh, session) with session_id
 * Stateless approach - session_id is embedded in tokens, no database storage
 * @param {object} user - User object
 * @param {string} origin - Request origin (optional)
 * @param {object} request - Express request object (optional)
 * @returns {object} Object with access_token, refresh_token, session_token, and session_id
 */
function generateAllTokens(user, origin = null, request = null) {
  try {
    // Generate session_id once - this will be embedded in all tokens
    const sessionId = uuidv4();

    // Generate all tokens with the same session_id
    const accessToken = generateAccessToken(user, origin, sessionId);
    const refreshToken = generateRefreshToken(user, origin, sessionId);
    const sessionToken = generateSessionToken(user, origin, sessionId);

    // No database storage - tokens are stateless
    // Session invalidation is handled via blacklist in cache

    return {
      access_token: accessToken,
      refresh_token: refreshToken,
      session_token: sessionToken,
      session_id: sessionId
    };
  } catch (error) {
    logger.error('Error generating all tokens', { error: error.message, module: 'Auth', label: 'TOKEN_GENERATION' });
    throw error;
  }
}

/**
 * Get user by user_id
 * @param {string} userId - User ID
 * @returns {Promise<object|null>} User object or null
 */
async function getUserById(userId) {
  try {
    const user = await prisma.user.findUnique({
      where: { user_id: userId }
    });
    return user || null;
  } catch (error) {
    logger.error('Error fetching user by ID', { error: error.message, module: 'Auth', label: 'FETCH_USER_BY_ID' });
    return null;
  }
}


/**
 * Authenticate user and return token
 * @param {string} identifier - Email or phone number
 * @param {string} password - Plain text password
 * @param {string} origin - Request origin (optional)
 * @returns {Promise<string|null>} JWT token or null
 */
async function authenticateUserToken(identifier, password, origin = null) {
  try {
    const user = await authenticateUser(identifier, password);
    if (!user) {
      return null;
    }
    return generateAccessToken(user, origin);
  } catch (error) {
    logger.error('Authentication failed', { error: error.message, module: 'Auth', label: 'AUTH_DJANGO' });
    return null;
  }
}

/**
 * Authenticate user and return all tokens (access, refresh, session) with user data
 * Also clears any user-level blacklist entries to allow new sessions after logout
 * @param {string} identifier - Email or phone number
 * @param {string} password - Plain text password
 * @param {string} origin - Request origin (optional)
 * @param {object} request - Express request object (optional)
 * @returns {Promise<object|null>} Object with tokens and user, or null
 */
async function authenticateUserWithData(identifier, password, origin = null, request = null) {
  try {
    const user = await authenticateUser(identifier, password);
    if (!user) {
      return null;
    }

    const userId = String(user.user_id);

    // Clear user-level blacklist entries BEFORE generating tokens
    // This ensures that after logout and re-login, the new tokens work immediately
    try {
      const {
        clearUserBlacklist,
        clearUserRefreshTokenBlacklist
      } = require('./session_manager');
      await clearUserBlacklist(userId);
      await clearUserRefreshTokenBlacklist(userId);
    } catch (clearError) {
      // Log but don't fail login if clearing blacklist fails
      logger.warn(`Failed to clear user blacklist (non-blocking): ${clearError.message}`, { module: 'Auth', label: 'LOGIN' });
    }

    // Generate all tokens and create session
    const tokens = generateAllTokens(user, origin, request);

    // Return tokens and user data
    return {
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      session_token: tokens.session_token,
      session_id: tokens.session_id,
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
  updateUserVerificationStatus,
  generateAccessToken,
  generateRefreshToken,
  generateSessionToken,
  generateAllTokens,
  getUserById,
  authenticateUserToken,
  authenticateUserWithData,
  updateUserPassword,
  createUserInDb
};

