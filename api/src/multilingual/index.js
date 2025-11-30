/**
 * Multilingual support module for API responses.
 * Provides translation functionality for error messages and success messages.
 */

const {
    getLanguage,
    translateMessage,
    translateError,
    translateJsonData,
    normalizeLanguage,
  } = require('./multilingual');
  
  module.exports = {
    getLanguage,
    translateMessage,
    translateError,
    translateJsonData,
    normalizeLanguage,
  };
  