/**
 * Node.js Server - Express Backend
 * Matching FastAPI Backend Structure
 * Only includes routers that exist in FastAPI backend
 */
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
require('dotenv').config();
require('express-async-errors');

// ============================================================
// ROUTER IMPORTS - Matching FastAPI Backend
// ============================================================
const authenticateRouter = require('./router/authenticate/authenticate');
const profileRouter = require('./router/authenticate/profile');
const healthRouter = require('./router/health/api');
const testSentryRouter = require('./router/health/test-sentry');
const uploadRouter = require('./router/upload/api');
const dashboardRouter = require('./router/dashboard/api');
const permissionsRouter = require('./router/permissions/api');
const activityRouter = require('./router/activity/api');

// ============================================================
// MIDDLEWARE IMPORTS
// ============================================================
const { errorHandler } = require('./src/middleware/errorHandler');
const { requestLogger } = require('./src/middleware/requestLogger');
const { securityMiddleware } = require('./src/middleware/securityMiddleware');

// ============================================================
// UTILITY IMPORTS
// ============================================================
const logger = require('./src/logger/logger');
const { prisma } = require('./src/db/prisma');
const { SUCCESS } = require('./src/response/success');

// ============================================================
// SWAGGER/OPENAPI DOCUMENTATION
// ============================================================
const { swaggerSpec, swaggerUi, swaggerOptions } = require('./src/config/swagger');

// ============================================================
// SENTRY INITIALIZATION
// ============================================================
const { initSentry, getRequestHandler, getTracingHandler, getErrorHandler } = require('./src/sentry/sentry');
const sentry = initSentry();

// ============================================================
// EXPRESS APP INITIALIZATION
// ============================================================
const app = express();

// ============================================================
// ENVIRONMENT VARIABLES
// ============================================================
const PORT = process.env.API_INTERNAL_PORT || 3000;
const MODE = process.env.MODE || 'api/dev/v1';
const API_MODE = process.env.API_MODE || 'development';

// ============================================================
// MIDDLEWARE CONFIGURATION
// ============================================================

// Sentry request handler (must be first)
if (sentry) {
  app.use(getRequestHandler());
  app.use(getTracingHandler());
}

// Trust proxy (for nginx)
app.set('trust proxy', 1);

// Security headers
app.use(helmet({
  contentSecurityPolicy: API_MODE === 'production' ? undefined : false,
  crossOriginEmbedderPolicy: false
}));

// CORS Configuration - Matching FastAPI Backend
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);
    
    // Match winsta.ai, winsta.pro and their subdomains, or localhost
    // Base domain and all subdomains
    // localhost development
    const allowedOrigins = [
      /^https?:\/\/(.*\.)?winsta\.(ai|pro)$/,
      /^https?:\/\/(127\.0\.0\.1|localhost):(8000|3000)$/
    ];
    
    const isAllowed = allowedOrigins.some(pattern => pattern.test(origin));
    callback(null, isAllowed);
  },
  credentials: true,
  methods: ['*'],
  allowedHeaders: ['*']
};

app.use(cors(corsOptions));

// Body parsing middleware
app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));

// Compression
app.use(compression());

// Request logging
app.use(morgan('combined', { stream: { write: message => logger.info(message.trim()) } }));
app.use(requestLogger);

// Rate limiting - more permissive for high traffic
const limiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: parseInt(process.env.RATE_LIMIT_MAX || '200', 10), // Increased from 100 to 200 for better traffic handling
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Skip rate limiting for health checks
    return req.path === '/health' || req.path === '/api/health';
  },
  // Note: For distributed rate limiting in cluster mode, install rate-limit-redis
  // and configure Redis store here if needed
});

app.use(limiter);

// Security middleware
app.use(securityMiddleware);

// ============================================================
// SWAGGER/OPENAPI DOCUMENTATION
// ============================================================
// Swagger documentation is disabled in production (matching FastAPI)

if (API_MODE !== 'production') {
  // Swagger JSON endpoint - regenerates spec on each request to pick up new endpoints
  app.get('/api-docs.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    const { getSwaggerSpec } = require('./src/config/swagger');
    const freshSpec = getSwaggerSpec();
    res.send(freshSpec);
  });

  // Swagger UI endpoint - regenerates spec on each request to pick up new endpoints
  app.use('/api-docs', swaggerUi.serve, (req, res, next) => {
    // Disable caching for Swagger UI
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    
    const { getSwaggerSpec, swaggerOptions } = require('./src/config/swagger');
    const freshSpec = getSwaggerSpec();
    swaggerUi.setup(freshSpec, swaggerOptions)(req, res, next);
  });
}

// ============================================================
// HEALTH CHECK
// ============================================================

/**
 * Public health check endpoint with environment info
 * Does not require database connection to return success
 * Matching FastAPI Backend structure
 */
app.get('/health', async (req, res) => {
  try {
    // Check database connection status (non-blocking)
    let db_status = 'unknown';
    try {
      await prisma.$queryRaw`SELECT 1`;
      db_status = 'connected';
    } catch (dbError) {
      db_status = `error: ${dbError.message.substring(0, 50)}`;
    }

    const envInfo = {
      API_VERSION: process.env.API_VERSION || 'N/A',
      API_MODE: process.env.API_MODE || 'N/A',
      MODE: process.env.MODE || 'N/A',
      UTC: process.env.UTC || 'N/A',
      DEBUG_MODE: process.env.DEBUG_MODE || 'N/A',
      TIMEZONE: process.env.TIMEZONE || 'N/A',
      LOG_LEVEL: process.env.LOG_LEVEL || 'N/A'
    };

    const meta = {
      service: 'nodejs-backend-with-postgresql-api',
      status: 'ok',
      database: db_status,
      env: envInfo
    };

    return res.status(200).json(
      SUCCESS.response(
        'Service is healthy',
        { status: 'ok', database: db_status },
        meta
      )
    );
  } catch (error) {
    // Even on error, return a response (not an exception)
    logger.error('Health check failed', { error: error.message });
    return res.status(500).json({
      success: false,
      message: 'Health check failed',
      data: { status: 'error' },
      error: error.message
    });
  }
});

// ============================================================
// ROUTERS - Matching FastAPI Backend
// ============================================================

// Authentication Routes
app.use(`/${MODE}`, authenticateRouter);

// Profile & Settings Routes
app.use(`/${MODE}`, profileRouter);

// Health & Monitoring Routes
app.use(`/${MODE}`, healthRouter);
app.use(`/${MODE}`, testSentryRouter);

// Upload Routes
app.use(`/${MODE}`, uploadRouter);

// Dashboard Routes
app.use(`/${MODE}`, dashboardRouter);

// Permissions & Groups Routes
app.use(`/${MODE}`, permissionsRouter);

// Activity Logs Routes
app.use(`/${MODE}/activity`, activityRouter);

// ============================================================
// ERROR HANDLING
// ============================================================

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
    path: req.path
  });
});

// Sentry error handler (before global error handler)
if (sentry) {
  app.use(getErrorHandler());
}

// Global error handler
app.use(errorHandler);

// ============================================================
// STARTUP EVENT
// ============================================================

/**
 * Initialize services on application startup
 * Matching FastAPI Backend startup event
 */
async function startupEvent() {
  // Test database connection (non-blocking)
  try {
    await prisma.$queryRaw`SELECT 1`;
    logger.info('✅ Database connection initialized', { module: 'Server' });
  } catch (dbError) {
    logger.warn('⚠️  Database connection not available yet (will retry on first use)', {
      module: 'Server',
      error: dbError.message
    });
    // Continue startup even if database fails (for health checks, etc.)
  }

  // Initialize cache (for token blacklisting)
  try {
    const cache = require('./src/cache/cache');
    // Cache connection is handled automatically in cache.js
    // Just verify it's available
    if (cache && cache.client) {
      logger.info('✅ Cache initialized', { module: 'Server' });
    }
  } catch (cacheError) {
    logger.warn('⚠️  Cache initialization failed (will use in-memory fallback)', {
      module: 'Server',
      error: cacheError.message
    });
  }

  // Note: Database schema is managed via Prisma
  // Use 'npm run db:pull' to pull schema from remote
  // Use 'npm run db:push' to push schema to database
}

// ============================================================
// SERVER STARTUP
// ============================================================

// Start server
async function startServer() {
  try {
    // Run startup event
    await startupEvent();
  } catch (error) {
    logger.error('Failed during startup event', { error: error.message });
    // Continue startup even if startup event fails
  }
  
  app.listen(PORT, '0.0.0.0', () => {
    logger.info(`🚀 Server running on port ${PORT}`, {
      port: PORT,
      mode: MODE,
      apiMode: API_MODE,
      nodeVersion: process.version
    });
  });
}

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  logger.error('Unhandled Promise Rejection', { error: err.message, stack: err.stack });
  process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  logger.error('Uncaught Exception', { error: err.message, stack: err.stack });
  process.exit(1);
});

// Graceful shutdown
async function gracefulShutdown(signal) {
  logger.info(`${signal} received, shutting down gracefully`);
  
  // Flush Sentry events
  if (sentry) {
    try {
      const { flush } = require('./src/sentry/sentry');
      await flush(2000);
      logger.info('Sentry events flushed');
    } catch (error) {
      logger.error('Error flushing Sentry events', { error: error.message });
    }
  }
  
  // Close worker pool
  try {
    const { terminateWorkerPool } = require('./src/utils/workerUtils');
    await terminateWorkerPool();
  } catch (error) {
    logger.error('Error terminating worker pool', { error: error.message });
  }
  
  // Close database connections
  try {
    await prisma.$disconnect();
    logger.info('Database connections closed');
  } catch (error) {
    logger.error('Error closing database connections', { error: error.message });
  }
  
  // Give time for ongoing requests to complete
  setTimeout(() => {
    process.exit(0);
  }, 5000);
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Start the server
startServer();

module.exports = app;

