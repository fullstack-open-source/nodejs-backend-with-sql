# Dashboard Router

> **Complete Documentation for Dashboard Analytics and Statistics Endpoints**

This router provides comprehensive dashboard statistics and analytics for user management, including user counts, growth metrics, role statistics, and sign-in analytics.

## 📋 Table of Contents

- [Overview](#overview)
- [Endpoints](#endpoints)
  - [Dashboard Overview](#dashboard-overview)
  - [Users by Status](#users-by-status)
  - [Users by Type](#users-by-type)
  - [Users by Auth Type](#users-by-auth-type)
  - [Users by Country](#users-by-country)
  - [Users by Language](#users-by-language)
  - [User Growth](#user-growth)
  - [Role Statistics](#role-statistics)
  - [Recent Sign-ins](#recent-sign-ins)
  - [All Statistics](#all-statistics)
- [Workflows](#workflows)
- [Error Handling](#error-handling)

## Overview

The Dashboard router provides analytics and statistics endpoints for monitoring user data, growth metrics, and system health. These endpoints are essential for:
- **Administrative Dashboards**: Display key metrics and KPIs
- **User Analytics**: Track user growth and demographics
- **System Monitoring**: Monitor user activity and engagement
- **Reporting**: Generate reports for stakeholders

**Base Path:** `/{MODE}/dashboard`

**Authentication:** All endpoints require authentication

**Permissions:** All endpoints require `view_dashboard` permission

## Endpoints

### Dashboard Overview

**Endpoint:** `GET /{MODE}/dashboard/overview`

**Description:** Returns comprehensive dashboard overview statistics including total users, active users, verified users, and new user counts.

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

**Workflow:**
```
1. Authenticated Request
   │
   ├─► Validate JWT Token
   │
   ├─► Check Permission (view_dashboard)
   │
   ├─► Calculate Date Boundaries
   │   ├─► Today (00:00:00)
   │   ├─► Tomorrow (00:00:00)
   │   ├─► Week Ago (7 days)
   │   └─► Month Start (1st of month)
   │
   ├─► Execute Parallel Queries
   │   ├─► Total Users Count
   │   ├─► Active Users Count (is_active = true)
   │   ├─► Verified Users Count (is_verified = true)
   │   ├─► Email Verified Count
   │   ├─► Phone Verified Count
   │   ├─► New Users Today
   │   ├─► New Users This Week
   │   ├─► New Users This Month
   │   └─► Users With Sign-in (last_sign_in_at not null)
   │
   └─► Return Aggregated Statistics
```

**Metrics Explained:**
- `total_users`: Total number of registered users
- `active_users`: Users with `is_active = true`
- `verified_users`: Users with `is_verified = true`
- `email_verified`: Users with verified email addresses
- `phone_verified`: Users with verified phone numbers
- `new_users.today`: Users created today
- `new_users.this_week`: Users created in last 7 days
- `new_users.this_month`: Users created this month
- `users_with_sign_in`: Users who have signed in at least once

---

### Users by Status

**Endpoint:** `GET /{MODE}/dashboard/users-by-status`

**Description:** Returns count of users grouped by status (ACTIVE, INACTIVE, etc.).

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

**Workflow:**
```
1. Authenticated Request
   │
   ├─► Validate JWT Token
   │
   ├─► Check Permission (view_dashboard)
   │
   ├─► Group Users by Status
   │   └─► prisma.user.groupBy({ by: ['status'] })
   │
   ├─► Count Users per Status
   │   └─► Order by count (descending)
   │
   └─► Return Status Statistics
```

**Status Values:**
- `ACTIVE`: Active users
- `INACTIVE`: Inactive users
- Other custom statuses as defined in the system

---

### Users by Type

**Endpoint:** `GET /{MODE}/dashboard/users-by-type`

**Description:** Returns count of users grouped by user_type (customer, business, etc.).

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

**Workflow:**
```
1. Authenticated Request
   │
   ├─► Validate JWT Token
   │
   ├─► Check Permission (view_dashboard)
   │
   ├─► Group Users by Type
   │   └─► prisma.user.groupBy({ by: ['user_type'] })
   │
   ├─► Count Users per Type
   │   └─► Order by count (descending)
   │
   └─► Return Type Statistics
```

**User Types:**
- `customer`: Regular customers
- `business`: Business accounts
- Other custom types as defined in the system

---

### Users by Auth Type

**Endpoint:** `GET /{MODE}/dashboard/users-by-auth-type`

**Description:** Returns count of users grouped by authentication type (email, phone, etc.).

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

**Workflow:**
```
1. Authenticated Request
   │
   ├─► Validate JWT Token
   │
   ├─► Check Permission (view_dashboard)
   │
   ├─► Group Users by Auth Type
   │   └─► prisma.user.groupBy({ by: ['auth_type'] })
   │
   ├─► Count Users per Auth Type
   │   └─► Order by count (descending)
   │
   └─► Return Auth Type Statistics
```

**Auth Types:**
- `email`: Email-based authentication
- `phone`: Phone-based authentication

---

### Users by Country

**Endpoint:** `GET /{MODE}/dashboard/users-by-country`

**Description:** Returns count of users grouped by country (top 20 countries).

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
      { "country": "UK", "count": 200 },
      { "country": "CA", "count": 150 }
    ]
  }
}
```

**Workflow:**
```
1. Authenticated Request
   │
   ├─► Validate JWT Token
   │
   ├─► Check Permission (view_dashboard)
   │
   ├─► Group Users by Country
   │   └─► prisma.user.groupBy({ by: ['country'], take: 20 })
   │
   ├─► Count Users per Country
   │   └─► Order by count (descending)
   │
   └─► Return Top 20 Countries
```

**Note:** Returns top 20 countries by user count.

---

### Users by Language

**Endpoint:** `GET /{MODE}/dashboard/users-by-language`

**Description:** Returns count of users grouped by language preference.

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

**Workflow:**
```
1. Authenticated Request
   │
   ├─► Validate JWT Token
   │
   ├─► Check Permission (view_dashboard)
   │
   ├─► Group Users by Language
   │   └─► prisma.user.groupBy({ by: ['language'] })
   │
   ├─► Count Users per Language
   │   └─► Order by count (descending)
   │
   └─► Return Language Statistics
```

**Language Codes:** ISO 639-1 codes (en, ar, etc.)

---

### User Growth

**Endpoint:** `GET /{MODE}/dashboard/user-growth`

**Description:** Returns user sign-up statistics over time (daily, weekly, monthly).

**Authentication:** Required
**Permission:** `view_dashboard`

**Query Parameters:**
- `period` (optional): Time period for growth statistics
  - `daily` (default): Daily growth
  - `weekly`: Weekly growth
  - `monthly`: Monthly growth
- `days` (optional): Number of days to look back (for daily period, default: 30, max: 365)

**Request:**
```http
GET /dev/v1/dashboard/user-growth?period=daily&days=30 HTTP/1.1
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "message": "User growth statistics retrieved successfully",
  "data": {
    "period": "daily",
    "growth": [
      { "period": "2025-01-01", "count": 10 },
      { "period": "2025-01-02", "count": 15 },
      { "period": "2025-01-03", "count": 12 }
    ]
  }
}
```

**Workflow:**
```
1. Authenticated Request
   │
   ├─► Validate JWT Token
   │
   ├─► Check Permission (view_dashboard)
   │
   ├─► Extract Query Parameters
   │   ├─► period: daily/weekly/monthly (default: daily)
   │   └─► days: number (default: 30, max: 365)
   │
   ├─► Execute Raw SQL Query
   │   ├─► Daily: DATE(created_at) with last N days
   │   ├─► Weekly: DATE_TRUNC('week', created_at) with last 12 weeks
   │   └─► Monthly: DATE_TRUNC('month', created_at) with last 12 months
   │
   ├─► Format Results
   │   └─► Map to period and count
   │
   └─► Return Growth Statistics
```

**Use Cases:**
- Growth trend analysis
- User acquisition metrics
- Time-series visualization
- Reporting

---

### Role Statistics

**Endpoint:** `GET /{MODE}/dashboard/role-statistics`

**Description:** Returns count of users by role (admin, business, developer, etc.).

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

**Workflow:**
```
1. Authenticated Request
   │
   ├─► Validate JWT Token
   │
   ├─► Check Permission (view_dashboard)
   │
   ├─► Get All Users
   │   └─► prisma.user.findMany({ select: { user_id: true } })
   │
   ├─► For Each User
   │   ├─► Get User Groups
   │   │   └─► getUserGroups(user_id)
   │   │
   │   └─► Count by Group Codename
   │       ├─► super_admin
   │       ├─► admin
   │       ├─► business
   │       ├─► developer
   │       ├─► accountant
   │       └─► user
   │
   └─► Return Role Statistics
```

**Note:** This endpoint iterates through all users to count roles. For large user bases, consider caching or optimization.

**Roles:**
- `superusers`: Users with super_admin group
- `admins`: Users with admin group
- `business`: Users with business group
- `developers`: Users with developer group
- `accountants`: Users with accountant group
- `regular_users`: Users with user group

---

### Recent Sign-ins

**Endpoint:** `GET /{MODE}/dashboard/recent-sign-ins`

**Description:** Returns users who signed in recently within specified hours.

**Authentication:** Required
**Permission:** `view_dashboard`

**Query Parameters:**
- `hours` (optional): Number of hours to look back (default: 24, max: 168)

**Request:**
```http
GET /dev/v1/dashboard/recent-sign-ins?hours=24 HTTP/1.1
Authorization: Bearer <token>
```

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

**Workflow:**
```
1. Authenticated Request
   │
   ├─► Validate JWT Token
   │
   ├─► Check Permission (view_dashboard)
   │
   ├─► Extract Query Parameters
   │   └─► hours: number (default: 24, max: 168)
   │
   ├─► Calculate Date Boundaries
   │   ├─► One Hour Ago
   │   ├─► N Hours Ago (from query)
   │   └─► Today (00:00:00)
   │
   ├─► Execute Parallel Queries
   │   ├─► Total Users With Sign-in (last_sign_in_at not null)
   │   ├─► Sign-ins Last Hour
   │   ├─► Sign-ins Last N Hours
   │   └─► Sign-ins Today
   │
   └─► Return Sign-in Statistics
```

**Metrics:**
- `total_with_sign_in`: Total users who have signed in at least once
- `last_hour`: Users who signed in within last hour
- `last_{N}_hours`: Users who signed in within last N hours
- `today`: Users who signed in today

---

### All Statistics

**Endpoint:** `GET /{MODE}/dashboard/all-statistics`

**Description:** Returns comprehensive dashboard statistics including all metrics from other endpoints.

**Authentication:** Required
**Permission:** `view_dashboard`

**Response:**
```json
{
  "success": true,
  "message": "All dashboard statistics retrieved successfully",
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
      }
    },
    "by_status": [
      { "status": "ACTIVE", "count": 850 },
      { "status": "INACTIVE", "count": 150 }
    ],
    "by_type": [
      { "user_type": "customer", "count": 800 },
      { "user_type": "business", "count": 200 }
    ],
    "by_auth_type": [
      { "auth_type": "email", "count": 600 },
      { "auth_type": "phone", "count": 400 }
    ],
    "roles": {
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

**Workflow:**
```
1. Authenticated Request
   │
   ├─► Validate JWT Token
   │
   ├─► Check Permission (view_dashboard)
   │
   ├─► Calculate Date Boundaries
   │   ├─► Today, Tomorrow, Week Ago, Month Start
   │
   ├─► Execute All Queries in Parallel
   │   ├─► Overview Statistics (9 queries)
   │   ├─► Users by Status (groupBy)
   │   ├─► Users by Type (groupBy)
   │   ├─► Users by Auth Type (groupBy)
   │   └─► Role Statistics (iterate users)
   │
   ├─► Aggregate All Results
   │
   └─► Return Comprehensive Statistics
```

**Use Cases:**
- Dashboard initialization
- Comprehensive reporting
- Single API call for all metrics
- Admin panel data loading

---

## Workflows

### Complete Dashboard Data Flow

```
┌─────────────────────────────────────────────────────────────┐
│              Dashboard Statistics Request                   │
└────────────────────────────┬────────────────────────────────┘
                              │
                              ▼
                    ┌─────────────────┐
                    │  Validate Auth  │
                    └────────┬────────┘
                             │
                             ▼
                    ┌─────────────────┐
                    │ Check Permission │
                    └────────┬────────┘
                             │
                ┌────────────┴────────────┐
                │                         │
                ▼                         ▼
        ┌───────────────┐         ┌───────────────┐
        │ Single Metric │         │ All Metrics   │
        └───────┬───────┘         └───────┬───────┘
                │                         │
                ▼                         ▼
        ┌───────────────┐         ┌───────────────┐
        │ Execute Query │         │ Parallel Queries│
        └───────┬───────┘         └───────┬───────┘
                │                         │
                └────────────┬────────────┘
                             │
                             ▼
                    ┌─────────────────┐
                    │ Format Results  │
                    └────────┬────────┘
                             │
                             ▼
                    ┌─────────────────┐
                    │ Return Response │
                    └─────────────────┘
```

## Error Handling

### Common Error Responses

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
  "error": "Insufficient permissions. Requires view_dashboard permission",
  "statusCode": 403
}
```

**500 Internal Server Error:**
```json
{
  "success": false,
  "message": "Dashboard error",
  "error": "Error details",
  "statusCode": 500
}
```

### Error Handling Workflow

```
1. Error Occurs
   │
   ├─► Log Error
   │   └─► Winston Logger with module: 'Dashboard'
   │
   ├─► Format Error Response
   │   └─► ERROR.fromMap('DASHBOARD_ERROR')
   │
   └─► Return Error Response
       └─► Appropriate Status Code
```

---

## Best Practices

1. **Caching**: Consider caching dashboard statistics for better performance
2. **Pagination**: For large datasets, implement pagination
3. **Optimization**: Role statistics endpoint may be slow for large user bases - consider optimization
4. **Rate Limiting**: Implement rate limiting for dashboard endpoints
5. **Data Aggregation**: Use database aggregation functions for better performance
6. **Date Boundaries**: Always use proper date boundaries for time-based queries
7. **Parallel Queries**: Use Promise.all() for parallel queries when possible
8. **Error Handling**: Handle database errors gracefully

---

## Performance Considerations

1. **Role Statistics**: This endpoint iterates through all users - consider caching or background jobs
2. **User Growth**: Raw SQL queries are used for date aggregations - ensure proper indexing
3. **All Statistics**: Combines multiple queries - may be slower, consider caching
4. **Database Indexing**: Ensure proper indexes on:
   - `created_at` (for growth queries)
   - `last_sign_in_at` (for sign-in queries)
   - `status`, `user_type`, `auth_type`, `country`, `language` (for groupBy queries)

---

**Last Updated**: January 2025

