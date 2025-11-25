# Health & Monitoring Router

> **Complete Documentation for Health Check and System Monitoring Endpoints**

This router provides endpoints for checking API health status, system information, and testing error tracking integration.

## 📋 Table of Contents

- [Overview](#overview)
- [Endpoints](#endpoints)
  - [Health Check](#health-check)
  - [System Health Check](#system-health-check)
  - [Test Sentry](#test-sentry)
- [Workflows](#workflows)
- [Error Handling](#error-handling)

## Overview

The Health router provides monitoring and diagnostic endpoints that help track the API's operational status. These endpoints are essential for:
- **Load Balancer Health Checks**: Verify service availability
- **System Monitoring**: Track resource usage and system metrics
- **Error Tracking Testing**: Validate Sentry integration

**Base Path:** `/{MODE}/health` or `/health` (for basic health check)

**Authentication:** Most endpoints do not require authentication (except `/test-sentry`)

## Endpoints

### Health Check

**Endpoint:** `GET /health` or `GET /{MODE}/health`

**Description:** Returns the health status of the API service with environment information. This endpoint is typically used by load balancers and monitoring systems.

**Authentication:** Not required

**Request:**
```http
GET /health HTTP/1.1
Host: api.example.com
```

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
      "MODE": "dev/v1",
      "UTC": "UTC",
      "DEBUG_MODE": "false",
      "TIMEZONE": "UTC",
      "LOG_LEVEL": "info"
    }
  }
}
```

**Workflow:**
```
1. Client Request
   │
   ├─► Extract Environment Variables
   │   ├─► API_VERSION
   │   ├─► API_MODE
   │   ├─► MODE
   │   ├─► UTC
   │   ├─► DEBUG_MODE
   │   ├─► TIMEZONE
   │   └─► LOG_LEVEL
   │
   ├─► Build Response
   │   ├─► Status: "ok"
   │   └─► Meta Information
   │
   └─► Return 200 OK
```

**Use Cases:**
- Load balancer health checks
- Container orchestration health probes
- Service discovery
- Monitoring dashboards

---

### System Health Check

**Endpoint:** `GET /{MODE}/health/system`

**Description:** Returns detailed system information including CPU, memory, platform details, and environment configuration. Useful for system administrators and monitoring tools.

**Authentication:** Not required

**Request:**
```http
GET /dev/v1/health/system HTTP/1.1
Host: api.example.com
```

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
      "API_MODE": "development",
      "MODE": "dev/v1",
      "DEBUG_MODE": "false",
      "LOG_LEVEL": "info"
    },
    "timestamp": 1704067200000
  }
}
```

**Response Fields:**
- `system_info.platform`: Operating system platform (linux, darwin, win32)
- `system_info.nodeVersion`: Node.js version
- `system_info.cpuCount`: Number of CPU cores
- `system_info.memoryTotal`: Total system memory in bytes
- `system_info.memoryFree`: Free memory in bytes
- `system_info.memoryUsed`: Used memory in bytes
- `system_info.uptime`: System uptime in seconds
- `environment`: Environment configuration variables
- `timestamp`: Unix timestamp of the check

**Workflow:**
```
1. Client Request
   │
   ├─► Gather System Information
   │   ├─► Platform (process.platform)
   │   ├─► Node.js Version (process.version)
   │   ├─► CPU Count (os.cpus().length)
   │   ├─► Memory Stats (os.totalmem(), os.freemem())
   │   └─► System Uptime (os.uptime())
   │
   ├─► Gather Environment Info
   │   ├─► API_VERSION
   │   ├─► API_MODE
   │   ├─► MODE
   │   ├─► DEBUG_MODE
   │   └─► LOG_LEVEL
   │
   ├─► Calculate Memory Usage
   │   └─► memoryUsed = totalmem - freemem
   │
   ├─► Build Response
   │   ├─► Status: "healthy"
   │   ├─► System Information
   │   ├─► Environment Information
   │   └─► Timestamp
   │
   └─► Return 200 OK
```

**Use Cases:**
- System resource monitoring
- Performance analysis
- Capacity planning
- Troubleshooting system issues

---

### Test Sentry

**Endpoint:** `GET /{MODE}/health/test-sentry`

**Description:** Intentionally triggers different types of errors to test Sentry error tracking integration. Useful for validating error monitoring setup.

**Authentication:** Required (Bearer token)

**Query Parameters:**
- `type` (optional): Type of error to test
  - `exception` (default): Manual exception capture
  - `message`: Manual message capture
  - `unhandled`: Unhandled error (caught by error handler)
  - `async`: Async error

**Request:**
```http
GET /dev/v1/health/test-sentry?type=exception HTTP/1.1
Host: api.example.com
Authorization: Bearer <token>
```

**Response (Exception Type):**
```json
{
  "success": true,
  "message": "Test exception sent to Sentry",
  "data": {
    "type": "exception",
    "environment": "development",
    "message": "Check your Sentry dashboard for the error",
    "error": "Test Sentry Exception - This is a test error"
  }
}
```

**Response (Message Type):**
```json
{
  "success": true,
  "message": "Test message sent to Sentry",
  "data": {
    "type": "message",
    "environment": "development",
    "message": "Check your Sentry dashboard for the message"
  }
}
```

**Response (Async Type):**
```json
{
  "success": true,
  "message": "Test async error scheduled",
  "data": {
    "type": "async",
    "environment": "development",
    "message": "Async error will be sent to Sentry in 100ms"
  }
}
```

**Workflow (Exception Type):**
```
1. Client Request with Authentication
   │
   ├─► Validate JWT Token
   │
   ├─► Extract Query Parameters
   │   └─► type = "exception" (default)
   │
   ├─► Set Sentry User Context
   │   └─► If user available, set user info
   │
   ├─► Add Breadcrumb
   │   └─► Log test initiation
   │
   ├─► Create Test Error
   │   ├─► Error Name: "SentryTestError"
   │   └─► Error Message: "Test Sentry Exception..."
   │
   ├─► Capture Exception in Sentry
   │   ├─► Add Tags (test_type, environment, endpoint)
   │   └─► Add Extra Data (query, userAgent, IP)
   │
   └─► Return 200 OK with Success Message
```

**Workflow (Unhandled Type):**
```
1. Client Request with Authentication
   │
   ├─► Validate JWT Token
   │
   ├─► Extract Query Parameters
   │   └─► type = "unhandled"
   │
   ├─► Throw Error
   │   └─► "Test Unhandled Error..."
   │
   ├─► Error Handler Catches
   │   ├─► Log Error
   │   ├─► Capture in Sentry
   │   └─► Format Error Response
   │
   └─► Return 500 with Error Details
```

**Workflow (Async Type):**
```
1. Client Request with Authentication
   │
   ├─► Validate JWT Token
   │
   ├─► Extract Query Parameters
   │   └─► type = "async"
   │
   ├─► Schedule Async Error
   │   └─► setTimeout(() => {
   │       └─► Capture Exception in Sentry
   │   }, 100)
   │
   └─► Return 200 OK Immediately
       └─► Error sent to Sentry after 100ms
```

**Error Types:**

1. **Exception**: Manually captures an exception with context
2. **Message**: Sends a warning message to Sentry
3. **Unhandled**: Throws an error that gets caught by the global error handler
4. **Async**: Schedules an async error to test async error tracking

**Use Cases:**
- Testing Sentry integration
- Validating error tracking setup
- Debugging error monitoring
- Verifying error context capture

---

## Workflows

### Complete Health Check Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    Health Check Request                     │
└────────────────────────────┬────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│              Determine Endpoint Type                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │
│  │ Basic Health │  │ System Info  │  │ Test Sentry  │       │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘       │
└─────────┼──────────────────┼──────────────────┼─────────────┘
          │                  │                  │
          ▼                  ▼                  ▼
┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
│ Gather Env Vars │ │ Gather Sys Info │ │ Validate Auth   │
│ Return Status   │ │ Calculate Memory│ │ Test Error Type │
│                 │ │ Return Metrics  │ │ Capture Sentry  │
└─────────────────┘ └─────────────────┘ └─────────────────┘
          │                  │                  │
          └──────────────────┴──────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────┐
│                    Return Response                          │
└─────────────────────────────────────────────────────────────┘
```

## Error Handling

### Health Check Errors

**500 Internal Server Error:**
```json
{
  "success": false,
  "message": "Health check failed",
  "error": "Error details",
  "statusCode": 500
}
```

**Common Error Scenarios:**
- Environment variables not accessible
- System information gathering fails
- Sentry configuration issues (for test-sentry endpoint)

### Error Handling Workflow

```
1. Error Occurs
   │
   ├─► Log Error
   │   └─► Winston Logger
   │
   ├─► Capture in Sentry (if applicable)
   │   └─► captureException()
   │
   ├─► Format Error Response
   │   └─► ERROR.fromMap()
   │
   └─► Return Error Response
       └─► Appropriate Status Code
```

---

## Best Practices

1. **Use Basic Health Check for Load Balancers**: The `/health` endpoint is lightweight and perfect for frequent health checks
2. **Use System Health for Monitoring**: The `/health/system` endpoint provides detailed metrics for monitoring dashboards
3. **Test Sentry Regularly**: Use `/test-sentry` to validate error tracking is working correctly
4. **Monitor Response Times**: Health checks should respond quickly (< 100ms)
5. **Cache System Info**: Consider caching system information if called frequently
6. **Secure Test Endpoint**: The test-sentry endpoint requires authentication to prevent abuse

---

**Last Updated**: January 2025

