/**
 * Email Service
 * Handles email sending via SMTP
 * Matches FastAPI email.py structure
 */

const nodemailer = require('nodemailer');
const { ONETIME_VERIFICATION_TEMPLATE } = require('./template');
const logger = require('../logger/logger');

// Email Configuration
const EMAIL_HOST = process.env.EMAIL_HOST;
const EMAIL_HOST_USER = process.env.EMAIL_HOST_USER;
const EMAIL_HOST_PASSWORD = process.env.EMAIL_HOST_PASSWORD;
const EMAIL_PORT = parseInt(process.env.EMAIL_PORT || '587', 10);
const EMAIL_USE_TLS = true;

// Create transporter
let transporter = null;

if (EMAIL_HOST && EMAIL_HOST_USER && EMAIL_HOST_PASSWORD) {
  transporter = nodemailer.createTransport({
    host: EMAIL_HOST,
    port: EMAIL_PORT,
    secure: false, // true for 465, false for other ports
    auth: {
      user: EMAIL_HOST_USER,
      pass: EMAIL_HOST_PASSWORD
    },
    tls: {
      rejectUnauthorized: false
    }
  });
}

/**
 * Send OTP email
 * @param {string} toEmail - Recipient email address
 * @param {string} otp - OTP code
 * @returns {Promise<boolean>} Success status
 */
async function sendOtpEmail(toEmail, otp) {
  if (!transporter) {
    logger.error('Email transporter not configured', { module: 'Email' });
    return false;
  }

  try {
    const subject = 'One-Time Verification Code';
    
    // Format HTML with OTP
    const htmlBody = ONETIME_VERIFICATION_TEMPLATE.replace('{code}', otp);
    
    // Plain text version
    const plainText = `Your one-time password (OTP) is: ${otp}\n\nIt will expire in 10 minutes.`;

    const mailOptions = {
      from: EMAIL_HOST_USER,
      to: toEmail,
      subject: subject,
      text: plainText,
      html: htmlBody
    };

    await transporter.sendMail(mailOptions);
    logger.info(`OTP sent successfully to ${toEmail}`, { module: 'Email' });
    return true;
  } catch (error) {
    logger.error(`Error sending OTP email to ${toEmail}`, { error: error.message, module: 'Email' });
    return false;
  }
}

/**
 * Send OTP email asynchronously (non-blocking)
 * @param {string} toEmail - Recipient email address
 * @param {string} otp - OTP code
 */
function sendOtpAsync(toEmail, otp) {
  // Send in background (fire and forget)
  sendOtpEmail(toEmail, otp).catch(error => {
    logger.error(`Async OTP email failed for ${toEmail}`, { error: error.message, module: 'Email' });
  });
}

module.exports = {
  sendOtpEmail,
  sendOtpAsync
};

