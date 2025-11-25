/**
 * Request/Response Models for Authentication
 * Matches FastAPI router/authenticate/models.py structure
 */

const Joi = require('joi');

// Validation schemas
const phonePattern = /^\+?[1-9]\d{1,14}$/;
const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

/**
 * OTP Request Schema
 */
const otpRequestSchema = Joi.object({
  user_id: Joi.string().required(),
  channel: Joi.string().valid('email', 'sms', 'whatsapp').required()
});

/**
 * OTP Verify Request Schema
 */
const otpVerifyRequestSchema = Joi.object({
  user_id: Joi.string().required(),
  channel: Joi.string().valid('email', 'sms', 'whatsapp').required(),
  otp: Joi.string().required()
});

/**
 * Login with OTP Request Schema
 */
const loginWithOtpRequestSchema = Joi.object({
  user_id: Joi.string().required(),
  channel: Joi.string().valid('email', 'sms', 'whatsapp').required(),
  otp: Joi.string().required()
});

/**
 * Set Password Schema
 */
const setPasswordSchema = Joi.object({
  password: Joi.string().min(8).required()
    .pattern(/[A-Z]/).message('Password must contain at least one uppercase letter')
    .pattern(/[a-z]/).message('Password must contain at least one lowercase letter')
    .pattern(/\d/).message('Password must contain at least one digit')
    .pattern(/[!@#$%^&*(),.?":{}|<>]/).message('Password must contain at least one special character'),
  confirm_password: Joi.string().valid(Joi.ref('password')).required()
    .messages({ 'any.only': 'Passwords do not match' })
});

/**
 * Password Change Schema
 */
const passwordChangeSchema = setPasswordSchema.keys({
  user_id: Joi.string().required(),
  channel: Joi.string().valid('email', 'sms', 'whatsapp').required(),
  old_password: Joi.string().required()
});

/**
 * Forget Password Schema
 */
const forgetPasswordSchema = setPasswordSchema.keys({
  user_id: Joi.string().required(),
  otp: Joi.string().allow('').optional(),
  channel: Joi.string().allow('').optional()
});

/**
 * Check User Availability Request Schema
 */
const checkUserAvailabilityRequestSchema = Joi.object({
  user_id: Joi.string().allow(null).optional(),
  phone: Joi.string().allow(null).optional(),
  email: Joi.string().allow(null).optional()
}).or('user_id', 'phone', 'email');

/**
 * Change Email Request Schema
 */
const changeEmailRequestSchema = Joi.object({
  new_email: Joi.string().email().allow(null).optional(),
  otp: Joi.string().allow(null).optional()
});

/**
 * Change Phone Request Schema
 */
const changePhoneRequestSchema = Joi.object({
  new_phone: Joi.string().pattern(phonePattern).allow(null).optional(),
  otp: Joi.string().allow(null).optional()
});

/**
 * User Profile Accessibility Schema
 */
const userProfileAccessibilitySchema = Joi.object({
  profile_accessibility: Joi.string().valid('public', 'private', 'friends').default('public')
});

/**
 * User Profile Language Schema
 */
const userProfileLanguageSchema = Joi.object({
  language: Joi.string().valid('en', 'ar').default('en')
});

/**
 * Validate request data against schema
 * @param {object} data - Data to validate
 * @param {object} schema - Joi schema
 * @returns {object} { error: null|string, value: object }
 */
function validate(data, schema) {
  const { error, value } = schema.validate(data, { abortEarly: false });
  if (error) {
    return {
      error: error.details.map(d => d.message).join(', '),
      value: null
    };
  }
  return { error: null, value };
}

module.exports = {
  otpRequestSchema,
  otpVerifyRequestSchema,
  loginWithOtpRequestSchema,
  setPasswordSchema,
  passwordChangeSchema,
  forgetPasswordSchema,
  checkUserAvailabilityRequestSchema,
  changeEmailRequestSchema,
  changePhoneRequestSchema,
  userProfileAccessibilitySchema,
  userProfileLanguageSchema,
  validate
};

