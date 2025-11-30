/**
 * Session Manager - Handles token blacklisting for stateless authentication
 * Multi-token session management with access_token, refresh_token, session_token, and session_id
 * Uses cache (Redis or in-memory) for blacklisting instead of database storage
 * Optimized for fast and secure authentication
 */

const crypto = require('crypto');
const logger = require('../logger/logger');
const cache = require('../cache/cache');

// Token expiration times (in minutes)
const ACCESS_TOKEN_EXPIRY = parseInt(process.env.ACCESS_TOKEN_EXPIRY_MINUTES || '60', 10); // 1 hour
const SESSION_TOKEN_EXPIRY = parseInt(process.env.SESSION_TOKEN_EXPIRY_MINUTES || '10080', 10); // 7 days
const REFRESH_TOKEN_EXPIRY = parseInt(process.env.REFRESH_TOKEN_EXPIRY_MINUTES || '43200', 10); // 30 days

/**
 * Create a hash of a token for blacklisting
 * @param {string} token - Token to hash
 * @returns {string} Hashed token
 */
function hashToken(token) {
  return crypto.createHash('sha256').update(token, 'utf8').digest('hex');
}

/**
 * Add a token to the blacklist
 * @param {string} token - Token to blacklist
 * @param {string} tokenType - Token type: 'access', 'refresh', or 'session'
 * @param {number|null} expiresInMinutes - Optional expiration time in minutes
 * @returns {Promise<boolean>} True if successful, False otherwise
 */
async function blacklistToken(token, tokenType = 'access', expiresInMinutes = null) {
  try {
    const tokenHash = hashToken(token);
    const blacklistKey = `blacklist:${tokenType}:${tokenHash}`;

    // Set expiration based on token type if not provided
    if (expiresInMinutes === null) {
      if (tokenType === 'access') {
        expiresInMinutes = ACCESS_TOKEN_EXPIRY;
      } else if (tokenType === 'session') {
        expiresInMinutes = SESSION_TOKEN_EXPIRY;
      } else { // refresh
        expiresInMinutes = REFRESH_TOKEN_EXPIRY;
      }
    }

    // Store in cache with TTL (convert minutes to seconds)
    const ttlSeconds = expiresInMinutes * 60;
    await cache.set(blacklistKey, '1', ttlSeconds);

    return true;
  } catch (error) {
    logger.error('Error blacklisting token', { error: error.message, module: 'Auth', label: 'TOKEN_BLACKLIST' });
    return false;
  }
}

/**
 * Check if a token is blacklisted
 * @param {string} token - Token to check
 * @param {string} tokenType - Token type: 'access', 'refresh', or 'session'
 * @returns {Promise<boolean>} True if blacklisted, False otherwise
 */
async function isTokenBlacklisted(token, tokenType = 'access') {
  try {
    const tokenHash = hashToken(token);
    const blacklistKey = `blacklist:${tokenType}:${tokenHash}`;

    const result = await cache.get(blacklistKey);
    return result !== null;
  } catch (error) {
    logger.error('Error checking token blacklist', { error: error.message, module: 'Auth', label: 'TOKEN_BLACKLIST_CHECK' });
    // On error, assume not blacklisted to avoid blocking valid requests
    return false;
  }
}

/**
 * Blacklist a session by session_id
 * This will invalidate all tokens associated with this session
 * @param {string} sessionId - Session ID
 * @param {number|null} expiresInMinutes - Optional expiration time in minutes
 * @returns {Promise<boolean>} True if successful, False otherwise
 */
async function blacklistSession(sessionId, expiresInMinutes = null) {
  try {
    const blacklistKey = `blacklist:session:${sessionId}`;

    // Default to refresh token expiry (longest)
    if (expiresInMinutes === null) {
      expiresInMinutes = REFRESH_TOKEN_EXPIRY;
    }

    const ttlSeconds = expiresInMinutes * 60;
    await cache.set(blacklistKey, '1', ttlSeconds);

    return true;
  } catch (error) {
    logger.error('Error blacklisting session', { error: error.message, module: 'Auth', label: 'SESSION_BLACKLIST' });
    return false;
  }
}

/**
 * Check if a session is blacklisted
 * @param {string} sessionId - Session ID
 * @returns {Promise<boolean>} True if blacklisted, False otherwise
 */
async function isSessionBlacklisted(sessionId) {
  try {
    const blacklistKey = `blacklist:session:${sessionId}`;
    const result = await cache.get(blacklistKey);
    return result !== null;
  } catch (error) {
    logger.error('Error checking session blacklist', { error: error.message, module: 'Auth', label: 'SESSION_BLACKLIST_CHECK' });
    // On error, assume not blacklisted to avoid blocking valid requests
    return false;
  }
}

/**
 * Blacklist all sessions for a user by storing a user-level blacklist entry
 * @param {string} userId - User ID
 * @param {number|null} expiresInMinutes - Optional expiration time in minutes
 * @returns {Promise<number>} 1 if successful (we track it as a single operation)
 */
async function blacklistAllUserSessions(userId, expiresInMinutes = null) {
  try {
    const blacklistKey = `blacklist:user:${userId}`;

    if (expiresInMinutes === null) {
      expiresInMinutes = REFRESH_TOKEN_EXPIRY;
    }

    const ttlSeconds = expiresInMinutes * 60;
    await cache.set(blacklistKey, '1', ttlSeconds);

    return 1;
  } catch (error) {
    logger.error('Error blacklisting user sessions', { error: error.message, module: 'Auth', label: 'USER_SESSIONS_BLACKLIST' });
    return 0;
  }
}

/**
 * Check if all sessions for a user are blacklisted
 * @param {string} userId - User ID
 * @returns {Promise<boolean>} True if blacklisted, False otherwise
 */
async function isUserBlacklisted(userId) {
  try {
    const blacklistKey = `blacklist:user:${userId}`;
    const result = await cache.get(blacklistKey);
    return result !== null;
  } catch (error) {
    logger.error('Error checking user blacklist', { error: error.message, module: 'Auth', label: 'USER_BLACKLIST_CHECK' });
    return false;
  }
}

/**
 * Clear/remove user-level blacklist entry
 * This allows the user to create new sessions after logout
 * @param {string} userId - User ID whose blacklist should be cleared
 * @returns {Promise<boolean>} True if successful, False otherwise
 */
async function clearUserBlacklist(userId) {
  try {
    const blacklistKey = `blacklist:user:${userId}`;
    await cache.del(blacklistKey);
    return true;
  } catch (error) {
    logger.error('Error clearing user blacklist', { error: error.message, module: 'Auth', label: 'CLEAR_USER_BLACKLIST' });
    return false;
  }
}

/**
 * Clear/remove user-level refresh token blacklist entry
 * This allows the user to use refresh tokens after logout
 * @param {string} userId - User ID whose refresh token blacklist should be cleared
 * @returns {Promise<boolean>} True if successful, False otherwise
 */
async function clearUserRefreshTokenBlacklist(userId) {
  try {
    // Check the actual key format used in revoke_all_user_refresh_tokens
    const blacklistKey = `blacklist:user_refresh_revoke:${userId}`;
    await cache.del(blacklistKey);
    return true;
  } catch (error) {
    logger.error('Error clearing user refresh token blacklist', { error: error.message, module: 'Auth', label: 'CLEAR_REFRESH_BLACKLIST' });
    return false;
  }
}

/**
 * Blacklist an access token by its JTI (JWT ID)
 * This is more efficient than hashing the entire token
 * @param {string} tokenJti - JWT ID from the token payload
 * @param {string} userId - User ID for logging purposes
 * @param {number|null} expiresInSeconds - Optional expiration time in seconds (defaults to access token expiry)
 * @returns {Promise<boolean>} True if successful, False otherwise
 */
async function blacklistAccessTokenByJti(tokenJti, userId, expiresInSeconds = null) {
  try {
    if (!tokenJti) {
      logger.warn(`No JTI provided for blacklisting access token for user ${userId}`, { module: 'Auth', label: 'TOKEN_BLACKLIST_JTI' });
      return false;
    }

    const blacklistKey = `blacklist:access:jti:${tokenJti}`;

    // Default to access token expiry (convert minutes to seconds)
    if (expiresInSeconds === null) {
      expiresInSeconds = ACCESS_TOKEN_EXPIRY * 60;
    }

    await cache.set(blacklistKey, '1', expiresInSeconds);

    return true;
  } catch (error) {
    logger.error('Error blacklisting access token by JTI', { error: error.message, module: 'Auth', label: 'TOKEN_BLACKLIST_JTI' });
    return false;
  }
}

/**
 * Check if an access token is blacklisted by its JTI
 * @param {string} tokenJti - JWT ID from the token payload
 * @returns {Promise<boolean>} True if blacklisted, False otherwise
 */
async function isAccessTokenBlacklistedByJti(tokenJti) {
  try {
    if (!tokenJti) {
      return false;
    }

    const blacklistKey = `blacklist:access:jti:${tokenJti}`;
    const result = await cache.get(blacklistKey);
    return result !== null;
  } catch (error) {
    logger.error('Error checking access token blacklist by JTI', { error: error.message, module: 'Auth', label: 'TOKEN_BLACKLIST_CHECK_JTI' });
    return false;
  }
}

/**
 * Revoke all refresh tokens for a user by blacklisting them
 * This is done by storing a user-level refresh token blacklist entry
 * @param {string} userId - User ID whose refresh tokens should be revoked
 * @returns {Promise<boolean>} True if successful, False otherwise
 */
async function revokeAllUserRefreshTokens(userId) {
  try {
    const blacklistKey = `blacklist:refresh:user:${userId}`;

    // Use refresh token expiry (longest)
    const ttlSeconds = REFRESH_TOKEN_EXPIRY * 60;
    await cache.set(blacklistKey, '1', ttlSeconds);

    return true;
  } catch (error) {
    logger.error('Error revoking all refresh tokens for user', { error: error.message, module: 'Auth', label: 'REVOKE_REFRESH_TOKENS' });
    return false;
  }
}

/**
 * Check if all refresh tokens for a user have been revoked
 * @param {string} userId - User ID to check
 * @returns {Promise<boolean>} True if revoked, False otherwise
 */
async function isUserRefreshTokenRevoked(userId) {
  try {
    const blacklistKey = `blacklist:refresh:user:${userId}`;
    const result = await cache.get(blacklistKey);
    return result !== null;
  } catch (error) {
    logger.error('Error checking user refresh token revocation', { error: error.message, module: 'Auth', label: 'CHECK_REFRESH_REVOKED' });
    return false;
  }
}

module.exports = {
  ACCESS_TOKEN_EXPIRY,
  SESSION_TOKEN_EXPIRY,
  REFRESH_TOKEN_EXPIRY,
  hashToken,
  blacklistToken,
  isTokenBlacklisted,
  blacklistSession,
  isSessionBlacklisted,
  blacklistAllUserSessions,
  isUserBlacklisted,
  clearUserBlacklist,
  clearUserRefreshTokenBlacklist,
  blacklistAccessTokenByJti,
  isAccessTokenBlacklistedByJti,
  revokeAllUserRefreshTokens,
  isUserRefreshTokenRevoked
};

