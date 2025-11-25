/**
 * Professional Google Cloud Storage Implementation
 * Handles all media file uploads with proper organization
 */

const { Storage } = require('@google-cloud/storage');
const path = require('path');
const logger = require('../logger/logger');
const axios = require('axios');

// Global GCS client cache
let _gcsClientCache = {};
let _gcsClientLock = false;

class ProfessionalMediaStorage {
  constructor(bucketName = null, credentialsPath = null) {
    this.bucketName = bucketName || process.env.GOOGLE_STORAGE_BUCKET_NAME;  
    this.mediaPrefix = 'media';
    
    // Set credentials path - use provided path or default to google-backend-master.json
    const BASE_DIR = path.dirname(__dirname);
    this.credentialsPath = credentialsPath || path.join(BASE_DIR, './../credentials/google-backend-master.json');
    
    this._client = null;
    this._bucket = null;
    
    this._initializeGCSClient();
  }

  _initializeGCSClient() {
    /**
     * Initialize Google Cloud Storage client with singleton pattern
     */
    const cacheKey = `${this.bucketName}:${this.credentialsPath || 'default'}`;
    
    // Check if client is already cached
    if (_gcsClientCache[cacheKey]) {
      const [cachedClient, cachedBucket] = _gcsClientCache[cacheKey];
      this._client = cachedClient;
      this._bucket = cachedBucket;
      return;
    }
    
    // Initialize new client
    try {
      const fs = require('fs');
      
      // Use credentials file if it exists
      if (this.credentialsPath && fs.existsSync(this.credentialsPath)) {
        this._client = new Storage({
          keyFilename: this.credentialsPath
        });
        logger.info('Google Cloud Storage initialized with credentials file', { 
          module: 'GCS', 
          label: 'AUTH',
          credentialsPath: this.credentialsPath 
        });
      } else {
        // Fallback to default authentication (for environments with default credentials)
        logger.warn('Credentials file not found, trying default authentication...', { 
          module: 'GCS', 
          label: 'AUTH',
          credentialsPath: this.credentialsPath 
        });
        this._client = new Storage();
      }
      
      this._bucket = this._client.bucket(this.bucketName);
      
      // Cache the client and bucket
      _gcsClientCache[cacheKey] = [this._client, this._bucket];
    } catch (error) {
      logger.error(`Failed to initialize Google Cloud Storage: ${error.message}`, { module: 'GCS', label: 'ERROR' });
      this._client = null;
      this._bucket = null;
    }
  }

  /**
   * Upload file data to Google Cloud Storage
   * @param {Buffer|string} fileData - File data
   * @param {string} folder - Folder path in bucket
   * @param {string} objectKey - Object key (filename)
   * @param {string} contentType - Content type
   * @returns {string} Public URL
   */
  uploadToGoogleStorage(fileData, folder, objectKey, contentType = 'image/png') {
    if (!this._bucket) {
      throw new Error('Google Cloud Storage not initialized');
    }
    
    const blob = this._bucket.file(`${folder}/${objectKey}`);
    
    // Convert string to buffer if needed
    if (typeof fileData === 'string') {
      fileData = Buffer.from(fileData, 'utf-8');
    }
    
    return new Promise((resolve, reject) => {
      const stream = blob.createWriteStream({
        metadata: {
          contentType: contentType
        },
        public: true
      });
      
      stream.on('error', (error) => {
        logger.error('Error uploading to GCS', { error: error.message, module: 'Storage' });
        reject(error);
      });
      
      stream.on('finish', async () => {
        try {
          // Make the blob publicly accessible
          await blob.makePublic();
          const publicUrl = `https://storage.googleapis.com/${this.bucketName}/${folder}/${objectKey}`;
          resolve(publicUrl);
        } catch (error) {
          logger.error('Error making blob public', { error: error.message, module: 'Storage' });
          // Still return URL even if makePublic fails
          const publicUrl = `https://storage.googleapis.com/${this.bucketName}/${folder}/${objectKey}`;
          resolve(publicUrl);
        }
      });
      
      stream.end(fileData);
    });
  }

  /**
   * Upload file from local path to Google Cloud Storage
   * @param {string} filePath - Local file path
   * @param {string} folder - Folder path in bucket
   * @param {string} objectKey - Object key (filename)
   * @param {string} contentType - Content type
   * @returns {Promise<string>} Public URL
   */
  async uploadPathToGoogleStorage(filePath, folder, objectKey, contentType = 'image/png') {
    if (!this._bucket) {
      throw new Error('Google Cloud Storage not initialized');
    }
    
    const blob = this._bucket.file(`${folder}/${objectKey}`);
    const fs = require('fs');
    
    await blob.save(fs.readFileSync(filePath), {
      metadata: {
        contentType: contentType
      },
      public: true
    });
    
    await blob.makePublic();
    
    // Delete local file after upload
    fs.unlinkSync(filePath);
    
    return `https://storage.googleapis.com/${this.bucketName}/${folder}/${objectKey}`;
  }

  /**
   * Upload file data from string/bytes to Google Cloud Storage
   * @param {Buffer|string} fileData - File data
   * @param {string} folder - Folder path in bucket
   * @param {string} objectKey - Object key (filename)
   * @param {string} contentType - Content type
   * @returns {Promise<string>} Public URL
   */
  async uploadToGoogleStorageFromString(fileData, folder, objectKey, contentType = 'image/png') {
    return this.uploadToGoogleStorage(fileData, folder, objectKey, contentType);
  }

  /**
   * Delete file from Google Cloud Storage
   * @param {string} folder - Folder path
   * @param {string} objectKey - Object key
   * @returns {Promise<boolean>} Success status
   */
  async deleteFromGoogleStorage(folder, objectKey) {
    if (!this._bucket) {
      throw new Error('Google Cloud Storage not initialized');
    }
    
    try {
      const blob = this._bucket.file(`${folder}/${objectKey}`);
      await blob.delete();
      return true;
    } catch (error) {
      logger.error('Error deleting from GCS', { error: error.message, module: 'Storage' });
      return false;
    }
  }

  /**
   * Download image from URL and upload to GCS
   * @param {string} fileUrl - Image URL
   * @param {string} folder - Folder path
   * @param {string} userId - User ID
   * @returns {Promise<string>} Public URL
   */
  async uploadImageFromUrlToGcs(fileUrl, folder, userId) {
    try {
      const response = await axios.get(fileUrl, { responseType: 'arraybuffer' });
      const fileData = Buffer.from(response.data);
      
      const extension = fileUrl.split('?')[0].split('.').pop() || 'png';
      const objectKey = `${userId}-${Date.now()}.${extension}`;
      
      return await this.uploadToGoogleStorage(fileData, folder, objectKey, response.headers['content-type'] || 'image/png');
    } catch (error) {
      logger.error('Error uploading image from URL', { error: error.message, module: 'Storage' });
      throw error;
    }
  }

  /**
   * Download video from URL and upload to GCS
   * @param {string} videoUrl - Video URL
   * @param {string} folder - Folder path
   * @param {string} userId - User ID
   * @returns {Promise<string>} Public URL
   */
  async uploadVideoFromUrlToGcs(videoUrl, folder, userId) {
    try {
      const response = await axios.get(videoUrl, { responseType: 'arraybuffer' });
      const fileData = Buffer.from(response.data);
      
      const extension = videoUrl.split('?')[0].split('.').pop() || 'mp4';
      const objectKey = `${userId}-${Date.now()}.${extension}`;
      
      return await this.uploadToGoogleStorage(fileData, folder, objectKey, response.headers['content-type'] || 'video/mp4');
    } catch (error) {
      logger.error('Error uploading video from URL', { error: error.message, module: 'Storage' });
      throw error;
    }
  }

  /**
   * Download audio from URL and upload to GCS
   * @param {string} audioUrl - Audio URL
   * @param {string} folder - Folder path
   * @param {string} userId - User ID
   * @returns {Promise<string>} Public URL
   */
  async uploadAudioFromUrlToGcs(audioUrl, folder, userId) {
    try {
      const response = await axios.get(audioUrl, { responseType: 'arraybuffer' });
      const fileData = Buffer.from(response.data);
      
      const extension = audioUrl.split('?')[0].split('.').pop() || 'mp3';
      const objectKey = `${userId}-${Date.now()}.${extension}`;
      
      return await this.uploadToGoogleStorage(fileData, folder, objectKey, response.headers['content-type'] || 'audio/mpeg');
    } catch (error) {
      logger.error('Error uploading audio from URL', { error: error.message, module: 'Storage' });
      throw error;
    }
  }

  /**
   * Upload audio bytes to GCS
   * @param {Buffer} audioData - Audio data
   * @param {string} folder - Folder path
   * @param {string} userId - User ID
   * @param {string} extension - File extension
   * @param {string} contentType - Content type
   * @returns {Promise<string>} Public URL
   */
  async uploadAudioBytesToGcs(audioData, folder, userId, extension = 'mp3', contentType = null) {
    const objectKey = `${userId}-${Date.now()}.${extension}`;
    const finalContentType = contentType || `audio/${extension}`;
    
    return await this.uploadToGoogleStorage(audioData, folder, objectKey, finalContentType);
  }
}

// Create singleton instance
const mediaStorage = new ProfessionalMediaStorage();

// Wrapper functions for backward compatibility
function uploadToGoogleStorage(fileData, folder, objectKey, contentType = 'image/png') {
  return mediaStorage.uploadToGoogleStorage(fileData, folder, objectKey, contentType);
}

function uploadPathToGoogleStorage(filePath, folder, objectKey, contentType = 'image/png') {
  return mediaStorage.uploadPathToGoogleStorage(filePath, folder, objectKey, contentType);
}

function uploadToGoogleStorageFromString(fileData, folder, objectKey, contentType = 'image/png') {
  return mediaStorage.uploadToGoogleStorageFromString(fileData, folder, objectKey, contentType);
}

function deleteFromGoogleStorage(folder, objectKey) {
  return mediaStorage.deleteFromGoogleStorage(folder, objectKey);
}

function uploadImageFromUrlToGcs(fileUrl, folder, userId) {
  return mediaStorage.uploadImageFromUrlToGcs(fileUrl, folder, userId);
}

function uploadVideoFromUrlToGcs(videoUrl, folder, userId) {
  return mediaStorage.uploadVideoFromUrlToGcs(videoUrl, folder, userId);
}

function uploadAudioFromUrlToGcs(audioUrl, folder, userId) {
  return mediaStorage.uploadAudioFromUrlToGcs(audioUrl, folder, userId);
}

function uploadAudioBytesToGcs(audioData, folder, userId, extension = 'mp3', contentType = null) {
  return mediaStorage.uploadAudioBytesToGcs(audioData, folder, userId, extension, contentType);
}

module.exports = {
  ProfessionalMediaStorage,
  mediaStorage,
  uploadToGoogleStorage,
  uploadPathToGoogleStorage,
  uploadToGoogleStorageFromString,
  deleteFromGoogleStorage,
  uploadImageFromUrlToGcs,
  uploadVideoFromUrlToGcs,
  uploadAudioFromUrlToGcs,
  uploadAudioBytesToGcs
};

