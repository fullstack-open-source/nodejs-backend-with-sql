const redis = require('redis');
const logger = require('../logger/logger');

// Build Redis connection URL
const redisUrl = process.env.REDIS_URL || 
  `redis://${process.env.REDIS_PASSWORD ? `:${process.env.REDIS_PASSWORD}@` : ''}${process.env.REDIS_HOST || 'localhost'}:${process.env.REDIS_PORT || 6379}`;

// Create Redis client with proper configuration for redis v4+
const client = redis.createClient({
  url: redisUrl,
  socket: {
    reconnectStrategy: (retries) => {
      if (retries > 10) {
        logger.warn('Redis reconnection attempts exhausted');
        return false; // Stop reconnecting
      }
      return Math.min(retries * 100, 3000);
    },
    connectTimeout: 10000
  }
});

// Handle connection events
client.on('connect', () => {
  logger.info('Redis client connecting...');
});

client.on('error', (err) => {
  logger.error('Redis client error', { error: err.message || err.toString() });
});

client.on('ready', () => {
  logger.info('Redis client ready');
});

client.on('reconnecting', () => {
  logger.warn('Redis client reconnecting...');
});

// Connect to Redis with error handling
let isConnected = false;
(async () => {
  try {
    await client.connect();
    isConnected = true;
    logger.info('Redis client connected successfully');
  } catch (error) {
    logger.error('Failed to connect to Redis', { error: error.message || error.toString() });
    isConnected = false;
  }
})();

/**
 * Get value from cache
 * @param {string} key - Cache key
 * @returns {Promise<any>} Cached value
 */
async function get(key) {
  if (!isConnected || !client.isReady) {
    return null;
  }
  try {
    const value = await client.get(key);
    if (!value) {
      return null;
    }
    // Try to parse as JSON, if it fails return as string (for blacklist values like "1")
    try {
      return JSON.parse(value);
    } catch (parseError) {
      return value;
    }
  } catch (error) {
    logger.error('Cache get error', { error: error.message || error.toString(), key });
    return null;
  }
}

/**
 * Set value in cache
 * @param {string} key - Cache key
 * @param {any} value - Value to cache
 * @param {number} ttl - Time to live in seconds
 * @returns {Promise<boolean>} Success status
 */
async function set(key, value, ttl = 3600) {
  if (!isConnected || !client.isReady) {
    return false;
  }
  try {
    // If value is already a string (like "1" for blacklisting), don't stringify
    const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
    await client.setEx(key, ttl, stringValue);
    return true;
  } catch (error) {
    logger.error('Cache set error', { error: error.message || error.toString(), key });
    return false;
  }
}

/**
 * Delete value from cache
 * @param {string} key - Cache key
 * @returns {Promise<boolean>} Success status
 */
async function del(key) {
  if (!isConnected || !client.isReady) {
    return false;
  }
  try {
    await client.del(key);
    return true;
  } catch (error) {
    logger.error('Cache delete error', { error: error.message || error.toString(), key });
    return false;
  }
}

/**
 * Check if key exists in cache
 * @param {string} key - Cache key
 * @returns {Promise<boolean>} Existence status
 */
async function exists(key) {
  if (!isConnected || !client.isReady) {
    return false;
  }
  try {
    const result = await client.exists(key);
    return result === 1;
  } catch (error) {
    logger.error('Cache exists error', { error: error.message || error.toString(), key });
    return false;
  }
}

module.exports = {
  client,
  get,
  set,
  del,
  exists
};

