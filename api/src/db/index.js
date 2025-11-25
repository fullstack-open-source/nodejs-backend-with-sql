/**
 * PostgreSQL Database Interface
 * Centralized database connection and operations
 * FastAPI-style: exports connection directly
 * 
 * Usage: 
 *   const db = require('./src/db');
 *   await db.query('SELECT * FROM users');
 *   await db.transaction(async (client) => { ... });
 */

const { getConnection } = require('./postgres/postgres');
const logger = require('../logger/logger');

/**
 * Get database connection (lazy initialization)
 */
async function getDbConnection() {
  return getConnection();
}

/**
 * Initialize database connection (lazy initialization)
 */
async function initialize() {
  return getConnection();
}

/**
 * Close database connection
 */
async function close() {
  try {
    const connection = getConnection();
    if (connection && typeof connection.close === 'function') {
      await connection.close();
      logger.info('PostgreSQL database connection closed');
    }
  } catch (error) {
    // Connection might not be initialized yet
    logger.warn('No connection to close', { error: error.message });
  }
}

/**
 * Get raw connection (for migrations, etc.)
 */
function getRawConnection() {
  return getConnection();
}

// Create a proxy that lazily initializes the connection only when methods are called
const dbProxy = new Proxy({}, {
  get(target, prop) {
    // If it's one of our helper methods, return them directly
    if (prop === 'getConnection') return getDbConnection;
    if (prop === 'initialize') return initialize;
    if (prop === 'close') return close;
    if (prop === 'getRawConnection') return getRawConnection;
    
    // For all other properties/methods, get the connection first
    const connection = getConnection();
    
    // If it's a function, bind it to the connection
    if (typeof connection[prop] === 'function') {
      return connection[prop].bind(connection);
    }
    
    // Otherwise, return the property value
    return connection[prop];
  }
});

module.exports = dbProxy;
