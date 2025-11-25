const express = require('express');
const router = express.Router();
const { SUCCESS } = require('../../src/response/success');
const { ERROR } = require('../../src/response/error');
const logger = require('../../src/logger/logger');
const { prisma } = require('../../src/db/prisma');
const { validateRequest } = require('../../src/authenticate/authenticate');
const { checkPermission } = require('../../src/middleware/permissionMiddleware');

/**
 * @swagger
 * /api/dashboard/overview:
 *   get:
 *     summary: Get dashboard overview statistics
 *     description: Returns comprehensive user statistics including totals, active users, verified users, and more
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard overview statistics
 *       401:
 *         description: Unauthorized
 */
router.get('/dashboard/overview', validateRequest, checkPermission('view_dashboard'), async (req, res, next) => {
  try {
    // Get today's date boundaries
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    // Get week ago date
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    
    // Get month start
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);
    
    const [
      totalUsers,
      activeUsers,
      verifiedUsers,
      emailVerified,
      phoneVerified,
      newUsersToday,
      newUsersThisWeek,
      newUsersThisMonth,
      usersWithLastSignIn
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { is_active: true } }),
      prisma.user.count({ where: { is_verified: true } }),
      prisma.user.count({ where: { is_email_verified: true } }),
      prisma.user.count({ where: { is_phone_verified: true } }),
      prisma.user.count({ 
        where: { 
          created_at: { gte: today, lt: tomorrow }
        }
      }),
      prisma.user.count({ 
        where: { 
          created_at: { gte: weekAgo }
        }
      }),
      prisma.user.count({ 
        where: { 
          created_at: { gte: monthStart }
        }
      }),
      prisma.user.count({ 
        where: { 
          last_sign_in_at: { not: null }
        }
      })
    ]);
    
    const results = {
      totalUsers,
      activeUsers,
      verifiedUsers,
      emailVerified,
      phoneVerified,
      newUsersToday,
      newUsersThisWeek,
      newUsersThisMonth,
      usersWithLastSignIn
    };

    return res.status(200).json(
      SUCCESS.response('Dashboard overview retrieved successfully', {
        overview: {
          total_users: results.totalUsers,
          active_users: results.activeUsers,
          verified_users: results.verifiedUsers,
          email_verified: results.emailVerified,
          phone_verified: results.phoneVerified,
          new_users: {
            today: results.newUsersToday,
            this_week: results.newUsersThisWeek,
            this_month: results.newUsersThisMonth
          },
          users_with_sign_in: results.usersWithLastSignIn
        }
      })
    );
  } catch (error) {
    logger.error('Error in dashboard overview', { error: error.message, stack: error.stack, module: 'Dashboard', label: 'OVERVIEW' });
    const errorResponse = ERROR.fromMap('DASHBOARD_ERROR', {}, error);
    return res.status(errorResponse.statusCode).json(errorResponse.detail);
  }
});

/**
 * @swagger
 * /api/dashboard/users-by-status:
 *   get:
 *     summary: Get user statistics by status
 *     description: Returns count of users grouped by status (ACTIVE, INACTIVE, etc.)
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User statistics by status
 */
router.get('/dashboard/users-by-status', validateRequest, checkPermission('view_dashboard'), async (req, res, next) => {
  try {
    const statsResult = await prisma.user.groupBy({
      by: ['status'],
      _count: { status: true },
      orderBy: { _count: { status: 'desc' } }
    });
    
    const stats = statsResult.map(row => ({
      status: row.status,
      count: row._count.status
    }));

    return res.status(200).json(
      SUCCESS.response('User statistics by status retrieved successfully', {
        users_by_status: stats
      })
    );
  } catch (error) {
    logger.error('Error in users by status', { error: error.message, stack: error.stack, module: 'Dashboard', label: 'USERS_BY_STATUS' });
    const errorResponse = ERROR.fromMap('DASHBOARD_ERROR', {}, error);
    return res.status(errorResponse.statusCode).json(errorResponse.detail);
  }
});

/**
 * @swagger
 * /api/dashboard/users-by-type:
 *   get:
 *     summary: Get user statistics by user type
 *     description: Returns count of users grouped by user_type (customer, business, etc.)
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User statistics by type
 */
router.get('/dashboard/users-by-type', validateRequest, checkPermission('view_dashboard'), async (req, res, next) => {
  try {
    const statsResult = await prisma.user.groupBy({
      by: ['user_type'],
      _count: { user_type: true },
      orderBy: { _count: { user_type: 'desc' } }
    });
    
    const stats = statsResult.map(row => ({
      user_type: row.user_type || 'unknown',
      count: row._count.user_type
    }));

    return res.status(200).json(
      SUCCESS.response('User statistics by type retrieved successfully', {
        users_by_type: stats
      })
    );
  } catch (error) {
    logger.error('Error in users by type', { error: error.message, stack: error.stack, module: 'Dashboard', label: 'USERS_BY_TYPE' });
    const errorResponse = ERROR.fromMap('DASHBOARD_ERROR', {}, error);
    return res.status(errorResponse.statusCode).json(errorResponse.detail);
  }
});

/**
 * @swagger
 * /api/dashboard/users-by-auth-type:
 *   get:
 *     summary: Get user statistics by authentication type
 *     description: Returns count of users grouped by auth_type (email, phone, etc.)
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User statistics by authentication type
 */
router.get('/dashboard/users-by-auth-type', validateRequest, checkPermission('view_dashboard'), async (req, res, next) => {
  try {
    const statsResult = await prisma.user.groupBy({
      by: ['auth_type'],
      _count: { auth_type: true },
      orderBy: { _count: { auth_type: 'desc' } }
    });
    
    const stats = statsResult.map(row => ({
      auth_type: row.auth_type || 'unknown',
      count: row._count.auth_type
    }));

    return res.status(200).json(
      SUCCESS.response('User statistics by auth type retrieved successfully', {
        users_by_auth_type: stats
      })
    );
  } catch (error) {
    logger.error('Error in users by auth type', { error: error.message, stack: error.stack, module: 'Dashboard', label: 'USERS_BY_AUTH_TYPE' });
    const errorResponse = ERROR.fromMap('DASHBOARD_ERROR', {}, error);
    return res.status(errorResponse.statusCode).json(errorResponse.detail);
  }
});

/**
 * @swagger
 * /api/dashboard/users-by-country:
 *   get:
 *     summary: Get user statistics by country
 *     description: Returns count of users grouped by country
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User statistics by country
 */
router.get('/dashboard/users-by-country', validateRequest, checkPermission('view_dashboard'), async (req, res, next) => {
  try {
    const statsResult = await prisma.user.groupBy({
      by: ['country'],
      _count: { country: true },
      orderBy: { _count: { country: 'desc' } },
      take: 20
    });
    
    const stats = statsResult.map(row => ({
      country: row.country || 'unknown',
      count: row._count.country
    }));

    return res.status(200).json(
      SUCCESS.response('User statistics by country retrieved successfully', {
        users_by_country: stats
      })
    );
  } catch (error) {
    logger.error('Error in users by country', { error: error.message, stack: error.stack, module: 'Dashboard', label: 'USERS_BY_COUNTRY' });
    const errorResponse = ERROR.fromMap('DASHBOARD_ERROR', {}, error);
    return res.status(errorResponse.statusCode).json(errorResponse.detail);
  }
});

/**
 * @swagger
 * /api/dashboard/users-by-language:
 *   get:
 *     summary: Get user statistics by language
 *     description: Returns count of users grouped by language preference
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User statistics by language
 */
router.get('/dashboard/users-by-language', validateRequest, checkPermission('view_dashboard'), async (req, res, next) => {
  try {
    const statsResult = await prisma.user.groupBy({
      by: ['language'],
      _count: { language: true },
      orderBy: { _count: { language: 'desc' } }
    });
    
    const stats = statsResult.map(row => ({
      language: row.language || 'unknown',
      count: row._count.language
    }));

    return res.status(200).json(
      SUCCESS.response('User statistics by language retrieved successfully', {
        users_by_language: stats
      })
    );
  } catch (error) {
    logger.error('Error in users by language', { error: error.message, stack: error.stack, module: 'Dashboard', label: 'USERS_BY_LANGUAGE' });
    const errorResponse = ERROR.fromMap('DASHBOARD_ERROR', {}, error);
    return res.status(errorResponse.statusCode).json(errorResponse.detail);
  }
});

/**
 * @swagger
 * /api/dashboard/user-growth:
 *   get:
 *     summary: Get user growth statistics
 *     description: Returns user sign-up statistics over time (daily, weekly, monthly)
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [daily, weekly, monthly]
 *           default: daily
 *         description: Time period for growth statistics
 *       - in: query
 *         name: days
 *         schema:
 *           type: integer
 *           default: 30
 *         description: Number of days to look back (for daily period)
 *     responses:
 *       200:
 *         description: User growth statistics
 */
router.get('/dashboard/user-growth', validateRequest, checkPermission('view_dashboard'), async (req, res, next) => {
  try {
    const period = req.query.period || 'daily';
    const days = parseInt(req.query.days) || 30;

    // Use raw query for date aggregations as Prisma doesn't support DATE_TRUNC directly
    let query;
    
    if (period === 'daily') {
      const daysLimit = Math.min(Math.max(1, days), 365);
      query = prisma.$queryRaw`
        SELECT 
          DATE(created_at) as date,
          COUNT(*)::int as count
        FROM "user"
        WHERE created_at >= CURRENT_DATE - INTERVAL '${daysLimit} days'
        GROUP BY DATE(created_at)
        ORDER BY date ASC
      `;
    } else if (period === 'weekly') {
      query = prisma.$queryRaw`
        SELECT 
          DATE_TRUNC('week', created_at) as week,
          COUNT(*)::int as count
        FROM "user"
        WHERE created_at >= CURRENT_DATE - INTERVAL '12 weeks'
        GROUP BY DATE_TRUNC('week', created_at)
        ORDER BY week ASC
      `;
    } else {
      query = prisma.$queryRaw`
        SELECT 
          DATE_TRUNC('month', created_at) as month,
          COUNT(*)::int as count
        FROM "user"
        WHERE created_at >= CURRENT_DATE - INTERVAL '12 months'
        GROUP BY DATE_TRUNC('month', created_at)
        ORDER BY month ASC
      `;
    }

    const result = await query;
    const growth = result.map(row => ({
      period: period === 'daily' ? row.date : (period === 'weekly' ? row.week : row.month),
      count: row.count || 0
    }));

    return res.status(200).json(
      SUCCESS.response('User growth statistics retrieved successfully', {
        period: period,
        growth: growth
      })
    );
  } catch (error) {
    logger.error('Error in user growth', { error: error.message, stack: error.stack, module: 'Dashboard', label: 'USER_GROWTH' });
    const errorResponse = ERROR.fromMap('DASHBOARD_ERROR', {}, error);
    return res.status(errorResponse.statusCode).json(errorResponse.detail);
  }
});

/**
 * @swagger
 * /api/dashboard/role-statistics:
 *   get:
 *     summary: Get user statistics by role
 *     description: Returns count of users by role (admin, business, developer, etc.)
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Role statistics
 */
router.get('/dashboard/role-statistics', validateRequest, checkPermission('view_dashboard'), async (req, res, next) => {
  try {
    const { getUserGroups } = require('../../src/permissions/permissions');
    
    const allUsers = await prisma.user.findMany({
      select: { user_id: true }
    });
    
    const roleStats = {
      super_admin: 0,
      admin: 0,
      business: 0,
      developer: 0,
      accountant: 0,
      user: 0
    };
    
    for (const user of allUsers) {
      const groups = await getUserGroups(user.user_id);
      groups.forEach(group => {
        if (roleStats.hasOwnProperty(group.codename)) {
          roleStats[group.codename]++;
        }
      });
    }
    
    const stats = {
      superusers: roleStats.super_admin,
      admins: roleStats.admin,
      business: roleStats.business,
      developers: roleStats.developer,
      accountants: roleStats.accountant,
      regular_users: roleStats.user
    };

    return res.status(200).json(
      SUCCESS.response('Role statistics retrieved successfully', {
        role_statistics: stats
      })
    );
  } catch (error) {
    logger.error('Error in role statistics', { error: error.message, stack: error.stack, module: 'Dashboard', label: 'ROLE_STATISTICS' });
    const errorResponse = ERROR.fromMap('DASHBOARD_ERROR', {}, error);
    return res.status(errorResponse.statusCode).json(errorResponse.detail);
  }
});

/**
 * @swagger
 * /api/dashboard/recent-sign-ins:
 *   get:
 *     summary: Get recent sign-in statistics
 *     description: Returns users who signed in recently
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: hours
 *         schema:
 *           type: integer
 *           default: 24
 *         description: Number of hours to look back
 *     responses:
 *       200:
 *         description: Recent sign-in statistics
 */
router.get('/dashboard/recent-sign-ins', validateRequest, checkPermission('view_dashboard'), async (req, res, next) => {
  try {
    const hours = parseInt(req.query.hours) || 24;

    const hoursLimit = Math.min(Math.max(1, hours), 168);
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const hoursAgo = new Date(Date.now() - hoursLimit * 60 * 60 * 1000);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const [total, lastHour, lastPeriod, todayCount] = await Promise.all([
      prisma.user.count({
        where: {
          last_sign_in_at: { not: null }
        }
      }),
      prisma.user.count({
        where: {
          last_sign_in_at: { gte: oneHourAgo }
        }
      }),
      prisma.user.count({
        where: {
          last_sign_in_at: { gte: hoursAgo }
        }
      }),
      prisma.user.count({
        where: {
          last_sign_in_at: { gte: today }
        }
      })
    ]);
    
    const stats = {
      total_with_sign_in: total,
      last_hour: lastHour,
      [`last_${hoursLimit}_hours`]: lastPeriod,
      today: todayCount
    };

    return res.status(200).json(
      SUCCESS.response('Recent sign-in statistics retrieved successfully', {
        recent_sign_ins: stats
      })
    );
  } catch (error) {
    logger.error('Error in recent sign-ins', { error: error.message, stack: error.stack, module: 'Dashboard', label: 'RECENT_SIGN_INS' });
    const errorResponse = ERROR.fromMap('DASHBOARD_ERROR', {}, error);
    return res.status(errorResponse.statusCode).json(errorResponse.detail);
  }
});

/**
 * @swagger
 * /api/dashboard/all-statistics:
 *   get:
 *     summary: Get all dashboard statistics
 *     description: Returns comprehensive dashboard statistics including all metrics
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: All dashboard statistics
 */
router.get('/dashboard/all-statistics', validateRequest, checkPermission('view_dashboard'), async (req, res, next) => {
  try {
    // Get date boundaries
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);
    
    const [
      totalUsers,
      activeUsers,
      verifiedUsers,
      emailVerified,
      phoneVerified,
      newToday,
      newThisWeek,
      newThisMonth,
      byStatus,
      byType,
      byAuthType
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { is_active: true } }),
      prisma.user.count({ where: { is_verified: true } }),
      prisma.user.count({ where: { is_email_verified: true } }),
      prisma.user.count({ where: { is_phone_verified: true } }),
      prisma.user.count({ where: { created_at: { gte: today, lt: tomorrow } } }),
      prisma.user.count({ where: { created_at: { gte: weekAgo } } }),
      prisma.user.count({ where: { created_at: { gte: monthStart } } }),
      prisma.user.groupBy({ by: ['status'], _count: { status: true } }),
      prisma.user.groupBy({ by: ['user_type'], _count: { user_type: true } }),
      prisma.user.groupBy({ by: ['auth_type'], _count: { auth_type: true } })
    ]);
    
    const { getUserGroups } = require('../../src/permissions/permissions');
    const allUsers = await prisma.user.findMany({
      select: { user_id: true }
    });
    
    const roleStats = {
      super_admin: 0,
      admin: 0,
      business: 0,
      developer: 0,
      accountant: 0,
      user: 0
    };
    
    for (const user of allUsers) {
      const groups = await getUserGroups(user.user_id);
      groups.forEach(group => {
        if (roleStats.hasOwnProperty(group.codename)) {
          roleStats[group.codename]++;
        }
      });
    }
    
    const superusers = roleStats.super_admin;
    const admins = roleStats.admin;
    const business = roleStats.business;
    const developers = roleStats.developer;
    const accountants = roleStats.accountant;
    const regularUsers = roleStats.user;

    const stats = {
      overview: {
        total_users: totalUsers,
        active_users: activeUsers,
        verified_users: verifiedUsers,
        email_verified: emailVerified,
        phone_verified: phoneVerified,
        new_users: {
          today: newToday,
          this_week: newThisWeek,
          this_month: newThisMonth
        }
      },
      by_status: byStatus.map(r => ({ status: r.status, count: r._count.status })),
      by_type: byType.map(r => ({ user_type: r.user_type || 'unknown', count: r._count.user_type })),
      by_auth_type: byAuthType.map(r => ({ auth_type: r.auth_type || 'unknown', count: r._count.auth_type })),
      roles: {
        superusers,
        admins,
        business,
        developers,
        accountants,
        regular_users: regularUsers
      }
    };

    return res.status(200).json(
      SUCCESS.response('All dashboard statistics retrieved successfully', stats)
    );
  } catch (error) {
    logger.error('Error in all statistics', { error: error.message, stack: error.stack, module: 'Dashboard', label: 'ALL_STATISTICS' });
    const errorResponse = ERROR.fromMap('DASHBOARD_ERROR', {}, error);
    return res.status(errorResponse.statusCode).json(errorResponse.detail);
  }
});

module.exports = router;

