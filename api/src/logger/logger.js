const winston = require('winston');
const path = require('path');
const fs = require('fs');

const logDir = path.join(__dirname, '../../logs');

if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

const consoleFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.colorize(),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    let msg = `${timestamp} [${level}]: ${message}`;
    if (Object.keys(meta).length > 0) {
      msg += ` ${JSON.stringify(meta)}`;
    }
    return msg;
  })
);

const fileFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

const successFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    let logEntry = `${timestamp} [${level.toUpperCase()}]: ${message}`;
    if (Object.keys(meta).length > 0) {
      logEntry += ` ${JSON.stringify(meta, null, 2)}`;
    }
    return logEntry;
  })
);

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: fileFormat,
  defaultMeta: { service: 'nodejs-backend-with-postgresql' },
  transports: [
    new winston.transports.File({
      filename: path.join(logDir, 'errors-server.log'),
      level: 'warn',
      format: fileFormat,
      maxsize: 50 * 1024 * 1024,
      maxFiles: 1, 
      tailable: true
    }),
    new winston.transports.File({
      filename: path.join(logDir, 'success-server.log'),
      level: 'info', 
      format: successFormat,
      maxsize: 50 * 1024 * 1024,
      maxFiles: 1, 
      tailable: true,
      filter: (info) => info.level === 'info'
    })
  ],
  exceptionHandlers: [
    new winston.transports.File({
      filename: path.join(logDir, 'errors-server.log'),
      format: fileFormat,
      maxsize: 50 * 1024 * 1024,
      maxFiles: 1
    })
  ],
  rejectionHandlers: [
    new winston.transports.File({
      filename: path.join(logDir, 'errors-server.log'),
      format: fileFormat,
      maxsize: 50 * 1024 * 1024,
      maxFiles: 1
    })
  ]
});

logger.add(new winston.transports.Console({
  format: consoleFormat,
  level: 'warn'
}));

logger.info = (function(originalInfo) {
  return function(message, meta = {}) {
    originalInfo.call(this, message, meta);
  };
})(logger.info);

logger.error = (function(originalError) {
  return function(message, meta = {}) {
    originalError.call(this, message, meta);
  };
})(logger.error);

logger.warn = (function(originalWarn) {
  return function(message, meta = {}) {
    originalWarn.call(this, message, meta);
  };
})(logger.warn);

logger.debug = (function(originalDebug) {
  return function(message, meta = {}) {
    originalDebug.call(this, message, meta);
  };
})(logger.debug);

module.exports = logger;

