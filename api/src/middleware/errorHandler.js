const logger = require('../logger/logger');
const { ERROR } = require('../response/error');
const { captureException } = require('../sentry/sentry');

/**
 * Global error handler middleware
 */
const errorHandler = (err, req, res, next) => {
  logger.error('Error occurred', {
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    ip: req.ip
  });

  // Capture error in Sentry (if enabled)
  captureException(err, {
    tags: {
      endpoint: req.path,
      method: req.method,
      statusCode: err.statusCode || err.status || 500
    },
    extra: {
      query: req.query,
      body: req.body,
      userAgent: req.get('user-agent'),
      ip: req.ip
    },
    user: req.user ? {
      id: req.user.user_id || req.user.uid,
      username: req.user.user_name || req.user.username,
      email: req.user.email
    } : undefined
  });

  // Default error
  let statusCode = err.statusCode || err.status || 500;
  let message = err.message || 'Internal server error';
  let errorKey = err.errorKey || 'INTERNAL_SERVER_ERROR';
  let details = err.details || {};

  // Handle specific error types
  if (err.name === 'ValidationError') {
    statusCode = 400;
    errorKey = 'VALIDATION_ERROR';
    message = 'Validation failed';
    details = err.details || { errors: err.errors };
  } else if (err.name === 'UnauthorizedError' || err.name === 'JsonWebTokenError') {
    statusCode = 401;
    errorKey = 'UNAUTHORIZED';
    message = 'Authentication failed';
  } else if (err.name === 'CastError') {
    statusCode = 400;
    errorKey = 'INVALID_ID';
    message = 'Invalid ID format';
  }

  // Don't expose internal errors unless DEBUG_MODE is enabled
  const { isDebugMode } = require('../utils/debug');
  const exception = isDebugMode() ? err : undefined;

  res.status(statusCode).json(
    ERROR.build(errorKey, details, exception)
  );
};

module.exports = { errorHandler };

