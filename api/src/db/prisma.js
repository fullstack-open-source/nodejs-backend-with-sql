/**
 * Prisma Database Client
 * Wrapper around Prisma Client for database operations
 * Uses the existing PostgreSQL connection pool from postgres.js
 */

const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { getConnection } = require('./postgres/postgres');
const logger = require('../logger/logger');

// Get the existing PostgreSQL connection pool
// This reuses the same connection pool created in postgres.js
function getPostgresPool() {
  const connection = getConnection();
  return connection.pool;
}

// Create Prisma Adapter using existing pool
const pool = getPostgresPool();
const adapter = new PrismaPg(pool);

// Create base Prisma Client instance with adapter
const prismaBase = new PrismaClient({
  adapter: adapter,
  log: process.env.NODE_ENV === 'development' 
    ? ['query', 'error', 'warn'] 
    : ['error'],
});

// Extend Prisma Client to auto-assign default "user" group
const prisma = prismaBase.$extends({
  name: 'auto-assign-user-group',
  query: {
    user: {
      async create({ args, query }) {
        const result = await query(args);
        
        if (result && result.user_id) {
          try {
            const userGroup = await prismaBase.group.findUnique({
              where: { codename: 'user' }
            });
            
            if (userGroup) {
              await prismaBase.userGroup.upsert({
                where: {
                  user_id_group_id: {
                    user_id: result.user_id,
                    group_id: userGroup.group_id
                  }
                },
                update: {},
                create: {
                  user_id: result.user_id,
                  group_id: userGroup.group_id
                }
              });
              
              logger.info(`Auto-assigned 'user' group to new user ${result.user_id}`);
            }
          } catch (error) {
            logger.warn(`Failed to auto-assign user group to ${result.user_id}`, { error: error.message });
          }
        }
        
        return result;
      }
    }
  }
});

// Handle connection events (use prismaBase for $on)
prismaBase.$on('query', (e) => {
  const { isDebugMode, debugQuery } = require('../utils/debug');
  
  if (isDebugMode()) {
    debugQuery(e.query, e.params, e.duration);
  }
});

// Graceful shutdown
process.on('beforeExit', async () => {
  await prismaBase.$disconnect();
});

/**
 * Test database connection
 */
async function testConnection() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    
    return true;
  } catch (error) {
    logger.error('Prisma database connection failed', { error: error.message });
    return false;
  }
}

module.exports = {
  prisma,
  testConnection,
  // Export common operations for backward compatibility
  query: async (text, params) => {
    // For raw SQL queries, use $queryRaw
    if (params && params.length > 0) {
      return await prisma.$queryRawUnsafe(text, ...params);
    }
    return await prisma.$queryRawUnsafe(text);
  },
  transaction: async (callback) => {
    return await prisma.$transaction(callback);
  },
};

