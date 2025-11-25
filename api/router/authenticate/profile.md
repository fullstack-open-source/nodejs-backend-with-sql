# Profile Management Router

> **Complete Documentation for User Profile and Settings Endpoints**

This router handles all user profile management operations including profile retrieval, updates, email/phone changes, theme/language preferences, and account management.

## 📋 Table of Contents

- [Overview](#overview)
- [Endpoints](#endpoints)
  - [Get Profile](#get-profile)
  - [Update Profile Picture](#update-profile-picture)
  - [Update Profile](#update-profile)
  - [Update Profile Accessibility](#update-profile-accessibility)
  - [Update Profile Language](#update-profile-language)
  - [Change Email](#change-email)
  - [Change Phone](#change-phone)
  - [Send Phone OTP](#send-phone-otp)
  - [Update Theme](#update-theme)
  - [Deactivate Account](#deactivate-account)
  - [Delete Account](#delete-account)
  - [Get Settings](#get-settings)
  - [Update Timezone](#update-timezone)
- [Workflows](#workflows)
- [Error Handling](#error-handling)

## Overview

The Profile Management router provides comprehensive user profile and settings management including:
- **Profile Information**: Retrieve and update user profile data
- **Media Management**: Upload and manage profile pictures
- **Contact Information**: Change email and phone numbers with verification
- **Preferences**: Manage theme, language, timezone, and accessibility settings
- **Account Management**: Deactivate or delete user accounts

**Base Path:** `/{MODE}/settings`

**Authentication:** All endpoints require authentication

**Permissions:** Most endpoints require `edit_profile` or `view_profile` permission

## Endpoints

### Get Profile

**Endpoint:** `GET /{MODE}/settings/profile` or `GET /{MODE}/settings/profile/:user_id`

**Description:** Get current authenticated user's profile or a specific user's profile by ID.

**Authentication:** Required
**Permission:** `view_profile` (own profile) or `view_user` (other users)

**Request:**
```http
GET /dev/v1/settings/profile HTTP/1.1
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "message": "User profile fetched successfully",
  "data": {
    "user_id": "uuid",
    "email": "user@example.com",
    "first_name": "John",
    "last_name": "Doe",
    "profile_picture_url": "https://storage.googleapis.com/...",
    "bio": "User bio",
    "country": "US",
    "status": "ACTIVE",
    "is_active": true,
    "is_verified": true,
    "is_email_verified": true,
    "is_phone_verified": true
  }
}
```

**Workflow:**
```
1. Authenticated Request
   │
   ├─► Validate JWT Token
   │
   ├─► Check Permission
   │   ├─► Own profile → view_profile
   │   └─► Other user → view_user
   │
   ├─► Get User Data
   │   └─► getUserByUserId(userId)
   │
   ├─► Serialize Data
   │   └─► Remove sensitive fields
   │
   └─► Return Profile Data
```

---

### Update Profile Picture

**Endpoint:** `POST /{MODE}/settings/update-profile-picture`

**Description:** Update user's profile picture. Uploads image to Google Cloud Storage.

**Authentication:** Required
**Permission:** `edit_profile`

**Request:** Multipart form data
- `file`: Image file (max 15MB)

**Response:**
```json
{
  "success": true,
  "message": "Profile picture updated successfully",
  "data": {
    "profile_picture_url": "https://storage.googleapis.com/bucket-name/media/users/user-uuid-file.jpg"
  }
}
```

**Workflow:**
```
1. Authenticated Request
   │
   ├─► Validate JWT Token
   │
   ├─► Check Permission (edit_profile)
   │
   ├─► Validate File Upload
   │   └─► Check file exists
   │
   ├─► Process File
   │   ├─► Extract file buffer
   │   ├─► Get file extension
   │   └─► Get content type
   │
   ├─► Generate Object Key
   │   └─► {username}-user_id_{userId}-|-{uuid}.{ext}
   │
   ├─► Upload to Google Cloud Storage
   │   ├─► Folder: media/users
   │   └─► uploadToGoogleStorageFromString()
   │
   ├─► Update Database
   │   └─► Update profile_picture_url
   │
   └─► Return Public URL
```

**Supported Formats:**
- Images: jpg, jpeg, png, gif, webp
- Max Size: 15MB

---

### Update Profile

**Endpoint:** `POST /{MODE}/settings/update-profile`

**Description:** Partially update user profile fields. Protected fields (user_id, email, phone) cannot be updated.

**Authentication:** Required
**Permission:** `edit_profile`

**Request Body:**
```json
{
  "first_name": "John",
  "last_name": "Doe",
  "bio": "Updated bio",
  "country": "US"
}
```

**Response:**
```json
{
  "success": true,
  "message": "User profile update successfully",
  "data": {
    "user_id": "uuid",
    "first_name": "John",
    "last_name": "Doe",
    "bio": "Updated bio",
    "country": "US"
  }
}
```

**Workflow:**
```
1. Authenticated Request
   │
   ├─► Validate JWT Token
   │
   ├─► Check Permission (edit_profile)
   │
   ├─► Remove Protected Fields
   │   ├─► user_id
   │   ├─► email (if exists)
   │   └─► phone (if exists)
   │
   ├─► Validate Update Data
   │   └─► Check at least one field to update
   │
   ├─► Update User in Database
   │   └─► prisma.user.update()
   │
   ├─► Fetch Updated User Data
   │   └─► getUserByUserId()
   │
   └─► Return Updated Profile
```

**Updatable Fields:**
- `first_name`
- `last_name`
- `bio`
- `country`
- `profile_picture_url` (use update-profile-picture endpoint)

**Protected Fields:**
- `user_id`
- `email` (use change-email endpoint)
- `phone_number` (use change-phone endpoint)

---

### Update Profile Accessibility

**Endpoint:** `POST /{MODE}/settings/profile-accessibility`

**Description:** Update user's profile accessibility settings (public/private).

**Authentication:** Required
**Permission:** `edit_profile`

**Request Body:**
```json
{
  "profile_accessibility": "public"
}
```

**Options:** `public`, `private`

**Response:**
```json
{
  "success": true,
  "message": "Profile accessibility updated successfully",
  "data": { ... }
}
```

**Workflow:**
```
1. Authenticated Request
   │
   ├─► Validate JWT Token
   │
   ├─► Check Permission (edit_profile)
   │
   ├─► Validate Request
   │   └─► profile_accessibility: public | private
   │
   ├─► Update Database
   │   └─► prisma.user.update()
   │
   ├─► Fetch Updated User Data
   │
   └─► Return Updated Profile
```

---

### Update Profile Language

**Endpoint:** `POST /{MODE}/settings/profile-language`

**Description:** Update user's language preference.

**Authentication:** Required
**Permission:** `edit_profile`

**Request Body:**
```json
{
  "language": "en"
}
```

**Options:** `en`, `ar` (and other supported languages)

**Response:**
```json
{
  "success": true,
  "message": "Profile language updated successfully",
  "data": { ... }
}
```

**Workflow:**
```
1. Authenticated Request
   │
   ├─► Validate JWT Token
   │
   ├─► Check Permission (edit_profile)
   │
   ├─► Validate Language Code
   │   └─► Must be valid language enum
   │
   ├─► Update Database
   │   └─► prisma.user.update()
   │
   └─► Return Updated Profile
```

---

### Change Email

**Endpoint:** `POST /{MODE}/settings/change-email`

**Description:** Change user's email address. Requires OTP verification.

**Authentication:** Required
**Permission:** `edit_profile`

**Request Body:**
```json
{
  "new_email": "newemail@example.com",
  "otp": "123456"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Email updated and verified successfully",
  "data": {
    "user": {
      "id": "uuid",
      "email": "newemail@example.com",
      "is_email_verified": true,
      "email_verified_at": "2025-01-01T00:00:00.000Z"
    }
  }
}
```

**Workflow:**
```
1. Authenticated Request
   │
   ├─► Validate JWT Token
   │
   ├─► Check Permission (edit_profile)
   │
   ├─► Validate Request
   │   ├─► new_email required
   │   └─► otp required
   │
   ├─► Verify OTP
   │   └─► verifyOtp(new_email, otp)
   │
   ├─► Check Email Availability
   │   └─► Ensure email not used by another user
   │
   ├─► Update Email
   │   ├─► Update email field
   │   ├─► Set is_email_verified: true
   │   └─► Set email_verified_at: now
   │
   ├─► Delete OTP
   │   └─► verifyOtp(consume=true)
   │
   └─► Return Updated User Data
```

**Note:** User must request OTP to new email first using `/auth/send-one-time-password` endpoint.

---

### Change Phone

**Endpoint:** `POST /{MODE}/settings/change-phone`

**Description:** Change user's phone number. Requires OTP verification.

**Authentication:** Required
**Permission:** `edit_profile`

**Request Body:**
```json
{
  "new_phone": "+1234567890",
  "otp": "123456"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Phone number updated and verified successfully",
  "data": {
    "user": {
      "id": "uuid",
      "phone_number": { "phone": "1234567890" },
      "is_phone_verified": true,
      "phone_number_verified_at": "2025-01-01T00:00:00.000Z"
    }
  }
}
```

**Workflow:**
```
1. Authenticated Request
   │
   ├─► Validate JWT Token
   │
   ├─► Check Permission (edit_profile)
   │
   ├─► Validate Request
   │   ├─► new_phone required
   │   ├─► otp required
   │   └─► Validate phone format
   │
   ├─► Verify OTP
   │   └─► verifyOtp(new_phone, otp)
   │
   ├─► Check Phone Availability
   │   └─► Ensure phone not used by another user
   │
   ├─► Clean Phone Number
   │   └─► Remove + prefix
   │
   ├─► Update Phone
   │   ├─► Update phone_number JSONB field
   │   ├─► Set is_phone_verified: true
   │   └─► Set phone_number_verified_at: now
   │
   ├─► Delete OTP
   │   └─► verifyOtp(consume=true)
   │
   └─► Return Updated User Data
```

**Note:** User must request OTP to new phone first using `/settings/send-phone-otp` endpoint.

---

### Send Phone OTP

**Endpoint:** `POST /{MODE}/settings/send-phone-otp`

**Description:** Send OTP to a phone number for verification (e.g., for changing phone).

**Authentication:** Required
**Permission:** `edit_profile`

**Request Body:**
```json
{
  "phone": "+1234567890",
  "channel": "sms"
}
```

**Channel Options:** `sms`, `whatsapp`

**Response:**
```json
{
  "success": true,
  "message": "OTP sent successfully",
  "data": {
    "message": "OTP sent successfully"
  }
}
```

**Workflow:**
```
1. Authenticated Request
   │
   ├─► Validate JWT Token
   │
   ├─► Check Permission (edit_profile)
   │
   ├─► Validate Request
   │   ├─► phone required
   │   ├─► channel required (sms/whatsapp)
   │   └─► Validate phone format
   │
   ├─► Generate OTP
   │   └─► setOtp(phone, 600 seconds)
   │
   ├─► Send OTP
   │   ├─► sms → Send SMS via Twilio
   │   └─► whatsapp → Send WhatsApp via Twilio
   │
   └─► Return Success Response
```

---

### Update Theme

**Endpoint:** `POST /{MODE}/settings/update-theme`

**Description:** Update user's theme preference.

**Authentication:** Required
**Permission:** `edit_profile`

**Request Body:**
```json
{
  "theme": "dark"
}
```

**Options:** `light`, `dark`

**Response:**
```json
{
  "success": true,
  "message": "Theme updated successfully",
  "data": { ... }
}
```

**Workflow:**
```
1. Authenticated Request
   │
   ├─► Validate JWT Token
   │
   ├─► Check Permission (edit_profile)
   │
   ├─► Validate Theme
   │   └─► Must be "light" or "dark"
   │
   ├─► Update Database
   │   └─► prisma.user.update()
   │
   ├─► Fetch Updated User Data
   │
   └─► Return Updated Profile
```

---

### Deactivate Account

**Endpoint:** `POST /{MODE}/settings/deactivate-account`

**Description:** Deactivate user account (sets is_active to false and status to INACTIVE).

**Authentication:** Required
**Permission:** `edit_profile`

**Request Body:** None

**Response:**
```json
{
  "success": true,
  "message": "Account deactivated successfully",
  "data": {
    "user_id": "uuid",
    "is_active": false,
    "status": "INACTIVE"
  }
}
```

**Workflow:**
```
1. Authenticated Request
   │
   ├─► Validate JWT Token
   │
   ├─► Check Permission (edit_profile)
   │
   ├─► Update User Status
   │   ├─► Set is_active: false
   │   └─► Set status: INACTIVE
   │
   └─► Return Success Response
```

**Note:** Deactivated accounts cannot login. Account can be reactivated by admin.

---

### Delete Account

**Endpoint:** `POST /{MODE}/settings/delete-account`

**Description:** Delete user account (requires confirmation). Sets is_active to false and status to INACTIVE.

**Authentication:** Required
**Permission:** `edit_profile`

**Request Body:**
```json
{
  "confirm": true
}
```

**Response:**
```json
{
  "success": true,
  "message": "Account deactivated successfully",
  "data": {
    "user_id": "uuid",
    "is_active": false
  }
}
```

**Workflow:**
```
1. Authenticated Request
   │
   ├─► Validate JWT Token
   │
   ├─► Check Permission (edit_profile)
   │
   ├─► Validate Confirmation
   │   └─► confirm must be true
   │
   ├─► Update User Status
   │   ├─► Set is_active: false
   │   └─► Set status: INACTIVE
   │
   └─► Return Success Response
```

**Note:** This is a soft delete. Account data is preserved but marked as inactive.

---

### Get Settings

**Endpoint:** `GET /{MODE}/settings/get-settings`

**Description:** Get all user settings and preferences.

**Authentication:** Required
**Permission:** `view_profile`

**Response:**
```json
{
  "success": true,
  "message": "User settings retrieved successfully",
  "data": {
    "user_id": "uuid",
    "theme": "dark",
    "language": "en",
    "profile_accessibility": "public",
    "timezone": "America/New_York",
    "country": "US",
    "bio": "User bio",
    "is_email_verified": true,
    "is_phone_verified": true,
    "is_active": true,
    "is_verified": true,
    "status": "ACTIVE"
  }
}
```

**Workflow:**
```
1. Authenticated Request
   │
   ├─► Validate JWT Token
   │
   ├─► Check Permission (view_profile)
   │
   ├─► Get User Settings
   │   └─► prisma.user.findUnique()
   │       └─► Select settings fields
   │
   ├─► Serialize Data
   │
   └─► Return Settings
```

---

### Update Timezone

**Endpoint:** `POST /{MODE}/settings/update-timezone`

**Description:** Update user's timezone preference.

**Authentication:** Required
**Permission:** `edit_profile`

**Request Body:**
```json
{
  "timezone": "America/New_York"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Timezone updated successfully",
  "data": { ... }
}
```

**Workflow:**
```
1. Authenticated Request
   │
   ├─► Validate JWT Token
   │
   ├─► Check Permission (edit_profile)
   │
   ├─► Validate Timezone
   │   └─► Must be valid IANA timezone
   │
   ├─► Update Database
   │   └─► prisma.user.update()
   │
   ├─► Fetch Updated User Data
   │
   └─► Return Updated Profile
```

**Valid Timezones:** IANA timezone database (e.g., "America/New_York", "Europe/London", "Asia/Tokyo")

---

## Workflows

### Complete Profile Update Flow

```
┌─────────────────────────────────────────────────────────────┐
│              Profile Management Flow                         │
└────────────────────────────┬────────────────────────────────┘
                              │
                              ▼
                    ┌─────────────────┐
                    │  Get Profile?   │
                    └────────┬────────┘
                             │
                ┌────────────┴────────────┐
                │                         │
                ▼                         ▼
        ┌───────────────┐         ┌───────────────┐
        │  View Profile │         │ Update Profile │
        └───────┬───────┘         └───────┬───────┘
                │                         │
                ▼                         ▼
        ┌───────────────┐         ┌───────────────┐
        │ Return Data   │         │ Validate Data │
        └───────────────┘         └───────┬───────┘
                                           │
                           ┌───────────────┼───────────────┐
                           │               │               │
                           ▼               ▼               ▼
                  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐
                  │ Update DB   │ │ Upload File  │ │ Verify OTP  │
                  └──────┬──────┘ └──────┬──────┘ └──────┬──────┘
                         │               │               │
                         └───────────────┴───────────────┘
                                         │
                                         ▼
                                 ┌─────────────┐
                                 │ Return Data │
                                 └─────────────┘
```

### Email/Phone Change Flow

```
1. User Requests Email/Phone Change
   │
   ├─► POST /settings/send-phone-otp (for phone)
   │   └─► OTP sent to new phone
   │
   ├─► POST /auth/send-one-time-password (for email)
   │   └─► OTP sent to new email
   │
   ├─► User Receives OTP
   │
   ├─► POST /settings/change-email or /settings/change-phone
   │   ├─► Verify OTP
   │   ├─► Check availability
   │   ├─► Update contact info
   │   └─► Mark as verified
   │
   └─► Email/Phone Changed Successfully
```

## Error Handling

### Common Error Responses

**400 Bad Request - Invalid Payload:**
```json
{
  "success": false,
  "message": "Invalid request payload",
  "error": "Validation error details",
  "statusCode": 400
}
```

**401 Unauthorized - Invalid OTP:**
```json
{
  "success": false,
  "message": "Invalid OTP",
  "error": "OTP is incorrect or expired",
  "statusCode": 401
}
```

**403 Forbidden - Permission Denied:**
```json
{
  "success": false,
  "message": "Permission denied",
  "error": "Insufficient permissions",
  "statusCode": 403
}
```

**404 Not Found - Profile Not Found:**
```json
{
  "success": false,
  "message": "Profile not found",
  "error": "User profile does not exist",
  "statusCode": 404
}
```

**409 Conflict - Email/Phone Already Exists:**
```json
{
  "success": false,
  "message": "Email already exists",
  "error": "Email is already registered to another user",
  "statusCode": 409
}
```

---

## Best Practices

1. **Profile Picture**: Use appropriate image formats and sizes (max 15MB)
2. **Email/Phone Changes**: Always verify with OTP before updating
3. **Protected Fields**: Never allow direct updates to user_id, email, or phone
4. **Data Validation**: Validate all input data before updating
5. **Error Messages**: Provide clear error messages for validation failures
6. **Account Deletion**: Require explicit confirmation for account deletion
7. **Timezone Format**: Use IANA timezone database format
8. **Language Codes**: Use ISO 639-1 language codes (en, ar, etc.)

---

**Last Updated**: January 2025

