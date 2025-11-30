/**
 * Error Response Handler
 * Provides standardized error response format matching FastAPI structure
 * Uses error map for consistent error codes and messages
 */

const { v4: uuidv4 } = require('uuid');
const { ERRORS, getError } = require('./map');
const { isDebugMode, getDebugInfo } = require('../utils/debug');
const { translateError, getLanguage } = require('../multilingual');

class ErrorResponse {
  /**
   * Build error response object using error map
   * Matches FastAPI error format: { detail: { success: false, error: {...} } }
   * @param {string} errorKey - Error key from ERRORS map
   * @param {object} details - Additional error details (optional)
   * @param {string} exception - Exception message (optional)
   * @param {string} language - Language code (optional)
   * @returns {object} Formatted error response
   */
  static build(errorKey, details = {}, exception = null, language = null) {
    const errorDef = getError(errorKey);
    const errorId = uuidv4();
    const timestamp = new Date().toISOString();
    
    // Get language - simple and fast
    const lang = getLanguage(language);
    
    // Get error message
    const errorMessage = errorDef ? errorDef.message : `Unknown error: ${errorKey}`;
    
    // Translate error message
    const translatedMessage = translateError(errorMessage, lang);
    
    // Build error object
    const errorObj = {
      id: errorId,
      code: errorDef ? errorDef.code : null,
      message: translatedMessage,
      ...(errorDef && errorDef.reason ? { reason: errorDef.reason } : {}),
      ...(errorDef && errorDef.hint ? { hint: errorDef.hint } : {}),
      ...(Object.keys(details).length > 0 ? { details } : {}),
      timestamp: timestamp
    };

    // Add exception info if provided and DEBUG_MODE is enabled
    if (exception && isDebugMode()) {
      errorObj.debug = getDebugInfo(exception);
    }

    // Return in FastAPI format
    return {
      detail: {
        success: false,
        error: errorObj
      }
    };
  }

  /**
   * Create error response (backward compatible)
   * @param {string} message - Error message
   * @param {object} data - Error data
   * @param {string} exception - Exception message (optional)
   * @param {string} language - Language code (optional)
   * @returns {object} Formatted error response
   */
  static response(message, data = {}, exception = null, language = null) {
    const errorId = uuidv4();
    const timestamp = new Date().toISOString();
    
    // Get language - simple and fast
    const lang = getLanguage(language);
    
    // Translate error message
    const translatedMessage = translateError(message, lang);
    
    const errorObj = {
      id: errorId,
      code: null,
      message: translatedMessage,
      ...(Object.keys(data).length > 0 ? { details: data } : {}),
      timestamp: timestamp
    };

    if (exception && isDebugMode()) {
      errorObj.debug = getDebugInfo(exception);
    }

    return {
      detail: {
        success: false,
        error: errorObj
      }
    };
  }

  /**
   * Create error response from error key with HTTP status
   * @param {string} errorKey - Error key from ERRORS map
   * @param {object} details - Additional error details (optional)
   * @param {string} exception - Exception message (optional)
   * @returns {object} Formatted error response with HTTP status
   */
  static fromMap(errorKey, details = {}, exception = null, language = null) {
    const errorDef = getError(errorKey);
    const errorId = uuidv4();
    const timestamp = new Date().toISOString();
    
    // Get language - simple and fast
    const lang = getLanguage(language);
    
    if (!errorDef) {
      const errorMessage = `Unknown error: ${errorKey}`;
      const translatedMessage = translateError(errorMessage, lang);
      
      const errorObj = {
        id: errorId,
        code: null,
        message: translatedMessage,
        ...(Object.keys(details).length > 0 ? { details } : {}),
        timestamp: timestamp
      };

      if (exception && isDebugMode()) {
        errorObj.debug = getDebugInfo(exception);
      }

      return {
        detail: {
          success: false,
          error: errorObj
        },
        statusCode: 500
      };
    }

    // Get error message and translate it
    const errorMessage = errorDef.message;
    const translatedMessage = translateError(errorMessage, lang);

    // Build error object with all available fields
    const errorObj = {
      id: errorId,
      code: errorDef.code,
      message: translatedMessage,
      ...(errorDef.reason ? { reason: errorDef.reason } : {}),
      ...(errorDef.hint ? { hint: errorDef.hint } : {}),
      ...(Object.keys(details).length > 0 ? { details } : {}),
      timestamp: timestamp
    };

    if (exception && isDebugMode()) {
      errorObj.debug = getDebugInfo(exception);
    }

    return {
      detail: {
        success: false,
        error: errorObj
      },
      statusCode: errorDef.http_status || 500
    };
  }
}

module.exports = { ERROR: ErrorResponse, ERRORS };

