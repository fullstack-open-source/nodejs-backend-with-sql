const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const logger = require('../logger/logger');

/**
 * Validate JWT token
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

    const decoded = jwt.verify(cleanToken, process.env.JWT_SECRET);
    return decoded;
  } catch (error) {
    logger.error('Token validation failed', { error: error.message });
    return null;
  }
}

/**
 * Generate JWT token
 * @param {object} payload - Token payload
 * @param {string} expiresIn - Expiration time (default: 7d)
 * @returns {string} JWT token
 */
function generateToken(payload, expiresIn = process.env.JWT_EXPIRES_IN || '7d') {
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn });
}

/**
 * Hash password
 * @param {string} password - Plain text password
 * @returns {Promise<string>} Hashed password
 */
async function hashPassword(password) {
  const saltRounds = 10;
  return await bcrypt.hash(password, saltRounds);
}

/**
 * Compare password with hash
 * @param {string} password - Plain text password
 * @param {string} hash - Hashed password
 * @returns {Promise<boolean>} Match result
 */
async function comparePassword(password, hash) {
  return await bcrypt.compare(password, hash);
}

/**
 * Express middleware to validate request authentication
 * @param {object} req - Express request
 * @param {object} res - Express response
 * @param {function} next - Express next function
 */
async function validateRequest(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      return res.status(401).json({
        success: false,
        error_key: 'UNAUTHORIZED',
        message: 'No authorization token provided'
      });
    }

    const decoded = validateToken(authHeader);
    
    if (!decoded) {
      return res.status(401).json({
        success: false,
        error_key: 'UNAUTHORIZED',
        message: 'Invalid or expired token'
      });
    }

    // Attach user info to request
    req.user = decoded;
    next();
  } catch (error) {
    logger.error('Authentication validation failed', { error: error.message });
    return res.status(401).json({
      success: false,
      error_key: 'UNAUTHORIZED',
      message: 'Authentication failed'
    });
  }
}

module.exports = {
  validateToken,
  generateToken,
  hashPassword,
  comparePassword,
  validateRequest
};

