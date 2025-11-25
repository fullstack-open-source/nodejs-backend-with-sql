const { prisma } = require('../src/db/prisma');
const logger = require('../src/logger/logger');

const defaultPermissions = [
  {
    name: 'View Dashboard',
    codename: 'view_dashboard',
    description: 'Can view dashboard and statistics',
    category: 'dashboard'
  },
  {
    name: 'View Profile',
    codename: 'view_profile',
    description: 'Can view user profiles',
    category: 'profile'
  },
  {
    name: 'Edit Profile',
    codename: 'edit_profile',
    description: 'Can edit own profile',
    category: 'profile'
  },
  {
    name: 'View User',
    codename: 'view_user',
    description: 'Can view other users profiles and information',
    category: 'user'
  },
  {
    name: 'View Permissions',
    codename: 'view_permission',
    description: 'Can view permissions',
    category: 'permission'
  },
  {
    name: 'Add Permission',
    codename: 'add_permission',
    description: 'Can create new permissions',
    category: 'permission'
  },
  {
    name: 'Edit Permission',
    codename: 'edit_permission',
    description: 'Can edit permissions',
    category: 'permission'
  },
  {
    name: 'Delete Permission',
    codename: 'delete_permission',
    description: 'Can delete permissions',
    category: 'permission'
  },
  {
    name: 'View Groups',
    codename: 'view_group',
    description: 'Can view groups',
    category: 'group'
  },
  {
    name: 'Add Group',
    codename: 'add_group',
    description: 'Can create new groups',
    category: 'group'
  },
  {
    name: 'Edit Group',
    codename: 'edit_group',
    description: 'Can edit groups and assign permissions to groups',
    category: 'group'
  },
  {
    name: 'Delete Group',
    codename: 'delete_group',
    description: 'Can delete groups',
    category: 'group'
  },
  {
    name: 'Assign Groups',
    codename: 'assign_groups',
    description: 'Can assign groups to users',
    category: 'group'
  },
  {
    name: 'View Activity Logs',
    codename: 'view_activity_log',
    description: 'Can view activity logs',
    category: 'activity'
  },
  {
    name: 'Delete Activity Logs',
    codename: 'delete_activity_log',
    description: 'Can delete activity logs',
    category: 'activity'
  },
  {
    name: 'Add Upload',
    codename: 'add_upload',
    description: 'Can upload media files',
    category: 'upload'
  },
  {
    name: 'Delete Upload',
    codename: 'delete_upload',
    description: 'Can delete media files',
    category: 'upload'
  }
];

const defaultGroups = [
  {
    name: 'Super Admin',
    codename: 'super_admin',
    description: 'Full system access with all permissions',
    is_system: true,
    is_active: true,
    permissions: [
      'view_dashboard', 'view_profile', 'edit_profile', 'view_user',
      'view_permission', 'add_permission', 'edit_permission', 'delete_permission',
      'view_group', 'add_group', 'edit_group', 'delete_group',
      'assign_groups', 'view_activity_log', 'delete_activity_log',
      'add_upload', 'delete_upload'
    ]
  },
  {
    name: 'Admin',
    codename: 'admin',
    description: 'Administrative access with most permissions',
    is_system: true,
    is_active: true,
    permissions: [
      'view_dashboard', 'view_profile', 'edit_profile', 'view_user',
      'view_permission', 'view_group', 'add_group', 'edit_group',
      'assign_groups', 'view_activity_log', 'add_upload', 'delete_upload'
    ]
  },
  {
    name: 'Developer',
    codename: 'developer',
    description: 'Developer access with technical permissions',
    is_system: true,
    is_active: true,
    permissions: [
      'view_dashboard', 'view_profile', 'edit_profile', 'view_user',
      'view_permission', 'view_group', 'view_activity_log', 'add_upload'
    ]
  },
  {
    name: 'Business',
    codename: 'business',
    description: 'Business user with limited administrative access',
    is_system: true,
    is_active: true,
    permissions: [
      'view_dashboard', 'view_profile', 'edit_profile', 'view_user',
      'view_activity_log', 'add_upload'
    ]
  },
  {
    name: 'User',
    codename: 'user',
    description: 'Standard user with basic permissions',
    is_system: true,
    is_active: true,
    permissions: [
      'view_profile', 'edit_profile', 'add_upload'
    ]
  },
  {
    name: 'Accountant',
    codename: 'accountant',
    description: 'Accountant with financial access',
    is_system: true,
    is_active: true,
    permissions: [
      'view_dashboard', 'view_profile', 'edit_profile', 'view_user',
      'view_activity_log'
    ]
  }
];

async function seedPermissions() {
  logger.info('Seeding permissions...');
  
  const createdPermissions = {};
  
  for (const permData of defaultPermissions) {
    try {
      let permission = await prisma.permission.findUnique({
        where: { codename: permData.codename }
      });
      
      if (permission) {
        permission = await prisma.permission.update({
          where: { codename: permData.codename },
          data: {
            name: permData.name,
            description: permData.description,
            category: permData.category
          }
        });
        logger.info(`Permission updated: ${permData.codename}`);
      } else {
        permission = await prisma.permission.create({
          data: permData
        });
        logger.info(`Permission created: ${permData.codename}`);
      }
      
      createdPermissions[permData.codename] = permission;
    } catch (error) {
      logger.error(`Failed to create permission ${permData.codename}`, { error: error.message });
      throw error;
    }
  }
  
  logger.info(`Successfully seeded ${Object.keys(createdPermissions).length} permissions`);
  return createdPermissions;
}

async function seedGroups(permissions) {
  logger.info('Seeding groups...');
  
  const createdGroups = {};
  
  for (const groupData of defaultGroups) {
    try {
      const { permissions: permCodenames, ...groupInfo } = groupData;
      
      let group = await prisma.group.findUnique({
        where: { codename: groupData.codename }
      });
      
      if (group) {
        group = await prisma.group.update({
          where: { codename: groupData.codename },
          data: {
            name: groupInfo.name,
            description: groupInfo.description,
            is_system: groupInfo.is_system,
            is_active: groupInfo.is_active
          }
        });
        logger.info(`Group updated: ${groupData.codename}`);
      } else {
        group = await prisma.group.create({
          data: groupInfo
        });
        logger.info(`Group created: ${groupData.codename}`);
      }
      
      createdGroups[groupData.codename] = group;
      
      if (permCodenames && permCodenames.length > 0) {
        await assignPermissionsToGroup(group.group_id, permCodenames, permissions);
        logger.info(`Assigned ${permCodenames.length} permissions to group ${groupData.codename}`);
      }
    } catch (error) {
      logger.error(`Failed to create group ${groupData.codename}`, { error: error.message });
      throw error;
    }
  }
  
  logger.info(`Successfully seeded ${Object.keys(createdGroups).length} groups`);
  return createdGroups;
}

async function assignPermissionsToGroup(groupId, permissionCodenames, permissionsMap) {
  for (const codename of permissionCodenames) {
    const permission = permissionsMap[codename];
    if (!permission) {
      logger.warn(`Permission ${codename} not found, skipping assignment`);
      continue;
    }
    
    try {
      const existing = await prisma.groupPermission.findUnique({
        where: {
          group_id_permission_id: {
            group_id: groupId,
            permission_id: permission.permission_id
          }
        }
      });
      
      if (!existing) {
        await prisma.groupPermission.create({
          data: {
            group_id: groupId,
            permission_id: permission.permission_id
          }
        });
      }
    } catch (error) {
      logger.error(`Failed to assign permission ${codename} to group`, { error: error.message });
    }
  }
}

async function assignDefaultGroupsToUsers(groups) {
  logger.info('Assigning default groups to existing users...');
  
  try {
    const users = await prisma.user.findMany({
      where: {
        is_active: true
      },
      select: {
        user_id: true,
        email: true
      }
    });
    
    logger.info(`Found ${users.length} users to process`);
    
    const defaultGroup = groups['user'];
    if (!defaultGroup) {
      logger.warn('Default "user" group not found, skipping user group assignment');
      return { totalUsers: users.length, assignedCount: 0 };
    }
    
    let assignedCount = 0;
    let skippedCount = 0;
    
    for (const user of users) {
      try {
        const existing = await prisma.userGroup.findUnique({
          where: {
            user_id_group_id: {
              user_id: user.user_id,
              group_id: defaultGroup.group_id
            }
          }
        });
        
        if (!existing) {
          await prisma.userGroup.create({
            data: {
              user_id: user.user_id,
              group_id: defaultGroup.group_id
            }
          });
          assignedCount++;
          logger.info(`Assigned default "user" group to user ${user.email || user.user_id}`);
        } else {
          skippedCount++;
        }
      } catch (error) {
        logger.error(`Failed to assign group to user ${user.email || user.user_id}`, { error: error.message });
      }
    }
    
    logger.info(`Group assignment completed: ${assignedCount} assignments made, ${skippedCount} users already had groups`);
    return { totalUsers: users.length, assignedCount, skippedCount };
  } catch (error) {
    logger.error('Failed to assign default groups to users', { error: error.message });
    throw error;
  }
}

async function seed() {
  try {
    logger.info('Starting database seeding...');
    
    const permissions = await seedPermissions();
    const groups = await seedGroups(permissions);
    
    const userAssignment = await assignDefaultGroupsToUsers(groups);
    
    logger.info('Database seeding completed successfully');
    logger.info(`Created ${Object.keys(permissions).length} permissions`);
    logger.info(`Created ${Object.keys(groups).length} groups`);
    logger.info(`Assigned groups to ${userAssignment.assignedCount} user-group relationships`);
    
    return {
      permissions: Object.keys(permissions).length,
      groups: Object.keys(groups).length,
      userAssignments: userAssignment.assignedCount,
      usersProcessed: userAssignment.totalUsers
    };
  } catch (error) {
    logger.error('Database seeding failed', { error: error.message, stack: error.stack });
    throw error;
  }
}

async function main() {
  try {
    await seed();
    await prisma.$disconnect();
    process.exit(0);
  } catch (error) {
    logger.error('Seed script failed', { error: error.message });
    await prisma.$disconnect();
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { seed, seedPermissions, seedGroups, assignDefaultGroupsToUsers };

