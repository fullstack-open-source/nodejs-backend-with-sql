/**
 * SMS Service
 * Handles SMS and WhatsApp messaging via Twilio and KWT SMS API
 * Matches FastAPI sms.py structure
 */

const axios = require('axios');
const twilio = require('twilio');
const logger = require('../logger/logger');

// WhatsApp Configuration
const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const TWILIO_WHATSAPP_NUMBER = process.env.TWILIO_WHATSAPP_NUMBER;
const TWILIO_MESSAGING_SERVICE_ID = process.env.TWILIO_MESSAGING_SERVICE_ID;
const TWILIO_CONTENT_ID = process.env.TWILIO_CONTENT_ID;
// SMS Configuration
const SMS_API_ENDPOINT = process.env.SMS_API_ENDPOINT;
const SMS_SENDER_USERNAME = process.env.SMS_SENDER_USERNAME;      
const SMS_SENDER_PASSWORD = process.env.SMS_SENDER_PASSWORD;
const SMS_SENDER = process.env.SMS_SENDER;
const SMS_SENDER_MODE = process.env.SMS_SENDER_MODE || '1';

/**
 * Send SMS using KWT SMS API
 * @param {string} toNumber - Recipient phone number
 * @param {string} message - Message content
 * @returns {Promise<object>} Response object with success status
 */
async function sendSMS(toNumber, message) {
  try {
    const params = new URLSearchParams({
      username: SMS_SENDER_USERNAME,
      password: SMS_SENDER_PASSWORD,
      sender: SMS_SENDER,
      mobile: toNumber.replace('+', ''),
      lang: '1',
      test: SMS_SENDER_MODE,
      message: message
    });

    const response = await axios.post(SMS_API_ENDPOINT, params.toString(), {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });

    if (response.data) {
      return { success: true, data: response.data };
    } else {
      logger.error('Failed to send SMS: Empty response from SMS API', { module: 'SMS' });
      return { success: false, message: 'Failed to send message' };
    }
  } catch (error) {
    logger.error(`Error sending SMS to ${toNumber}`, { error: error.message, module: 'SMS' });
    return { success: false, error: error.message };
  }
}

/**
 * Send WhatsApp message via Twilio
 * @param {string} toNumber - Recipient phone number
 * @param {string} otp - OTP code to send
 * @returns {Promise<object>} Response object with success status and message SID
 */
async function sendWhatsApp(toNumber, otp) {
  try {
    const client = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);
    
    const message = await client.messages.create({
      from: `whatsapp:${TWILIO_WHATSAPP_NUMBER}`,
      to: `whatsapp:${toNumber}`,
      body: `Your OTP is: ${otp}`
    });

    return { success: true, sid: message.sid };
  } catch (error) {
    logger.error(`Error sending WhatsApp to ${toNumber}`, { error: error.message, module: 'SMS' });
    return { success: false, error: error.message };
  }
}

module.exports = {
  sendSMS,
  sendWhatsApp
};

