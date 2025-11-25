# 🚀 Node.js Backend API

[![Node.js](https://img.shields.io/badge/Node.js-18%2B-green.svg)](https://nodejs.org)
[![Express](https://img.shields.io/badge/Express-4.18%2B-blue.svg)](https://expressjs.com)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16%2B-blue.svg)](https://postgresql.org)
[![Prisma](https://img.shields.io/badge/Prisma-7.0%2B-purple.svg)](https://prisma.io)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Status](https://img.shields.io/badge/Status-Production%20Ready-brightgreen.svg)]()
[![Docker](https://img.shields.io/badge/Docker-Ready-blue.svg)](https://docker.com)

> **Enterprise-Grade Node.js Backend API with Advanced Features**

Node.js Backend is a comprehensive, production-ready RESTful API built with Express.js, featuring JWT authentication, role-based access control, real-time activity logging, advanced security middleware, and comprehensive monitoring capabilities.

**Repository**: [https://github.com/mrdasdeveloper/nodejs-backend](https://github.com/mrdasdeveloper/nodejs-backend)

## 📋 Table of Contents

- [🚀 Features](#-features)
- [🏗️ Architecture](#️-architecture)
  - [System Architecture](#system-architecture)
  - [Request Flow](#request-flow)
  - [Middleware Stack](#middleware-stack)
  - [Database Architecture](#database-architecture)
  - [Module Structure](#module-structure)
- [📦 Installation & Setup](#-installation--setup)
  - [Prerequisites](#prerequisites)
  - [Quick Start](#quick-start)
  - [Development Setup](#development-setup)
  - [Production Setup](#production-setup)
  - [Docker Setup](#docker-setup)
- [🔄 Complete Project Workflow](#-complete-project-workflow)
  - [Service Connection Architecture](#service-connection-architecture)
  - [Service Startup Order](#service-startup-order)
  - [Connection Flow](#connection-flow)

## 🚀 Features

### 🎯 Core Capabilities

- **RESTful API**: Comprehensive REST API with Express.js framework
- **JWT Authentication**: Secure token-based authentication system
- **Role-Based Access Control**: Flexible permission system with groups and permissions
- **Activity Logging**: Comprehensive audit trail with detailed metadata
- **File Upload**: Google Cloud Storage integration for media files
- **Email & SMS**: Twilio and Nodemailer integration for notifications
- **Error Tracking**: Sentry integration for production monitoring and error tracking
- **API Documentation**: Auto-generated Swagger/OpenAPI documentation
- **Request Queue**: Rate limiting and request queuing for traffic management
- **Worker Pool**: CPU-intensive task processing with worker threads
- **Docker Ready**: Production-ready containerization with multi-stage builds
- **PM2 Support**: Process management with cluster mode for high availability

### 🔧 Technical Features

- **Express.js 4.18+**: Modern web framework for building APIs
- **PostgreSQL 16+**: Robust relational database with advanced features
- **Prisma ORM**: Type-safe database access with connection pooling
- **Redis**: Caching and session management for improved performance
- **JWT**: Secure token-based authentication and authorization
- **Winston**: Professional logging system with file rotation
- **Helmet**: Security headers for protection against common vulnerabilities
- **Rate Limiting**: Request throttling to prevent abuse
- **Compression**: Response compression for optimized bandwidth usage
- **CORS**: Cross-origin resource sharing with whitelist validation
- **Swagger**: Interactive API documentation with Swagger UI
- **Nginx Reverse Proxy**: Production-ready reverse proxy configuration

## 🏗️ Architecture

### System Architecture

The system follows a layered architecture with clear separation of concerns:

```
┌───────────────────────────────────────────────────────────────┐
│                        External Proxy                         │
│                    (api.example.com)                          │
│                    SSL/TLS Termination                        │
└────────────────────────────┬──────────────────────────────────┘
                              │
                              ▼
┌────────────────────────────────────────────────────────────────┐
│                    Internal Nginx Proxy                        │
│                    (Port 9080:80)                              │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Security Layer:                                         │  │
│  │  - Rate Limiting (200 req/min per IP)                    │  │
│  │  - Request Size Validation (15MB max)                    │  │
│  │  - Attack Pattern Detection                              │  │
│  │  - Content Security Policy                               │  │
│  │  - DDoS Protection                                       │  │
│  └──────────────────────────────────────────────────────────┘  │
└────────────────────────────┬───────────────────────────────────┘
                             │
                             ▼
┌────────────────────────────────────────────────────────────────┐
│                    Express.js Application                      │
│                    (Port 3000)                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Middleware Stack:                                       │  │
│  │  1. Sentry Request Handler                               │  │
│  │  2. Helmet (Security Headers)                            │  │
│  │  3. CORS (Cross-Origin)                                  │  │
│  │  4. Body Parser (JSON/URL-encoded)                       │  │
│  │  5. Compression                                          │  │
│  │  6. Morgan (Request Logging)                             │  │
│  │  7. Request Logger (Custom)                              │  │
│  │  8. Rate Limiter                                         │  │
│  │  9. Security Middleware (Custom)                         │  │
│  └──────────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Application Modules:                                    │  │
│  │  - Authentication (JWT, OTP, Login)                      │  │
│  │  - Profile Management                                    │  │
│  │  - Permissions (Groups, Permissions)                     │  │
│  │  - Dashboard (Analytics)                                 │  │
│  │  - Activity Logging                                      │  │
│  │  - File Upload (GCS)                                     │  │
│  │  - Health Monitoring                                     │  │
│  └──────────────────────────────────────────────────────────┘  │
└────────────────────────────┬──────────────────────────────-────┘
                             │
                ┌────────────┴─────────────┐
                ▼                          ▼
┌──────────────────────────┐   ┌──────────────────────────┐
│   PostgreSQL Database    │   │   Redis Cache            │
│   (Prisma ORM)           │   │   (Sessions, Cache)      │
│   - User Data            │   │   - Session Storage      │
│   - Permissions          │   │   - OTP Cache            │
│   - Activity Logs        │   │   - Rate Limiting        │
│   - Groups               │   │   - Temporary Data       │
└──────────────────────────┘   └──────────────────────────┘
                │
                ▼
┌──────────────────────────┐
│   Google Cloud Storage   │
│   (Media & Static Files) │
│   - User Uploads         │
│   - Generated Content    │
│   - Static Assets        │
└──────────────────────────┘
```

### Request Flow

```
1. Client Request
   │
   ├─► External Proxy (api.example.com)
   │
   ├─► Internal Nginx (Port 9080)
   │   ├─► Security Checks (Rate Limiting, Attack Detection)
   │   ├─► Request Size Validation
   │   ├─► Content Security Policy Headers
   │   └─► Proxy to Express (http://api:3000)
   │
   ├─► Express Middleware Stack
   │   ├─► Sentry Request Handler
   │   │   └─► Request Context Capture
   │   │
   │   ├─► Helmet
   │   │   └─► Security Headers
   │   │
   │   ├─► CORS
   │   │   └─► Origin Validation
   │   │
   │   ├─► Body Parser
   │   │   ├─► JSON Parsing (15MB limit)
   │   │   └─► URL-encoded Parsing
   │   │
   │   ├─► Compression
   │   │   └─► Response Compression
   │   │
   │   ├─► Morgan + Request Logger
   │   │   └─► Request Logging
   │   │
   │   ├─► Rate Limiter
   │   │   └─► Request Throttling (200/min)
   │   │
   │   └─► Security Middleware
   │       ├─► Input Sanitization
   │       ├─► SQL Injection Detection
   │       ├─► XSS Detection
   │       └─► Command Injection Detection
   │
   ├─► Route Handler
   │   ├─► JWT Authentication (if required)
   │   ├─► Permission Check (if required)
   │   ├─► Request Validation
   │   ├─► Business Logic
   │   ├─► Database Operations (Prisma)
   │   └─► Response Formatting
   │
   ├─► Activity Logging
   │   └─► Log to Database
   │
   └─► Response
       ├─► Error Handling (if any)
       ├─► Sentry Error Capture (if error)
       ├─► Security Headers
       └─► Client Response
```

### Middleware Stack

The middleware stack processes requests in a specific order to ensure security, performance, and reliability:

1. **Sentry Request Handler** - Captures request context for error tracking and performance monitoring
2. **Helmet** - Sets security headers including X-Content-Type-Options, X-Frame-Options, and X-XSS-Protection
3. **CORS** - Handles cross-origin requests with whitelist validation for allowed origins
4. **Body Parser** - Parses JSON and URL-encoded request bodies with 15MB size limit
5. **Compression** - Compresses responses using gzip algorithm for bandwidth optimization
6. **Morgan + Request Logger** - Logs HTTP requests with detailed metadata including IP, method, path, and response time
7. **Rate Limiter** - Throttles requests to 200 requests per minute per IP address
8. **Security Middleware** - Sanitizes input data and detects attack patterns including SQL injection, XSS, and command injection
9. **Route Handlers** - Application-specific logic execution
10. **Error Handler** - Catches and formats errors with appropriate status codes
11. **Sentry Error Handler** - Captures errors for monitoring and alerting

### Database Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    PostgreSQL Database                      │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  User Model                                          │   │
│  │  - user_id (UUID, Primary Key)                       │   │
│  │  - email, phone_number, user_name                    │   │
│  │  - password, auth_type                               │   │
│  │  - is_email_verified, is_phone_verified              │   │
│  │  - status, is_active, is_verified                    │   │
│  │  - profile_picture_url, bio                          │   │
│  │  - Relationships: UserGroup[], ActivityLog[]         │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Permission Model                                    │   │
│  │  - permission_id (UUID, Primary Key)                 │   │
│  │  - name, codename (unique)                           │   │
│  │  - description, category                             │   │
│  │  - Relationships: GroupPermission[]                  │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Group Model                                         │   │
│  │  - group_id (UUID, Primary Key)                      │   │
│  │  - name, codename (unique)                           │   │
│  │  - description, is_system, is_active                 │   │
│  │  - Relationships: GroupPermission[], UserGroup[]     │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  GroupPermission Model (Many-to-Many)                │   │
│  │  - id (UUID, Primary Key)                            │   │
│  │  - group_id (FK → Group)                             │   │
│  │  - permission_id (FK → Permission)                   │   │
│  │  - Unique constraint: (group_id, permission_id)      │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  UserGroup Model (Many-to-Many)                      │   │
│  │  - id (UUID, Primary Key)                            │   │
│  │  - user_id (FK → User)                               │   │
│  │  - group_id (FK → Group)                             │   │
│  │  - assigned_at, assigned_by_user_id                  │   │
│  │  - Unique constraint: (user_id, group_id)            │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  ActivityLog Model                                   │   │
│  │  - log_id (UUID, Primary Key)                        │   │
│  │  - user_id (FK → User, nullable)                     │   │
│  │  - level, message, action, module                    │   │
│  │  - ip_address, user_agent, device, browser, os       │   │
│  │  - endpoint, method, status_code                     │   │
│  │  - request_id, session_id                            │   │
│  │  - metadata, error_details (JSONB)                   │   │
│  │  - duration_ms, created_at                           │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### Module Structure

```
NodeJs Backend API
├── 📁 api/                              # Main application directory
│   ├── 📄 server.js                     # Express server entry point
│   ├── 📄 Dockerfile                    # Multi-stage Docker build
│   ├── 📄 ecosystem.config.js           # PM2 configuration
│   ├── 📄 package.json                  # Dependencies and scripts
│   ├── 📄 start.sh                      # Container startup script
│   │
│   ├── 📁 router/                       # API route handlers
│   │   ├── 🔐 authenticate/              # Authentication routes
│   │   │   ├── authenticate.js          # Login, OTP, token management
│   │   │   ├── profile.js               # User profile management
│   │   │   ├── models.js                # Request validation schemas
│   │   │   ├── query.js                 # Database queries
│   │   │   └── utils.js                 # Helper functions
│   │   │
│   │   ├── 📊 dashboard/                # Dashboard routes
│   │   │   └── api.js                   # Analytics and statistics
│   │   │
│   │   ├── 🔑 permissions/              # Permission management
│   │   │   └── api.js                   # Groups, permissions, users
│   │   │
│   │   ├── 📝 activity/                 # Activity logging
│   │   │   └── api.js                   # Activity log endpoints
│   │   │
│   │   ├── 📤 upload/                   # File upload
│   │   │   └── api.js                   # Media upload endpoints
│   │   │
│   │   └── ❤️ health/                   # Health monitoring
│   │       ├── api.js                   # Health check endpoints
│   │       └── test-sentry.js           # Sentry test endpoint
│   │
│   ├── 📁 src/                          # Source code modules
│   │   ├── 🔐 authenticate/             # Authentication logic
│   │   │   ├── authenticate.js          # JWT validation
│   │   │   ├── checkpoint.js            # User authentication
│   │   │   ├── models.js                # User models
│   │   │   └── otp_cache.js             # OTP management
│   │   │
│   │   ├── 📊 activity/                 # Activity logging
│   │   │   └── activityLog.js          # Activity log service
│   │   │
│   │   ├── 💾 cache/                    # Caching layer
│   │   │   └── cache.js                # Redis cache utilities
│   │   │
│   │   ├── ⚙️ config/                   # Configuration
│   │   │   └── swagger.js               # Swagger/OpenAPI config
│   │   │
│   │   ├── 🗄️ db/                       # Database layer
│   │   │   ├── prisma.js                # Prisma client setup
│   │   │   ├── index.js                 # Database utilities
│   │   │   └── postgres/                # PostgreSQL utilities
│   │   │       ├── postgres.js          # Connection pool
│   │   │       └── initTriggers.js      # Database triggers
│   │   │
│   │   ├── 📧 email/                    # Email service
│   │   │   ├── email.js                 # Email sending
│   │   │   └── template.js              # Email templates
│   │   │
│   │   ├── 📋 enum/                     # Enumerations
│   │   │   └── enum.js                  # Application enums
│   │   │
│   │   ├── 📝 logger/                   # Logging system
│   │   │   └── logger.js                # Winston logger
│   │   │
│   │   ├── 🛡️ middleware/               # Express middleware
│   │   │   ├── errorHandler.js          # Global error handler
│   │   │   ├── permissionMiddleware.js   # Permission checking
│   │   │   ├── requestLogger.js         # Request logging
│   │   │   ├── requestQueue.js          # Request queuing
│   │   │   └── securityMiddleware.js    # Security checks
│   │   │
│   │   ├── 🔑 permissions/               # Permission system
│   │   │   └── permissions.js            # Permission utilities
│   │   │
│   │   ├── 📤 response/                  # Response handlers
│   │   │   ├── success.js               # Success responses
│   │   │   ├── error.js                 # Error responses
│   │   │   └── map.js                   # Response mapping
│   │   │
│   │   ├── 🐛 sentry/                    # Error tracking
│   │   │   └── sentry.js                # Sentry configuration
│   │   │
│   │   ├── 📱 sms/                       # SMS service
│   │   │   └── sms.js                   # Twilio integration
│   │   │
│   │   ├── 💾 storage/                   # File storage
│   │   │   └── storage.js               # Google Cloud Storage
│   │   │
│   │   ├── 🛠️ utils/                     # Utilities
│   │   │   ├── debug.js                 # Debug utilities
│   │   │   └── workerUtils.js           # Worker pool utilities
│   │   │
│   │   └── 👷 workers/                   # Worker threads
│   │       ├── workerPool.js            # Worker pool manager
│   │       └── cpuTaskWorker.js         # CPU task worker
│   │
│   ├── 📁 prisma/                        # Prisma ORM
│   │   ├── schema.prisma                # Database schema
│   │   ├── seed.js                      # Database seeding
│   │   └── seed-defaults.js             # Default seed data
│   │
│   ├── 📁 credentials/                   # Service credentials
│   │   └── google-backend-master.json   # GCS credentials
│   │
│   ├── 📁 logs/                          # Application logs
│   │   ├── errors-server.log            # Error logs
│   │   └── success-server.log           # Success logs
│   │
│   └── 📁 scripts/                       # Utility scripts
│       ├── kill-port.sh                 # Port cleanup
│       └── db-sync.sh                   # Database sync
│
├── 📁 nginx/                             # Nginx configuration
│   ├── nginx.conf                        # Main nginx config
│   ├── proxy.conf                        # Proxy settings
│   ├── security.conf                    # Security headers
│   └── conf.d/                          # Additional configs
│       ├── default.conf                 # Default server config
│       └── security.conf                # Security rules
│
├── 📄 docker-compose.yaml                # Docker Compose config
├── 📄 reload.sh                          # Deployment script
└── 📄 README.md                          # This file
```

## 📦 Installation & Setup

### Prerequisites

**System Requirements:**
- **OS**: Linux (Ubuntu 20.04+), macOS, or Windows with WSL2
- **Node.js**: 18.0 or higher
- **npm**: 9.0 or higher
- **PostgreSQL**: 12+ (for production)
- **Redis**: 6+ (optional, for caching)
- **Docker**: 20.10+ (for containerized deployment)
- **Docker Compose**: 2.0+ (for multi-container orchestration)
- **Google Cloud Storage**: Account and bucket (for media files)

**Development Tools:**
- Git 2.30+
- Code editor (VS Code recommended)
- Postman or similar API testing tool

### Quick Start

#### Step 1: Clone Repository

```bash
git clone https://github.com/mrdasdeveloper/nodejs-backend.git
cd nodejs-backend
```

#### Step 2: Setup Environment

```bash
# Copy example environment file
cp example.env .env

# Edit .env file with your configuration
nano .env
```

#### Step 3: Start Services with Docker Compose

```bash
# Create Docker network (if not exists)
docker network create nodejs_backend_with_postgresql_network

# Start all services
docker compose up -d

# Check service status
docker compose ps

# View logs
docker compose logs -f api
```

#### Step 4: Setup Database Schema

```bash
# Generate Prisma Client
docker compose exec api npm run prisma:generate

# Push schema to database
docker compose exec api npm run db:push

# Seed database (optional)
docker compose exec api npm run db:seed
```

#### Step 5: Access Services

- **API Base**: http://localhost:9080
- **API Docs**: http://localhost:9080/api-docs
- **Health Check**: http://localhost:9080/health (no prefix) or http://localhost:9080/{MODE}/health
- **API Routes**: http://localhost:9080/{MODE}/* (e.g., /prod/v1/authenticate, /dev/v1/token)
- **pgAdmin**: http://localhost:5050 (if enabled)

**Note:** Replace `{MODE}` with your configured MODE value (e.g., `prod/v1` or `dev/v1`)

### API Route Prefix (MODE)

All API routes are prefixed with the `MODE` environment variable. This allows you to version your API and separate environments.

**Configuration in `.env`:**
```bash
MODE=prod/v1    # For production API version 1
# or
MODE=dev/v1     # For development API version 1
```

**API Route Examples:**

If `MODE=prod/v1`, all routes will be prefixed with `/prod/v1/`:
- Health Check: `http://localhost:9080/prod/v1/health`
- Authentication: `http://localhost:9080/prod/v1/authenticate`
- Login: `http://localhost:9080/prod/v1/token`
- Profile: `http://localhost:9080/prod/v1/settings`
- Dashboard: `http://localhost:9080/prod/v1/dashboard`
- Permissions: `http://localhost:9080/prod/v1/permissions`
- Activity: `http://localhost:9080/prod/v1/activity`

If `MODE=dev/v1`, all routes will be prefixed with `/dev/v1/`:
- Health Check: `http://localhost:9080/dev/v1/health`
- Authentication: `http://localhost:9080/dev/v1/authenticate`
- Login: `http://localhost:9080/dev/v1/token`
- Profile: `http://localhost:9080/dev/v1/settings`
- Dashboard: `http://localhost:9080/dev/v1/dashboard`
- Permissions: `http://localhost:9080/dev/v1/permissions`
- Activity: `http://localhost:9080/dev/v1/activity`

**Note:** The `/health` endpoint is available without the MODE prefix for health checks:
- Direct Health Check: `http://localhost:9080/health` (no prefix)

### Development Setup

#### Step 1: System Preparation

```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Install Node.js 18+
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install Docker (optional, for containerized development)
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo apt install docker-compose-plugin -y
```

#### Step 2: Project Setup

```bash
# Clone repository
git clone https://github.com/mrdasdeveloper/nodejs-backend.git
cd nodejs-backend/api

# Install dependencies
npm install
```

#### Step 3: Environment Configuration

```bash
# Copy example environment file
cp ../example.env ../.env

# Edit .env file with your settings
nano ../.env
```

#### Step 4: Database Setup (Local PostgreSQL)

```bash
# Install PostgreSQL
sudo apt install postgresql postgresql-contrib -y

# Create database and user
sudo -u postgres psql << EOF
CREATE DATABASE nodejs_backend;
CREATE USER nodejs_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE nodejs_backend TO nodejs_user;
\q
EOF

# Update .env with local database connection
# DATABASE_URL=postgresql://nodejs_user:your_password@localhost:5432/nodejs_backend
```

#### Step 5: Prisma Setup

```bash
# Generate Prisma Client
npm run prisma:generate

# Push schema to database
npm run db:push

# Open Prisma Studio (optional)
npm run prisma:studio
```

#### Step 6: Seed Database (Optional)

```bash
# Seed with default data
npm run db:seed
```

#### Step 7: Start Development Server

```bash
# Development mode with auto-reload
npm run dev

# Or start directly
npm start
```

#### Step 8: Access Application

- **API Base**: http://localhost:3000
- **API Docs**: http://localhost:3000/api-docs
- **Health Check**: http://localhost:3000/health (no prefix) or http://localhost:3000/{MODE}/health
- **API Routes**: http://localhost:3000/{MODE}/* (e.g., /prod/v1/authenticate, /dev/v1/token)
- **Prisma Studio**: http://localhost:5555 (if running)

**Note:** Replace `{MODE}` with your configured MODE value (e.g., `prod/v1` or `dev/v1`)

### Production Setup

#### Step 1: Server Preparation

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 18+
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install PM2
npm install -g pm2

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo apt install docker-compose-plugin -y
```

#### Step 2: Clone and Setup Project

```bash
# Clone repository
git clone https://github.com/mrdasdeveloper/nodejs-backend.git
cd nodejs-backend

# Create production .env file
cp example.env .env

# Edit .env file with production settings
nano .env
```

**Important**: Update `.env` file with production values:
- Set `NODE_ENV=production`
- Set `API_MODE=production`
- Set `DEBUG_MODE=false`
- Configure production database credentials
- Set strong JWT secret (generate with: `openssl rand -base64 32`)
- Configure production Redis, Sentry, and other services

#### Step 3: Deploy with Docker (Recommended)

```bash
# Build and start services
docker compose build
docker compose up -d

# Check status
docker compose ps

# View logs
docker compose logs -f api

# Run migrations
docker compose exec api npm run db:push
```

#### Step 4: Or Deploy with PM2

```bash
cd api

# Generate Prisma Client
npm run prisma:generate

# Start with PM2
npm run pm2:start

# Check status
pm2 status

# View logs
pm2 logs

# Monitor
pm2 monit
```

#### Step 5: Configure External Proxy (Nginx)

```bash
# Install Nginx
sudo apt install nginx -y

# Create Nginx config
sudo nano /etc/nginx/sites-available/api.example.com
```

Add configuration:

```nginx
server {
    listen 80;
    server_name api.example.com;

    location / {
        proxy_pass http://localhost:9080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/api.example.com /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### Docker Setup

#### Step 1: Prerequisites

```bash
# Check Docker version
docker --version
docker compose version

# Install Docker if needed
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo apt install docker-compose-plugin -y
```

#### Step 2: Docker Compose Services

The `docker-compose.yaml` includes:
- **api**: Node.js application (Express server)
- **db**: PostgreSQL database
- **redis**: Redis cache and session store
- **nginx**: Internal reverse proxy
- **pgadmin**: PostgreSQL admin interface

#### Step 3: Build and Start Services

```bash
# Create Docker network
docker network create nodejs_backend_with_postgresql_network

# Build images
docker compose build

# Start all services
docker compose up -d

# View all logs
docker compose logs -f

# View specific service logs
docker compose logs -f api
docker compose logs -f nginx
```

#### Step 4: Service Management

```bash
# Stop services
docker compose stop

# Start services
docker compose start

# Restart services
docker compose restart

# Restart specific service
docker compose restart api

# Stop and remove containers
docker compose down

# Stop, remove containers, and volumes
docker compose down -v
```

#### Step 5: Execute Commands in Containers

```bash
# Run Prisma migrations
docker compose exec api npm run db:push

# Generate Prisma Client
docker compose exec api npm run prisma:generate

# Access container shell
docker compose exec api sh

# Run database seed
docker compose exec api npm run db:seed

# Access PostgreSQL
docker compose exec db psql -U postgres -d postgres
```

#### Step 6: Health Checks

```bash
# Check service health
docker compose ps

# Test API health endpoint
curl http://localhost:8900/health

# Test Nginx health endpoint
curl http://localhost:9080/health

# Check database connection
docker compose exec api npm run prisma:studio
```

#### Step 7: Network Configuration

```bash
# Create network (if not exists)
docker network create nodejs_backend_with_postgresql_network

# Verify network
docker network ls

# Inspect network
docker network inspect nodejs_backend_with_postgresql_network
```

## 🔄 Complete Project Workflow

### Service Connection Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    Docker Network                               │
│              (nodejs_backend_with_postgresql_network)           │
│                                                                 │
│  ┌──────────────┐                                               │
│  │   Client     │                                               │
│  │  (Browser)   │                                               │
│  └──────┬───────┘                                               │
│         │                                                       │
│         │ HTTP/HTTPS (Port 9080)                                │
│         ▼                                                       │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  Nginx Service                                           │   │
│  │  Container: nodejs-backend-nginx                         │   │
│  │  Port: 9080:80 (host:container)                          │   │
│  │  Config: ./nginx/nginx.conf                              │   │
│  └──────┬───────────────────────────────────────────────────┘   │
│         │                                                       │
│         │ Proxy to http://api:3000                              │
│         ▼                                                       │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  API Service (Node.js/Express)                           │   │
│  │  Container: nodejs-backend                               │   │
│  │  Port: 3000 (internal only)                              │   │
│  │  ┌────────────────────────────────────────────────────┐  │   │
│  │  │  Prisma Client                                     │  │   │
│  │  │  - Reads schema.prisma                             │  │   │
│  │  │  - Generates type-safe queries                     │  │   │
│  │  └──────┬─────────────────────────────────────────────┘  │   │
│  └─────────┼────────────────────────────────────────────────┘   │
│            │                                                    │
│            │ PostgreSQL Connection                              │
│            │ (postgresql://postgres:postgres@                   │
│            │  nodejs-backend-db:5432/postgres)                  │
│            ▼                                                    │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  PostgreSQL Service                                      │   │
│  │  Container: nodejs-backend-db                            │   │
│  │  Port: 5432 (internal only)                              │   │
│  │  Volume: postgres_data (persistent)                      │   │
│  │  ┌────────────────────────────────────────────────────┐  │   │
│  │  │  Database: postgres                                │  │   │
│  │  │  - User table                                      │  │   │
│  │  │  - Permission table                                │  │   │
│  │  │  - Group table                                     │  │   │
│  │  │  - ActivityLog table                               │  │   │
│  │  └────────────────────────────────────────────────────┘  │   │
│  └──────────────────────────────────────────────────────────┘   │
│            ▲                                                    │
│            │                                                    │
│            │ Redis Connection                                   │
│            │ (redis://nodejs-backend-redis:6379)                │
│            │                                                    │
│  ┌─────────┴──────────────────────────────────────────────┐     │
│  │  Redis Service                                         │     │
│  │  Container: nodejs-backend-redis                       │     │
│  │  Port: 6379 (internal only)                            │     │
│  │  ┌──────────────────────────────────────────────────┐  │     │
│  │  │  Cache Storage                                   │  │     │
│  │  │  - OTP cache                                     │  │     │
│  │  │  - Session storage                               │  │     │
│  │  │  - Rate limiting data                            │  │     │
│  │  └──────────────────────────────────────────────────┘  │     │
│  └────────────────────────────────────────────────────────┘     │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  pgAdmin Service (Optional)                              │   │
│  │  Container: nodejs-backend-pgadmin                       │   │
│  │  Port: 5050:80 (host:container)                          │   │
│  │  ┌────────────────────────────────────────────────────┐  │   │
│  │  │  Web Interface                                     │  │   │
│  │  │  - Database management                             │  │   │
│  │  │  - Query execution                                 │  │   │
│  │  │  - Schema visualization                            │  │   │
│  │  └──────┬─────────────────────────────────────────────┘  │   │
│  │         │                                                │   │
│  │         │ PostgreSQL Connection                          │   │
│  │         │ (nodejs-backend-db:5432)                       │   │
│  │         ▼                                                │   │
│  │  ┌──────────────────────────────────────────────────┐    │   │
│  │  │  Connects to PostgreSQL Service                  │    │   │
│  │  └──────────────────────────────────────────────────┘    │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

### Service Startup Order

```
1. Docker Network
   └─► nodejs_backend_with_postgresql_network

2. Database Services (Start First)
   ├─► PostgreSQL (nodejs-backend-db:5432)
   └─► Redis (nodejs-backend-redis:6379)

3. API Service (Waits for Database Health Checks)
   ├─► Connects to PostgreSQL via Prisma
   └─► Connects to Redis for Cache

4. Nginx Service (Waits for API Health Check)
   └─► Proxies to API (http://api:3000)

5. pgAdmin Service (Optional, Waits for Database)
   └─► Connects to PostgreSQL
```

### Connection Flow

```
Client Request
    │
    ▼
Port 9080 (Host) ──► Nginx ──► Port 3000 ──► API Service
                                         │
                                         ├─► PostgreSQL (Port 5432)
                                         └─► Redis (Port 6379)
```

---

## 📄 License & Open Source

This project is **open source** and **free to use** for all purposes with **no restrictions**.

### 🎯 Open Source License

This project is released under the **[MIT License](LICENSE)**, which means:

- ✅ **Free to use** for any purpose (commercial or personal)
- ✅ **No restrictions** on usage, modification, or distribution
- ✅ **No warranty** provided
- ✅ **Attribution** is appreciated but not required

**📄 Full License Text**: See [LICENSE](LICENSE) file for complete license terms and conditions.

### 🙏 Technologies & Acknowledgments

This project is built with amazing open-source technologies. Special thanks to:

#### Core Framework & Runtime
- **[Node.js](https://nodejs.org/)** - JavaScript runtime built on Chrome's V8 engine
- **[Express.js](https://expressjs.com/)** - Fast, unopinionated web framework for Node.js

#### Database & ORM
- **[PostgreSQL](https://www.postgresql.org/)** - Advanced open-source relational database
- **[Prisma](https://www.prisma.io/)** - Next-generation ORM for Node.js and TypeScript
- **[Redis](https://redis.io/)** - In-memory data structure store

#### Security & Authentication
- **[JWT (jsonwebtoken)](https://github.com/auth0/node-jsonwebtoken)** - JSON Web Token implementation
- **[bcryptjs](https://github.com/dcodeIO/bcrypt.js)** - Password hashing library
- **[Helmet](https://helmetjs.github.io/)** - Security middleware for Express

#### Monitoring & Logging
- **[Winston](https://github.com/winstonjs/winston)** - Logging library for Node.js
- **[Sentry](https://sentry.io/)** - Error tracking and performance monitoring
- **[Morgan](https://github.com/expressjs/morgan)** - HTTP request logger middleware

#### API Documentation
- **[Swagger](https://swagger.io/)** - API documentation and testing tools
- **[swagger-jsdoc](https://github.com/Swaagie/swagger-jsdoc)** - Swagger specification generator
- **[swagger-ui-express](https://github.com/scottie1984/swagger-ui-express)** - Swagger UI for Express

#### Utilities & Middleware
- **[CORS](https://github.com/expressjs/cors)** - Cross-Origin Resource Sharing middleware
- **[compression](https://github.com/expressjs/compression)** - Response compression middleware
- **[express-rate-limit](https://github.com/expressjs/express-rate-limit)** - Rate limiting middleware
- **[express-validator](https://express-validator.github.io/)** - Request validation middleware
- **[Joi](https://joi.dev/)** - Schema validation library

#### Communication Services
- **[Nodemailer](https://nodemailer.com/)** - Email sending library
- **[Twilio](https://www.twilio.com/)** - Cloud communications platform

#### Storage
- **[Google Cloud Storage](https://cloud.google.com/storage)** - Object storage service
- **[Multer](https://github.com/expressjs/multer)** - File upload middleware

#### Process Management
- **[PM2](https://pm2.keymetrics.io/)** - Production process manager for Node.js

#### Containerization
- **[Docker](https://www.docker.com/)** - Containerization platform
- **[Docker Compose](https://docs.docker.com/compose/)** - Multi-container Docker application tool

#### Web Server
- **[Nginx](https://www.nginx.com/)** - High-performance web server and reverse proxy

### 🌟 Contributing

Contributions are welcome! This is an open-source project, and we encourage:

- 🐛 Bug reports
- 💡 Feature requests
- 📝 Documentation improvements
- 🔧 Code contributions
- ⭐ Starring the repository

### 📞 Support

For issues, questions, or contributions, please visit:
- **Repository**: [https://github.com/mrdasdeveloper/nodejs-backend](https://github.com/mrdasdeveloper/nodejs-backend)
- **Issues**: Open an issue on GitHub

---

**Made with ❤️ using open-source technologies**

*This project is free to use, modify, and distribute for any purpose without restrictions.*

---

## 📜 License

Copyright (c) 2025 Full Stack Open Source

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
