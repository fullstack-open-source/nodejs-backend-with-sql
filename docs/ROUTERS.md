# 📚 Router Documentation Index

> **Complete Reference Guide for All API Router Documentation**

This document provides a comprehensive index and quick reference to all router documentation files. Each router has detailed documentation with endpoints, workflows, and examples.

## 📋 Table of Contents

- [Documentation Overview](#documentation-overview)
- [Router Documentation](#router-documentation)
  - [Health & Monitoring](#health--monitoring)
  - [Authentication](#authentication)
  - [Profile Management](#profile-management)
  - [Dashboard & Analytics](#dashboard--analytics)
  - [Permissions & Groups](#permissions--groups)
  - [Activity Logging](#activity-logging)
  - [File Upload](#file-upload)
- [Quick Reference](#quick-reference)
- [Related Documentation](#related-documentation)

## Documentation Overview

The Node.js Backend API is organized into modular routers, each handling a specific domain of functionality. Each router has comprehensive documentation covering:

- **Endpoints**: All available API endpoints with detailed descriptions
- **Request/Response Formats**: Complete request and response examples
- **Workflows**: Step-by-step workflow diagrams
- **Authentication**: Authentication and permission requirements
- **Error Handling**: Common errors and error responses
- **Best Practices**: Recommended usage patterns

**Documentation Location:** All router documentation files are located in `/api/router/{router-name}/` directories.

## Router Documentation

### Health & Monitoring

**File:** [`/api/router/health/health.md`](../../api/router/health/health.md)

**Description:** Health check and system monitoring endpoints for service status, system information, and error tracking testing.

**Endpoints:**
- `GET /health` - Basic health check
- `GET /{MODE}/health/system` - Detailed system health information
- `GET /{MODE}/health/test-sentry` - Test Sentry error tracking

**Key Features:**
- Service availability checks
- System resource monitoring (CPU, memory, uptime)
- Environment information
- Sentry integration testing

**Use Cases:**
- Load balancer health checks
- System monitoring dashboards
- Error tracking validation

---

### Authentication

**File:** [`/api/router/authenticate/authenticate.md`](../../api/router/authenticate/authenticate.md)

**Description:** User authentication endpoints including login, registration, password management, and OTP verification.

**Endpoints:**
- `POST /{MODE}/token` - Login with password
- `POST /{MODE}/auth/login-with-password` - Alternative login endpoint
- `POST /{MODE}/auth/send-one-time-password` - Send OTP
- `POST /{MODE}/auth/verify-one-time-password` - Verify OTP
- `POST /{MODE}/auth/login-with-otp` - Login with OTP
- `POST /{MODE}/auth/verify` - Signup/Register
- `POST /{MODE}/auth/set-password` - Set password
- `POST /{MODE}/auth/change-password` - Change password
- `POST /{MODE}/auth/forget-password` - Reset password
- `POST /{MODE}/logout` - Logout user
- `POST /{MODE}/auth/check-user-availability` - Check if user exists
- `POST /{MODE}/auth/verify-email-and-phone` - Verify email/phone

**Key Features:**
- Password-based authentication
- OTP-based authentication (email, SMS, WhatsApp)
- User registration with verification
- Password management (set, change, reset)
- User availability checks

**Use Cases:**
- User login and registration
- Password recovery
- Two-factor authentication
- Account verification

---

### Profile Management

**File:** [`/api/router/authenticate/profile.md`](../../api/router/authenticate/profile.md)

**Description:** User profile and settings management endpoints including profile updates, media management, and account settings.

**Endpoints:**
- `GET /{MODE}/settings/profile` - Get current user profile
- `GET /{MODE}/settings/profile/:user_id` - Get user profile by ID
- `POST /{MODE}/settings/update-profile-picture` - Update profile picture
- `POST /{MODE}/settings/update-profile` - Update profile information
- `POST /{MODE}/settings/profile-accessibility` - Update profile accessibility
- `POST /{MODE}/settings/profile-language` - Update language preference
- `POST /{MODE}/settings/change-email` - Change email address
- `POST /{MODE}/settings/change-phone` - Change phone number
- `POST /{MODE}/settings/send-phone-otp` - Send phone OTP
- `POST /{MODE}/settings/update-theme` - Update theme preference
- `POST /{MODE}/settings/deactivate-account` - Deactivate account
- `POST /{MODE}/settings/delete-account` - Delete account
- `GET /{MODE}/settings/get-settings` - Get all settings
- `POST /{MODE}/settings/update-timezone` - Update timezone

**Key Features:**
- Profile information management
- Profile picture upload to Google Cloud Storage
- Email and phone number changes with OTP verification
- Theme, language, and timezone preferences
- Account deactivation and deletion

**Use Cases:**
- User profile management
- Account settings
- Contact information updates
- Preference management

---

### Dashboard & Analytics

**File:** [`/api/router/dashboard/dashboard.md`](../../api/router/dashboard/dashboard.md)

**Description:** Dashboard statistics and analytics endpoints for user data, growth metrics, and system health monitoring.

**Endpoints:**
- `GET /{MODE}/dashboard/overview` - Dashboard overview statistics
- `GET /{MODE}/dashboard/users-by-status` - Users grouped by status
- `GET /{MODE}/dashboard/users-by-type` - Users grouped by type
- `GET /{MODE}/dashboard/users-by-auth-type` - Users grouped by auth type
- `GET /{MODE}/dashboard/users-by-country` - Users grouped by country
- `GET /{MODE}/dashboard/users-by-language` - Users grouped by language
- `GET /{MODE}/dashboard/user-growth` - User growth statistics
- `GET /{MODE}/dashboard/role-statistics` - User statistics by role
- `GET /{MODE}/dashboard/recent-sign-ins` - Recent sign-in statistics
- `GET /{MODE}/dashboard/all-statistics` - All dashboard statistics

**Key Features:**
- Comprehensive user statistics
- Growth metrics (daily, weekly, monthly)
- User demographics (country, language, type)
- Role-based statistics
- Sign-in analytics

**Use Cases:**
- Administrative dashboards
- User analytics and reporting
- System monitoring
- Business intelligence

---

### Permissions & Groups

**File:** [`/api/router/permissions/permissions.md`](../../api/router/permissions/permissions.md)

**Description:** Role-based access control (RBAC) endpoints for managing permissions, groups, and user-group assignments.

**Endpoints:**

**Permissions:**
- `GET /{MODE}/permissions` - Get all permissions
- `GET /{MODE}/permissions/:permission_id` - Get permission by ID
- `POST /{MODE}/permissions` - Create permission
- `PUT /{MODE}/permissions/:permission_id` - Update permission
- `DELETE /{MODE}/permissions/:permission_id` - Delete permission

**Groups:**
- `GET /{MODE}/groups` - Get all groups
- `GET /{MODE}/groups/:group_id` - Get group by ID
- `POST /{MODE}/groups` - Create group
- `PUT /{MODE}/groups/:group_id` - Update group
- `DELETE /{MODE}/groups/:group_id` - Delete group
- `POST /{MODE}/groups/:group_id/permissions` - Assign permissions to group

**User Permissions & Groups:**
- `GET /{MODE}/users/:user_id/groups` - Get user groups
- `GET /{MODE}/users/:user_id/permissions` - Get user permissions
- `POST /{MODE}/users/:user_id/groups` - Assign groups to user
- `GET /{MODE}/users/me/groups` - Get current user groups
- `GET /{MODE}/users/me/permissions` - Get current user permissions

**Key Features:**
- Permission management (CRUD)
- Group management (CRUD)
- Permission-to-group assignment
- User-to-group assignment
- Permission aggregation from groups
- System group protection

**Use Cases:**
- Access control management
- Role-based permissions
- User authorization
- Security management

---

### Activity Logging

**File:** [`/api/router/activity/activity.md`](../../api/router/activity/activity.md)

**Description:** Activity logging and audit trail endpoints for tracking user activities, system events, and generating analytics.

**Endpoints:**
- `POST /{MODE}/activity/logs` - Create activity log entry
- `GET /{MODE}/activity/logs` - Get activity logs with filters
- `GET /{MODE}/activity/logs/:log_id` - Get activity log by ID
- `GET /{MODE}/activity/users/:user_id/logs` - Get user activity logs
- `GET /{MODE}/activity/me/logs` - Get current user activity logs
- `GET /{MODE}/activity/statistics` - Get activity statistics
- `DELETE /{MODE}/activity/logs/cleanup` - Delete old activity logs

**Key Features:**
- Comprehensive activity logging
- Advanced filtering (user, level, action, module, date range)
- User agent parsing (device, browser, OS)
- Activity statistics and analytics
- Log cleanup and maintenance

**Use Cases:**
- Audit trails
- Security monitoring
- User activity tracking
- Compliance reporting
- Debugging and troubleshooting

---

### File Upload

**File:** [`/api/router/upload/upload.md`](../../api/router/upload/upload.md)

**Description:** Media file upload and management endpoints for uploading files to Google Cloud Storage and managing uploaded files.

**Endpoints:**
- `POST /{MODE}/upload-media` - Upload media file (from file or URL)
- `DELETE /{MODE}/delete-media` - Delete media file from GCS

**Key Features:**
- Direct file upload (multipart form data)
- Upload from URL
- Google Cloud Storage integration
- File deletion from GCS
- Automatic file type detection
- 15MB file size limit

**Use Cases:**
- Profile picture uploads
- Document uploads
- Media file management
- Content delivery

---

## Quick Reference

### Authentication Requirements

| Router | Authentication | Common Permissions |
|--------|---------------|-------------------|
| Health | Not required (except test-sentry) | - |
| Authentication | Not required (most endpoints) | - |
| Profile | Required | `view_profile`, `edit_profile` |
| Dashboard | Required | `view_dashboard` |
| Permissions | Required | `view_permission`, `add_permission`, `edit_permission`, `delete_permission`, `view_group`, `add_group`, `edit_group`, `delete_group`, `assign_groups` |
| Activity | Required | `view_activity_log`, `edit_profile`, `delete_activity_log` |
| Upload | Required | `add_upload`, `delete_upload` |

### Base Paths

| Router | Base Path |
|--------|-----------|
| Health | `/health` or `/{MODE}/health` |
| Authentication | `/{MODE}/auth` or `/{MODE}/token` |
| Profile | `/{MODE}/settings` |
| Dashboard | `/{MODE}/dashboard` |
| Permissions | `/{MODE}/permissions`, `/{MODE}/groups`, `/{MODE}/users` |
| Activity | `/{MODE}/activity` |
| Upload | `/{MODE}/upload-media`, `/{MODE}/delete-media` |

### Common HTTP Methods

- **GET**: Retrieve data
- **POST**: Create new resources or perform actions
- **PUT**: Update existing resources
- **DELETE**: Delete resources

### Response Format

All endpoints return a consistent response format:

**Success:**
```json
{
  "success": true,
  "message": "Operation successful",
  "data": { ... },
  "meta": { ... }
}
```

**Error:**
```json
{
  "success": false,
  "message": "Error message",
  "error": "Error details",
  "statusCode": 400
}
```

---

## Related Documentation

### Main Documentation Files

1. **[APIUSES.md](./APIUSES.md)** - Complete API usage guide with all endpoints
2. **[ARCHITECTURE.md](./ARCHITECTURE.md)** - System architecture and design documentation
3. **[TECHNICAL.md](./TECHNICAL.md)** - Technical details, dependencies, and configuration

### Router Documentation Files

1. **[Health Router](../../api/router/health/health.md)** - Health check and monitoring
2. **[Authentication Router](../../api/router/authenticate/authenticate.md)** - User authentication
3. **[Profile Router](../../api/router/authenticate/profile.md)** - Profile management
4. **[Dashboard Router](../../api/router/dashboard/dashboard.md)** - Analytics and statistics
5. **[Permissions Router](../../api/router/permissions/permissions.md)** - RBAC and permissions
6. **[Activity Router](../../api/router/activity/activity.md)** - Activity logging
7. **[Upload Router](../../api/router/upload/upload.md)** - File upload and management

### Code Documentation

- **Source Code**: `/api/router/{router-name}/api.js` or `{router-name}.js`
- **Swagger Documentation**: Available at `/{MODE}/api-docs` (if configured)

---

## Documentation Structure

```
docs/
├── APIUSES.md          # Complete API usage guide
├── ARCHITECTURE.md     # System architecture
├── TECHNICAL.md        # Technical documentation
└── ROUTERS.md          # This file - Router documentation index

api/router/
├── health/
│   └── health.md       # Health & Monitoring documentation
├── authenticate/
│   ├── authenticate.md # Authentication documentation
│   └── profile.md      # Profile Management documentation
├── dashboard/
│   └── dashboard.md    # Dashboard documentation
├── permissions/
│   └── permissions.md  # Permissions & Groups documentation
├── activity/
│   └── activity.md     # Activity Logging documentation
└── upload/
    └── upload.md       # File Upload documentation
```

---

## Getting Started

1. **New to the API?** Start with [APIUSES.md](./APIUSES.md) for a complete overview
2. **Understanding Architecture?** Read [ARCHITECTURE.md](./ARCHITECTURE.md)
3. **Setting Up?** Check [TECHNICAL.md](./TECHNICAL.md) for technical details
4. **Working with Specific Router?** Navigate to the router documentation using the links above

---

## Contributing

When adding new endpoints or modifying existing ones:

1. Update the router's `.md` file in `/api/router/{router-name}/`
2. Update [APIUSES.md](./APIUSES.md) with the new endpoint
3. Update this index if adding a new router
4. Ensure Swagger documentation is updated in the code

---

**Last Updated**: January 2025

