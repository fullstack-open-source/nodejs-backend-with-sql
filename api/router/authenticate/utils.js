/**
 * Authentication Utilities
 * Validation and serialization functions
 */

const { getUserByEmailOrPhone, createUserInDb } = require('../../src/authenticate/checkpoint');
const { ERROR } = require('../../src/response/error');
const logger = require('../../src/logger/logger');

// Validation patterns
const phonePattern = /^\+?[1-9]\d{1,14}$/;
const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

/**
 * Validate phone number format
 * @param {string} phone - Phone number
 * @returns {boolean} True if valid
 */
function validatePhone(phone) {
  return phonePattern.test(phone);
}

/**
 * Validate email format
 * @param {string} email - Email address
 * @returns {boolean} True if valid
 */
function validateEmail(email) {
  return emailPattern.test(email);
}

/**
 * Serialize user data (convert dates to ISO strings)
 * @param {object} user - User object
 * @returns {object} Serialized user data
 */
function serializeUserData(user) {
  if (!user) {
    return {};
  }
  
  const userDict = typeof user.toJSON === 'function' ? user.toJSON() : { ...user };
  
  // Convert datetime fields to ISO strings
  const datetimeFields = ['dob', 'last_sign_in_at', 'email_verified_at', 'phone_number_verified_at', 'created_at', 'last_updated'];
  for (const field of datetimeFields) {
    if (userDict[field] && userDict[field] instanceof Date) {
      userDict[field] = userDict[field].toISOString();
    }
  }
  
  // Recursively convert datetime objects
  function convertDatetime(obj) {
    if (obj instanceof Date) {
      return obj.toISOString();
    } else if (Array.isArray(obj)) {
      return obj.map(convertDatetime);
    } else if (obj && typeof obj === 'object') {
      const converted = {};
      for (const [key, value] of Object.entries(obj)) {
        converted[key] = convertDatetime(value);
      }
      return converted;
    }
    return obj;
  }
  
  return convertDatetime(userDict);
}

/**
 * Serialize data (convert dates, handle nested objects)
 * @param {any} data - Data to serialize
 * @returns {any} Serialized data
 */
function serializeData(data) {
  function convertDatetime(obj) {
    if (obj instanceof Date) {
      return obj.toISOString();
    } else if (Array.isArray(obj)) {
      return obj.map(convertDatetime);
    } else if (obj && typeof obj === 'object' && obj.constructor === Object) {
      const converted = {};
      for (const [key, value] of Object.entries(obj)) {
        converted[key] = convertDatetime(value);
      }
      return converted;
    }
    return obj;
  }
  
  return convertDatetime(data);
}

/**
 * Get request user by identifier
 * @param {string} userId - User identifier (email or phone)
 * @param {string} channel - Channel (email, sms, whatsapp)
 * @returns {Promise<object>} User object
 * @throws {Error} If user not found
 */
async function getRequestUser(userId, channel) {
  try {
    const user = await getUserByEmailOrPhone(userId);
    if (user) {
      return user;
    } else {
      throw new Error('PROFILE_NOT_FOUND');
    }
  } catch (error) {
    if (error.message === 'PROFILE_NOT_FOUND') {
      throw error;
    }
    logger.error('Error getting user', { error: error.message, module: 'Auth', label: 'GET_USER' });
    throw new Error('PROFILE_PROCESSING_ERROR');
  }
}

module.exports = {
  validatePhone,
  validateEmail,
  serializeUserData,
  serializeData,
  getRequestUser
};

