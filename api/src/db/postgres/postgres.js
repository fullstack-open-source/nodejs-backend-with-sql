/**
 * PostgreSQL Database Connection
 * Matches FastAPI structure: src/db/postgres/postgres.py
 */

const { Pool } = require('pg');
const logger = require('../../logger/logger');

/**
 * Build connection string from individual components or use provided URL
 */
function buildConnectionString() {
  // If DATABASE_URL is provided, use it
  if (process.env.DATABASE_URL) {
    return process.env.DATABASE_URL;
  }
  
  // Build from individual components
  const host = process.env.DATABASE_HOST || 'nodejs-backend-db';
  const port = process.env.DATABASE_PORT || 5432;
  const database = process.env.DATABASE_NAME || 'postgres';
  const user = process.env.DATABASE_USER || 'postgres';
  const password = process.env.DATABASE_PASSWORD || 'postgres';

  // URL encode password to handle special characters
  const encodedPassword = encodeURIComponent(password);

  return `postgresql://${user}:${encodedPassword}@${host}:${port}/${database}`;
}

/**
 * Get SSL configuration
 */
function getSSLConfig(connectionString = null) {
  const sslEnabled = process.env.DATABASE_SSL === 'true';
  
  // For Supabase and other cloud providers, we might need SSL even if not explicitly enabled
  if (connectionString) {
    // Check if connection string indicates SSL requirement (Supabase pooler, etc.)
    if (connectionString.includes('pooler.supabase.com') || 
        connectionString.includes('supabase.com') ||
        connectionString.includes('ssl=true') ||
        connectionString.includes('sslmode=require')) {
      return {
        rejectUnauthorized: false // Allow self-signed certificates for cloud providers
      };
    }
  }
  
  if (sslEnabled) {
    return {
      rejectUnauthorized: process.env.DATABASE_SSL_REJECT_UNAUTHORIZED !== 'false'
    };
  }

  return false;
}

/**
 * PostgresConnection class
 * Similar to FastAPI's PostgresConnection
 */
class PostgresConnection {
  constructor(connectionString = null, options = {}) {
    const connString = connectionString || buildConnectionString();
    const sslConfig = getSSLConfig(connString);

    this.pool = new Pool({
      connectionString: connString,
      ssl: options.ssl !== undefined ? options.ssl : sslConfig,
      max: options.max || parseInt(process.env.DB_POOL_MAX || '50', 10), // Increased from 20 to 50 for better concurrency
      min: options.min || parseInt(process.env.DB_POOL_MIN || '5', 10), // Increased from 2 to 5 for faster response
      idleTimeoutMillis: options.idleTimeoutMillis || 30000,
      connectionTimeoutMillis: options.connectionTimeoutMillis || 10000,
      allowExitOnIdle: false, // Keep pool alive
      maxUses: 7500, // Recycle connections after 7500 uses to prevent memory leaks
    });

    // Event handlers
    this.pool.on('connect', () => {
      logger.info('PostgreSQL connection established');
    });

    this.pool.on('error', (err) => {
      logger.error('Unexpected error on idle PostgreSQL client', { error: err.message });
    });
  }

  /**
   * Execute a query
   */
  async query(text, params) {
    const start = Date.now();
    try {
      const res = await this.pool.query(text, params);
      const duration = Date.now() - start;
      const { isDebugMode, debugQuery } = require('../../utils/debug');
      if (isDebugMode()) {
        debugQuery(text, params, duration);
      }
      return {
        rows: res.rows,
        rowCount: res.rowCount,
        command: res.command
      };
    } catch (error) {
      logger.error('PostgreSQL query error', { error: error.message, text });
      throw error;
    }
  }

  /**
   * Get a client from the pool for transactions
   */
  async getClient() {
    return await this.pool.connect();
  }

  /**
   * Execute a transaction
   */
  async transaction(callback) {
    const client = await this.getClient();
    try {
      await client.query('BEGIN');
      const result = await callback(client);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Close connection pool
   */
  async close() {
    if (this.pool) {
      await this.pool.end();
      logger.info('PostgreSQL connection closed');
    }
  }

  /**
   * Table method for query builder (similar to FastAPI)
   * @param {string} tableName - Table name
   * @returns {Object} Query builder instance
   */
  table(tableName) {
    // For now, return a simple query builder
    // Can be extended later to match FastAPI's QueryBuilder
    return {
      select: async (fields = '*') => {
        const query = `SELECT ${fields} FROM ${tableName}`;
        return await this.query(query);
      },
      insert: async (data) => {
        const keys = Object.keys(data).join(', ');
        const values = Object.values(data);
        const placeholders = values.map((_, i) => `$${i + 1}`).join(', ');
        const query = `INSERT INTO ${tableName} (${keys}) VALUES (${placeholders}) RETURNING *`;
        return await this.query(query, values);
      },
      update: async (data, where) => {
        const setClause = Object.keys(data).map((key, i) => `${key} = $${i + 1}`).join(', ');
        const whereClause = Object.keys(where).map((key, i) => `${key} = $${Object.keys(data).length + i + 1}`).join(' AND ');
        const values = [...Object.values(data), ...Object.values(where)];
        const query = `UPDATE ${tableName} SET ${setClause} WHERE ${whereClause} RETURNING *`;
        return await this.query(query, values);
      },
      delete: async (where) => {
        const whereClause = Object.keys(where).map((key, i) => `${key} = $${i + 1}`).join(' AND ');
        const values = Object.values(where);
        const query = `DELETE FROM ${tableName} WHERE ${whereClause} RETURNING *`;
        return await this.query(query, values);
      }
    };
  }
}

// Lazy initialization - only create connection when needed
let connection = null;

/**
 * Get or create database connection
 */
function getConnection() {
  if (!connection) {
    // Build connection string from individual components or use provided URL
    const connectionString = buildConnectionString();

    // Validate required environment variables
    if (!connectionString) {
      const errorMsg = 'Missing required database environment variables. Provide either DATABASE_URL or individual DATABASE_HOST, DATABASE_NAME, DATABASE_USER, DATABASE_PASSWORD, DATABASE_PORT';
      logger.error(errorMsg);
      throw new Error(errorMsg);
    }

    try {
      const sslConfig = getSSLConfig(connectionString);
      
      connection = new PostgresConnection(connectionString, {
        ssl: sslConfig,
        max: parseInt(process.env.DB_POOL_MAX || '50', 10), // Increased for high traffic
        min: parseInt(process.env.DB_POOL_MIN || '5', 10), // Increased for faster response
        idleTimeoutMillis: parseInt(process.env.DB_POOL_IDLE_TIMEOUT || '30000', 10),
        connectionTimeoutMillis: parseInt(process.env.DB_POOL_CONNECTION_TIMEOUT || '10000', 10),
      });

      // Extract connection info for logging (without password)
      try {
        const urlObj = new URL(connectionString);
        logger.info('PostgreSQL connection pool created', {
          host: urlObj.hostname,
          port: urlObj.port,
          database: urlObj.pathname.replace('/', ''),
          user: urlObj.username,
          ssl: !!sslConfig
        });
      } catch (e) {
        logger.info('PostgreSQL connection pool created', { ssl: !!sslConfig });
      }

      // Test connection asynchronously (don't block module load)
      connection.query('SELECT 1')
        .then(() => {
          logger.info('PostgreSQL connection initialized successfully');
        })
        .catch((error) => {
          logger.error('Failed to test PostgreSQL connection', { error: error.message });
        });
    } catch (error) {
      logger.error('Failed to establish database connection', { error: error.message });
      throw error;
    }
  }
  return connection;
}

module.exports = {
  get connection() {
    return getConnection();
  },
  PostgresConnection,
  getConnection
};
