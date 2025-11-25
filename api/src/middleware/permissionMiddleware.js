/**
 * Permission Middleware
 * Checks if user has required permissions
 */

const { ERROR } = require('../response/error');
const { userHasPermission } = require('../permissions/permissions');
const logger = require('../logger/logger');

/**
 * Check if user has permission
 * @param {string|Array<string>} requiredPermissions - Permission codename(s) required
 * @param {string} requireAll - If true, user must have ALL permissions. If false, user needs ANY permission
 * @returns {Function} Express middleware
 */
function checkPermission(requiredPermissions, requireAll = false) {
  return async (req, res, next) => {
    try {
      const userId = req.user?.uid || req.user?.user_id;
      
      if (!userId) {
        const errorResponse = ERROR.fromMap('FORBIDDEN', { message: 'User not authenticated' });
        return res.status(errorResponse.statusCode).json(errorResponse.detail);
      }

      // Superuser bypass - check if user has super_admin group
      const { getUserGroups } = require('../permissions/permissions');
      try {
        const userGroups = await getUserGroups(userId);
        const isSuperuser = userGroups.some(g => g.codename === 'super_admin');
        if (isSuperuser) {
          return next();
        }
      } catch (error) {
        logger.warn('Error checking superuser status', { error: error.message });
      }

      const permissions = Array.isArray(requiredPermissions) ? requiredPermissions : [requiredPermissions];
      
      if (requireAll) {
        // User must have ALL permissions
        for (const permission of permissions) {
          const hasPermission = await userHasPermission(userId, permission);
          if (!hasPermission) {
            const errorResponse = ERROR.fromMap('FORBIDDEN', { 
              message: `Missing required permission: ${permission}`,
              permission: permission
            });
            return res.status(errorResponse.statusCode).json(errorResponse.detail);
          }
        }
      } else {
        // User needs ANY permission
        let hasAnyPermission = false;
        for (const permission of permissions) {
          if (await userHasPermission(userId, permission)) {
            hasAnyPermission = true;
            break;
          }
        }
        
        if (!hasAnyPermission) {
          const errorResponse = ERROR.fromMap('FORBIDDEN', { 
            message: `Missing required permission. Required one of: ${permissions.join(', ')}`,
            required_permissions: permissions
          });
          return res.status(errorResponse.statusCode).json(errorResponse.detail);
        }
      }

      next();
    } catch (error) {
      logger.error('Error in permission check', { error: error.message, module: 'Permissions', label: 'PERMISSION_CHECK' });
      const errorResponse = ERROR.fromMap('AUTH_PROCESSING_ERROR', {}, error);
      return res.status(errorResponse.statusCode).json(errorResponse.detail);
    }
  };
}

/**
 * Check if user has any of the specified groups
 * @param {string|Array<string>} requiredGroups - Group codename(s) required
 * @returns {Function} Express middleware
 */
function checkGroup(requiredGroups) {
  return async (req, res, next) => {
    try {
      const userId = req.user?.uid || req.user?.user_id;
      
      if (!userId) {
        const errorResponse = ERROR.fromMap('FORBIDDEN', { message: 'User not authenticated' });
        return res.status(errorResponse.statusCode).json(errorResponse.detail);
      }

      // Superuser bypass - check if user has super_admin group
      const { getUserGroups } = require('../permissions/permissions');
      try {
        const userGroups = await getUserGroups(userId);
        const isSuperuser = userGroups.some(g => g.codename === 'super_admin');
        if (isSuperuser) {
          return next();
        }
      } catch (error) {
        logger.warn('Error checking superuser status', { error: error.message });
      }

      const userGroups = await getUserGroups(userId);
      const userGroupCodenames = userGroups.map(g => g.codename);
      
      const groups = Array.isArray(requiredGroups) ? requiredGroups : [requiredGroups];
      const hasGroup = groups.some(group => userGroupCodenames.includes(group));
      
      if (!hasGroup) {
        const errorResponse = ERROR.fromMap('FORBIDDEN', { 
          message: `Missing required group. Required one of: ${groups.join(', ')}`,
          required_groups: groups
        });
        return res.status(errorResponse.statusCode).json(errorResponse.detail);
      }

      next();
    } catch (error) {
      logger.error('Error in group check', { error: error.message, module: 'Permissions', label: 'GROUP_CHECK' });
      const errorResponse = ERROR.fromMap('AUTH_PROCESSING_ERROR', {}, error);
      return res.status(errorResponse.statusCode).json(errorResponse.detail);
    }
  };
}

module.exports = {
  checkPermission,
  checkGroup
};

