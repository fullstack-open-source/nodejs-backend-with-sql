# 🔧 Technical Documentation

> **Comprehensive Technical Guide for Node.js Backend API**

This document provides detailed technical information about the Node.js Backend API, including technology stack, dependencies, configuration, and implementation details.

> **📖 Related Documentation:** [APIUSES.md](./APIUSES.md) | [ARCHITECTURE.md](./ARCHITECTURE.md) | [ROUTERS.md](./ROUTERS.md)

## 📋 Table of Contents

- [Technology Stack](#technology-stack)
- [Dependencies](#dependencies)
- [Project Structure](#project-structure)
- [Configuration Management](#configuration-management)
- [Database Schema](#database-schema)
- [Authentication & Security](#authentication--security)
- [API Versioning](#api-versioning)
- [Error Handling](#error-handling)
- [Logging System](#logging-system)
- [Performance Optimization](#performance-optimization)
- [Deployment Architecture](#deployment-architecture)

## Technology Stack

### Core Technologies

**Runtime & Framework**
- **Node.js 18+**: JavaScript runtime built on Chrome's V8 engine
- **Express.js 4.18+**: Minimal and flexible web application framework
- **JavaScript (ES6+)**: Modern JavaScript features and syntax

**Database & ORM**
- **PostgreSQL 16+**: Advanced open-source relational database
- **Prisma 7.0+**: Next-generation ORM with type-safe database access
- **pg (node-postgres)**: PostgreSQL client for Node.js
- **@prisma/adapter-pg**: Prisma adapter for PostgreSQL connection pooling

**Caching & Sessions**
- **Redis 7.2+**: In-memory data structure store
- **redis (node-redis)**: Redis client for Node.js

**Authentication & Security**
- **jsonwebtoken**: JWT implementation for token-based authentication
- **bcryptjs**: Password hashing library
- **helmet**: Security middleware for Express
- **express-rate-limit**: Rate limiting middleware
- **express-validator**: Request validation middleware
- **joi**: Schema validation library

**Monitoring & Logging**
- **winston**: Logging library with multiple transports
- **winston-daily-rotate-file**: Daily rotating file transport for Winston
- **morgan**: HTTP request logger middleware
- **@sentry/node**: Error tracking and performance monitoring
- **@sentry/profiling-node**: Performance profiling for Node.js

**API Documentation**
- **swagger-jsdoc**: Swagger specification generator from JSDoc comments
- **swagger-ui-express**: Swagger UI for Express

**File Upload & Storage**
- **multer**: Multipart/form-data handling middleware
- **@google-cloud/storage**: Google Cloud Storage client library

**Communication**
- **nodemailer**: Email sending library
- **twilio**: Cloud communications platform for SMS and WhatsApp

**Utilities**
- **axios**: HTTP client for making requests
- **compression**: Response compression middleware
- **cors**: Cross-Origin Resource Sharing middleware
- **dotenv**: Environment variable management
- **express-async-errors**: Async error handling for Express
- **moment**: Date manipulation library
- **uuid**: UUID generation library

**Process Management**
- **pm2**: Production process manager for Node.js applications

**Containerization**
- **Docker**: Containerization platform
- **Docker Compose**: Multi-container Docker application orchestration

## Dependencies

### Production Dependencies

```json
{
  "@google-cloud/storage": "^7.7.0",
  "@prisma/adapter-pg": "^7.0.0",
  "@prisma/client": "^7.0.0",
  "@sentry/node": "^8.0.0",
  "@sentry/profiling-node": "^8.55.0",
  "axios": "^1.6.5",
  "bcryptjs": "^2.4.3",
  "compression": "^1.7.4",
  "cors": "^2.8.5",
  "dotenv": "^16.3.1",
  "express": "^4.18.2",
  "express-async-errors": "^3.1.1",
  "express-rate-limit": "^7.1.5",
  "express-validator": "^7.0.1",
  "helmet": "^7.1.0",
  "joi": "^17.11.0",
  "jsonwebtoken": "^9.0.2",
  "moment": "^2.30.1",
  "morgan": "^1.10.0",
  "multer": "^1.4.5-lts.1",
  "nodemailer": "^6.9.7",
  "openai": "^4.20.1",
  "pg": "^8.16.3",
  "pm2": "^5.3.0",
  "prisma": "^7.0.0",
  "redis": "^4.6.12",
  "socket.io": "^4.6.1",
  "swagger-jsdoc": "^6.2.8",
  "swagger-ui-express": "^5.0.1",
  "twilio": "^4.20.0",
  "uuid": "^9.0.1",
  "winston": "^3.11.0",
  "winston-daily-rotate-file": "^4.7.1"
}
```

### Development Dependencies

```json
{
  "eslint": "^8.56.0",
  "jest": "^29.7.0",
  "nodemon": "^3.0.2",
  "supertest": "^6.3.3"
}
```

## Project Structure

### Directory Organization

```
api/
├── server.js                 # Main Express application entry point
├── package.json              # Dependencies and npm scripts
├── Dockerfile                # Multi-stage Docker build configuration
├── ecosystem.config.js       # PM2 process manager configuration
├── start.sh                  # Container startup script
├── prisma.config.ts          # Prisma configuration
│
├── router/                   # API route handlers
│   ├── authenticate/        # Authentication routes
│   ├── dashboard/           # Dashboard routes
│   ├── permissions/         # Permission management routes
│   ├── activity/            # Activity logging routes
│   ├── upload/              # File upload routes
│   └── health/              # Health check routes
│
├── src/                     # Source code modules
│   ├── authenticate/        # Authentication logic
│   ├── activity/           # Activity logging service
│   ├── cache/              # Redis cache utilities
│   ├── config/             # Configuration files
│   ├── db/                 # Database layer
│   ├── email/              # Email service
│   ├── enum/               # Application enumerations
│   ├── logger/             # Logging system
│   ├── middleware/         # Express middleware
│   ├── permissions/        # Permission system
│   ├── response/           # Response handlers
│   ├── sentry/             # Error tracking
│   ├── sms/                # SMS service
│   ├── storage/            # File storage
│   ├── utils/              # Utility functions
│   └── workers/            # Worker threads
│
├── prisma/                  # Prisma ORM
│   ├── schema.prisma       # Database schema definition
│   ├── seed.js             # Database seeding script
│   └── seed-defaults.js    # Default seed data
│
├── credentials/             # Service credentials
│   └── google-backend-master.json
│
├── logs/                    # Application logs
│   ├── errors-server.log   # Error logs
│   └── success-server.log  # Success logs
│
└── scripts/                 # Utility scripts
    ├── kill-port.sh        # Port cleanup script
    └── db-sync.sh          # Database sync script
```

## Configuration Management

### Environment Variables

All configuration is managed through environment variables loaded from `.env` file. See `example.env` for complete list of available variables.

### Configuration Categories

**Application Configuration**
- `MODE`: API version prefix (e.g., `prod/v1`, `dev/v1`)
- `API_MODE`: API mode (development, staging, production)
- `API_VERSION`: API version number
- `NODE_ENV`: Node.js environment
- `DEBUG_MODE`: Debug mode toggle

**Server Configuration**
- `API_INTERNAL_PORT`: Internal API port (default: 3000)
- `API_DEBUG_PORT`: External debug port (default: 8900)
- `PROXY_PORT`: Nginx proxy port (default: 9080)

**Database Configuration**
- `DATABASE_URL`: Complete PostgreSQL connection string
- `DATABASE_HOST`: Database host address
- `DATABASE_PORT`: Database port (default: 5432)
- `DATABASE_NAME`: Database name
- `DATABASE_USER`: Database username
- `DATABASE_PASSWORD`: Database password
- `DB_POOL_MAX`: Maximum connection pool size (default: 50)
- `DB_POOL_MIN`: Minimum connection pool size (default: 2)

**Redis Configuration**
- `REDIS_HOST`: Redis host address
- `REDIS_PORT`: Redis port (default: 6379)
- `REDIS_PASSWORD`: Redis password (optional)

**Security Configuration**
- `JWT_SECRET`: JWT secret key for token signing
- `JWT_EXPIRES_IN`: JWT token expiration time
- `MASTER_OTP`: Master OTP for testing

**External Services**
- `SENTRY_DSN`: Sentry error tracking DSN
- `GOOGLE_STORAGE_BUCKET_NAME`: GCS bucket name
- `EMAIL_HOST`: SMTP host address
- `TWILIO_ACCOUNT_SID`: Twilio account SID

## Database Schema

### Prisma Schema

The database schema is defined in `api/prisma/schema.prisma` using Prisma Schema Language.

**Key Models:**
- **User**: User accounts with authentication and profile data
- **Permission**: Granular permissions with codenames
- **Group**: User groups with permissions
- **GroupPermission**: Many-to-many relationship between Group and Permission
- **UserGroup**: Many-to-many relationship between User and Group
- **ActivityLog**: Comprehensive activity logging with metadata

### Database Migrations

**Development:**
```bash
npm run db:push  # Push schema directly to database
```

**Production:**
```bash
npx prisma migrate dev --name migration_name  # Create migration
npx prisma migrate deploy  # Apply migrations
```

## Authentication & Security

### JWT Authentication

- **Token Type**: Bearer token
- **Token Location**: Authorization header (`Authorization: Bearer <token>`)
- **Token Expiration**: Configurable via `JWT_EXPIRES_IN` (default: 7d)
- **Secret Key**: Configured via `JWT_SECRET` environment variable

### Password Security

- **Hashing Algorithm**: bcrypt
- **Salt Rounds**: 10 (default)
- **Password Requirements**: Enforced via validation middleware

### Security Middleware

**Helmet**: Sets security headers
- X-Content-Type-Options: nosniff
- X-Frame-Options: DENY
- X-XSS-Protection: 1; mode=block

**Rate Limiting**: Prevents abuse
- Window: 1 minute
- Max Requests: 200 per IP (configurable)

**Input Sanitization**: Removes null bytes and trims input
**Attack Detection**: SQL injection, XSS, command injection detection

## API Versioning

### Route Prefixing

All API routes are prefixed with the `MODE` environment variable:

- If `MODE=prod/v1`: Routes are `/prod/v1/*`
- If `MODE=dev/v1`: Routes are `/dev/v1/*`

**Example Routes:**
- `/prod/v1/authenticate`
- `/prod/v1/token`
- `/prod/v1/settings/profile`
- `/prod/v1/dashboard/overview`

**Exception:** `/health` endpoint is available without prefix for health checks.

## Error Handling

### Error Response Format

All errors follow a consistent format:

```json
{
  "success": false,
  "message": "Error message",
  "error": "Error details",
  "statusCode": 400
}
```

### Error Types

- **AUTH_INVALID_CREDENTIALS**: Invalid login credentials
- **AUTH_INVALID_PAYLOAD**: Invalid request payload
- **PROFILE_NOT_FOUND**: User profile not found
- **PERMISSION_DENIED**: Insufficient permissions
- **INTERNAL_ERROR**: Server error
- **VALIDATION_ERROR**: Request validation failed

### Global Error Handler

All errors are caught by the global error handler middleware and formatted consistently.

## Logging System

### Winston Logger

**Log Levels:**
- `error`: Error logs
- `warn`: Warning logs
- `info`: Information logs
- `debug`: Debug logs

**Log Files:**
- `logs/errors-server.log`: Error and warning logs
- `logs/success-server.log`: Info and success logs

**Log Rotation:**
- Max file size: 50MB
- Backup files: 1
- Format: JSON structured logging

### Request Logging

**Morgan**: HTTP request logging
- Format: Combined
- Output: Winston logger

**Custom Request Logger**: Additional request metadata logging

## Performance Optimization

### Connection Pooling

**PostgreSQL:**
- Min connections: 5 (configurable)
- Max connections: 50 (configurable)
- Idle timeout: 30 seconds
- Connection timeout: 10 seconds

**Prisma:**
- Automatic connection pooling via PostgreSQL adapter
- Connection reuse for better performance

### Response Compression

**Compression Middleware**: Gzip compression for responses
- Reduces bandwidth usage
- Improves response times

### Caching

**Redis:**
- OTP cache storage
- Session storage
- Rate limiting data
- Temporary data storage

### Worker Pool

**CPU-Intensive Tasks**: Processed in worker threads
- Prevents blocking main event loop
- Improves concurrent request handling

## Deployment Architecture

### Docker Multi-Stage Build

**Stage 1: Dependencies**
- Install and cache dependencies
- Install build tools

**Stage 2: Builder**
- Generate Prisma Client
- Prepare production build

**Stage 3: Production**
- Optimized production image
- Non-root user
- Minimal dependencies

### PM2 Process Management

**Cluster Mode**: Utilizes all CPU cores
- Instances: `max` (all CPU cores)
- Load balancing across instances
- Automatic restarts on failure

### Health Checks

**API Health Check**: `/health`
- Returns service status
- Includes environment information

**Docker Health Check**: Built into Dockerfile
- Interval: 30 seconds
- Timeout: 10 seconds
- Retries: 3

### Service Dependencies

**Startup Order:**
1. PostgreSQL database
2. Redis cache
3. API service (waits for database health)
4. Nginx proxy (waits for API health)
5. pgAdmin (waits for database health)

---

**Last Updated**: January 2025

