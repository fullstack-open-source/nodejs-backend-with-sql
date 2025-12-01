const express = require('express');
const router = express.Router();
const { SUCCESS } = require('../../src/response/success');
const { ERROR } = require('../../src/response/error');
const logger = require('../../src/logger/logger');
const { captureException, captureMessage } = require('../../src/sentry/sentry');

/**
 * @swagger
 * /api/health:
 *   get:
 *     summary: Health check endpoint
 *     description: Returns the health status of the API service with environment information
 *     tags: [Health & Monitoring]
 *     responses:
 *       200:
 *         description: Service is healthy
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *             example:
 *               success: true
 *               message: Service is healthy
 *               data:
 *                 status: ok
 *               meta:
 *                 service: nodejs-backend-with-postgresql-api
 *                 status: ok
 *                 env:
 *                   API_VERSION: 1.0.0
 *                   API_MODE: development
 *       500:
 *         description: Health check failed
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
/**
 * Health check endpoint
 * GET /health
 */
router.get('/health', async (req, res) => {
  try {

    const baseUrl = `${process.env.API_HOST || 'localhost'}:${process.env.PROXY_PORT || 8900}`;
    const mode = process.env.MODE || 'api/dev/v1';

    const envInfo = {
      API_VERSION: process.env.API_VERSION || 'N/A',
      API_MODE: process.env.API_MODE || 'N/A',
      API_URL: baseUrl,
      MODE: mode,
      UTC: process.env.UTC || 'N/A',
      DEBUG_MODE: process.env.DEBUG_MODE || 'N/A',
      TIMEZONE: process.env.TIMEZONE || 'N/A',
      LOG_LEVEL: process.env.LOG_LEVEL || 'N/A',
    };

    const meta = {
      service: 'nodejs-backend-with-postgresql-api',
      status: 'ok',
      env: envInfo  
    };

    return res.status(200).json(
      SUCCESS.response('Service is healthy', { status: 'ok' }, meta)
    );
  } catch (error) {
    logger.error('Health check failed', { error: error.message });
    captureException(error, { tags: { endpoint: '/health' } });
    const errorResponse = ERROR.fromMap('HEALTH_CHECK_FAILED', {}, error);
    return res.status(errorResponse.statusCode).json(errorResponse.detail);
  }
});

/**
 * @swagger
 * /api/health/system:
 *   get:
 *     summary: System health check endpoint
 *     description: Returns detailed system information including CPU, memory, and environment details
 *     tags: [Health & Monitoring]
 *     responses:
 *       200:
 *         description: System health information
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *             example:
 *               success: true
 *               message: System health check completed
 *               data:
 *                 status: healthy
 *                 system_info:
 *                   platform: linux
 *                   nodeVersion: v18.0.0
 *                   cpuCount: 4
 *                   memoryTotal: 8589934592
 *                   memoryFree: 4294967296
 *                   memoryUsed: 4294967296
 *                   uptime: 3600
 *                 environment:
 *                   API_VERSION: 1.0.0
 *                   API_MODE: development
 *                 timestamp: 1234567890
 *       500:
 *         description: System health check failed
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
/**
 * System health check endpoint
 * GET /health/system
 */
router.get('/health/system', async (req, res) => {
  try {
    const os = require('os');
    const baseUrl = `${process.env.API_HOST || 'localhost'}:${process.env.PROXY_PORT || 8900}`;
    const mode = process.env.MODE || 'api/dev/v1';
    const systemInfo = {
      platform: process.platform,
      nodeVersion: process.version,
      cpuCount: os.cpus().length,
      memoryTotal: os.totalmem(),
      memoryFree: os.freemem(),
      memoryUsed: os.totalmem() - os.freemem(),
      uptime: os.uptime()
    };

    const envInfo = {
      API_VERSION: process.env.API_VERSION || 'N/A',
      API_MODE: process.env.API_MODE || 'N/A',
      API_URL: baseUrl,
      MODE: mode,
      DEBUG_MODE: process.env.DEBUG_MODE || 'N/A',
      LOG_LEVEL: process.env.LOG_LEVEL || 'N/A'
    };

    return res.status(200).json(
      SUCCESS.response('System health check completed', {
        status: 'healthy',
        system_info: systemInfo,
        environment: envInfo,
        timestamp: Date.now()
      })
    );
  } catch (error) {
    logger.error('System health check failed', { error: error.message });
    const errorResponse = ERROR.fromMap('HEALTH_CHECK_FAILED', {}, error);
    return res.status(errorResponse.statusCode).json(errorResponse.detail);
  }
});

module.exports = router;

