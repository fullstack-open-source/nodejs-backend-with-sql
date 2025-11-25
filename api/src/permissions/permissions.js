/**
 * Permission Management Service
 * Handles group and permission operations using Prisma
 */

const { prisma } = require('../db/prisma');
const logger = require('../logger/logger');

/**
 * Get all permissions
 * @returns {Promise<Array>} Array of permission objects
 */
async function getAllPermissions() {
  try {
    const permissions = await prisma.permission.findMany({
      orderBy: [
        { category: 'asc' },
        { name: 'asc' }
      ]
    });
    
    return permissions.map(perm => ({
      permission_id: perm.permission_id,
      name: perm.name,
      codename: perm.codename,
      description: perm.description,
      category: perm.category,
      created_at: perm.created_at,
      last_updated: perm.last_updated
    }));
  } catch (error) {
    logger.error('Error getting all permissions', { error: error.message, module: 'Permissions', label: 'GET_ALL_PERMISSIONS' });
    throw error;
  }
}

/**
 * Get permission by ID
 * @param {string} permissionId - Permission ID
 * @returns {Promise<object|null>} Permission object or null
 */
async function getPermissionById(permissionId) {
  try {
    const permission = await prisma.permission.findUnique({
      where: { permission_id: permissionId }
    });
    
    if (!permission) return null;
    
    return {
      permission_id: permission.permission_id,
      name: permission.name,
      codename: permission.codename,
      description: permission.description,
      category: permission.category,
      created_at: permission.created_at,
      last_updated: permission.last_updated
    };
  } catch (error) {
    logger.error('Error getting permission by ID', { error: error.message, module: 'Permissions', label: 'GET_PERMISSION_BY_ID' });
    throw error;
  }
}

/**
 * Get permission by codename
 * @param {string} codename - Permission codename
 * @returns {Promise<object|null>} Permission object or null
 */
async function getPermissionByCodename(codename) {
  try {
    const permission = await prisma.permission.findUnique({
      where: { codename: codename }
    });
    
    if (!permission) return null;
    
    return {
      permission_id: permission.permission_id,
      name: permission.name,
      codename: permission.codename,
      description: permission.description,
      category: permission.category,
      created_at: permission.created_at,
      last_updated: permission.last_updated
    };
  } catch (error) {
    logger.error('Error getting permission by codename', { error: error.message, module: 'Permissions', label: 'GET_PERMISSION_BY_CODENAME' });
    throw error;
  }
}

/**
 * Create a new permission
 * @param {object} permissionData - Permission data
 * @returns {Promise<object>} Created permission
 */
async function createPermission(permissionData) {
  try {
    const { name, codename, description, category } = permissionData;
    
    const permission = await prisma.permission.create({
      data: {
        name,
        codename,
        description: description || null,
        category: category || null
      }
    });
    
    return {
      permission_id: permission.permission_id,
      name: permission.name,
      codename: permission.codename,
      description: permission.description,
      category: permission.category,
      created_at: permission.created_at,
      last_updated: permission.last_updated
    };
  } catch (error) {
    logger.error('Error creating permission', { error: error.message, module: 'Permissions', label: 'CREATE_PERMISSION' });
    throw error;
  }
}

/**
 * Update permission
 * @param {string} permissionId - Permission ID
 * @param {object} permissionData - Updated permission data
 * @returns {Promise<object|null>} Updated permission or null
 */
async function updatePermission(permissionId, permissionData) {
  try {
    const { name, codename, description, category } = permissionData;
    
    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (codename !== undefined) updateData.codename = codename;
    if (description !== undefined) updateData.description = description;
    if (category !== undefined) updateData.category = category;
    
    const permission = await prisma.permission.update({
      where: { permission_id: permissionId },
      data: updateData
    });
    
    return {
      permission_id: permission.permission_id,
      name: permission.name,
      codename: permission.codename,
      description: permission.description,
      category: permission.category,
      created_at: permission.created_at,
      last_updated: permission.last_updated
    };
  } catch (error) {
    if (error.code === 'P2025') {
      // Record not found
      return null;
    }
    logger.error('Error updating permission', { error: error.message, module: 'Permissions', label: 'UPDATE_PERMISSION' });
    throw error;
  }
}

/**
 * Delete permission
 * @param {string} permissionId - Permission ID
 * @returns {Promise<boolean>} True if deleted
 */
async function deletePermission(permissionId) {
  try {
    await prisma.permission.delete({
      where: { permission_id: permissionId }
    });
    return true;
  } catch (error) {
    if (error.code === 'P2025') {
      // Record not found
      return false;
    }
    logger.error('Error deleting permission', { error: error.message, module: 'Permissions', label: 'DELETE_PERMISSION' });
    throw error;
  }
}

/**
 * Get all groups
 * @returns {Promise<Array>} Array of group objects with permissions
 */
async function getAllGroups() {
  try {
    const groups = await prisma.group.findMany({
      where: { is_active: true },
      include: {
        groupPermissions: {
          include: {
            permission: true
          }
        }
      },
      orderBy: { name: 'asc' }
    });
    
    return groups.map(group => ({
      group_id: group.group_id,
      name: group.name,
      codename: group.codename,
      description: group.description,
      is_system: group.is_system,
      is_active: group.is_active,
      permissions: group.groupPermissions.map(gp => ({
        permission_id: gp.permission.permission_id,
        name: gp.permission.name,
        codename: gp.permission.codename,
        description: gp.permission.description,
        category: gp.permission.category
      })),
      created_at: group.created_at,
      last_updated: group.last_updated
    }));
  } catch (error) {
    logger.error('Error getting all groups', { error: error.message, module: 'Permissions', label: 'GET_ALL_GROUPS' });
    throw error;
  }
}

/**
 * Get group by ID
 * @param {string} groupId - Group ID
 * @returns {Promise<object|null>} Group object with permissions or null
 */
async function getGroupById(groupId) {
  try {
    const group = await prisma.group.findUnique({
      where: { group_id: groupId },
      include: {
        groupPermissions: {
          include: {
            permission: true
          }
        }
      }
    });
    
    if (!group) return null;
    
    return {
      group_id: group.group_id,
      name: group.name,
      codename: group.codename,
      description: group.description,
      is_system: group.is_system,
      is_active: group.is_active,
      permissions: group.groupPermissions.map(gp => ({
        permission_id: gp.permission.permission_id,
        name: gp.permission.name,
        codename: gp.permission.codename,
        description: gp.permission.description,
        category: gp.permission.category
      })),
      created_at: group.created_at,
      last_updated: group.last_updated
    };
  } catch (error) {
    logger.error('Error getting group by ID', { error: error.message, module: 'Permissions', label: 'GET_GROUP_BY_ID' });
    throw error;
  }
}

/**
 * Get group by codename
 * @param {string} codename - Group codename
 * @returns {Promise<object|null>} Group object with permissions or null
 */
async function getGroupByCodename(codename) {
  try {
    const group = await prisma.group.findUnique({
      where: { codename: codename },
      include: {
        groupPermissions: {
          include: {
            permission: true
          }
        }
      }
    });
    
    if (!group) return null;
    
    return {
      group_id: group.group_id,
      name: group.name,
      codename: group.codename,
      description: group.description,
      is_system: group.is_system,
      is_active: group.is_active,
      permissions: group.groupPermissions.map(gp => ({
        permission_id: gp.permission.permission_id,
        name: gp.permission.name,
        codename: gp.permission.codename,
        description: gp.permission.description,
        category: gp.permission.category
      })),
      created_at: group.created_at,
      last_updated: group.last_updated
    };
  } catch (error) {
    logger.error('Error getting group by codename', { error: error.message, module: 'Permissions', label: 'GET_GROUP_BY_CODENAME' });
    throw error;
  }
}

/**
 * Create a new group
 * @param {object} groupData - Group data
 * @returns {Promise<object>} Created group
 */
async function createGroup(groupData) {
  try {
    const { name, codename, description, is_system, is_active } = groupData;
    
    const group = await prisma.group.create({
      data: {
        name,
        codename,
        description: description || null,
        is_system: is_system || false,
        is_active: is_active !== undefined ? is_active : true
      }
    });
    
    return {
      group_id: group.group_id,
      name: group.name,
      codename: group.codename,
      description: group.description,
      is_system: group.is_system,
      is_active: group.is_active,
      permissions: [],
      created_at: group.created_at,
      last_updated: group.last_updated
    };
  } catch (error) {
    logger.error('Error creating group', { error: error.message, module: 'Permissions', label: 'CREATE_GROUP' });
    throw error;
  }
}

/**
 * Update group
 * @param {string} groupId - Group ID
 * @param {object} groupData - Updated group data
 * @returns {Promise<object|null>} Updated group or null
 */
async function updateGroup(groupId, groupData) {
  try {
    const { name, codename, description, is_active } = groupData;
    
    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (codename !== undefined) updateData.codename = codename;
    if (description !== undefined) updateData.description = description;
    if (is_active !== undefined) updateData.is_active = is_active;
    
    await prisma.group.update({
      where: { group_id: groupId },
      data: updateData
    });
    
    return await getGroupById(groupId);
  } catch (error) {
    if (error.code === 'P2025') {
      // Record not found
      return null;
    }
    logger.error('Error updating group', { error: error.message, module: 'Permissions', label: 'UPDATE_GROUP' });
    throw error;
  }
}

/**
 * Delete group
 * @param {string} groupId - Group ID
 * @returns {Promise<boolean>} True if deleted
 */
async function deleteGroup(groupId) {
  try {
    // Check if group is system group
    const group = await prisma.group.findUnique({
      where: { group_id: groupId },
      select: { is_system: true }
    });
    
    if (!group) return false;
    if (group.is_system) return false; // Cannot delete system groups
    
    await prisma.group.delete({
      where: { group_id: groupId }
    });
    return true;
  } catch (error) {
    if (error.code === 'P2025') {
      // Record not found
      return false;
    }
    logger.error('Error deleting group', { error: error.message, module: 'Permissions', label: 'DELETE_GROUP' });
    throw error;
  }
}

/**
 * Assign permissions to group
 * @param {string} groupId - Group ID
 * @param {Array<string>} permissionIds - Array of permission IDs
 * @returns {Promise<boolean>} True if successful
 */
async function assignPermissionsToGroup(groupId, permissionIds) {
  try {
    await prisma.$transaction(async (tx) => {
      // Remove existing permissions
      await tx.groupPermission.deleteMany({
        where: { group_id: groupId }
      });
      
      // Add new permissions
      if (permissionIds && permissionIds.length > 0) {
        await tx.groupPermission.createMany({
          data: permissionIds.map(permissionId => ({
            group_id: groupId,
            permission_id: permissionId
          })),
          skipDuplicates: true
        });
      }
    });
    
    return true;
  } catch (error) {
    logger.error('Error assigning permissions to group', { error: error.message, module: 'Permissions', label: 'ASSIGN_PERMISSIONS' });
    throw error;
  }
}

/**
 * Get user groups from user_group table
 * @param {string} userId - User ID
 * @returns {Promise<Array>} Array of group objects
 */
async function getUserGroups(userId) {
  try {
    const userGroups = await prisma.userGroup.findMany({
      where: {
        user_id: userId,
        group: {
          is_active: true
        }
      },
      include: {
        group: true
      },
      orderBy: {
        group: {
          name: 'asc'
        }
      }
    });
    
    return userGroups.map(ug => ({
      group_id: ug.group.group_id,
      name: ug.group.name,
      codename: ug.group.codename,
      description: ug.group.description,
      is_system: ug.group.is_system,
      is_active: ug.group.is_active,
      assigned_at: ug.assigned_at,
      assigned_by_user_id: ug.assigned_by_user_id
    }));
  } catch (error) {
    logger.error('Error getting user groups', { error: error.message, module: 'Permissions', label: 'GET_USER_GROUPS' });
    throw error;
  }
}

/**
 * Get user permissions from all assigned groups
 * @param {string} userId - User ID
 * @returns {Promise<Array>} Array of unique permission objects
 */
async function getUserPermissions(userId) {
  try {
    const userGroups = await prisma.userGroup.findMany({
      where: {
        user_id: userId,
        group: {
          is_active: true
        }
      },
      include: {
        group: {
          include: {
            groupPermissions: {
              include: {
                permission: true
              }
            }
          }
        }
      }
    });
    
    // Extract unique permissions
    const permissionMap = new Map();
    userGroups.forEach(ug => {
      ug.group.groupPermissions.forEach(gp => {
        const perm = gp.permission;
        if (!permissionMap.has(perm.permission_id)) {
          permissionMap.set(perm.permission_id, {
            permission_id: perm.permission_id,
            name: perm.name,
            codename: perm.codename,
            description: perm.description,
            category: perm.category
          });
        }
      });
    });
    
    // Sort by category and name
    return Array.from(permissionMap.values()).sort((a, b) => {
      if (a.category !== b.category) {
        return (a.category || '').localeCompare(b.category || '');
      }
      return a.name.localeCompare(b.name);
    });
  } catch (error) {
    logger.error('Error getting user permissions', { error: error.message, module: 'Permissions', label: 'GET_USER_PERMISSIONS' });
    throw error;
  }
}

/**
 * Check if user has permission through assigned groups
 * @param {string} userId - User ID
 * @param {string} permissionCodename - Permission codename
 * @returns {Promise<boolean>} True if user has permission
 */
async function userHasPermission(userId, permissionCodename) {
  try {
    const count = await prisma.userGroup.count({
      where: {
        user_id: userId,
        group: {
          is_active: true,
          groupPermissions: {
            some: {
              permission: {
                codename: permissionCodename
              }
            }
          }
        }
      }
    });
    
    return count > 0;
  } catch (error) {
    logger.error('Error checking user permission', { error: error.message, module: 'Permissions', label: 'USER_HAS_PERMISSION' });
    return false;
  }
}

/**
 * Assign groups to user
 * @param {string} userId - User ID
 * @param {Array<string>} groupCodenames - Array of group codenames
 * @param {string} assignedByUserId - User ID who assigned (optional)
 * @returns {Promise<boolean>} True if successful
 */
async function assignGroupsToUser(userId, groupCodenames, assignedByUserId = null) {
  try {
    if (!groupCodenames || !Array.isArray(groupCodenames)) {
      throw new Error('groupCodenames must be an array');
    }
    
    // Get group IDs from codenames
    const groups = await prisma.group.findMany({
      where: {
        codename: { in: groupCodenames },
        is_active: true
      },
      select: { group_id: true, codename: true }
    });
    
    if (groups.length !== groupCodenames.length) {
      const foundCodenames = groups.map(g => g.codename);
      const missing = groupCodenames.filter(c => !foundCodenames.includes(c));
      throw new Error(`Groups not found: ${missing.join(', ')}`);
    }
    
    await prisma.$transaction(async (tx) => {
      // Remove existing groups
      await tx.userGroup.deleteMany({
        where: { user_id: userId }
      });
      
      // Add new groups
      if (groups.length > 0) {
        await tx.userGroup.createMany({
          data: groups.map(group => ({
            user_id: userId,
            group_id: group.group_id,
            assigned_by_user_id: assignedByUserId || null
          })),
          skipDuplicates: true
        });
      }
    });
    
    return true;
  } catch (error) {
    logger.error('Error assigning groups to user', { error: error.message, module: 'Permissions', label: 'ASSIGN_GROUPS_TO_USER' });
    throw error;
  }
}

/**
 * Remove groups from user
 * @param {string} userId - User ID
 * @param {Array<string>} groupCodenames - Array of group codenames to remove
 * @returns {Promise<boolean>} True if successful
 */
async function removeGroupsFromUser(userId, groupCodenames) {
  try {
    if (!groupCodenames || !Array.isArray(groupCodenames)) {
      throw new Error('groupCodenames must be an array');
    }
    
    // Get group IDs from codenames
    const groups = await prisma.group.findMany({
      where: {
        codename: { in: groupCodenames }
      },
      select: { group_id: true }
    });
    
    if (groups.length === 0) return true;
    
    const groupIds = groups.map(g => g.group_id);
    
    const result = await prisma.userGroup.deleteMany({
      where: {
        user_id: userId,
        group_id: { in: groupIds }
      }
    });
    
    return result.count > 0;
  } catch (error) {
    logger.error('Error removing groups from user', { error: error.message, module: 'Permissions', label: 'REMOVE_GROUPS_FROM_USER' });
    throw error;
  }
}

module.exports = {
  // Permissions
  getAllPermissions,
  getPermissionById,
  getPermissionByCodename,
  createPermission,
  updatePermission,
  deletePermission,
  
  // Groups
  getAllGroups,
  getGroupById,
  getGroupByCodename,
  createGroup,
  updateGroup,
  deleteGroup,
  assignPermissionsToGroup,
  
  // User Groups & Permissions
  getUserGroups,
  getUserPermissions,
  userHasPermission,
  assignGroupsToUser,
  removeGroupsFromUser
};
