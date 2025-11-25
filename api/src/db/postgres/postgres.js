const { Pool } = require('pg');
const logger = require('../../logger/logger');

const { buildConnectionString: buildConnectionStringShared } = require('./connection-builder');

function buildConnectionString() {
  return buildConnectionStringShared();
}

function getSSLConfig(connectionString = null) {
  const sslEnabled = process.env.DATABASE_SSL === 'true';
  if (sslEnabled) {
    return {
      rejectUnauthorized: process.env.DATABASE_SSL_REJECT_UNAUTHORIZED !== 'false'
    };
  }
  return false;
}

class PostgresConnection {
  constructor(connectionString = null, options = {}) {
    const connString = connectionString || buildConnectionString();
    const sslConfig = getSSLConfig(connString);

    this.pool = new Pool({
      connectionString: connString,
      ssl: options.ssl !== undefined ? options.ssl : sslConfig,
      max: options.max || parseInt(process.env.DB_POOL_MAX || '50', 10), 
      min: options.min || parseInt(process.env.DB_POOL_MIN || '5', 10), 
      idleTimeoutMillis: options.idleTimeoutMillis || 30000,
      connectionTimeoutMillis: options.connectionTimeoutMillis || 10000,
      allowExitOnIdle: false, 
      maxUses: 7500, 
    });

    this.pool.on('connect', () => {
      logger.info('PostgreSQL connection established');
    });

    this.pool.on('error', (err) => {
      logger.error('Unexpected error on idle PostgreSQL client', { error: err.message });
    });
  }

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


  async getClient() {
    return await this.pool.connect();
  }

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


let connection = null;

/**
 * Get or create database connection
 */
function getConnection() {
  if (!connection) {
    
    const connectionString = buildConnectionString();

    
    if (!connectionString) {
      const errorMsg = 'Missing required database environment variables. Provide either DATABASE_URL or individual DATABASE_HOST, DATABASE_NAME, DATABASE_USER, DATABASE_PASSWORD, DATABASE_PORT';
      logger.error(errorMsg);
      throw new Error(errorMsg);
    }

    try {
      const sslConfig = getSSLConfig(connectionString);
      
      connection = new PostgresConnection(connectionString, {
        ssl: sslConfig,
        max: parseInt(process.env.DB_POOL_MAX || '50', 10), 
        min: parseInt(process.env.DB_POOL_MIN || '5', 10), 
        idleTimeoutMillis: parseInt(process.env.DB_POOL_IDLE_TIMEOUT || '30000', 10),
        connectionTimeoutMillis: parseInt(process.env.DB_POOL_CONNECTION_TIMEOUT || '10000', 10),
      });

      
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
