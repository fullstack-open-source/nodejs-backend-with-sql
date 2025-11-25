/**
 * Debug Utility
 * Controls debug functionality based on DEBUG_MODE environment variable
 */

const logger = require('../logger/logger');

/**
 * Check if debug mode is enabled
 * @returns {boolean} True if DEBUG_MODE is 'true'
 */
function isDebugMode() {
  return process.env.DEBUG_MODE === 'true' || process.env.DEBUG_MODE === 'True' || process.env.DEBUG_MODE === '1';
}

/**
 * Debug logger - only logs if DEBUG_MODE is enabled
 * @param {string} message - Debug message
 * @param {object} meta - Additional metadata
 */
function debug(message, meta = {}) {
  if (isDebugMode()) {
    logger.debug(message, meta);
  }
}

/**
 * Debug error with stack trace - only logs if DEBUG_MODE is enabled
 * @param {string} message - Error message
 * @param {Error|object} error - Error object or metadata
 */
function debugError(message, error = {}) {
  if (isDebugMode()) {
    const errorMeta = error instanceof Error 
      ? { 
          error: error.message, 
          stack: error.stack,
          ...error 
        }
      : error;
    logger.debug(message, errorMeta);
  }
}

/**
 * Get debug information for error responses
 * Only includes debug info if DEBUG_MODE is enabled
 * @param {Error|object} exception - Exception object
 * @returns {object|null} Debug object or null
 */
function getDebugInfo(exception) {
  if (!isDebugMode()) {
    return null;
  }

  if (exception instanceof Error) {
    return {
      exception: exception.message,
      stack: exception.stack,
      name: exception.name
    };
  }

  if (typeof exception === 'string') {
    return {
      exception: exception
    };
  }

  if (exception && typeof exception === 'object') {
    return {
      exception: exception.message || exception.error || String(exception),
      ...(exception.stack && { stack: exception.stack })
    };
  }

  return null;
}

/**
 * Log query details - only if DEBUG_MODE is enabled
 * @param {string} query - Query string
 * @param {object} params - Query parameters
 * @param {number} duration - Query duration in ms
 */
function debugQuery(query, params = null, duration = null) {
  if (isDebugMode()) {
    const meta = {};
    if (params) meta.params = params;
    if (duration !== null) meta.duration = `${duration}ms`;
    logger.debug('Query executed', { query, ...meta });
  }
}

/**
 * Log request details - only if DEBUG_MODE is enabled
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 */
function debugRequest(req, res) {
  if (isDebugMode()) {
    logger.debug('Request details', {
      method: req.method,
      path: req.path,
      query: req.query,
      body: req.body,
      headers: {
        'user-agent': req.get('user-agent'),
        'content-type': req.get('content-type'),
        'authorization': req.get('authorization') ? '***' : undefined
      },
      ip: req.ip,
      user: req.user ? { user_id: req.user.user_id || req.user.uid } : undefined
    });
  }
}

/**
 * Log response details - only if DEBUG_MODE is enabled
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 * @param {number} duration - Response duration in ms
 */
function debugResponse(req, res, duration = null) {
  if (isDebugMode()) {
    logger.debug('Response details', {
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration: duration ? `${duration}ms` : null
    });
  }
}

/**
 * Sanitize sensitive data for debug output
 * @param {object} data - Data to sanitize
 * @returns {object} Sanitized data
 */
function sanitizeDebugData(data) {
  if (!data || typeof data !== 'object') {
    return data;
  }

  const sensitiveKeys = ['password', 'token', 'secret', 'key', 'authorization', 'access_token', 'refresh_token'];
  const sanitized = { ...data };

  for (const key in sanitized) {
    const lowerKey = key.toLowerCase();
    if (sensitiveKeys.some(sk => lowerKey.includes(sk))) {
      sanitized[key] = '***';
    } else if (typeof sanitized[key] === 'object' && sanitized[key] !== null) {
      sanitized[key] = sanitizeDebugData(sanitized[key]);
    }
  }

  return sanitized;
}

module.exports = {
  isDebugMode,
  debug,
  debugError,
  getDebugInfo,
  debugQuery,
  debugRequest,
  debugResponse,
  sanitizeDebugData
};

