/**
 * Activity Log Service
 * Handles user activity logging operations using Prisma
 */

const { prisma } = require('../db/prisma');
const logger = require('../logger/logger');

/**
 * Create activity log entry
 * @param {object} logData - Activity log data
 * @returns {Promise<object>} Created activity log
 */
async function createActivityLog(logData) {
  try {
    const {
      user_id,
      level = 'info',
      message,
      action,
      module,
      ip_address,
      user_agent,
      device,
      browser,
      os,
      platform,
      endpoint,
      method,
      status_code,
      request_id,
      session_id,
      metadata,
      error_details,
      duration_ms
    } = logData;

    if (!message) {
      throw new Error('Message is required for activity log');
    }

    const activityLog = await prisma.activityLog.create({
      data: {
        user_id: user_id || null,
        level,
        message,
        action: action || null,
        module: module || null,
        ip_address: ip_address || null,
        user_agent: user_agent || null,
        device: device || null,
        browser: browser || null,
        os: os || null,
        platform: platform || null,
        endpoint: endpoint || null,
        method: method || null,
        status_code: status_code || null,
        request_id: request_id || null,
        session_id: session_id || null,
        metadata: metadata || null,
        error_details: error_details || null,
        duration_ms: duration_ms || null
      }
    });

    return activityLog;
  } catch (error) {
    logger.error('Error creating activity log', { error: error.message, module: 'ActivityLog', label: 'CREATE_ACTIVITY_LOG' });
    throw error;
  }
}

/**
 * Get activity logs with filters
 * @param {object} filters - Filter options
 * @returns {Promise<Array>} Array of activity logs
 */
async function getActivityLogs(filters = {}) {
  try {
    const {
      user_id,
      level,
      action,
      module,
      ip_address,
      start_date,
      end_date,
      limit = 100,
      offset = 0,
      orderBy = 'created_at',
      order = 'desc'
    } = filters;

    const where = {};
    
    if (user_id) where.user_id = user_id;
    if (level) where.level = level;
    if (action) where.action = action;
    if (module) where.module = module;
    if (ip_address) where.ip_address = ip_address;
    
    if (start_date || end_date) {
      where.created_at = {};
      if (start_date) where.created_at.gte = new Date(start_date);
      if (end_date) where.created_at.lte = new Date(end_date);
    }

    const activityLogs = await prisma.activityLog.findMany({
      where,
      include: {
        user: {
          select: {
            user_id: true,
            email: true,
            user_name: true,
            first_name: true,
            last_name: true
          }
        }
      },
      orderBy: {
        [orderBy]: order
      },
      take: parseInt(limit),
      skip: parseInt(offset)
    });

    return activityLogs;
  } catch (error) {
    logger.error('Error getting activity logs', { error: error.message, module: 'ActivityLog', label: 'GET_ACTIVITY_LOGS' });
    throw error;
  }
}

/**
 * Get activity log by ID
 * @param {string} logId - Log ID
 * @returns {Promise<object|null>} Activity log or null
 */
async function getActivityLogById(logId) {
  try {
    const activityLog = await prisma.activityLog.findUnique({
      where: { log_id: logId },
      include: {
        user: {
          select: {
            user_id: true,
            email: true,
            user_name: true,
            first_name: true,
            last_name: true
          }
        }
      }
    });

    return activityLog;
  } catch (error) {
    logger.error('Error getting activity log by ID', { error: error.message, module: 'ActivityLog', label: 'GET_ACTIVITY_LOG_BY_ID' });
    throw error;
  }
}

/**
 * Get user activity logs
 * @param {string} userId - User ID
 * @param {object} filters - Additional filters
 * @returns {Promise<Array>} Array of user activity logs
 */
async function getUserActivityLogs(userId, filters = {}) {
  try {
    return await getActivityLogs({
      ...filters,
      user_id: userId
    });
  } catch (error) {
    logger.error('Error getting user activity logs', { error: error.message, module: 'ActivityLog', label: 'GET_USER_ACTIVITY_LOGS' });
    throw error;
  }
}

/**
 * Get activity statistics
 * @param {object} filters - Filter options
 * @returns {Promise<object>} Activity statistics
 */
async function getActivityStatistics(filters = {}) {
  try {
    const {
      user_id,
      start_date,
      end_date
    } = filters;

    const where = {};
    if (user_id) where.user_id = user_id;
    if (start_date || end_date) {
      where.created_at = {};
      if (start_date) where.created_at.gte = new Date(start_date);
      if (end_date) where.created_at.lte = new Date(end_date);
    }

    const [total, byLevel, byAction, byModule] = await Promise.all([
      prisma.activityLog.count({ where }),
      prisma.activityLog.groupBy({
        by: ['level'],
        where,
        _count: { level: true }
      }),
      prisma.activityLog.groupBy({
        by: ['action'],
        where,
        _count: { action: true },
        orderBy: { _count: { action: 'desc' } },
        take: 10
      }),
      prisma.activityLog.groupBy({
        by: ['module'],
        where,
        _count: { module: true },
        orderBy: { _count: { module: 'desc' } },
        take: 10
      })
    ]);

    return {
      total,
      by_level: byLevel.map(item => ({
        level: item.level,
        count: item._count.level
      })),
      by_action: byAction.map(item => ({
        action: item.action,
        count: item._count.action
      })),
      by_module: byModule.map(item => ({
        module: item.module,
        count: item._count.module
      }))
    };
  } catch (error) {
    logger.error('Error getting activity statistics', { error: error.message, module: 'ActivityLog', label: 'GET_ACTIVITY_STATISTICS' });
    throw error;
  }
}

/**
 * Delete old activity logs
 * @param {number} daysOld - Delete logs older than this many days
 * @returns {Promise<number>} Number of deleted logs
 */
async function deleteOldActivityLogs(daysOld = 90) {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    const result = await prisma.activityLog.deleteMany({
      where: {
        created_at: {
          lt: cutoffDate
        }
      }
    });

    return result.count;
  } catch (error) {
    logger.error('Error deleting old activity logs', { error: error.message, module: 'ActivityLog', label: 'DELETE_OLD_ACTIVITY_LOGS' });
    throw error;
  }
}

/**
 * Parse user agent to extract device, browser, and OS info
 * @param {string} userAgent - User agent string
 * @returns {object} Parsed user agent info
 */
function parseUserAgent(userAgent) {
  if (!userAgent) {
    return { device: null, browser: null, os: null };
  }

  const ua = userAgent.toLowerCase();
  
  // Detect device
  let device = 'Desktop';
  if (ua.includes('mobile') || ua.includes('android') || ua.includes('iphone')) {
    device = 'Mobile';
  } else if (ua.includes('tablet') || ua.includes('ipad')) {
    device = 'Tablet';
  }

  // Detect browser
  let browser = null;
  if (ua.includes('chrome') && !ua.includes('edg')) {
    browser = 'Chrome';
  } else if (ua.includes('firefox')) {
    browser = 'Firefox';
  } else if (ua.includes('safari') && !ua.includes('chrome')) {
    browser = 'Safari';
  } else if (ua.includes('edg')) {
    browser = 'Edge';
  } else if (ua.includes('opera') || ua.includes('opr')) {
    browser = 'Opera';
  }

  // Detect OS
  let os = null;
  if (ua.includes('windows')) {
    os = 'Windows';
  } else if (ua.includes('mac os') || ua.includes('macos')) {
    os = 'macOS';
  } else if (ua.includes('linux')) {
    os = 'Linux';
  } else if (ua.includes('android')) {
    os = 'Android';
  } else if (ua.includes('ios') || ua.includes('iphone') || ua.includes('ipad')) {
    os = 'iOS';
  }

  return { device, browser, os };
}

module.exports = {
  createActivityLog,
  getActivityLogs,
  getActivityLogById,
  getUserActivityLogs,
  getActivityStatistics,
  deleteOldActivityLogs,
  parseUserAgent
};

