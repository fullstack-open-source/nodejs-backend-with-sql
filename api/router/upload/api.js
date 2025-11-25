const express = require('express');
const router = express.Router();
const multer = require('multer');
const { SUCCESS } = require('../../src/response/success');
const { ERROR } = require('../../src/response/error');
const logger = require('../../src/logger/logger');
const { validateRequest } = require('../../src/authenticate/authenticate');
const { checkPermission } = require('../../src/middleware/permissionMiddleware');
const { v4: uuidv4 } = require('uuid');
const axios = require('axios');
const { uploadToGoogleStorageFromString } = require('../../src/storage/storage');

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 15 * 1024 * 1024 // 15MB limit
  }
});

/**
 * @swagger
 * /api/upload-media:
 *   post:
 *     summary: Upload media file
 *     description: Upload a media file either from URL or direct file upload to Google Cloud Storage
 *     tags: [Upload Media]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *               url:
 *                 type: string
 *                 format: uri
 *                 description: URL to download file from
 *     responses:
 *       200:
 *         description: File uploaded successfully
 *       400:
 *         description: No file or URL provided
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Upload processing error
 */
router.post('/upload-media', validateRequest, checkPermission('add_upload'), upload.single('file'), async (req, res, next) => {
  try {
    const { url } = req.body;
    const file = req.file;
    const userId = req.user.uid || req.user.user_id;

    if (!url && !file) {
      const errorResponse = ERROR.fromMap('MEDIA_FILE_OR_URL', { user_id: userId });
      return res.status(errorResponse.statusCode).json(errorResponse.detail);
    }

    let fileData;
    let extension;
    let contentType;

    if (url) {
      // Download file from URL
      try {
        const response = await axios.get(url, {
          responseType: 'arraybuffer',
          maxContentLength: 15 * 1024 * 1024 // 15MB limit
        });
        fileData = Buffer.from(response.data);
        
        // Try to get extension from URL or response headers
        const urlParts = url.split('?')[0].split('.');
        extension = urlParts[urlParts.length - 1]?.toLowerCase();
        if (!extension || extension.includes('/')) {
          const contentTypeHeader = response.headers['content-type'];
          extension = contentTypeHeader?.split('/')[1] || 'bin';
        }
        contentType = response.headers['content-type'] || 'application/octet-stream';
      } catch (error) {
        logger.error('Error downloading file from URL', { error: error.message, url });
        const errorResponse = ERROR.fromMap('MEDIA_DOWNLOAD_ERROR', { url });
        return res.status(errorResponse.statusCode).json(errorResponse.detail);
      }
    } else {
      // File upload
      fileData = file.buffer;
      const filenameParts = file.originalname.split('.');
      extension = filenameParts[filenameParts.length - 1]?.toLowerCase() || 'bin';
      contentType = file.mimetype || 'application/octet-stream';
    }

    const objectKey = `${userId}-|-${uuidv4()}.${extension}`;
    const folder = 'media/users';

    // Upload to GCS using storage module
    const publicUrl = await uploadToGoogleStorageFromString(fileData, folder, objectKey, contentType);

    logger.info('File uploaded successfully', { userId, url: publicUrl });

    return res.status(200).json(
      SUCCESS.response('File uploaded successfully', {
        url: publicUrl
      })
    );
  } catch (error) {
    logger.error('Error uploading media', { error: error.message, userId: req.user?.uid });
    next(error);
  }
});

/**
 * @swagger
 * /api/delete-media:
 *   delete:
 *     summary: Delete media file
 *     description: Delete a media file from Google Cloud Storage
 *     tags: [Upload Media]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: url
 *         required: true
 *         schema:
 *           type: string
 *           format: uri
 *         description: GCS URL of the file to delete
 *     responses:
 *       200:
 *         description: File deleted successfully
 *       400:
 *         description: Invalid URL or no URL provided
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: File not found
 *       500:
 *         description: Delete processing error
 */
router.delete('/delete-media', validateRequest, checkPermission('delete_upload'), async (req, res, next) => {
  try {
    const { url } = req.query;
    const userId = req.user.uid || req.user.user_id;

    if (!url) {
      const errorResponse = ERROR.fromMap('MEDIA_DELETE_ERROR', { message: 'No URL provided', user_id: userId });
      return res.status(errorResponse.statusCode).json(errorResponse.detail);
    }

    const bucketName = process.env.GOOGLE_STORAGE_BUCKET_NAME;
    if (!bucketName) {
      const errorResponse = ERROR.fromMap('CONFIGURATION_ERROR', { message: 'Bucket name not configured' });
      return res.status(errorResponse.statusCode).json(errorResponse.detail);
    }

    // Decode and parse the URL
    const decodedUrl = decodeURIComponent(url);
    const urlObj = new URL(decodedUrl);

    // Validate domain
    if (!urlObj.hostname.includes('storage.googleapis.com')) {
      const errorResponse = ERROR.fromMap('MEDIA_INVALID_URL', { url });
      return res.status(errorResponse.statusCode).json(errorResponse.detail);
    }

    // Extract bucket and object path from URL
    // Format: https://storage.googleapis.com/bucket-name/folder/file.ext
    const pathParts = urlObj.pathname.substring(1).split('/');
    if (pathParts.length < 2) {
      const errorResponse = ERROR.fromMap('MEDIA_INVALID_URL', { url, message: 'Invalid GCS URL format' });
      return res.status(errorResponse.statusCode).json(errorResponse.detail);
    }

    const urlBucket = pathParts[0];
    const folder = pathParts[1]; // e.g., 'media/users'
    const objectKey = pathParts.slice(2).join('/'); // Rest of the path

    // Check if bucket in URL matches the configured one
    if (urlBucket !== bucketName) {
      const errorResponse = ERROR.fromMap('MEDIA_DELETE_ERROR', {
        message: 'URL bucket does not match configured bucket',
        urlBucket,
        configuredBucket: bucketName
      });
      return res.status(errorResponse.statusCode).json(errorResponse.detail);
    }

    // Delete file from GCS using storage module
    try {
      const { deleteFromGoogleStorage } = require('../../src/storage/storage');
      const success = await deleteFromGoogleStorage(folder, objectKey);
      
      if (!success) {
        const errorResponse = ERROR.fromMap('MEDIA_DELETE_ERROR', { message: 'File not found in GCS', objectKey });
        return res.status(errorResponse.statusCode).json(errorResponse.detail);
      }

      logger.info('File deleted successfully', { userId, objectPath });

      return res.status(200).json(
        SUCCESS.response(`File deleted successfully from bucket '${bucketName}'`, {
          bucket: bucketName
        })
      );
    } catch (error) {
      logger.error('Error deleting file from GCS', { error: error.message, objectPath });
      throw error;
    }
  } catch (error) {
    logger.error('Error deleting media', { error: error.message, userId: req.user?.uid });
    next(error);
  }
});

module.exports = router;

