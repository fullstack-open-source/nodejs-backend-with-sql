/**
 * Database Query Functions for Authentication
 * Uses Prisma for database operations
 */

const { prisma } = require('../../src/db/prisma');
const logger = require('../../src/logger/logger');
const { ERROR } = require('../../src/response/error');

/**
 * Get user by user_id
 * @param {string} userId - User ID (UUID)
 * @returns {Promise<object|null>} User object or null
 */
async function getUserByUserId(userId) {
  try {
    if (!userId) {
      throw new Error('user_id is required');
    }
    
    const user = await prisma.user.findUnique({
      where: { user_id: userId }
    });
    
    if (!user) {
      logger.warn(`User not found with user_id: ${userId}`, { module: 'Auth', label: 'GET_USER_BY_ID' });
      return null;
    }
    
    return {
      ...user,
      user_id: String(user.user_id)
    };
  } catch (error) {
    logger.error('Database error in get_user_by_user_id', { error: error.message, module: 'Auth', label: 'GET_USER_BY_ID' });
    throw error;
  }
}

module.exports = {
  getUserByUserId
};

