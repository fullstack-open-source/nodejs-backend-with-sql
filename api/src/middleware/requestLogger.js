const logger = require('../logger/logger');
const { isDebugMode, debugRequest, debugResponse } = require('../utils/debug');

/**
 * Request logging middleware
 */
const requestLogger = (req, res, next) => {
  const start = Date.now();

  // Log request
  logger.info('Incoming request', {
    method: req.method,
    path: req.path,
    ip: req.ip,
    userAgent: req.get('user-agent')
  });

  // Debug mode: log detailed request info
  if (isDebugMode()) {
    debugRequest(req, res);
  }

  // Log response when finished
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info('Request completed', {
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip
    });

    // Debug mode: log detailed response info
    if (isDebugMode()) {
      debugResponse(req, res, duration);
    }
  });

  next();
};

module.exports = { requestLogger };

