const express = require('express');
const router = express.Router();
const { SUCCESS } = require('../../src/response/success');
const { ERROR } = require('../../src/response/error');
const logger = require('../../src/logger/logger');
const { validateRequest } = require('../../src/authenticate/authenticate');
const { checkPermission } = require('../../src/middleware/permissionMiddleware');
const {
  createActivityLog,
  getActivityLogs,
  getActivityLogById,
  getUserActivityLogs,
  getActivityStatistics,
  deleteOldActivityLogs,
  parseUserAgent
} = require('../../src/activity/activityLog');

/**
 * @swagger
 * /api/activity/logs:
 *   post:
 *     summary: Create activity log entry
 *     description: Log a user activity
 *     tags: [Activity Logs]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - message
 *             properties:
 *               level:
 *                 type: string
 *                 enum: [info, warn, error, debug, audit]
 *               message:
 *                 type: string
 *               action:
 *                 type: string
 *               module:
 *                 type: string
 *               ip_address:
 *                 type: string
 *               user_agent:
 *                 type: string
 *               endpoint:
 *                 type: string
 *               method:
 *                 type: string
 *               status_code:
 *                 type: integer
 *               metadata:
 *                 type: object
 */
router.post('/logs', validateRequest, checkPermission('edit_profile'), async (req, res, next) => {
  try {
    const userId = req.user?.uid || req.user?.user_id;
    const userAgent = req.get('user-agent') || req.body.user_agent;
    const ipAddress = req.ip || req.connection.remoteAddress || req.body.ip_address;
    
    // Parse user agent
    const { device, browser, os } = parseUserAgent(userAgent);

    const logData = {
      user_id: userId || req.body.user_id || null,
      level: req.body.level || 'info',
      message: req.body.message,
      action: req.body.action || null,
      module: req.body.module || null,
      ip_address: ipAddress,
      user_agent: userAgent,
      device: req.body.device || device,
      browser: req.body.browser || browser,
      os: req.body.os || os,
      platform: req.body.platform || 'web',
      endpoint: req.body.endpoint || req.originalUrl,
      method: req.body.method || req.method,
      status_code: req.body.status_code || null,
      request_id: req.body.request_id || req.id || null,
      session_id: req.body.session_id || req.session?.id || null,
      metadata: req.body.metadata || null,
      error_details: req.body.error_details || null,
      duration_ms: req.body.duration_ms || null
    };

    const activityLog = await createActivityLog(logData);
    
    return res.status(201).json(
      SUCCESS.response('Activity log created successfully', { activity_log: activityLog })
    );
  } catch (error) {
    logger.error('Error creating activity log', { error: error.message, module: 'ActivityLog', label: 'CREATE_ACTIVITY_LOG' });
    const errorResponse = ERROR.fromMap('ACTIVITY_LOG_CREATE_FAILED', {}, error);
    return res.status(errorResponse.statusCode).json(errorResponse.detail);
  }
});

/**
 * @swagger
 * /api/activity/logs:
 *   get:
 *     summary: Get activity logs
 *     description: Retrieve activity logs with filters
 *     tags: [Activity Logs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: user_id
 *         schema:
 *           type: string
 *       - in: query
 *         name: level
 *         schema:
 *           type: string
 *           enum: [info, warn, error, debug, audit]
 *       - in: query
 *         name: action
 *         schema:
 *           type: string
 *       - in: query
 *         name: module
 *         schema:
 *           type: string
 *       - in: query
 *         name: start_date
 *         schema:
 *           type: string
 *           format: date-time
 *       - in: query
 *         name: end_date
 *         schema:
 *           type: string
 *           format: date-time
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 100
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 */
router.get('/logs', validateRequest, checkPermission('view_activity_log'), async (req, res, next) => {
  try {
    const filters = {
      user_id: req.query.user_id,
      level: req.query.level,
      action: req.query.action,
      module: req.query.module,
      ip_address: req.query.ip_address,
      start_date: req.query.start_date,
      end_date: req.query.end_date,
      limit: req.query.limit || 100,
      offset: req.query.offset || 0,
      orderBy: req.query.order_by || 'created_at',
      order: req.query.order || 'desc'
    };

    const activityLogs = await getActivityLogs(filters);
    
    return res.status(200).json(
      SUCCESS.response('Activity logs retrieved successfully', { 
        activity_logs: activityLogs,
        count: activityLogs.length
      })
    );
  } catch (error) {
    logger.error('Error getting activity logs', { error: error.message, module: 'ActivityLog', label: 'GET_ACTIVITY_LOGS' });
    const errorResponse = ERROR.fromMap('ACTIVITY_LOG_QUERY_FAILED', {}, error);
    return res.status(errorResponse.statusCode).json(errorResponse.detail);
  }
});

/**
 * @swagger
 * /api/activity/logs/{log_id}:
 *   get:
 *     summary: Get activity log by ID
 *     description: Retrieve a specific activity log
 *     tags: [Activity Logs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: log_id
 *         required: true
 *         schema:
 *           type: string
 */
router.get('/logs/:log_id', validateRequest, checkPermission('view_activity_log'), async (req, res, next) => {
  try {
    const { log_id } = req.params;
    const activityLog = await getActivityLogById(log_id);
    
    if (!activityLog) {
      const errorResponse = ERROR.fromMap('ACTIVITY_LOG_NOT_FOUND', { log_id });
      return res.status(errorResponse.statusCode).json(errorResponse.detail);
    }
    
    return res.status(200).json(
      SUCCESS.response('Activity log retrieved successfully', { activity_log: activityLog })
    );
  } catch (error) {
    logger.error('Error getting activity log by ID', { error: error.message, module: 'ActivityLog', label: 'GET_ACTIVITY_LOG_BY_ID' });
    const errorResponse = ERROR.fromMap('INTERNAL_ERROR', {}, error);
    return res.status(errorResponse.statusCode).json(errorResponse.detail);
  }
});

/**
 * @swagger
 * /api/activity/users/{user_id}/logs:
 *   get:
 *     summary: Get user activity logs
 *     description: Retrieve activity logs for a specific user
 *     tags: [Activity Logs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: user_id
 *         required: true
 *         schema:
 *           type: string
 */
router.get('/users/:user_id/logs', validateRequest, checkPermission('view_activity_log'), async (req, res, next) => {
  try {
    const { user_id } = req.params;
    const filters = {
      start_date: req.query.start_date,
      end_date: req.query.end_date,
      limit: req.query.limit || 100,
      offset: req.query.offset || 0
    };

    const activityLogs = await getUserActivityLogs(user_id, filters);
    
    return res.status(200).json(
      SUCCESS.response('User activity logs retrieved successfully', { 
        user_id,
        activity_logs: activityLogs,
        count: activityLogs.length
      })
    );
  } catch (error) {
    logger.error('Error getting user activity logs', { error: error.message, module: 'ActivityLog', label: 'GET_USER_ACTIVITY_LOGS' });
    const errorResponse = ERROR.fromMap('ACTIVITY_LOG_QUERY_FAILED', {}, error);
    return res.status(errorResponse.statusCode).json(errorResponse.detail);
  }
});

/**
 * @swagger
 * /api/activity/me/logs:
 *   get:
 *     summary: Get current user activity logs
 *     description: Retrieve activity logs for the current user
 *     tags: [Activity Logs]
 *     security:
 *       - bearerAuth: []
 */
router.get('/me/logs', validateRequest, checkPermission('view_profile'), async (req, res, next) => {
  try {
    const userId = req.user?.uid || req.user?.user_id;
    const filters = {
      start_date: req.query.start_date,
      end_date: req.query.end_date,
      limit: req.query.limit || 100,
      offset: req.query.offset || 0
    };

    const activityLogs = await getUserActivityLogs(userId, filters);
    
    return res.status(200).json(
      SUCCESS.response('Your activity logs retrieved successfully', { 
        activity_logs: activityLogs,
        count: activityLogs.length
      })
    );
  } catch (error) {
    logger.error('Error getting current user activity logs', { error: error.message, module: 'ActivityLog', label: 'GET_MY_ACTIVITY_LOGS' });
    const errorResponse = ERROR.fromMap('ACTIVITY_LOG_QUERY_FAILED', {}, error);
    return res.status(errorResponse.statusCode).json(errorResponse.detail);
  }
});

/**
 * @swagger
 * /api/activity/statistics:
 *   get:
 *     summary: Get activity statistics
 *     description: Retrieve activity log statistics
 *     tags: [Activity Logs]
 *     security:
 *       - bearerAuth: []
 */
router.get('/statistics', validateRequest, checkPermission('view_activity_log'), async (req, res, next) => {
  try {
    const filters = {
      user_id: req.query.user_id,
      start_date: req.query.start_date,
      end_date: req.query.end_date
    };

    const statistics = await getActivityStatistics(filters);
    
    return res.status(200).json(
      SUCCESS.response('Activity statistics retrieved successfully', { statistics })
    );
  } catch (error) {
    logger.error('Error getting activity statistics', { error: error.message, module: 'ActivityLog', label: 'GET_ACTIVITY_STATISTICS' });
    const errorResponse = ERROR.fromMap('ACTIVITY_LOG_QUERY_FAILED', {}, error);
    return res.status(errorResponse.statusCode).json(errorResponse.detail);
  }
});

/**
 * @swagger
 * /api/activity/logs/cleanup:
 *   delete:
 *     summary: Delete old activity logs
 *     description: Delete activity logs older than specified days
 *     tags: [Activity Logs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: days
 *         schema:
 *           type: integer
 *           default: 90
 */
router.delete('/logs/cleanup', validateRequest, checkPermission('delete_activity_log'), async (req, res, next) => {
  try {
    const daysOld = parseInt(req.query.days || 90);
    const deletedCount = await deleteOldActivityLogs(daysOld);
    
    return res.status(200).json(
      SUCCESS.response('Old activity logs deleted successfully', { 
        deleted_count: deletedCount,
        days_old: daysOld
      })
    );
  } catch (error) {
    logger.error('Error deleting old activity logs', { error: error.message, module: 'ActivityLog', label: 'DELETE_OLD_ACTIVITY_LOGS' });
    const errorResponse = ERROR.fromMap('ACTIVITY_LOG_DELETE_FAILED', {}, error);
    return res.status(errorResponse.statusCode).json(errorResponse.detail);
  }
});

module.exports = router;

