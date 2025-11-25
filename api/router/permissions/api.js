const express = require('express');
const router = express.Router();
const { SUCCESS } = require('../../src/response/success');
const { ERROR } = require('../../src/response/error');
const logger = require('../../src/logger/logger');
const { validateRequest } = require('../../src/authenticate/authenticate');
const { checkPermission } = require('../../src/middleware/permissionMiddleware');
const {
  getAllPermissions,
  getPermissionById,
  getPermissionByCodename,
  createPermission,
  updatePermission,
  deletePermission,
  getAllGroups,
  getGroupById,
  getGroupByCodename,
  createGroup,
  updateGroup,
  deleteGroup,
  assignPermissionsToGroup,
  getUserGroups,
  getUserPermissions,
  userHasPermission,
  assignGroupsToUser,
  removeGroupsFromUser
} = require('../../src/permissions/permissions');

/**
 * @swagger
 * /api/permissions:
 *   get:
 *     summary: Get all permissions
 *     description: Returns list of all permissions
 *     tags: [Permissions & Groups]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Permissions retrieved successfully
 */
router.get('/permissions', validateRequest, checkPermission('view_permission'), async (req, res, next) => {
  try {
    const permissions = await getAllPermissions();
    return res.status(200).json(
      SUCCESS.response('Permissions retrieved successfully', { permissions })
    );
  } catch (error) {
    logger.error('Error getting permissions', { error: error.message, module: 'Permissions', label: 'GET_PERMISSIONS' });
    const errorResponse = ERROR.fromMap('INTERNAL_ERROR', {}, error);
    return res.status(errorResponse.statusCode).json(errorResponse.detail);
  }
});

/**
 * @swagger
 * /api/permissions/{permission_id}:
 *   get:
 *     summary: Get permission by ID
 *     description: Returns a specific permission
 *     tags: [Permissions & Groups]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: permission_id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Permission retrieved successfully
 */
router.get('/permissions/:permission_id', validateRequest, checkPermission('view_permission'), async (req, res, next) => {
  try {
    const { permission_id } = req.params;
    const permission = await getPermissionById(permission_id);
    
    if (!permission) {
      const errorResponse = ERROR.fromMap('USER_NOT_FOUND', { permission_id });
      return res.status(errorResponse.statusCode).json(errorResponse.detail);
    }
    
    return res.status(200).json(
      SUCCESS.response('Permission retrieved successfully', { permission })
    );
  } catch (error) {
    logger.error('Error getting permission', { error: error.message, module: 'Permissions', label: 'GET_PERMISSION' });
    const errorResponse = ERROR.fromMap('INTERNAL_ERROR', {}, error);
    return res.status(errorResponse.statusCode).json(errorResponse.detail);
  }
});

/**
 * @swagger
 * /api/permissions:
 *   post:
 *     summary: Create new permission
 *     description: Create a new permission
 *     tags: [Permissions & Groups]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - codename
 *             properties:
 *               name:
 *                 type: string
 *               codename:
 *                 type: string
 *               description:
 *                 type: string
 *               category:
 *                 type: string
 *     responses:
 *       200:
 *         description: Permission created successfully
 */
router.post('/permissions', validateRequest, checkPermission('add_permission'), async (req, res, next) => {
  try {
    const { name, codename, description, category } = req.body;
    
    if (!name || !codename) {
      const errorResponse = ERROR.fromMap('AUTH_INVALID_PAYLOAD', { message: 'name and codename are required' });
      return res.status(errorResponse.statusCode).json(errorResponse.detail);
    }
    
    const permission = await createPermission({ name, codename, description, category });
    return res.status(201).json(
      SUCCESS.response('Permission created successfully', { permission })
    );
  } catch (error) {
    logger.error('Error creating permission', { error: error.message, module: 'Permissions', label: 'CREATE_PERMISSION' });
    if (error.code === 'P2002') {
      const errorResponse = ERROR.fromMap('DUPLICATE_ENTRY', { message: 'Permission with this name or codename already exists' });
      return res.status(errorResponse.statusCode).json(errorResponse.detail);
    }
    const errorResponse = ERROR.fromMap('PERMISSION_CREATE_FAILED', {}, error);
    return res.status(errorResponse.statusCode).json(errorResponse.detail);
  }
});

/**
 * @swagger
 * /api/permissions/{permission_id}:
 *   put:
 *     summary: Update permission
 *     description: Update a permission
 *     tags: [Permissions & Groups]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: permission_id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               codename:
 *                 type: string
 *               description:
 *                 type: string
 *               category:
 *                 type: string
 *     responses:
 *       200:
 *         description: Permission updated successfully
 */
router.put('/permissions/:permission_id', validateRequest, checkPermission('edit_permission'), async (req, res, next) => {
  try {
    const { permission_id } = req.params;
    const permission = await updatePermission(permission_id, req.body);
    
    if (!permission) {
      const errorResponse = ERROR.fromMap('PERMISSION_NOT_FOUND', { permission_id });
      return res.status(errorResponse.statusCode).json(errorResponse.detail);
    }
    
    return res.status(200).json(
      SUCCESS.response('Permission updated successfully', { permission })
    );
  } catch (error) {
    logger.error('Error updating permission', { error: error.message, module: 'Permissions', label: 'UPDATE_PERMISSION' });
    if (error.code === 'P2025') {
      const errorResponse = ERROR.fromMap('PERMISSION_NOT_FOUND', { permission_id: req.params.permission_id });
      return res.status(errorResponse.statusCode).json(errorResponse.detail);
    }
    const errorResponse = ERROR.fromMap('PERMISSION_UPDATE_FAILED', {}, error);
    return res.status(errorResponse.statusCode).json(errorResponse.detail);
  }
});

/**
 * @swagger
 * /api/permissions/{permission_id}:
 *   delete:
 *     summary: Delete permission
 *     description: Delete a permission
 *     tags: [Permissions & Groups]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: permission_id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Permission deleted successfully
 */
router.delete('/permissions/:permission_id', validateRequest, checkPermission('delete_permission'), async (req, res, next) => {
  try {
    const { permission_id } = req.params;
    const deleted = await deletePermission(permission_id);
    
    if (!deleted) {
      const errorResponse = ERROR.fromMap('PERMISSION_NOT_FOUND', { permission_id });
      return res.status(errorResponse.statusCode).json(errorResponse.detail);
    }
    
    return res.status(200).json(
      SUCCESS.response('Permission deleted successfully', { permission_id })
    );
  } catch (error) {
    logger.error('Error deleting permission', { error: error.message, module: 'Permissions', label: 'DELETE_PERMISSION' });
    if (error.code === 'P2025') {
      const errorResponse = ERROR.fromMap('PERMISSION_NOT_FOUND', { permission_id: req.params.permission_id });
      return res.status(errorResponse.statusCode).json(errorResponse.detail);
    }
    const errorResponse = ERROR.fromMap('PERMISSION_DELETE_FAILED', {}, error);
    return res.status(errorResponse.statusCode).json(errorResponse.detail);
  }
});

/**
 * @swagger
 * /api/groups:
 *   get:
 *     summary: Get all groups
 *     description: Returns list of all groups with their permissions
 *     tags: [Permissions & Groups]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Groups retrieved successfully
 */
router.get('/groups', validateRequest, checkPermission('view_group'), async (req, res, next) => {
  try {
    const groups = await getAllGroups();
    return res.status(200).json(
      SUCCESS.response('Groups retrieved successfully', { groups })
    );
  } catch (error) {
    logger.error('Error getting groups', { error: error.message, module: 'Permissions', label: 'GET_GROUPS' });
    const errorResponse = ERROR.fromMap('INTERNAL_ERROR', {}, error);
    return res.status(errorResponse.statusCode).json(errorResponse.detail);
  }
});

/**
 * @swagger
 * /api/groups/{group_id}:
 *   get:
 *     summary: Get group by ID
 *     description: Returns a specific group with its permissions
 *     tags: [Permissions & Groups]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: group_id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Group retrieved successfully
 */
router.get('/groups/:group_id', validateRequest, checkPermission('view_group'), async (req, res, next) => {
  try {
    const { group_id } = req.params;
    const group = await getGroupById(group_id);
    
    if (!group) {
      const errorResponse = ERROR.fromMap('GROUP_NOT_FOUND', { group_id });
      return res.status(errorResponse.statusCode).json(errorResponse.detail);
    }
    
    return res.status(200).json(
      SUCCESS.response('Group retrieved successfully', { group })
    );
  } catch (error) {
    logger.error('Error getting group', { error: error.message, module: 'Permissions', label: 'GET_GROUP' });
    const errorResponse = ERROR.fromMap('INTERNAL_ERROR', {}, error);
    return res.status(errorResponse.statusCode).json(errorResponse.detail);
  }
});

/**
 * @swagger
 * /api/groups:
 *   post:
 *     summary: Create new group
 *     description: Create a new group
 *     tags: [Permissions & Groups]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - codename
 *             properties:
 *               name:
 *                 type: string
 *               codename:
 *                 type: string
 *               description:
 *                 type: string
 *               is_system:
 *                 type: boolean
 *               is_active:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Group created successfully
 */
router.post('/groups', validateRequest, checkPermission('add_group'), async (req, res, next) => {
  try {
    const { name, codename, description, is_system, is_active } = req.body;
    
    if (!name || !codename) {
      const errorResponse = ERROR.fromMap('AUTH_INVALID_PAYLOAD', { message: 'name and codename are required' });
      return res.status(errorResponse.statusCode).json(errorResponse.detail);
    }
    
    const group = await createGroup({ name, codename, description, is_system, is_active });
    return res.status(201).json(
      SUCCESS.response('Group created successfully', { group })
    );
  } catch (error) {
    logger.error('Error creating group', { error: error.message, module: 'Permissions', label: 'CREATE_GROUP' });
    if (error.code === 'P2002') {
      const errorResponse = ERROR.fromMap('DUPLICATE_ENTRY', { message: 'Group with this name or codename already exists' });
      return res.status(errorResponse.statusCode).json(errorResponse.detail);
    }
    const errorResponse = ERROR.fromMap('GROUP_CREATE_FAILED', {}, error);
    return res.status(errorResponse.statusCode).json(errorResponse.detail);
  }
});

/**
 * @swagger
 * /api/groups/{group_id}:
 *   put:
 *     summary: Update group
 *     description: Update a group
 *     tags: [Permissions & Groups]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: group_id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               codename:
 *                 type: string
 *               description:
 *                 type: string
 *               is_active:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Group updated successfully
 */
router.put('/groups/:group_id', validateRequest, checkPermission('edit_group'), async (req, res, next) => {
  try {
    const { group_id } = req.params;
    const group = await updateGroup(group_id, req.body);
    
    if (!group) {
      const errorResponse = ERROR.fromMap('GROUP_NOT_FOUND', { group_id });
      return res.status(errorResponse.statusCode).json(errorResponse.detail);
    }
    
    return res.status(200).json(
      SUCCESS.response('Group updated successfully', { group })
    );
  } catch (error) {
    logger.error('Error updating group', { error: error.message, module: 'Permissions', label: 'UPDATE_GROUP' });
    if (error.code === 'P2025') {
      const errorResponse = ERROR.fromMap('GROUP_NOT_FOUND', { group_id: req.params.group_id });
      return res.status(errorResponse.statusCode).json(errorResponse.detail);
    }
    const errorResponse = ERROR.fromMap('GROUP_UPDATE_FAILED', {}, error);
    return res.status(errorResponse.statusCode).json(errorResponse.detail);
  }
});

/**
 * @swagger
 * /api/groups/{group_id}:
 *   delete:
 *     summary: Delete group
 *     description: Delete a group (system groups cannot be deleted)
 *     tags: [Permissions & Groups]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: group_id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Group deleted successfully
 */
router.delete('/groups/:group_id', validateRequest, checkPermission('delete_group'), async (req, res, next) => {
  try {
    const { group_id } = req.params;
    const deleted = await deleteGroup(group_id);
    
    if (!deleted) {
      const errorResponse = ERROR.fromMap('GROUP_DELETE_FAILED', { message: 'Group not found or is a system group' });
      return res.status(errorResponse.statusCode).json(errorResponse.detail);
    }
    
    return res.status(200).json(
      SUCCESS.response('Group deleted successfully', { group_id })
    );
  } catch (error) {
    logger.error('Error deleting group', { error: error.message, module: 'Permissions', label: 'DELETE_GROUP' });
    if (error.code === 'P2025') {
      const errorResponse = ERROR.fromMap('GROUP_NOT_FOUND', { group_id: req.params.group_id });
      return res.status(errorResponse.statusCode).json(errorResponse.detail);
    }
    const errorResponse = ERROR.fromMap('GROUP_DELETE_FAILED', {}, error);
    return res.status(errorResponse.statusCode).json(errorResponse.detail);
  }
});

/**
 * @swagger
 * /api/groups/{group_id}/permissions:
 *   post:
 *     summary: Assign permissions to group
 *     description: Assign permissions to a group (replaces existing permissions)
 *     tags: [Permissions & Groups]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: group_id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - permission_ids
 *             properties:
 *               permission_ids:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Permissions assigned successfully
 */
router.post('/groups/:group_id/permissions', validateRequest, checkPermission('edit_group'), async (req, res, next) => {
  try {
    const { group_id } = req.params;
    const { permission_ids } = req.body;
    
    if (!permission_ids || !Array.isArray(permission_ids)) {
      const errorResponse = ERROR.fromMap('AUTH_INVALID_PAYLOAD', { message: 'permission_ids array is required' });
      return res.status(errorResponse.statusCode).json(errorResponse.detail);
    }
    
    await assignPermissionsToGroup(group_id, permission_ids);
    const group = await getGroupById(group_id);
    
    return res.status(200).json(
      SUCCESS.response('Permissions assigned successfully', { group })
    );
  } catch (error) {
    logger.error('Error assigning permissions to group', { error: error.message, module: 'Permissions', label: 'ASSIGN_PERMISSIONS' });
    if (error.code === 'P2025') {
      const errorResponse = ERROR.fromMap('GROUP_NOT_FOUND', { group_id: req.params.group_id });
      return res.status(errorResponse.statusCode).json(errorResponse.detail);
    }
    const errorResponse = ERROR.fromMap('GROUP_ASSIGN_PERMISSIONS_FAILED', {}, error);
    return res.status(errorResponse.statusCode).json(errorResponse.detail);
  }
});

/**
 * @swagger
 * /api/users/{user_id}/groups:
 *   get:
 *     summary: Get user groups
 *     description: Returns all groups assigned to a user
 *     tags: [Permissions & Groups]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: user_id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User groups retrieved successfully
 */
router.get('/users/:user_id/groups', validateRequest, checkPermission('view_user'), async (req, res, next) => {
  try {
    const { user_id } = req.params;
    const groups = await getUserGroups(user_id);
    
    return res.status(200).json(
      SUCCESS.response('User groups retrieved successfully', { user_id, groups })
    );
  } catch (error) {
    logger.error('Error getting user groups', { error: error.message, module: 'Permissions', label: 'GET_USER_GROUPS' });
    const errorResponse = ERROR.fromMap('INTERNAL_ERROR', {}, error);
    return res.status(errorResponse.statusCode).json(errorResponse.detail);
  }
});

/**
 * @swagger
 * /api/users/{user_id}/permissions:
 *   get:
 *     summary: Get user permissions
 *     description: Returns all permissions for a user (from all groups)
 *     tags: [Permissions & Groups]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: user_id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User permissions retrieved successfully
 */
router.get('/users/:user_id/permissions', validateRequest, checkPermission('view_user'), async (req, res, next) => {
  try {
    const { user_id } = req.params;
    const permissions = await getUserPermissions(user_id);
    
    return res.status(200).json(
      SUCCESS.response('User permissions retrieved successfully', { user_id, permissions })
    );
  } catch (error) {
    logger.error('Error getting user permissions', { error: error.message, module: 'Permissions', label: 'GET_USER_PERMISSIONS' });
    const errorResponse = ERROR.fromMap('INTERNAL_ERROR', {}, error);
    return res.status(errorResponse.statusCode).json(errorResponse.detail);
  }
});

/**
 * @swagger
 * /api/users/{user_id}/groups:
 *   post:
 *     summary: Assign groups to user
 *     description: Assign groups to a user (replaces existing groups)
 *     tags: [Permissions & Groups]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: user_id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - group_ids
 *             properties:
 *               group_ids:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Groups assigned successfully
 */
router.post('/users/:user_id/groups', validateRequest, checkPermission('assign_groups'), async (req, res, next) => {
  try {
    const { user_id } = req.params;
    const { group_codenames } = req.body;
    const assignedByUserId = req.user?.uid || req.user?.user_id;
    
    if (!group_codenames || !Array.isArray(group_codenames) || group_codenames.length === 0) {
      const errorResponse = ERROR.fromMap('AUTH_INVALID_PAYLOAD', { message: 'group_codenames array is required (e.g., ["admin", "user"])' });
      return res.status(errorResponse.statusCode).json(errorResponse.detail);
    }
    
    const validCodenames = ['super_admin', 'admin', 'developer', 'business', 'accountant', 'user'];
    const invalidCodenames = group_codenames.filter(codename => !validCodenames.includes(codename));
    
    if (invalidCodenames.length > 0) {
      const errorResponse = ERROR.fromMap('AUTH_INVALID_PAYLOAD', { 
        message: `Invalid group codenames: ${invalidCodenames.join(', ')}. Valid codenames: ${validCodenames.join(', ')}` 
      });
      return res.status(errorResponse.statusCode).json(errorResponse.detail);
    }
    
    await assignGroupsToUser(user_id, group_codenames, assignedByUserId);
    const groups = await getUserGroups(user_id);
    
    return res.status(200).json(
      SUCCESS.response('Groups assigned successfully (user role flags updated)', { user_id, groups })
    );
  } catch (error) {
    logger.error('Error assigning groups to user', { error: error.message, module: 'Permissions', label: 'ASSIGN_GROUPS_TO_USER' });
    if (error.code === 'P2025') {
      const errorResponse = ERROR.fromMap('USER_NOT_FOUND', { user_id: req.params.user_id });
      return res.status(errorResponse.statusCode).json(errorResponse.detail);
    }
    const errorResponse = ERROR.fromMap('GROUP_ASSIGN_USERS_FAILED', {}, error);
    return res.status(errorResponse.statusCode).json(errorResponse.detail);
  }
});

/**
 * @swagger
 * /api/users/me/groups:
 *   get:
 *     summary: Get current user groups
 *     description: Returns all groups assigned to the current user
 *     tags: [Permissions & Groups]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User groups retrieved successfully
 */
router.get('/users/me/groups', validateRequest, checkPermission('view_profile'), async (req, res, next) => {
  try {
    const userId = req.user?.uid || req.user?.user_id;
    const groups = await getUserGroups(userId);
    
    return res.status(200).json(
      SUCCESS.response('User groups retrieved successfully', { groups })
    );
  } catch (error) {
    logger.error('Error getting current user groups', { error: error.message, module: 'Permissions', label: 'GET_MY_GROUPS' });
    const errorResponse = ERROR.fromMap('INTERNAL_ERROR', {}, error);
    return res.status(errorResponse.statusCode).json(errorResponse.detail);
  }
});

/**
 * @swagger
 * /api/users/me/permissions:
 *   get:
 *     summary: Get current user permissions
 *     description: Returns all permissions for the current user
 *     tags: [Permissions & Groups]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User permissions retrieved successfully
 */
router.get('/users/me/permissions', validateRequest, checkPermission('view_profile'), async (req, res, next) => {
  try {
    const userId = req.user?.uid || req.user?.user_id;
    const permissions = await getUserPermissions(userId);
    
    return res.status(200).json(
      SUCCESS.response('User permissions retrieved successfully', { permissions })
    );
  } catch (error) {
    logger.error('Error getting current user permissions', { error: error.message, module: 'Permissions', label: 'GET_MY_PERMISSIONS' });
    const errorResponse = ERROR.fromMap('INTERNAL_ERROR', {}, error);
    return res.status(errorResponse.statusCode).json(errorResponse.detail);
  }
});

module.exports = router;

