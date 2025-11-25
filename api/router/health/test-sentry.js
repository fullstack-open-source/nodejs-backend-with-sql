/**
 * Sentry Test Endpoint
 * Tests Sentry error tracking in different environments
 */

const express = require('express');
const router = express.Router();
const { SUCCESS } = require('../../src/response/success');
const { ERROR } = require('../../src/response/error');
const logger = require('../../src/logger/logger');
const { captureException, captureMessage, setUser, addBreadcrumb } = require('../../src/sentry/sentry');
const { validateRequest } = require('../../src/authenticate/authenticate');

/**
 * @swagger
 * /api/health/test-sentry:
 *   get:
 *     summary: Test Sentry error tracking
 *     description: Intentionally triggers an error to test Sentry integration
 *     tags: [Health & Monitoring]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [exception, message, unhandled, async]
 *         description: Type of error to test
 *     responses:
 *       200:
 *         description: Error triggered successfully (check Sentry dashboard)
 *       500:
 *         description: Error occurred
 */
router.get('/test-sentry', validateRequest, async (req, res, next) => {
  try {
    const { type = 'exception' } = req.query;
    const NODE_ENV = process.env.NODE_ENV || 'development';
    
    // Set user context if available
    if (req.user) {
      setUser(req.user);
    }

    // Add breadcrumb
    addBreadcrumb('Sentry test initiated', 'test', 'info', { type, nodeEnv: NODE_ENV });

    switch (type) {
      case 'exception':
        // Test manual exception capture
        const testError = new Error('Test Sentry Exception - This is a test error');
        testError.name = 'SentryTestError';
        captureException(testError, {
          tags: {
            test_type: 'manual_exception',
            environment: NODE_ENV,
            endpoint: '/health/test-sentry'
          },
          extra: {
            query: req.query,
            userAgent: req.get('user-agent'),
            ip: req.ip
          }
        });
        
        return res.status(200).json(
          SUCCESS.response('Test exception sent to Sentry', {
            type: 'exception',
            environment: NODE_ENV,
            message: 'Check your Sentry dashboard for the error',
            error: testError.message
          })
        );

      case 'message':
        // Test manual message capture
        captureMessage('Test Sentry Message - This is a test message', 'warning', {
          tags: {
            test_type: 'manual_message',
            environment: NODE_ENV
          },
          extra: {
            query: req.query,
            timestamp: new Date().toISOString()
          }
        });
        
        return res.status(200).json(
          SUCCESS.response('Test message sent to Sentry', {
            type: 'message',
            environment: NODE_ENV,
            message: 'Check your Sentry dashboard for the message'
          })
        );

      case 'unhandled':
        // Test unhandled error (will be caught by error handler)
        throw new Error('Test Unhandled Error - This error should be caught by error handler and sent to Sentry');

      case 'async':
        // Test async error
        setTimeout(() => {
          const asyncError = new Error('Test Async Error - This is an async error');
          captureException(asyncError, {
            tags: {
              test_type: 'async_error',
              environment: NODE_ENV
            }
          });
        }, 100);
        
        return res.status(200).json(
          SUCCESS.response('Test async error scheduled', {
            type: 'async',
            environment: NODE_ENV,
            message: 'Async error will be sent to Sentry in 100ms'
          })
        );

      default:
        return res.status(400).json(
          ERROR.fromMap('INVALID_REQUEST', { 
            message: 'Invalid test type. Use: exception, message, unhandled, or async' 
          }).detail
        );
    }
  } catch (error) {
    logger.error('Error in Sentry test endpoint', { error: error.message, stack: error.stack });
    // This error will be caught by Sentry error handler
    next(error);
  }
});

module.exports = router;

