/**
 * Success Response Handler
 * Provides standardized success response format matching FastAPI structure
 */

const { v4: uuidv4 } = require('uuid');
const { translateMessage, translateJsonData, getLanguage } = require('../multilingual');

class SuccessResponse {
  /**
   * Create a success response
   * @param {string} message - Success message
   * @param {object} data - Response data
   * @param {object} meta - Metadata (optional)
   * @param {string} language - Language code (optional)
   * @param {boolean} translateData - If true, translate JSON data structures (default: false)
   * @returns {object} Formatted success response
   */
  static response(message, data = {}, meta = {}, language = null, translateData = false) {
    const responseId = uuidv4();
    const timestamp = new Date().toISOString();
    
    // Get language - simple and fast
    const lang = getLanguage(language);
    
    // Translate message
    const translatedMessage = translateMessage(message, lang);
    
    // Optionally translate JSON data
    let processedData = data;
    if (translateData && data && Object.keys(data).length > 0) {
      processedData = translateJsonData(data, lang);
    }
    
    const response = {
      success: true,
      id: responseId,
      message: translatedMessage,
      data: processedData,
      timestamp: timestamp
    };

    if (Object.keys(meta).length > 0) {
      response.meta = meta;
    }

    return response;
  }

  /**
   * Create a success response with pagination
   * @param {string} message - Success message
   * @param {array} items - Array of items
   * @param {object} pagination - Pagination info
   * @param {object} meta - Metadata (optional)
   * @param {string} language - Language code (optional)
   * @param {boolean} translateData - If true, translate JSON data structures (default: false)
   * @returns {object} Formatted success response with pagination
   */
  static paginated(message, items = [], pagination = {}, meta = {}, language = null, translateData = false) {
    const responseId = uuidv4();
    const timestamp = new Date().toISOString();
    
    // Get language - simple and fast
    const lang = getLanguage(language);
    
    // Translate message
    const translatedMessage = translateMessage(message, lang);
    
    // Optionally translate JSON data
    let processedItems = items;
    if (translateData && items && items.length > 0) {
      processedItems = translateJsonData(items, lang);
    }
    
    return {
      success: true,
      id: responseId,
      message: translatedMessage,
      data: {
        items: processedItems,
        pagination: pagination
      },
      ...(Object.keys(meta).length > 0 && { meta }),
      timestamp: timestamp
    };
  }
}

module.exports = { SUCCESS: SuccessResponse };

