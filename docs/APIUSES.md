# 📚 API Usage Guide

> **Complete Guide to Using Node.js Backend API Endpoints**

This document provides comprehensive documentation for all API endpoints, including request/response formats, authentication requirements, and usage examples.

> **📖 For detailed router-specific documentation with workflows and examples, see [ROUTERS.md](./ROUTERS.md)**

## 📋 Table of Contents

- [API Overview](#api-overview)
- [Authentication](#authentication)
- [API Endpoints](#api-endpoints)
  - [Health & Monitoring](#health--monitoring)
  - [Authentication Endpoints](#authentication-endpoints)
  - [Profile Management](#profile-management)
  - [Dashboard & Analytics](#dashboard--analytics)
  - [Permissions & Groups](#permissions--groups)
  - [Activity Logging](#activity-logging)
  - [File Upload](#file-upload)

## API Overview

### Base URL

All API endpoints are prefixed with the `MODE` environment variable:

- **Production**: `https://api.example.com/prod/v1`
- **Development**: `http://localhost:9080/dev/v1`

**Note:** The `/health` endpoint is available without prefix: `http://localhost:9080/health`

### Response Format

**Success Response:**
```json
{
  "success": true,
  "message": "Operation successful",
  "data": { ... },
  "meta": { ... }
}
```

**Error Response:**
```json
{
  "success": false,
  "message": "Error message",
  "error": "Error details",
  "statusCode": 400
}
```

### Authentication

Most endpoints require JWT authentication. Include the token in the Authorization header:

```
Authorization: Bearer <your-access-token>
```

## Authentication

### Login with Password

**Endpoint:** `POST /{MODE}/token` or `POST /{MODE}/auth/login-with-password`

**Description:** Authenticate user with email/phone and password

**Authentication:** Not required

**Request Body:**
```json
{
  "username": "user@example.com",
  "password": "your-password"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "token_type": "bearer"
  }
}
```

**Usage:**
- Use email or phone number as `username`
- Accepts both JSON and form-urlencoded data
- Returns JWT access token for authenticated requests

### Send One-Time Password (OTP)

**Endpoint:** `POST /{MODE}/auth/send-one-time-password`

**Description:** Send OTP via email, SMS, or WhatsApp

**Authentication:** Not required

**Request Body:**
```json
{
  "user_id": "user@example.com",
  "channel": "email"
}
```

**Channel Options:**
- `email`: Send OTP via email
- `sms`: Send OTP via SMS
- `whatsapp`: Send OTP via WhatsApp

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

### Verify One-Time Password (OTP)

**Endpoint:** `POST /{MODE}/auth/verify-one-time-password`

**Description:** Verify OTP without logging in

**Authentication:** Not required

**Request Body:**
```json
{
  "user_id": "user@example.com",
  "channel": "email",
  "otp": "123456"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Verify Successfully",
  "data": {
    "user_id": "user@example.com"
  }
}
```

### Login with OTP

**Endpoint:** `POST /{MODE}/auth/login-with-otp`

**Description:** Verify OTP and login user. Returns access token upon successful verification.

**Authentication:** Not required

**Request Body:**
```json
{
  "user_id": "user@example.com",
  "channel": "email",
  "otp": "123456"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "token_type": "bearer",
    "user": { ... }
  }
}
```

### Signup/Register

**Endpoint:** `POST /{MODE}/auth/verify`

**Description:** Verify OTP and create new user account

**Authentication:** Not required

**Request Body:**
```json
{
  "user_id": "user@example.com",
  "channel": "email",
  "otp": "123456"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Signup successful",
  "data": {
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "token_type": "bearer",
    "user": { ... }
  }
}
```

### Set Password

**Endpoint:** `POST /{MODE}/auth/set-password`

**Description:** Set password for user account (for users who signed up with OTP)

**Authentication:** Required

**Request Body:**
```json
{
  "password": "new-password",
  "confirm_password": "new-password"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Password set successfully",
  "data": { ... }
}
```

### Change Password

**Endpoint:** `POST /{MODE}/auth/change-password`

**Description:** Change user's existing password

**Authentication:** Required

**Request Body:**
```json
{
  "old_password": "current-password",
  "new_password": "new-password",
  "confirm_password": "new-password"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Password changed successfully",
  "data": { ... }
}
```

### Forget Password

**Endpoint:** `POST /{MODE}/auth/forget-password`

**Description:** Request password reset via OTP

**Authentication:** Not required

**Request Body:**
```json
{
  "user_id": "user@example.com",
  "channel": "email"
}
```

**Response:**
```json
{
  "success": true,
  "message": "OTP sent for password reset",
  "data": { ... }
}
```

### Logout

**Endpoint:** `POST /{MODE}/logout`

**Description:** Logout user (invalidate token)

**Authentication:** Required

**Request Body:** None

**Response:**
```json
{
  "success": true,
  "message": "Logout successful",
  "data": { ... }
}
```

### Check User Availability

**Endpoint:** `POST /{MODE}/auth/check-user-availability`

**Description:** Check if email or phone number is available for registration

**Authentication:** Not required

**Request Body:**
```json
{
  "user_id": "user@example.com"
}
```

**Response:**
```json
{
  "success": true,
  "message": "User availability checked",
  "data": {
    "available": true,
    "user_id": "user@example.com"
  }
}
```

### Verify Email and Phone

**Endpoint:** `POST /{MODE}/auth/verify-email-and-phone`

**Description:** Verify both email and phone number with OTP

**Authentication:** Not required

**Request Body:**
```json
{
  "email": "user@example.com",
  "phone": "+1234567890",
  "email_otp": "123456",
  "phone_otp": "654321"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Email and phone verified successfully",
  "data": { ... }
}
```

## Health & Monitoring

### Health Check

**Endpoint:** `GET /health` or `GET /{MODE}/health`

**Description:** Check API service health status

**Authentication:** Not required

**Response:**
```json
{
  "success": true,
  "message": "Service is healthy",
  "data": {
    "status": "ok"
  },
  "meta": {
    "service": "nodejs-backend-with-postgresql-api",
    "status": "ok",
    "env": {
      "API_VERSION": "1.0.0",
      "API_MODE": "development",
      "MODE": "dev/v1"
    }
  }
}
```

### System Health Check

**Endpoint:** `GET /{MODE}/health/system`

**Description:** Get detailed system information including CPU, memory, and environment details

**Authentication:** Not required

**Response:**
```json
{
  "success": true,
  "message": "System health check completed",
  "data": {
    "status": "healthy",
    "system_info": {
      "platform": "linux",
      "nodeVersion": "v18.0.0",
      "cpuCount": 4,
      "memoryTotal": 8589934592,
      "memoryFree": 4294967296,
      "memoryUsed": 4294967296,
      "uptime": 3600
    },
    "environment": {
      "API_VERSION": "1.0.0",
      "API_MODE": "development"
    },
    "timestamp": 1234567890
  }
}
```

### Test Sentry

**Endpoint:** `GET /{MODE}/test-sentry`

**Description:** Test Sentry error tracking integration

**Authentication:** Required

**Response:**
```json
{
  "success": true,
  "message": "Sentry test completed",
  "data": { ... }
}
```

## Profile Management

### Get Current User Profile

**Endpoint:** `GET /{MODE}/settings/profile`

**Description:** Get current authenticated user's profile

**Authentication:** Required
**Permission:** `view_profile`

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
    "profile_picture_url": "https://...",
    "bio": "User bio",
    "status": "ACTIVE",
    "is_active": true,
    "is_verified": true
  }
}
```

### Get User Profile by ID

**Endpoint:** `GET /{MODE}/settings/profile/:user_id`

**Description:** Get a specific user's profile by user ID

**Authentication:** Required
**Permission:** `view_user`

**Parameters:**
- `user_id` (path): User UUID

**Response:**
```json
{
  "success": true,
  "message": "User profile fetched successfully",
  "data": { ... }
}
```

### Update Profile Picture

**Endpoint:** `POST /{MODE}/settings/update-profile-picture`

**Description:** Update user's profile picture

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
    "profile_picture_url": "https://storage.googleapis.com/..."
  }
}
```

### Update Profile

**Endpoint:** `POST /{MODE}/settings/update-profile`

**Description:** Partially update user profile fields

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
  "data": { ... }
}
```

### Update Profile Accessibility

**Endpoint:** `POST /{MODE}/settings/profile-accessibility`

**Description:** Update user's profile accessibility settings

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

### Update Profile Language

**Endpoint:** `POST /{MODE}/settings/profile-language`

**Description:** Update user's language preference

**Authentication:** Required
**Permission:** `edit_profile`

**Request Body:**
```json
{
  "language": "en"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Profile language updated successfully",
  "data": { ... }
}
```

### Change Email

**Endpoint:** `POST /{MODE}/settings/change-email`

**Description:** Change user's email address (requires OTP verification)

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
  "message": "Email changed successfully",
  "data": { ... }
}
```

### Change Phone Number

**Endpoint:** `POST /{MODE}/settings/change-phone`

**Description:** Change user's phone number (requires OTP verification)

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
  "message": "Phone number changed successfully",
  "data": { ... }
}
```

### Send Phone OTP

**Endpoint:** `POST /{MODE}/settings/send-phone-otp`

**Description:** Send OTP to phone number for verification

**Authentication:** Required
**Permission:** `edit_profile`

**Request Body:**
```json
{
  "phone": "+1234567890"
}
```

**Response:**
```json
{
  "success": true,
  "message": "OTP sent to phone successfully",
  "data": { ... }
}
```

### Update Theme

**Endpoint:** `POST /{MODE}/settings/update-theme`

**Description:** Update user's theme preference

**Authentication:** Required
**Permission:** `edit_profile`

**Request Body:**
```json
{
  "theme": "dark"
}
```

**Options:** `light`, `dark`, `auto`

**Response:**
```json
{
  "success": true,
  "message": "Theme updated successfully",
  "data": { ... }
}
```

### Deactivate Account

**Endpoint:** `POST /{MODE}/settings/deactivate-account`

**Description:** Deactivate user account

**Authentication:** Required
**Permission:** `edit_profile`

**Request Body:** None

**Response:**
```json
{
  "success": true,
  "message": "Account deactivated successfully",
  "data": { ... }
}
```

### Delete Account

**Endpoint:** `POST /{MODE}/settings/delete-account`

**Description:** Permanently delete user account

**Authentication:** Required
**Permission:** `edit_profile`

**Request Body:** None

**Response:**
```json
{
  "success": true,
  "message": "Account deleted successfully",
  "data": { ... }
}
```

### Get Settings

**Endpoint:** `GET /{MODE}/settings/get-settings`

**Description:** Get all user settings

**Authentication:** Required
**Permission:** `view_profile`

**Response:**
```json
{
  "success": true,
  "message": "Settings retrieved successfully",
  "data": {
    "profile": { ... },
    "theme": "dark",
    "language": "en",
    "timezone": "UTC"
  }
}
```

### Update Timezone

**Endpoint:** `POST /{MODE}/settings/update-timezone`

**Description:** Update user's timezone

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

## Dashboard & Analytics

### Dashboard Overview

**Endpoint:** `GET /{MODE}/dashboard/overview`

**Description:** Get comprehensive dashboard overview statistics

**Authentication:** Required
**Permission:** `view_dashboard`

**Response:**
```json
{
  "success": true,
  "message": "Dashboard overview retrieved successfully",
  "data": {
    "overview": {
      "total_users": 1000,
      "active_users": 850,
      "verified_users": 800,
      "email_verified": 750,
      "phone_verified": 700,
      "new_users": {
        "today": 10,
        "this_week": 50,
        "this_month": 200
      },
      "users_with_sign_in": 600
    }
  }
}
```

### Users by Status

**Endpoint:** `GET /{MODE}/dashboard/users-by-status`

**Description:** Get user statistics grouped by status

**Authentication:** Required
**Permission:** `view_dashboard`

**Response:**
```json
{
  "success": true,
  "message": "User statistics by status retrieved successfully",
  "data": {
    "users_by_status": [
      { "status": "ACTIVE", "count": 850 },
      { "status": "INACTIVE", "count": 150 }
    ]
  }
}
```

### Users by Type

**Endpoint:** `GET /{MODE}/dashboard/users-by-type`

**Description:** Get user statistics grouped by user type

**Authentication:** Required
**Permission:** `view_dashboard`

**Response:**
```json
{
  "success": true,
  "message": "User statistics by type retrieved successfully",
  "data": {
    "users_by_type": [
      { "user_type": "customer", "count": 800 },
      { "user_type": "business", "count": 200 }
    ]
  }
}
```

### Users by Auth Type

**Endpoint:** `GET /{MODE}/dashboard/users-by-auth-type`

**Description:** Get user statistics grouped by authentication type

**Authentication:** Required
**Permission:** `view_dashboard`

**Response:**
```json
{
  "success": true,
  "message": "User statistics by auth type retrieved successfully",
  "data": {
    "users_by_auth_type": [
      { "auth_type": "email", "count": 600 },
      { "auth_type": "phone", "count": 400 }
    ]
  }
}
```

### Users by Country

**Endpoint:** `GET /{MODE}/dashboard/users-by-country`

**Description:** Get user statistics grouped by country (top 20)

**Authentication:** Required
**Permission:** `view_dashboard`

**Response:**
```json
{
  "success": true,
  "message": "User statistics by country retrieved successfully",
  "data": {
    "users_by_country": [
      { "country": "US", "count": 300 },
      { "country": "UK", "count": 200 }
    ]
  }
}
```

### Users by Language

**Endpoint:** `GET /{MODE}/dashboard/users-by-language`

**Description:** Get user statistics grouped by language preference

**Authentication:** Required
**Permission:** `view_dashboard`

**Response:**
```json
{
  "success": true,
  "message": "User statistics by language retrieved successfully",
  "data": {
    "users_by_language": [
      { "language": "en", "count": 700 },
      { "language": "ar", "count": 300 }
    ]
  }
}
```

### User Growth

**Endpoint:** `GET /{MODE}/dashboard/user-growth`

**Description:** Get user growth statistics over time

**Authentication:** Required
**Permission:** `view_dashboard`

**Query Parameters:**
- `period`: `daily`, `weekly`, `monthly` (default: `daily`)
- `days`: Number of days to look back (default: 30, max: 365)

**Response:**
```json
{
  "success": true,
  "message": "User growth statistics retrieved successfully",
  "data": {
    "period": "daily",
    "growth": [
      { "period": "2025-01-01", "count": 10 },
      { "period": "2025-01-02", "count": 15 }
    ]
  }
}
```

### Role Statistics

**Endpoint:** `GET /{MODE}/dashboard/role-statistics`

**Description:** Get user statistics by role

**Authentication:** Required
**Permission:** `view_dashboard`

**Response:**
```json
{
  "success": true,
  "message": "Role statistics retrieved successfully",
  "data": {
    "role_statistics": {
      "superusers": 5,
      "admins": 10,
      "business": 50,
      "developers": 20,
      "accountants": 15,
      "regular_users": 900
    }
  }
}
```

### Recent Sign-ins

**Endpoint:** `GET /{MODE}/dashboard/recent-sign-ins`

**Description:** Get recent sign-in statistics

**Authentication:** Required
**Permission:** `view_dashboard`

**Query Parameters:**
- `hours`: Number of hours to look back (default: 24, max: 168)

**Response:**
```json
{
  "success": true,
  "message": "Recent sign-in statistics retrieved successfully",
  "data": {
    "recent_sign_ins": {
      "total_with_sign_in": 600,
      "last_hour": 10,
      "last_24_hours": 100,
      "today": 150
    }
  }
}
```

### All Statistics

**Endpoint:** `GET /{MODE}/dashboard/all-statistics`

**Description:** Get comprehensive dashboard statistics including all metrics

**Authentication:** Required
**Permission:** `view_dashboard`

**Response:**
```json
{
  "success": true,
  "message": "All dashboard statistics retrieved successfully",
  "data": {
    "overview": { ... },
    "by_status": [ ... ],
    "by_type": [ ... ],
    "by_auth_type": [ ... ],
    "roles": { ... }
  }
}
```

## Permissions & Groups

### Get All Permissions

**Endpoint:** `GET /{MODE}/permissions`

**Description:** Get list of all permissions

**Authentication:** Required
**Permission:** `view_permission`

**Response:**
```json
{
  "success": true,
  "message": "Permissions retrieved successfully",
  "data": {
    "permissions": [
      {
        "permission_id": "uuid",
        "name": "View Dashboard",
        "codename": "view_dashboard",
        "description": "Permission to view dashboard",
        "category": "dashboard"
      }
    ]
  }
}
```

### Get Permission by ID

**Endpoint:** `GET /{MODE}/permissions/:permission_id`

**Description:** Get a specific permission by ID

**Authentication:** Required
**Permission:** `view_permission`

**Parameters:**
- `permission_id` (path): Permission UUID

**Response:**
```json
{
  "success": true,
  "message": "Permission retrieved successfully",
  "data": {
    "permission": { ... }
  }
}
```

### Create Permission

**Endpoint:** `POST /{MODE}/permissions`

**Description:** Create a new permission

**Authentication:** Required
**Permission:** `add_permission`

**Request Body:**
```json
{
  "name": "View Dashboard",
  "codename": "view_dashboard",
  "description": "Permission to view dashboard",
  "category": "dashboard"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Permission created successfully",
  "data": {
    "permission": { ... }
  }
}
```

### Update Permission

**Endpoint:** `PUT /{MODE}/permissions/:permission_id`

**Description:** Update an existing permission

**Authentication:** Required
**Permission:** `edit_permission`

**Parameters:**
- `permission_id` (path): Permission UUID

**Request Body:**
```json
{
  "name": "View Dashboard Updated",
  "description": "Updated description"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Permission updated successfully",
  "data": {
    "permission": { ... }
  }
}
```

### Delete Permission

**Endpoint:** `DELETE /{MODE}/permissions/:permission_id`

**Description:** Delete a permission

**Authentication:** Required
**Permission:** `delete_permission`

**Parameters:**
- `permission_id` (path): Permission UUID

**Response:**
```json
{
  "success": true,
  "message": "Permission deleted successfully",
  "data": { ... }
}
```

### Get All Groups

**Endpoint:** `GET /{MODE}/groups`

**Description:** Get list of all groups with their permissions

**Authentication:** Required
**Permission:** `view_group`

**Response:**
```json
{
  "success": true,
  "message": "Groups retrieved successfully",
  "data": {
    "groups": [
      {
        "group_id": "uuid",
        "name": "Admin",
        "codename": "admin",
        "description": "Administrator group",
        "is_system": true,
        "is_active": true,
        "permissions": [ ... ]
      }
    ]
  }
}
```

### Get Group by ID

**Endpoint:** `GET /{MODE}/groups/:group_id`

**Description:** Get a specific group with its permissions

**Authentication:** Required
**Permission:** `view_group`

**Parameters:**
- `group_id` (path): Group UUID

**Response:**
```json
{
  "success": true,
  "message": "Group retrieved successfully",
  "data": {
    "group": { ... }
  }
}
```

### Create Group

**Endpoint:** `POST /{MODE}/groups`

**Description:** Create a new group

**Authentication:** Required
**Permission:** `add_group`

**Request Body:**
```json
{
  "name": "Moderator",
  "codename": "moderator",
  "description": "Moderator group",
  "is_system": false,
  "is_active": true
}
```

**Response:**
```json
{
  "success": true,
  "message": "Group created successfully",
  "data": {
    "group": { ... }
  }
}
```

### Update Group

**Endpoint:** `PUT /{MODE}/groups/:group_id`

**Description:** Update an existing group

**Authentication:** Required
**Permission:** `edit_group`

**Parameters:**
- `group_id` (path): Group UUID

**Request Body:**
```json
{
  "name": "Moderator Updated",
  "description": "Updated description"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Group updated successfully",
  "data": {
    "group": { ... }
  }
}
```

### Delete Group

**Endpoint:** `DELETE /{MODE}/groups/:group_id`

**Description:** Delete a group

**Authentication:** Required
**Permission:** `delete_group`

**Parameters:**
- `group_id` (path): Group UUID

**Response:**
```json
{
  "success": true,
  "message": "Group deleted successfully",
  "data": { ... }
}
```

### Assign Permissions to Group

**Endpoint:** `POST /{MODE}/groups/:group_id/permissions`

**Description:** Assign permissions to a group

**Authentication:** Required
**Permission:** `edit_group`

**Parameters:**
- `group_id` (path): Group UUID

**Request Body:**
```json
{
  "permission_ids": ["uuid1", "uuid2", "uuid3"]
}
```

**Response:**
```json
{
  "success": true,
  "message": "Permissions assigned to group successfully",
  "data": { ... }
}
```

### Get User Groups

**Endpoint:** `GET /{MODE}/users/:user_id/groups`

**Description:** Get all groups assigned to a user

**Authentication:** Required
**Permission:** `view_user`

**Parameters:**
- `user_id` (path): User UUID

**Response:**
```json
{
  "success": true,
  "message": "User groups retrieved successfully",
  "data": {
    "user_id": "uuid",
    "groups": [ ... ]
  }
}
```

### Get User Permissions

**Endpoint:** `GET /{MODE}/users/:user_id/permissions`

**Description:** Get all permissions for a user (from all groups)

**Authentication:** Required
**Permission:** `view_user`

**Parameters:**
- `user_id` (path): User UUID

**Response:**
```json
{
  "success": true,
  "message": "User permissions retrieved successfully",
  "data": {
    "user_id": "uuid",
    "permissions": [ ... ]
  }
}
```

### Assign Groups to User

**Endpoint:** `POST /{MODE}/users/:user_id/groups`

**Description:** Assign groups to a user

**Authentication:** Required
**Permission:** `assign_groups`

**Parameters:**
- `user_id` (path): User UUID

**Request Body:**
```json
{
  "group_ids": ["uuid1", "uuid2"]
}
```

**Response:**
```json
{
  "success": true,
  "message": "Groups assigned to user successfully",
  "data": { ... }
}
```

### Get My Groups

**Endpoint:** `GET /{MODE}/users/me/groups`

**Description:** Get all groups for the current authenticated user

**Authentication:** Required
**Permission:** `view_profile`

**Response:**
```json
{
  "success": true,
  "message": "Your groups retrieved successfully",
  "data": {
    "groups": [ ... ]
  }
}
```

### Get My Permissions

**Endpoint:** `GET /{MODE}/users/me/permissions`

**Description:** Get all permissions for the current authenticated user

**Authentication:** Required
**Permission:** `view_profile`

**Response:**
```json
{
  "success": true,
  "message": "Your permissions retrieved successfully",
  "data": {
    "permissions": [ ... ]
  }
}
```

## Activity Logging

### Create Activity Log

**Endpoint:** `POST /{MODE}/activity/logs`

**Description:** Create a new activity log entry

**Authentication:** Required
**Permission:** `edit_profile`

**Request Body:**
```json
{
  "level": "info",
  "message": "User performed action",
  "action": "login",
  "module": "authentication",
  "ip_address": "192.168.1.1",
  "user_agent": "Mozilla/5.0...",
  "endpoint": "/api/token",
  "method": "POST",
  "status_code": 200,
  "metadata": { "key": "value" }
}
```

**Level Options:** `info`, `warn`, `error`, `debug`, `audit`

**Response:**
```json
{
  "success": true,
  "message": "Activity log created successfully",
  "data": {
    "activity_log": { ... }
  }
}
```

### Get Activity Logs

**Endpoint:** `GET /{MODE}/activity/logs`

**Description:** Retrieve activity logs with filters

**Authentication:** Required
**Permission:** `view_activity_log`

**Query Parameters:**
- `user_id`: Filter by user ID
- `level`: Filter by log level (`info`, `warn`, `error`, `debug`, `audit`)
- `action`: Filter by action
- `module`: Filter by module
- `ip_address`: Filter by IP address
- `start_date`: Start date (ISO format)
- `end_date`: End date (ISO format)
- `limit`: Number of results (default: 100)
- `offset`: Pagination offset (default: 0)
- `order_by`: Sort field (default: `created_at`)
- `order`: Sort order (`asc`, `desc`, default: `desc`)

**Response:**
```json
{
  "success": true,
  "message": "Activity logs retrieved successfully",
  "data": {
    "activity_logs": [ ... ],
    "count": 50
  }
}
```

### Get Activity Log by ID

**Endpoint:** `GET /{MODE}/activity/logs/:log_id`

**Description:** Get a specific activity log by ID

**Authentication:** Required
**Permission:** `view_activity_log`

**Parameters:**
- `log_id` (path): Log UUID

**Response:**
```json
{
  "success": true,
  "message": "Activity log retrieved successfully",
  "data": {
    "activity_log": { ... }
  }
}
```

### Get User Activity Logs

**Endpoint:** `GET /{MODE}/activity/users/:user_id/logs`

**Description:** Get activity logs for a specific user

**Authentication:** Required
**Permission:** `view_activity_log`

**Parameters:**
- `user_id` (path): User UUID

**Query Parameters:**
- `start_date`: Start date (ISO format)
- `end_date`: End date (ISO format)
- `limit`: Number of results (default: 100)
- `offset`: Pagination offset (default: 0)

**Response:**
```json
{
  "success": true,
  "message": "User activity logs retrieved successfully",
  "data": {
    "user_id": "uuid",
    "activity_logs": [ ... ],
    "count": 25
  }
}
```

### Get My Activity Logs

**Endpoint:** `GET /{MODE}/activity/me/logs`

**Description:** Get activity logs for the current authenticated user

**Authentication:** Required
**Permission:** `view_profile`

**Query Parameters:**
- `start_date`: Start date (ISO format)
- `end_date`: End date (ISO format)
- `limit`: Number of results (default: 100)
- `offset`: Pagination offset (default: 0)

**Response:**
```json
{
  "success": true,
  "message": "Your activity logs retrieved successfully",
  "data": {
    "activity_logs": [ ... ],
    "count": 10
  }
}
```

### Get Activity Statistics

**Endpoint:** `GET /{MODE}/activity/statistics`

**Description:** Get activity log statistics

**Authentication:** Required
**Permission:** `view_activity_log`

**Query Parameters:**
- `user_id`: Filter by user ID
- `start_date`: Start date (ISO format)
- `end_date`: End date (ISO format)

**Response:**
```json
{
  "success": true,
  "message": "Activity statistics retrieved successfully",
  "data": {
    "statistics": {
      "total_logs": 1000,
      "by_level": { ... },
      "by_action": { ... },
      "by_module": { ... }
    }
  }
}
```

### Delete Old Activity Logs

**Endpoint:** `DELETE /{MODE}/activity/logs/cleanup`

**Description:** Delete activity logs older than specified days

**Authentication:** Required
**Permission:** `delete_activity_log`

**Query Parameters:**
- `days`: Days old (default: 90)

**Response:**
```json
{
  "success": true,
  "message": "Old activity logs deleted successfully",
  "data": {
    "deleted_count": 500,
    "days_old": 90
  }
}
```

## File Upload

### Upload Media

**Endpoint:** `POST /{MODE}/upload-media`

**Description:** Upload a media file either from URL or direct file upload to Google Cloud Storage

**Authentication:** Required
**Permission:** `add_upload`

**Request:** Multipart form data
- `file`: File to upload (max 15MB)
- `url`: URL to download file from (alternative to file upload)

**Response:**
```json
{
  "success": true,
  "message": "File uploaded successfully",
  "data": {
    "url": "https://storage.googleapis.com/bucket-name/media/users/user-uuid-file.ext"
  }
}
```

**Usage:**
- Upload file directly: Send `file` in multipart form data
- Upload from URL: Send `url` in form data
- File size limit: 15MB
- Supported formats: Images, documents, videos (based on content type)

### Delete Media

**Endpoint:** `DELETE /{MODE}/delete-media`

**Description:** Delete a media file from Google Cloud Storage

**Authentication:** Required
**Permission:** `delete_upload`

**Query Parameters:**
- `url`: GCS URL of the file to delete (required)

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

**Usage:**
- Provide the full GCS URL in the `url` query parameter
- URL must be from the configured Google Cloud Storage bucket
- Only files uploaded by the authenticated user can be deleted

---

## Error Codes

### Common Error Responses

**400 Bad Request:**
```json
{
  "success": false,
  "message": "Invalid request payload",
  "error": "Validation error details",
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
  "error": "Insufficient permissions",
  "statusCode": 403
}
```

**404 Not Found:**
```json
{
  "success": false,
  "message": "Resource not found",
  "error": "The requested resource does not exist",
  "statusCode": 404
}
```

**500 Internal Server Error:**
```json
{
  "success": false,
  "message": "Internal server error",
  "error": "Error details",
  "statusCode": 500
}
```

## Rate Limiting

All endpoints are subject to rate limiting:
- **Limit**: 200 requests per minute per IP address
- **Health endpoints**: Excluded from rate limiting
- **Response**: 429 Too Many Requests when limit exceeded

## Best Practices

1. **Always include Authorization header** for protected endpoints
2. **Handle errors gracefully** - Check `success` field in response
3. **Use appropriate HTTP methods** - GET for retrieval, POST for creation, PUT for updates, DELETE for deletion
4. **Validate input** before sending requests
5. **Handle pagination** for list endpoints using `limit` and `offset`
6. **Store tokens securely** - Never expose JWT tokens in client-side code
7. **Use HTTPS** in production for secure communication
8. **Implement retry logic** for transient errors
9. **Monitor rate limits** to avoid hitting limits
10. **Use appropriate permissions** - Request only necessary permissions

---

**Last Updated**: January 2025

