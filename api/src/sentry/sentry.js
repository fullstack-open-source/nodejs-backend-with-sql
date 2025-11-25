/**
 * Sentry Error Tracking Configuration
 * Integrates Sentry for error monitoring and performance tracking
 */

const Sentry = require('@sentry/node');
let ProfilingIntegration = null;
try {
  ProfilingIntegration = require('@sentry/profiling-node').ProfilingIntegration;
} catch (error) {
  // Profiling integration is optional
}
const logger = require('../logger/logger');

/**
 * Initialize Sentry based on environment
 * @param {object} app - Express app instance (optional, for middleware)
 */
function initSentry(app = null) {
  const NODE_ENV = process.env.NODE_ENV || 'development';
  const SENTRY_ENVIRONMENT = process.env.SENTRY_ENVIRONMENT || NODE_ENV;
  const SENTRY_DSN = process.env.SENTRY_DSN;
  const SENTRY_TRACES_SAMPLE_RATE = parseFloat(process.env.SENTRY_TRACES_SAMPLE_RATE || '0.1');
  const SENTRY_PROFILES_SAMPLE_RATE = parseFloat(process.env.SENTRY_PROFILES_SAMPLE_RATE || '0.1');

  // Only initialize Sentry if DSN is provided
  if (!SENTRY_DSN) {
    logger.warn('Sentry DSN not provided, Sentry will not be initialized');
    return null;
  }

  // Environment-specific configuration
  const environmentConfig = {
    development: {
      enabled: process.env.SENTRY_ENABLE_DEV === 'true',
      tracesSampleRate: 1.0, // 100% of transactions in development
      profilesSampleRate: 1.0,
      debug: false, // Disable Sentry's internal debug logging to reduce verbosity
      beforeSend: (event, hint) => {
        // In development, log to console only if DEBUG_MODE is enabled
        if (process.env.DEBUG_MODE === 'true') {
          logger.debug('Sentry event', { event, hint });
        }
        return event;
      }
    },
    staging: {
      enabled: true,
      tracesSampleRate: 0.5, // 50% of transactions in staging
      profilesSampleRate: 0.5,
      debug: false,
      beforeSend: (event, hint) => {
        // Filter out certain errors in staging if needed
        return event;
      }
    },
    production: {
      enabled: true,
      tracesSampleRate: SENTRY_TRACES_SAMPLE_RATE || 0.1, // Configurable, default 10%
      profilesSampleRate: SENTRY_PROFILES_SAMPLE_RATE || 0.1,
      debug: false,
      beforeSend: (event, hint) => {
        // In production, filter sensitive data
        if (event.request) {
          // Remove sensitive headers
          if (event.request.headers) {
            delete event.request.headers['authorization'];
            delete event.request.headers['cookie'];
            delete event.request.headers['x-api-key'];
          }
          // Remove sensitive query params
          if (event.request.query_string) {
            const queryParams = new URLSearchParams(event.request.query_string);
            queryParams.delete('token');
            queryParams.delete('password');
            queryParams.delete('secret');
            event.request.query_string = queryParams.toString();
          }
        }
        return event;
      }
    }
  };

  const config = environmentConfig[NODE_ENV] || environmentConfig.development;

  // Skip initialization if disabled for this environment
  if (!config.enabled) {
    logger.info(`Sentry disabled for ${NODE_ENV} environment`);
    return null;
  }

  try {
    // Suppress Sentry's internal verbose logging
    // The "Flushing client reports" messages are normal operational logs, not errors
    if (process.env.DEBUG_MODE !== 'true') {
      // Redirect Sentry's internal logger to only show errors
      const originalConsoleLog = console.log;
      const originalConsoleInfo = console.info;
      const originalConsoleWarn = console.warn;
      
      // Only suppress Sentry's flush messages, keep other logs
      const sentryLogPattern = /Sentry Logger \[(log|debug)\]:/;
      const originalLog = console.log;
      console.log = function(...args) {
        const message = args.join(' ');
        if (!sentryLogPattern.test(message) || message.includes('error') || message.includes('Error')) {
          originalLog.apply(console, args);
        }
      };
    }

    const sentryConfig = {
      dsn: SENTRY_DSN,
      environment: SENTRY_ENVIRONMENT,
      tracesSampleRate: config.tracesSampleRate,
      profilesSampleRate: config.profilesSampleRate,
      debug: config.debug,
      integrations: [
        ...(ProfilingIntegration ? [new ProfilingIntegration()] : []),
        Sentry.httpIntegration({ tracing: true }),
        ...(app ? [Sentry.expressIntegration({ app })] : []),
        Sentry.onUncaughtExceptionIntegration({
          exitEvenIfOtherHandlersAreRegistered: false
        }),
        Sentry.onUnhandledRejectionIntegration({
          mode: 'warn'
        })
      ],
      beforeSend: config.beforeSend,
      beforeSendTransaction: (event) => {
        // Filter out health check transactions
        if (event.transaction && (
          event.transaction.includes('/health') ||
          event.transaction.includes('/api/health')
        )) {
          return null; // Don't send health check transactions
        }
        return event;
      },
      ignoreErrors: [
        'ValidationError',
        'UnauthorizedError',
        'ForbiddenError',
        'NotFoundError',
        'RateLimitError'
      ],
      initialScope: {
        tags: {
          node_env: NODE_ENV,
          api_mode: process.env.API_MODE || 'development',
          debug_mode: process.env.DEBUG_MODE || 'false'
        }
      }
    };

    Sentry.init(sentryConfig);

    logger.info('Sentry initialized successfully', {
      environment: SENTRY_ENVIRONMENT,
      nodeEnv: NODE_ENV,
      tracesSampleRate: config.tracesSampleRate
    });

    return Sentry;
  } catch (error) {
    logger.error('Failed to initialize Sentry', { error: error.message });
    return null;
  }
}

/**
 * Get Sentry request handler middleware
 * @returns {Function} Express middleware or no-op
 */
function getRequestHandler() {
  if (!Sentry || !Sentry.Handlers) {
    return (req, res, next) => next();
  }
  return Sentry.Handlers.requestHandler({
    user: ['id', 'username', 'email'],
    ip: true,
    request: ['headers', 'method', 'query_string', 'url'],
    serverName: true,
    transaction: 'methodPath'
  });
}

/**
 * Get Sentry tracing handler middleware
 * @returns {Function} Express middleware or no-op
 */
function getTracingHandler() {
  if (!Sentry || !Sentry.Handlers) {
    return (req, res, next) => next();
  }
  return Sentry.Handlers.tracingHandler();
}

/**
 * Get Sentry error handler middleware
 * @returns {Function} Express middleware or no-op
 */
function getErrorHandler() {
  if (!Sentry || !Sentry.Handlers) {
    return (err, req, res, next) => next(err);
  }
  return Sentry.Handlers.errorHandler({
    shouldHandleError(error) {
      // Don't send to Sentry if it's a known client error
      if (error.statusCode && error.statusCode < 500) {
        return false;
      }
      return true;
    }
  });
}

/**
 * Capture exception manually
 * @param {Error} error - Error to capture
 * @param {object} context - Additional context
 */
function captureException(error, context = {}) {
  try {
    if (Sentry && typeof Sentry.captureException === 'function') {
      Sentry.withScope((scope) => {
        if (context.user) {
          scope.setUser(context.user);
        }
        if (context.tags) {
          Object.keys(context.tags).forEach(key => {
            scope.setTag(key, context.tags[key]);
          });
        }
        if (context.extra) {
          Object.keys(context.extra).forEach(key => {
            scope.setExtra(key, context.extra[key]);
          });
        }
        Sentry.captureException(error);
      });
    }
  } catch (err) {
    logger.error('Failed to capture exception in Sentry', { error: err.message });
  }
}

/**
 * Capture message manually
 * @param {string} message - Message to capture
 * @param {string} level - Severity level (info, warning, error)
 * @param {object} context - Additional context
 */
function captureMessage(message, level = 'info', context = {}) {
  try {
    if (Sentry && typeof Sentry.captureMessage === 'function') {
      Sentry.withScope((scope) => {
        if (context.user) {
          scope.setUser(context.user);
        }
        if (context.tags) {
          Object.keys(context.tags).forEach(key => {
            scope.setTag(key, context.tags[key]);
          });
        }
        if (context.extra) {
          Object.keys(context.extra).forEach(key => {
            scope.setExtra(key, context.extra[key]);
          });
        }
        Sentry.captureMessage(message, level);
      });
    }
  } catch (err) {
    logger.error('Failed to capture message in Sentry', { error: err.message });
  }
}

/**
 * Set user context for Sentry
 * @param {object} user - User object
 */
function setUser(user) {
  try {
    if (Sentry && typeof Sentry.setUser === 'function') {
      Sentry.setUser({
        id: user.user_id || user.id || user.uid,
        username: user.user_name || user.username,
        email: user.email,
        ip_address: user.ip_address
      });
    }
  } catch (err) {
    logger.error('Failed to set user in Sentry', { error: err.message });
  }
}

/**
 * Add breadcrumb for debugging
 * @param {string} message - Breadcrumb message
 * @param {string} category - Breadcrumb category
 * @param {string} level - Breadcrumb level
 * @param {object} data - Additional data
 */
function addBreadcrumb(message, category = 'custom', level = 'info', data = {}) {
  try {
    if (Sentry && typeof Sentry.addBreadcrumb === 'function') {
      Sentry.addBreadcrumb({
        message,
        category,
        level,
        data,
        timestamp: Date.now() / 1000
      });
    }
  } catch (err) {
    logger.error('Failed to add breadcrumb in Sentry', { error: err.message });
  }
}

/**
 * Flush Sentry events before shutdown
 * @param {number} timeout - Timeout in milliseconds
 * @returns {Promise}
 */
async function flush(timeout = 2000) {
  try {
    if (Sentry && typeof Sentry.flush === 'function') {
      return await Sentry.flush(timeout);
    }
  } catch (err) {
    logger.error('Failed to flush Sentry', { error: err.message });
  }
  return Promise.resolve();
}

module.exports = {
  initSentry,
  getRequestHandler,
  getTracingHandler,
  getErrorHandler,
  captureException,
  captureMessage,
  setUser,
  addBreadcrumb,
  flush,
  Sentry
};

