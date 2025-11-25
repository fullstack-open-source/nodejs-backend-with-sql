/**
 * Success Response Handler
 * Provides standardized success response format matching FastAPI structure
 */

const { v4: uuidv4 } = require('uuid');

class SuccessResponse {
  /**
   * Create a success response
   * @param {string} message - Success message
   * @param {object} data - Response data
   * @param {object} meta - Metadata (optional)
   * @param {string} language - Language code (optional)
   * @returns {object} Formatted success response
   */
  static response(message, data = {}, meta = {}, language = null) {
    const responseId = uuidv4();
    const timestamp = new Date().toISOString();
    
    const response = {
      success: true,
      id: responseId,
      message: message,
      data: data,
      timestamp: timestamp
    };

    if (Object.keys(meta).length > 0) {
      response.meta = meta;
    }

    if (language) {
      response.language = language;
    }

    return response;
  }

  /**
   * Create a success response with pagination
   * @param {string} message - Success message
   * @param {array} items - Array of items
   * @param {object} pagination - Pagination info
   * @param {object} meta - Metadata (optional)
   * @returns {object} Formatted success response with pagination
   */
  static paginated(message, items = [], pagination = {}, meta = {}) {
    const responseId = uuidv4();
    const timestamp = new Date().toISOString();
    
    return {
      success: true,
      id: responseId,
      message: message,
      data: {
        items: items,
        pagination: pagination
      },
      ...(Object.keys(meta).length > 0 && { meta }),
      timestamp: timestamp
    };
  }
}

module.exports = { SUCCESS: SuccessResponse };

