/**
 * OTP Cache Management
 * Handles OTP generation, storage, and verification
 */

const cache = require('../cache/cache');
const { randomInt } = require('crypto');
const logger = require('../logger/logger');

const MASTER_OTP = process.env.MASTER_OTP || process.env.MASTER_ADMIN_OTP || '1408199';

/**
 * Check if the provided OTP is the master OTP
 * @param {string} otp - OTP to check
 * @returns {boolean} True if OTP matches MASTER_OTP, False otherwise
 */
function isMasterOtp(otp) {
  return otp === MASTER_OTP;
}

/**
 * Generate numeric OTP of given length (default: 6)
 * @param {number} length - OTP length
 * @returns {string} Generated OTP
 */
function generateOtp(length = 6) {
  const digits = '0123456789';
  let otp = '';
  for (let i = 0; i < length; i++) {
    otp += digits[randomInt(0, digits.length)];
  }
  return otp;
}

/**
 * Generate OTP, store in cache, and return it
 * @param {string} userId - User ID (email or phone)
 * @param {number} ttl - Time to live in seconds (default: 600 = 10 minutes)
 * @returns {Promise<string>} Generated OTP
 */
async function setOtp(userId, ttl = 600) {
  // Normalize userId: trim whitespace and lowercase emails
  const normalizedUserId = normalizeUserId(userId);
  const otp = generateOtp();
  const cacheKey = `otp:${normalizedUserId}`;
  const success = await cache.set(cacheKey, otp, ttl);
  if (!success) {
    logger.error('Failed to store OTP in cache', { userId: normalizedUserId, cacheKey });
  } else {
    logger.info('OTP stored in cache', { userId: normalizedUserId, cacheKey, otpLength: otp.length });
  }
  return otp;
}

/**
 * Normalize user ID for consistent cache key generation
 * @param {string} userId - User ID (email or phone)
 * @returns {string} Normalized user ID
 */
function normalizeUserId(userId) {
  if (!userId) return userId;
  // Trim whitespace
  let normalized = userId.trim();
  // Lowercase emails (emails are case-insensitive)
  if (normalized.includes('@')) {
    normalized = normalized.toLowerCase();
  }
  return normalized;
}

/**
 * Verify OTP for given user_id
 * @param {string} userId - User ID (email or phone)
 * @param {string} otp - OTP to verify
 * @param {boolean} deleteAfterVerify - Delete OTP after verification (default: true)
 * @returns {Promise<boolean>} True if valid, False otherwise
 */
async function verifyOtp(userId, otp, deleteAfterVerify = true) {
  // Normalize userId for consistent cache key lookup
  const normalizedUserId = normalizeUserId(userId);
  const cacheKey = `otp:${normalizedUserId}`;
  
  // Ensure OTP is a string for comparison
  const otpString = String(otp).trim();
  
  // 1. Master OTP check
  if (isMasterOtp(otpString)) {
    logger.info('Master OTP verified', { userId: normalizedUserId });
    return true;
  }
  
  // 2. Get stored OTP from cache
  const storedOtp = await cache.get(cacheKey);
  
  // Log for debugging
  if (!storedOtp) {
    logger.warn('OTP not found in cache', { 
      userId: normalizedUserId, 
      cacheKey,
      providedOtp: otpString 
    });
    return false;
  }
  
  // Ensure stored OTP is a string for comparison
  const storedOtpString = String(storedOtp).trim();
  
  // 3. Normal OTP check (compare as strings)
  if (storedOtpString === otpString) {
    logger.info('OTP verified successfully', { userId: normalizedUserId });
    if (deleteAfterVerify) {
      await cache.del(cacheKey);
    }
    return true;
  }
  
  logger.warn('OTP mismatch', { 
    userId: normalizedUserId, 
    cacheKey,
    providedOtp: otpString,
    storedOtp: storedOtpString,
    storedOtpType: typeof storedOtp,
    providedOtpType: typeof otp
  });
  
  return false;
}

/**
 * Verify OTP without deleting (for multi-step verification)
 * @param {string} userId - User ID
 * @param {string} otp - OTP to verify
 * @param {boolean} deleteAfterVerify - Delete after verification (default: true)
 * @returns {Promise<boolean>} True if valid
 */
async function verifyOtpKeep(userId, otp, deleteAfterVerify = true) {
  // Normalize userId for consistent cache key lookup
  const normalizedUserId = normalizeUserId(userId);
  const stored = await cache.get(`otp:${normalizedUserId}`);
  if (!stored || stored !== otp) {
    return false;
  }
  
  if (deleteAfterVerify) {
    await cache.del(`otp:${normalizedUserId}`);
  }
  
  return true;
}

/**
 * Delete OTP from cache
 * @param {string} userId - User ID
 * @param {string} otp - OTP (optional, for logging)
 * @returns {Promise<boolean>} True if deleted
 */
async function deleteOtp(userId, otp = null) {
  // Normalize userId for consistent cache key lookup
  const normalizedUserId = normalizeUserId(userId);
  await cache.del(`otp:${normalizedUserId}`);
  return true;
}

module.exports = {
  generateOtp,
  setOtp,
  verifyOtp,
  verifyOtpKeep,
  deleteOtp,
  isMasterOtp
};

