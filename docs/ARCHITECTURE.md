# 🏗️ Architecture Documentation

> **Comprehensive Architecture Guide for Node.js Backend API**

This document provides detailed architecture information, including system design, component interactions, data flow, and architectural decisions.

> **📖 Related Documentation:** [APIUSES.md](./APIUSES.md) | [TECHNICAL.md](./TECHNICAL.md) | [ROUTERS.md](./ROUTERS.md)

## 📋 Table of Contents

- [System Architecture](#system-architecture)
- [Application Architecture](#application-architecture)
- [Database Architecture](#database-architecture)
- [Security Architecture](#security-architecture)
- [Deployment Architecture](#deployment-architecture)
- [Network Architecture](#network-architecture)
- [Data Flow Architecture](#data-flow-architecture)
- [Component Interactions](#component-interactions)

## System Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    Client Applications                           │
│              (Web, Mobile, Third-party APIs)                    │
└────────────────────────────┬────────────────────────────────────┘
                              │
                              │ HTTPS
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    External Load Balancer                       │
│                    (SSL/TLS Termination)                       │
│                    (api.example.com)                          │
└────────────────────────────┬────────────────────────────────────┘
                              │
                              │ HTTP
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Internal Nginx Proxy                        │
│                    (Port 9080)                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Security Layer:                                         │  │
│  │  - Rate Limiting (200 req/min per IP)                    │  │
│  │  - Request Size Validation (15MB max)                     │  │
│  │  - Attack Pattern Detection                               │  │
│  │  - DDoS Protection                                        │  │
│  │  - Content Security Policy                               │  │
│  └──────────────────────────────────────────────────────────┘  │
└────────────────────────────┬────────────────────────────────────┘
                              │
                              │ Proxy to http://api:3000
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Express.js Application                       │
│                    (Port 3000)                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Middleware Layer:                                        │  │
│  │  1. Sentry Request Handler                                │  │
│  │  2. Helmet (Security Headers)                            │  │
│  │  3. CORS (Cross-Origin)                                   │  │
│  │  4. Body Parser                                           │  │
│  │  5. Compression                                           │  │
│  │  6. Request Logging                                       │  │
│  │  7. Rate Limiter                                          │  │
│  │  8. Security Middleware                                   │  │
│  └──────────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Application Layer:                                      │  │
│  │  - Route Handlers                                         │  │
│  │  - Business Logic                                         │  │
│  │  - Data Validation                                         │  │
│  │  - Authentication & Authorization                          │  │
│  └──────────────────────────────────────────────────────────┘  │
└────────────────────────────┬────────────────────────────────────┘
                              │
                ┌─────────────┴─────────────┐
                ▼                           ▼
┌──────────────────────────┐   ┌──────────────────────────┐
│   PostgreSQL Database    │   │   Redis Cache            │
│   (Prisma ORM)           │   │   (Sessions, Cache)      │
│   Port: 5432             │   │   Port: 6379            │
└──────────────────────────┘   └──────────────────────────┘
                │
                ▼
┌──────────────────────────┐
│   Google Cloud Storage   │
│   (Media Files)         │
└──────────────────────────┘
```

## Application Architecture

### Layered Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Presentation Layer                        │
│  - API Routes (router/)                                      │
│  - Request Validation                                        │
│  - Response Formatting                                       │
└────────────────────────────┬────────────────────────────────┘
                              │
┌────────────────────────────┴────────────────────────────────┐
│                    Business Logic Layer                      │
│  - Authentication Logic (src/authenticate/)                 │
│  - Permission Management (src/permissions/)                  │
│  - Activity Logging (src/activity/)                         │
│  - Dashboard Analytics (router/dashboard/)                  │
└────────────────────────────┬────────────────────────────────┘
                              │
┌────────────────────────────┴────────────────────────────────┐
│                    Data Access Layer                         │
│  - Prisma ORM (src/db/prisma.js)                            │
│  - Database Queries                                          │
│  - Connection Pooling                                        │
└────────────────────────────┬────────────────────────────────┘
                              │
┌────────────────────────────┴────────────────────────────────┐
│                    Infrastructure Layer                      │
│  - Logging (src/logger/)                                     │
│  - Error Tracking (src/sentry/)                             │
│  - Storage (src/storage/)                                   │
│  - Email/SMS (src/email/, src/sms/)                         │
│  - Cache (src/cache/)                                       │
└─────────────────────────────────────────────────────────────┘
```

### Module Dependencies

```
server.js
    │
    ├─► Middleware Stack
    │   ├─► Sentry
    │   ├─► Helmet
    │   ├─► CORS
    │   ├─► Body Parser
    │   ├─► Compression
    │   ├─► Request Logger
    │   ├─► Rate Limiter
    │   └─► Security Middleware
    │
    └─► Route Handlers
        ├─► Health Router
        ├─► Authentication Router
        │   ├─► authenticate.js (Login, OTP, Token)
        │   └─► profile.js (Profile Management)
        ├─► Dashboard Router
        ├─► Permissions Router
        ├─► Activity Router
        └─► Upload Router
            │
            └─► Business Logic Modules
                ├─► Authentication Module
                │   ├─► JWT Validation
                │   ├─► User Authentication
                │   └─► OTP Management
                ├─► Permission Module
                │   ├─► Permission Checking
                │   └─► Group Management
                ├─► Activity Module
                │   └─► Activity Logging
                └─► Storage Module
                    └─► Google Cloud Storage
```

## Database Architecture

### Entity Relationship Diagram

```
┌──────────────┐
│    User      │
│              │
│ - user_id    │
│ - email      │
│ - password   │
│ - status     │
└──────┬───────┘
       │
       │ 1:N
       │
┌──────┴──────────────────┐
│    UserGroup            │
│                         │
│ - user_id (FK)          │
│ - group_id (FK)         │
│ - assigned_at           │
└──────┬──────────────────┘
       │
       │ N:1
       │
┌──────┴───────┐
│    Group     │
│              │
│ - group_id   │
│ - name       │
│ - codename   │
└──────┬───────┘
       │
       │ 1:N
       │
┌──────┴──────────────────┐
│  GroupPermission        │
│                         │
│ - group_id (FK)         │
│ - permission_id (FK)    │
└──────┬──────────────────┘
       │
       │ N:1
       │
┌──────┴──────────┐
│   Permission    │
│                 │
│ - permission_id │
│ - name          │
│ - codename      │
└─────────────────┘

┌──────────────┐
│    User      │
│              │
└──────┬───────┘
       │
       │ 1:N
       │
┌──────┴──────────────┐
│   ActivityLog       │
│                     │
│ - log_id            │
│ - user_id (FK)      │
│ - message           │
│ - action            │
│ - metadata          │
└─────────────────────┘
```

### Database Models

**User Model**
- Primary Key: `user_id` (UUID)
- Unique Fields: `email`, `user_name`
- Authentication: `password`, `auth_type`
- Verification: `is_email_verified`, `is_phone_verified`
- Status: `status`, `is_active`, `is_verified`
- Profile: `first_name`, `last_name`, `profile_picture_url`, `bio`
- Relationships: `UserGroup[]`, `ActivityLog[]`

**Permission Model**
- Primary Key: `permission_id` (UUID)
- Unique Fields: `name`, `codename`
- Organization: `category`, `description`
- Relationships: `GroupPermission[]`

**Group Model**
- Primary Key: `group_id` (UUID)
- Unique Fields: `name`, `codename`
- Status: `is_system`, `is_active`
- Relationships: `GroupPermission[]`, `UserGroup[]`

**GroupPermission Model**
- Junction table for Group ↔ Permission (Many-to-Many)
- Unique constraint: `(group_id, permission_id)`
- Cascade delete on group or permission deletion

**UserGroup Model**
- Junction table for User ↔ Group (Many-to-Many)
- Unique constraint: `(user_id, group_id)`
- Metadata: `assigned_at`, `assigned_by_user_id`
- Cascade delete on user or group deletion

**ActivityLog Model**
- Primary Key: `log_id` (UUID)
- User Reference: `user_id` (nullable, FK to User)
- Logging: `level`, `message`, `action`, `module`
- Request Info: `ip_address`, `user_agent`, `device`, `browser`, `os`
- Endpoint Info: `endpoint`, `method`, `status_code`
- Metadata: `request_id`, `session_id`, `metadata` (JSONB), `error_details` (JSONB)
- Performance: `duration_ms`, `created_at`

## Security Architecture

### Security Layers

```
┌─────────────────────────────────────────────────────────────┐
│                    Layer 1: Network Security                 │
│  - External Load Balancer (SSL/TLS Termination)            │
│  - Firewall Rules                                            │
│  - DDoS Protection                                           │
└────────────────────────────┬────────────────────────────────┘
                              │
┌────────────────────────────┴────────────────────────────────┐
│                    Layer 2: Nginx Security                   │
│  - Rate Limiting (200 req/min per IP)                       │
│  - Request Size Validation (15MB max)                       │
│  - Attack Pattern Detection                                 │
│  - Content Security Policy Headers                          │
└────────────────────────────┬────────────────────────────────┘
                              │
┌────────────────────────────┴────────────────────────────────┐
│                    Layer 3: Application Security             │
│  - Helmet (Security Headers)                                │
│  - CORS (Origin Validation)                                 │
│  - Input Sanitization                                        │
│  - SQL Injection Detection                                  │
│  - XSS Detection                                            │
│  - Command Injection Detection                              │
└────────────────────────────┬────────────────────────────────┘
                              │
┌────────────────────────────┴────────────────────────────────┐
│                    Layer 4: Authentication                  │
│  - JWT Token Validation                                     │
│  - Password Hashing (bcrypt)                                │
│  - OTP Verification                                         │
└────────────────────────────┬────────────────────────────────┘
                              │
┌────────────────────────────┴────────────────────────────────┐
│                    Layer 5: Authorization                   │
│  - Permission Checking                                      │
│  - Role-Based Access Control                                │
│  - Group-Based Permissions                                  │
└─────────────────────────────────────────────────────────────┘
```

### Authentication Flow

```
1. Client Request with Credentials
   │
   ├─► Validate Request Format
   │
   ├─► Authenticate User
   │   ├─► Check Email/Phone
   │   ├─► Verify Password/OTP
   │   └─► Check User Status
   │
   ├─► Generate JWT Token
   │   ├─► Include User ID
   │   ├─► Include Permissions
   │   └─► Set Expiration
   │
   └─► Return Access Token
```

### Authorization Flow

```
1. Authenticated Request
   │
   ├─► Extract JWT Token
   │
   ├─► Validate Token
   │   ├─► Verify Signature
   │   ├─► Check Expiration
   │   └─► Extract User Data
   │
   ├─► Check Permission
   │   ├─► Get User Groups
   │   ├─► Get Group Permissions
   │   └─► Check Required Permission
   │
   └─► Allow/Deny Request
```

## Deployment Architecture

### Docker Compose Services

```
┌─────────────────────────────────────────────────────────────┐
│                    Docker Network                            │
│         (nodejs_backend_with_postgresql_network)            │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │     API      │  │      DB       │  │    Redis     │     │
│  │  Container   │  │  Container   │  │  Container   │     │
│  │  Port: 3000  │  │  Port: 5432  │  │  Port: 6379  │     │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘     │
│         │                 │                  │              │
│         └─────────────────┼──────────────────┘              │
│                           │                                  │
│  ┌──────────────┐  ┌──────┴───────┐                        │
│  │    Nginx     │  │   pgAdmin    │                        │
│  │  Container   │  │  Container   │                        │
│  │  Port: 80    │  │  Port: 80    │                        │
│  └──────┬───────┘  └──────────────┘                        │
│         │                                                    │
│         └─► Exposed to Host                                 │
│             Port: 9080 (Nginx)                              │
│             Port: 5050 (pgAdmin)                            │
└─────────────────────────────────────────────────────────────┘
```

### Service Communication

**Internal Communication (Docker Network):**
- API → PostgreSQL: `postgresql://postgres:postgres@nodejs-backend-db:5432/postgres`
- API → Redis: `redis://nodejs-backend-redis:6379`
- Nginx → API: `http://api:3000`
- pgAdmin → PostgreSQL: `nodejs-backend-db:5432`

**External Access:**
- Client → Nginx: `http://localhost:9080` or `https://api.example.com`
- Client → pgAdmin: `http://localhost:5050`
- Client → API (Direct): `http://localhost:8900` (debug port)

## Network Architecture

### Network Flow

```
Internet
    │
    │ HTTPS (Port 443)
    ▼
External Load Balancer
    │
    │ HTTP (Port 80)
    ▼
Internal Nginx (Port 9080)
    │
    │ HTTP (Port 3000)
    ▼
Express.js Application
    │
    ├─► PostgreSQL (Port 5432)
    └─► Redis (Port 6379)
```

### Port Mapping

**Host → Container:**
- `9080:80` → Nginx
- `8900:3000` → API (Debug)
- `5050:80` → pgAdmin
- `5432` → PostgreSQL (Internal only)
- `6379` → Redis (Internal only)

## Data Flow Architecture

### Request Processing Flow

```
1. Client Request
   │
   ├─► External Proxy (SSL/TLS)
   │
   ├─► Nginx Proxy
   │   ├─► Rate Limiting Check
   │   ├─► Request Size Validation
   │   ├─► Attack Pattern Detection
   │   └─► Forward to API
   │
   ├─► Express Middleware
   │   ├─► Sentry Context Capture
   │   ├─► Security Headers (Helmet)
   │   ├─► CORS Validation
   │   ├─► Body Parsing
   │   ├─► Compression
   │   ├─► Request Logging
   │   ├─► Rate Limiting
   │   └─► Input Sanitization
   │
   ├─► Route Handler
   │   ├─► JWT Authentication (if required)
   │   ├─► Permission Check (if required)
   │   ├─► Request Validation
   │   ├─► Business Logic
   │   ├─► Database Query (Prisma)
   │   └─► Response Formatting
   │
   ├─► Activity Logging
   │   └─► Log to Database
   │
   └─► Response
       ├─► Error Handling (if error)
       ├─► Sentry Error Capture (if error)
       └─► Client Response
```

### Database Query Flow

```
Route Handler
    │
    ├─► Prisma Client
    │   │
    │   ├─► Connection Pool
    │   │   └─► PostgreSQL Connection
    │   │
    │   └─► Query Execution
    │       ├─► Type-Safe Query
    │       ├─► Parameter Binding
    │       └─► Result Mapping
    │
    └─► Response Data
```

## Component Interactions

### Authentication Component

```
Authentication Router
    │
    ├─► Request Validation
    │   └─► Schema Validation (Joi)
    │
    ├─► User Authentication
    │   ├─► getUserByEmailOrPhone()
    │   ├─► authenticateUserWithData()
    │   └─► updateLastSignIn()
    │
    ├─► Token Generation
    │   └─► generateAccessToken()
    │
    └─► Response
        └─► SUCCESS.response()
```

### Permission Component

```
Permission Router
    │
    ├─► JWT Validation
    │   └─► validateRequest()
    │
    ├─► Permission Check
    │   └─► checkPermission('view_permission')
    │
    ├─► Business Logic
    │   ├─► getAllPermissions()
    │   ├─► createPermission()
    │   └─► assignPermissionsToGroup()
    │
    └─► Response
        └─► SUCCESS.response()
```

### Activity Logging Component

```
Activity Router
    │
    ├─► Request Metadata Extraction
    │   ├─► IP Address
    │   ├─► User Agent
    │   ├─► Device Info
    │   └─► Request Details
    │
    ├─► Activity Log Creation
    │   └─► createActivityLog()
    │
    └─► Database Storage
        └─► ActivityLog Model
```

---

**Last Updated**: January 2025


