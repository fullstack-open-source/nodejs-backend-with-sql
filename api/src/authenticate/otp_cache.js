/**
 * OTP Cache Management
 * Handles OTP generation, storage, and verification
 */

const cache = require('../cache/cache');
const { randomInt } = require('crypto');

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
  const otp = generateOtp();
  await cache.set(`otp:${userId}`, otp, ttl);
  return otp;
}

/**
 * Verify OTP for given user_id
 * @param {string} userId - User ID (email or phone)
 * @param {string} otp - OTP to verify
 * @param {boolean} deleteAfterVerify - Delete OTP after verification (default: true)
 * @returns {Promise<boolean>} True if valid, False otherwise
 */
async function verifyOtp(userId, otp, deleteAfterVerify = true) {
  const storedOtp = await cache.get(`otp:${userId}`);
  
  // 1. Master OTP check
  if (isMasterOtp(otp)) {
    return true;
  }
  
  // 2. Normal OTP check
  if (storedOtp && storedOtp === otp) {
    if (deleteAfterVerify) {
      await cache.del(`otp:${userId}`);
    }
    return true;
  }
  
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
  const stored = await cache.get(`otp:${userId}`);
  if (!stored || stored !== otp) {
    return false;
  }
  
  if (deleteAfterVerify) {
    await cache.delete(`otp:${userId}`);
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
  await cache.del(`otp:${userId}`);
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

