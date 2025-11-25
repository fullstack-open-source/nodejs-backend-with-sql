# File Upload Router

> **Complete Documentation for Media File Upload and Management Endpoints**

This router handles file upload operations including uploading files from URLs or direct file uploads to Google Cloud Storage, and deleting uploaded files.

## 📋 Table of Contents

- [Overview](#overview)
- [Endpoints](#endpoints)
  - [Upload Media](#upload-media)
  - [Delete Media](#delete-media)
- [Workflows](#workflows)
- [Error Handling](#error-handling)

## Overview

The File Upload router provides comprehensive media file management functionality including:
- **File Upload**: Upload files directly or from URLs to Google Cloud Storage
- **File Deletion**: Delete files from Google Cloud Storage
- **Multiple Formats**: Support for images, documents, videos, and other file types
- **Size Limits**: 15MB maximum file size
- **Automatic Processing**: Automatic file type detection and content type handling

**Base Path:** `/{MODE}/upload-media`, `/{MODE}/delete-media`

**Authentication:** All endpoints require authentication

**Permissions:** 
- Upload: `add_upload` permission
- Delete: `delete_upload` permission

## Endpoints

### Upload Media

**Endpoint:** `POST /{MODE}/upload-media`

**Description:** Upload a media file either from URL or direct file upload to Google Cloud Storage.

**Authentication:** Required
**Permission:** `add_upload`

**Request Options:**

**Option 1: Direct File Upload (Multipart Form Data)**
```http
POST /dev/v1/upload-media HTTP/1.1
Authorization: Bearer <token>
Content-Type: multipart/form-data

file: [binary file data]
```

**Option 2: Upload from URL (Form Data)**
```http
POST /dev/v1/upload-media HTTP/1.1
Authorization: Bearer <token>
Content-Type: application/x-www-form-urlencoded

url: https://example.com/image.jpg
```

**Response:**
```json
{
  "success": true,
  "message": "File uploaded successfully",
  "data": {
    "url": "https://storage.googleapis.com/bucket-name/media/users/user-uuid-file.jpg"
  }
}
```

**Workflow (Direct File Upload):**
```
1. Authenticated Request
   │
   ├─► Validate JWT Token
   │
   ├─► Check Permission (add_upload)
   │
   ├─► Validate Request
   │   └─► Check file or url exists
   │
   ├─► Process File Upload
   │   ├─► Extract file buffer
   │   ├─► Get file extension from filename
   │   └─► Get content type from mimetype
   │
   ├─► Generate Object Key
   │   └─► {userId}-|-{uuid}.{extension}
   │
   ├─► Upload to Google Cloud Storage
   │   ├─► Folder: media/users
   │   ├─► Object Key: generated key
   │   └─► uploadToGoogleStorageFromString()
   │
   └─► Return Public URL
```

**Workflow (Upload from URL):**
```
1. Authenticated Request
   │
   ├─► Validate JWT Token
   │
   ├─► Check Permission (add_upload)
   │
   ├─► Validate Request
   │   └─► Check url exists
   │
   ├─► Download File from URL
   │   ├─► axios.get(url, { responseType: 'arraybuffer' })
   │   ├─► Max size: 15MB
   │   └─► Convert to Buffer
   │
   ├─► Extract File Information
   │   ├─► Extension from URL or Content-Type header
   │   └─► Content type from response headers
   │
   ├─► Generate Object Key
   │   └─► {userId}-|-{uuid}.{extension}
   │
   ├─► Upload to Google Cloud Storage
   │   └─► uploadToGoogleStorageFromString()
   │
   └─► Return Public URL
```

**Supported File Types:**
- Images: jpg, jpeg, png, gif, webp, svg
- Documents: pdf, doc, docx, txt
- Videos: mp4, avi, mov, webm
- Other: Based on content type

**File Size Limit:** 15MB maximum

**Storage Location:**
- Folder: `media/users`
- Object Key Format: `{userId}-|-{uuid}.{extension}`
- Public URL: `https://storage.googleapis.com/{bucket-name}/media/users/{object-key}`

---

### Delete Media

**Endpoint:** `DELETE /{MODE}/delete-media`

**Description:** Delete a media file from Google Cloud Storage.

**Authentication:** Required
**Permission:** `delete_upload`

**Query Parameters:**
- `url` (required): GCS URL of the file to delete

**Request:**
```http
DELETE /dev/v1/delete-media?url=https://storage.googleapis.com/bucket-name/media/users/user-uuid-file.jpg HTTP/1.1
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "message": "File deleted successfully from bucket 'bucket-name'",
  "data": {
    "bucket": "bucket-name"
  }
}
```

**Workflow:**
```
1. Authenticated Request
   │
   ├─► Validate JWT Token
   │
   ├─► Check Permission (delete_upload)
   │
   ├─► Validate Request
   │   └─► Check url parameter exists
   │
   ├─► Validate Bucket Configuration
   │   └─► Check GOOGLE_STORAGE_BUCKET_NAME exists
   │
   ├─► Parse GCS URL
   │   ├─► Decode URL
   │   ├─► Validate domain (storage.googleapis.com)
   │   └─► Extract bucket and object path
   │
   ├─► Validate Bucket Match
   │   └─► Ensure URL bucket matches configured bucket
   │
   ├─► Extract Object Path
   │   ├─► Folder: media/users (or other)
   │   └─► Object Key: file name
   │
   ├─► Delete from Google Cloud Storage
   │   └─► deleteFromGoogleStorage(folder, objectKey)
   │
   └─► Return Success Response
```

**URL Format:**
```
https://storage.googleapis.com/{bucket-name}/{folder}/{object-key}
```

**Example:**
```
https://storage.googleapis.com/my-bucket/media/users/user-123-file.jpg
```

**Validation:**
- URL must be from `storage.googleapis.com`
- Bucket in URL must match configured bucket
- URL must have valid path structure

---

## Workflows

### Complete File Upload Flow

```
┌─────────────────────────────────────────────────────────────┐
│              File Upload Flow                               │
└────────────────────────────┬────────────────────────────────┘
                              │
                ┌─────────────┴─────────────┐
                │                           │
                ▼                           ▼
        ┌───────────────┐         ┌───────────────┐
        │  Direct Upload │         │  Upload from │
        │   (Multipart)  │         │     URL      │
        └───────┬───────┘         └───────┬───────┘
                │                           │
                ▼                           ▼
        ┌───────────────┐         ┌───────────────┐
        │ Extract File  │         │ Download File │
        │   Buffer      │         │   from URL    │
        └───────┬───────┘         └───────┬───────┘
                │                           │
                └─────────────┬─────────────┘
                              │
                              ▼
                    ┌─────────────────┐
                    │ Get File Info   │
                    │ (ext, type)     │
                    └────────┬────────┘
                             │
                             ▼
                    ┌─────────────────┐
                    │ Generate Key    │
                    │ {userId}-uuid.ext│
                    └────────┬────────┘
                             │
                             ▼
                    ┌─────────────────┐
                    │ Upload to GCS   │
                    └────────┬────────┘
                             │
                             ▼
                    ┌─────────────────┐
                    │ Return Public   │
                    │      URL        │
                    └─────────────────┘
```

### File Deletion Flow

```
1. User Requests File Deletion
   │
   ├─► Validate Authentication
   │   └─► Check JWT token
   │
   ├─► Check Permission
   │   └─► delete_upload permission
   │
   ├─► Validate URL Parameter
   │   └─► URL must be provided
   │
   ├─► Parse GCS URL
   │   ├─► Decode URL
   │   ├─► Validate domain
   │   └─► Extract bucket and path
   │
   ├─► Validate Bucket
   │   └─► URL bucket must match config
   │
   ├─► Extract Object Path
   │   ├─► Folder name
   │   └─► Object key
   │
   ├─► Delete from GCS
   │   └─► deleteFromGoogleStorage()
   │
   └─► Return Success Response
```

## Error Handling

### Common Error Responses

**400 Bad Request - No File or URL:**
```json
{
  "success": false,
  "message": "File or URL required",
  "error": "Either file or url must be provided",
  "statusCode": 400
}
```

**400 Bad Request - Invalid URL:**
```json
{
  "success": false,
  "message": "Invalid URL",
  "error": "URL must be from storage.googleapis.com",
  "statusCode": 400
}
```

**401 Unauthorized:**
```json
{
  "success": false,
  "message": "Authentication required",
  "error": "Invalid or missing token",
  "statusCode": 401
}
```

**403 Forbidden:**
```json
{
  "success": false,
  "message": "Permission denied",
  "error": "Insufficient permissions. Requires add_upload permission",
  "statusCode": 403
}
```

**404 Not Found - File Not Found:**
```json
{
  "success": false,
  "message": "File not found",
  "error": "File not found in Google Cloud Storage",
  "statusCode": 404
}
```

**413 Payload Too Large:**
```json
{
  "success": false,
  "message": "File too large",
  "error": "File size exceeds 15MB limit",
  "statusCode": 413
}
```

**500 Internal Server Error - Download Error:**
```json
{
  "success": false,
  "message": "Download error",
  "error": "Failed to download file from URL",
  "statusCode": 500
}
```

**500 Internal Server Error - Upload Error:**
```json
{
  "success": false,
  "message": "Upload processing error",
  "error": "Failed to upload file to Google Cloud Storage",
  "statusCode": 500
}
```

---

## Best Practices

1. **File Size**: Always validate file size before upload (max 15MB)
2. **File Types**: Validate file types based on your application requirements
3. **Content Type**: Set appropriate content type for proper file handling
4. **URL Validation**: Validate URLs before downloading
5. **Error Handling**: Handle download and upload errors gracefully
6. **Security**: Only allow deletion of files from your configured bucket
7. **Object Keys**: Use unique object keys to prevent overwrites
8. **Cleanup**: Implement cleanup for failed uploads
9. **CORS**: Configure CORS on GCS bucket for web uploads
10. **Permissions**: Use IAM roles for GCS access, not service account keys in code

---

## Google Cloud Storage Configuration

**Required Environment Variables:**
- `GOOGLE_STORAGE_BUCKET_NAME`: Name of the GCS bucket

**Required Credentials:**
- Google Cloud Service Account JSON file
- Proper IAM permissions for bucket access

**Storage Structure:**
```
bucket-name/
  └── media/
      └── users/
          ├── user-123-uuid1.jpg
          ├── user-123-uuid2.png
          └── user-456-uuid3.pdf
```

**Public URL Format:**
```
https://storage.googleapis.com/{bucket-name}/media/users/{object-key}
```

---

## Security Considerations

1. **Authentication**: All endpoints require authentication
2. **Authorization**: Check permissions before allowing upload/delete
3. **Bucket Validation**: Ensure files are only deleted from your bucket
4. **URL Validation**: Validate URLs to prevent SSRF attacks
5. **File Type Validation**: Validate file types to prevent malicious uploads
6. **Size Limits**: Enforce size limits to prevent DoS attacks
7. **Content Scanning**: Consider scanning uploaded files for malware
8. **Access Control**: Use GCS IAM for fine-grained access control

---

## Performance Considerations

1. **File Size**: Large files may take time to upload/download
2. **Concurrent Uploads**: Handle multiple concurrent uploads efficiently
3. **Streaming**: For large files, consider streaming uploads
4. **Caching**: Cache public URLs if files don't change
5. **CDN**: Consider using CDN for frequently accessed files
6. **Compression**: Compress images before upload for better performance

---

**Last Updated**: January 2025

