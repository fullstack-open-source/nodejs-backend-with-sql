/**
 * Authentication Functions
 * Token validation, extraction, and user authentication
 */

const jwt = require('jsonwebtoken');
const logger = require('../logger/logger');
const {
  isTokenBlacklisted,
  isSessionBlacklisted,
  isUserBlacklisted,
  isAccessTokenBlacklistedByJti,
  isUserRefreshTokenRevoked
} = require('./session_manager');
const url = require('url');

// JWT Configuration - all configurable via .env
const SECRET_KEY = process.env.JWT_SECRET_KEY || process.env.JWT_SECRET;
const ALGORITHM = process.env.JWT_ALGORITHM || 'HS256';

/**
 * Extract token from multiple sources with priority (optimized for session_token)
 * Priority:
 * 1. X-Session-Token header (preferred for client-side - fastest and most secure)
 * 2. Authorization Bearer header (standard OAuth2)
 * 3. access_token query parameter (for backward compatibility)
 * 
 * Session tokens are preferred as they contain full user profile for faster validation.
 * No database lookup needed when using session_token.
 * @param {object} req - Express request object
 * @returns {string|null} Token string or null
 */
function extractToken(req) {
  // Priority 1: X-Session-Token header (preferred for client-side validation)
  // This is the fastest path as session_token has full user profile embedded
  const sessionToken = req.headers['x-session-token'];
  if (sessionToken) {
    return sessionToken.trim();
  }

  // Priority 2: Authorization Bearer header (standard OAuth2)
  const authHeader = req.headers.authorization || '';
  if (authHeader.startsWith('Bearer ')) {
    return authHeader.replace('Bearer ', '').trim();
  }

  // Priority 3: access_token query parameter (backward compatibility)
  const accessToken = req.query.access_token;
  if (accessToken) {
    return accessToken.trim();
  }

  return null;
}

/**
 * Extract origin/domain from request headers
 * Priority: Origin header > Host header > X-Forwarded-Host
 * Returns normalized origin (scheme + host only)
 * @param {object} req - Express request object
 * @returns {string} Normalized origin
 */
function extractOriginFromRequest(req) {
  // Try Origin header first (most reliable for CORS)
  const origin = req.headers.origin;
  if (origin) {
    try {
      const parsed = url.parse(origin);
      return `${parsed.protocol}//${parsed.host}`;
    } catch (error) {
      // Fall through to next option
    }
  }

  // Try Host header
  const host = req.headers.host;
  if (host) {
    // Determine scheme from request
    const scheme = req.secure || req.headers['x-forwarded-proto'] === 'https' ? 'https' : 'http';
    return `${scheme}://${host}`;
  }

  // Try X-Forwarded-Host (for reverse proxy scenarios)
  const forwardedHost = req.headers['x-forwarded-host'];
  if (forwardedHost) {
    const scheme = req.headers['x-forwarded-proto'] || 'https';
    return `${scheme}://${forwardedHost}`;
  }

  // Fallback to request URL
  return `${req.protocol}://${req.get('host')}`;
}

/**
 * Parse datetime string to Date object
 * @param {string} dtStr - Datetime string
 * @returns {Date|null} Date object or null
 */
function parseDatetime(dtStr) {
  if (!dtStr) {
    return null;
  }
  try {
    // Try ISO format first
    if (dtStr.includes('T') || dtStr.includes('Z')) {
      return new Date(dtStr);
    }
    // Try other formats
    return new Date(dtStr);
  } catch (error) {
    return null;
  }
}

/**
 * Validate user token - optimized for session_token (preferred) and access_token
 * 
 * Performance Optimization:
 * - Session tokens: Fastest validation (no database lookup needed - full user profile in token)
 * - Access tokens: Still supported but requires minimal data extraction
 * 
 * Token Sources (in priority order):
 * 1. X-Session-Token header (preferred for client-side - fastest)
 * 2. Authorization Bearer header (standard OAuth2)
 * 3. access_token query parameter (backward compatibility)
 * 
 * Security:
 * - All tokens are validated against blacklist (cache-based)
 * - Session validation checks session_id blacklist
 * - User-level blacklist support
 * - Domain/origin validation
 * 
 * @param {object} req - Express request object
 * @returns {Promise<object>} User object if valid, throws error otherwise
 */
async function validateUser(req) {
  const credentialsException = {
    success: false,
    error_key: 'UNAUTHORIZED',
    message: 'Missing or invalid Bearer token or Expired session',
    details: {
      Reason: 'Missing or invalid Bearer token or Expired session',
      'WWW-Authenticate': 'Bearer',
      Tips: [
        'Ensure your Authorization header includes a valid Bearer token (session_token or access_token)',
        'Login again to refresh expired tokens'
      ]
    }
  };

  // Extract token
  const token = extractToken(req);

  // Check if token is provided
  if (!token) {
    const error = new Error('No token provided');
    error.statusCode = 401;
    error.details = credentialsException;
    throw error;
  }

  try {
    // Decode token - try with audience first, fallback without if that fails
    let payload;
    try {
      payload = jwt.verify(token, SECRET_KEY, { 
        algorithms: [ALGORITHM],
        audience: 'authenticated'
      });
    } catch (audienceError) {
      // Fallback: try without audience if token wasn't created with audience
      payload = jwt.verify(token, SECRET_KEY, { 
        algorithms: [ALGORITHM]
      });
    }

    const uid = payload.sub;
    if (!uid) {
      const error = new Error('User ID not found in token');
      error.statusCode = 401;
      error.details = credentialsException;
      throw error;
    }

    // Get token type, session_id, and user_id
    const tokenType = payload.type || 'access';
    const sessionId = payload.session_id;
    const userId = payload.sub;

    // Validate token type - only accept access or session tokens for authentication
    if (tokenType !== 'access' && tokenType !== 'session') {
      const error = new Error(`Token type '${tokenType}' is not valid for authentication`);
      error.statusCode = 401;
      error.details = {
        success: false,
        error_key: 'AUTH_INVALID_TOKEN_TYPE',
        message: `Token type '${tokenType}' is not valid for authentication`,
        details: {
          Reason: `Token type '${tokenType}' is not valid for authentication`,
          'WWW-Authenticate': 'Bearer',
          Tips: [
            'Use session_token or access_token for authentication',
            'Refresh tokens cannot be used for API authentication'
          ]
        }
      };
      throw error;
    }

    // Fast blacklist checks - optimized order (fastest checks first)
    // 1. Check token blacklist first (most common, fastest check)
    if (await isTokenBlacklisted(token, tokenType)) {
      const error = new Error('Token has been revoked');
      error.statusCode = 401;
      error.details = {
        success: false,
        error_key: 'TOKEN_INVALID',
        message: 'Token has been revoked',
        details: {
          Reason: 'Token has been revoked',
          'WWW-Authenticate': 'Bearer',
          Tips: [
            'This token has been revoked',
            'Please login again to get a new token'
          ]
        }
      };
      throw error;
    }

    // 1b. Check JTI-based blacklist for access tokens (more efficient)
    if (tokenType === 'access') {
      const tokenJti = payload.jti;
      if (tokenJti && await isAccessTokenBlacklistedByJti(tokenJti)) {
        const error = new Error('Token has been revoked');
        error.statusCode = 401;
        error.details = {
          success: false,
          error_key: 'TOKEN_INVALID',
          message: 'Token has been revoked',
          details: {
            Reason: 'Token has been revoked',
            'WWW-Authenticate': 'Bearer',
            Tips: [
              'This token has been revoked',
              'Please login again to get a new token'
            ]
          }
        };
        throw error;
      }
    }

    // 2. Check session blacklist (if session_id exists)
    if (sessionId && await isSessionBlacklisted(sessionId)) {
      const error = new Error('Session has been revoked');
      error.statusCode = 401;
      error.details = {
        success: false,
        error_key: 'SESSION_INVALID',
        message: 'Session has been revoked',
        details: {
          Reason: 'Session has been revoked',
          'WWW-Authenticate': 'Bearer',
          Tips: [
            'Your session has been revoked or logged out',
            'Please login again to create a new session'
          ]
        }
      };
      throw error;
    }

    // 3. Check user blacklist last (least common, but still important)
    if (userId && await isUserBlacklisted(userId)) {
      const error = new Error('All sessions for this user have been revoked');
      error.statusCode = 401;
      error.details = {
        success: false,
        error_key: 'SESSION_INVALID',
        message: 'All sessions for this user have been revoked',
        details: {
          Reason: 'All sessions for this user have been revoked',
          'WWW-Authenticate': 'Bearer',
          Tips: [
            'Your sessions have been revoked',
            'Please login again to create a new session'
          ]
        }
      };
      throw error;
    }

    // 4. Check if all refresh tokens for user have been revoked (complete logout)
    if (userId && await isUserRefreshTokenRevoked(userId)) {
      const error = new Error('All refresh tokens have been revoked (user logged out)');
      error.statusCode = 401;
      error.details = {
        success: false,
        error_key: 'SESSION_INVALID',
        message: 'All refresh tokens have been revoked (user logged out)',
        details: {
          Reason: 'All refresh tokens have been revoked (user logged out)',
          'WWW-Authenticate': 'Bearer',
          Tips: [
            'Your session has been invalidated',
            'Please login again to get new tokens'
          ]
        }
      };
      throw error;
    }

    // Validate origin/domain if token contains origin claim
    const tokenOrigin = payload.origin;
    if (tokenOrigin) {
      // Extract current request origin
      const currentOrigin = extractOriginFromRequest(req);

      // Normalize origins for comparison (remove trailing slashes, lowercase)
      const tokenOriginNormalized = tokenOrigin.toLowerCase().replace(/\/$/, '');
      const currentOriginNormalized = currentOrigin.toLowerCase().replace(/\/$/, '');

      // Check if origins match
      let originsMatch = tokenOriginNormalized === currentOriginNormalized;

      // In development, allow localhost origins to be flexible (different ports are OK)
      const apiMode = process.env.API_MODE || 'development';
      if (!originsMatch && apiMode !== 'production') {
        try {
          const tokenParsed = url.parse(tokenOriginNormalized);
          const currentParsed = url.parse(currentOriginNormalized);

          // Allow if both are localhost/127.0.0.1 (different ports OK in dev)
          const isLocalhostToken = ['localhost', '127.0.0.1', '0.0.0.0'].includes(tokenParsed.hostname);
          const isLocalhostCurrent = ['localhost', '127.0.0.1', '0.0.0.0'].includes(currentParsed.hostname);

          if (isLocalhostToken && isLocalhostCurrent) {
            originsMatch = true;
          }
        } catch (error) {
          // Ignore parsing errors
        }
      }

      if (!originsMatch) {
        const error = new Error('Token was issued for a different domain');
        error.statusCode = 403;
        error.details = {
          success: false,
          error_key: 'TOKEN_DOMAIN_MISMATCH',
          message: 'Token was issued for a different domain',
          details: {
            Reason: 'Token was issued for a different domain',
            token_origin: tokenOrigin,
            request_origin: currentOrigin,
            Tips: [
              'Tokens are domain-specific for security',
              'Please login again from the correct domain'
            ]
          }
        };
        throw error;
      }
    }

    // Optimized: If session_token, use full user_profile from token (no DB query needed)
    // If access_token, we have minimal data but it's still valid
    const userProfile = payload.user_profile || {};
    const permissions = payload.permissions || {};

    // Set user_id/uid - primary key
    const userIdValue = uid || userProfile.user_id;

    // PERFORMANCE OPTIMIZATION: Fast path for session_token
    // Session tokens contain full user profile - no database lookup needed
    // This is the fastest validation path (recommended for client-side)
    if (tokenType === 'session' && userProfile && Object.keys(userProfile).length > 0) {
      // Session token contains complete user data - fastest validation path
      // No database query required - all user data is in the token
      return {
        // Primary key
        user_id: userIdValue,
        uid: userIdValue,

        // Basic user information (from user_profile in session token)
        first_name: payload.first_name || userProfile.first_name,
        last_name: payload.last_name || userProfile.last_name,
        email: payload.email || userProfile.email,
        phone_number: userProfile.phone_number,
        country: userProfile.country,
        dob: parseDatetime(userProfile.dob),
        profile_picture_url: userProfile.profile_picture_url,
        bio: userProfile.bio,
        user_name: payload.username || userProfile.user_name,

        // Enums
        auth_type: userProfile.auth_type,
        theme: userProfile.theme,
        profile_accessibility: userProfile.profile_accessibility,
        user_type: userProfile.user_type,
        language: userProfile.language,

        // STATUSModel fields
        is_active: permissions.is_active !== undefined ? permissions.is_active : true,
        is_verified: permissions.is_verified !== undefined ? permissions.is_verified : true,

        // Status and role
        status: userProfile.status || 'INACTIVE',
        timezone: userProfile.timezone,
        invited_by_user_id: userProfile.invited_by_user_id,

        // Protection flags
        is_protected: userProfile.is_protected || false,
        is_trashed: userProfile.is_trashed || false,

        // Timestamps
        last_sign_in_at: parseDatetime(userProfile.last_sign_in_at),
        email_verified_at: parseDatetime(userProfile.email_verified_at),
        created_at: parseDatetime(userProfile.created_at),
        last_updated: parseDatetime(userProfile.last_updated),

        // Legacy permission fields
        is_user: permissions.is_user !== undefined ? permissions.is_user : true,
        is_superuser: permissions.is_superuser || false,
        is_admin: permissions.is_admin || false
      };
    } else {
      // Access token path - minimal data, but still valid
      return {
        // Primary key
        user_id: userIdValue,
        uid: userIdValue,

        // Basic user information (from access token payload)
        first_name: payload.first_name,
        last_name: payload.last_name,
        email: payload.email,
        user_name: payload.username,

        // Essential permissions from access token
        is_active: payload.is_active !== undefined ? payload.is_active : true,
        is_verified: payload.is_verified !== undefined ? payload.is_verified : true,

        // Default values for missing fields
        is_draft: false,
        is_deleted: false,
        status: 'ACTIVE',
        is_protected: false,
        is_trashed: false,
        is_user: true,
        is_superuser: false,
        is_admin: false
      };
    }
  } catch (error) {
    if (error.statusCode) {
      throw error;
    }
    // JWT verification error
    const jwtError = new Error('Invalid or expired token');
    jwtError.statusCode = 401;
    jwtError.details = credentialsException;
    throw jwtError;
  }
}

/**
 * Validate user authentication request (Express middleware)
 * 
 * This is the FIRST check in the authentication/authorization flow.
 * It validates:
 * 1. Token exists and is provided
 * 2. Token is valid (signature, expiration)
 * 3. Token is not blacklisted
 * 4. Session is not blacklisted
 * 5. User is not blacklisted
 * 
 * After this check passes, permission/group checks can proceed.
 * 
 * @param {object} req - Express request
 * @param {object} res - Express response
 * @param {function} next - Express next function
 * @returns {Promise<void>}
 */
async function validateRequest(req, res, next) {
  try {
    const user = await validateUser(req);
    
    // Attach user info to request
    req.user = user;
    next();
  } catch (error) {
    logger.error('Authentication validation failed', { error: error.message, module: 'Auth', label: 'VALIDATE_REQUEST' });
    
    const statusCode = error.statusCode || 401;
    const details = error.details || {
      success: false,
      error_key: 'UNAUTHORIZED',
      message: 'Authentication failed'
    };
    
    return res.status(statusCode).json(details);
  }
}

/**
 * Generate JWT token (legacy function - kept for backward compatibility)
 * @param {object} payload - Token payload
 * @param {string} expiresIn - Expiration time (default: 7d)
 * @returns {string} JWT token
 */
function generateToken(payload, expiresIn = process.env.JWT_EXPIRES_IN || '7d') {
  return jwt.sign(payload, SECRET_KEY, { expiresIn, algorithm: ALGORITHM });
}

/**
 * Validate JWT token (legacy function - kept for backward compatibility)
 * @param {string} token - JWT token
 * @returns {object|null} Decoded token or null
 */
function validateToken(token) {
  try {
    if (!token) {
      return null;
    }

    // Remove 'Bearer ' prefix if present
    const cleanToken = token.startsWith('Bearer ') ? token.slice(7) : token;

    const decoded = jwt.verify(cleanToken, SECRET_KEY, { algorithms: [ALGORITHM] });
    return decoded;
  } catch (error) {
    logger.error('Token validation failed', { error: error.message, module: 'Auth', label: 'VALIDATE_TOKEN' });
    return null;
  }
}

module.exports = {
  SECRET_KEY,
  ALGORITHM,
  extractToken,
  extractOriginFromRequest,
  validateUser,
  validateRequest,
  generateToken,
  validateToken
};
