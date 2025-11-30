# Authentication Router

> **Complete Documentation for User Authentication Endpoints**

This router handles all user authentication operations including login, registration, password management, OTP verification, and user availability checks.

## 📋 Table of Contents

- [Overview](#overview)
- [Endpoints](#endpoints)
  - [Login with Password](#login-with-password)
  - [Send OTP](#send-otp)
  - [Verify OTP](#verify-otp)
  - [Login with OTP](#login-with-otp)
  - [Signup/Register](#signupregister)
  - [Set Password](#set-password)
  - [Change Password](#change-password)
  - [Forget Password](#forget-password)
  - [Logout](#logout)
  - [Refresh Token](#refresh-token)
  - [Token Info](#token-info)
  - [Check User Availability](#check-user-availability)
  - [Verify Email and Phone](#verify-email-and-phone)
- [Workflows](#workflows)
- [Error Handling](#error-handling)

## Overview

The Authentication router provides comprehensive user authentication functionality including:
- **Password-based Authentication**: Traditional email/phone + password login
- **OTP-based Authentication**: One-time password via email, SMS, or WhatsApp
- **User Registration**: Account creation with OTP verification
- **Password Management**: Set, change, and reset passwords
- **User Verification**: Email and phone number verification
- **Token Management**: Multi-token system (access, refresh, session) with token rotation
- **Session Management**: Session-based authentication with comprehensive token revocation

**Base Path:** `/{MODE}/auth` or `/{MODE}/token` or `/{MODE}/logout`

**Authentication:** Most endpoints do not require authentication (except password change, logout, and token-info)

## Endpoints

### Login with Password

**Endpoint:** `POST /{MODE}/token` or `POST /{MODE}/auth/login-with-password`

**Description:** Authenticate user with email/phone and password. Returns JWT access token upon successful authentication.

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
    "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "session_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "session_id": "uuid",
    "token_type": "bearer",
    "user": {
      "user_id": "uuid",
      "email": "user@example.com",
      "first_name": "John",
      "last_name": "Doe"
    }
  }
}
```

**Workflow:**
```
1. Client Request
   │
   ├─► Validate Request Format
   │   ├─► Check username exists
   │   └─► Check password exists
   │
   ├─► Authenticate User
   │   ├─► Get User by Email/Phone
   │   ├─► Verify Password (bcrypt)
   │   ├─► Check User Status (is_active, is_verified)
   │   └─► Update Last Sign-in
   │
   ├─► Generate All Tokens
   │   ├─► Generate Access Token
   │   ├─► Generate Refresh Token
   │   ├─► Generate Session Token
   │   ├─► Create Session ID
   │   └─► Sign with JWT_SECRET
   │
   └─► Return All Tokens + User Data
```

**Use Cases:**
- User login
- Session establishment
- API access token generation

---

### Send OTP

**Endpoint:** `POST /{MODE}/auth/send-one-time-password`

**Description:** Send one-time password via email, SMS, or WhatsApp. OTP is valid for 10 minutes.

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

**Workflow:**
```
1. Client Request
   │
   ├─► Validate Request
   │   ├─► user_id required
   │   └─► channel required (email/sms/whatsapp)
   │
   ├─► Generate OTP
   │   ├─► Generate 6-digit code
   │   └─► Store in Redis (600 seconds TTL)
   │
   ├─► Send OTP via Channel
   │   ├─► email → Send Email via Nodemailer
   │   ├─► sms → Send SMS via Twilio
   │   └─► whatsapp → Send WhatsApp via Twilio
   │
   └─► Return Success Response
```

**Use Cases:**
- Password reset
- Email/phone verification
- Two-factor authentication
- Account recovery

---

### Verify OTP

**Endpoint:** `POST /{MODE}/auth/verify-one-time-password`

**Description:** Verify one-time password without logging in. Used for verification purposes.

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

**Workflow:**
```
1. Client Request
   │
   ├─► Validate Request
   │   ├─► user_id required
   │   ├─► channel required
   │   └─► otp required
   │
   ├─► Verify OTP
   │   ├─► Get OTP from Redis
   │   ├─► Compare with provided OTP
   │   └─► Check expiration
   │
   └─► Return Verification Result
       └─► OTP not deleted (for reuse)
```

**Use Cases:**
- Email verification
- Phone verification
- Pre-login verification

---

### Login with OTP

**Endpoint:** `POST /{MODE}/auth/login-with-otp`

**Description:** Verify OTP and login user. Returns access token upon successful verification. OTP is deleted after successful login.

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
    "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "session_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "session_id": "uuid",
    "token_type": "bearer",
    "user": {
      "user_id": "uuid",
      "email": "user@example.com",
      "first_name": "John",
      "last_name": "Doe"
    }
  }
}
```

**Workflow:**
```
1. Client Request
   │
   ├─► Validate Request Format
   │   ├─► Validate email/phone format
   │   └─► Check required fields
   │
   ├─► Get User
   │   └─► getUserByEmailOrPhone()
   │
   ├─► Check User Status
   │   ├─► is_active = true
   │   └─► is_verified = true
   │
   ├─► Verify OTP
   │   ├─► Get OTP from Redis
   │   ├─► Compare with provided OTP
   │   └─► Delete OTP (consume=true)
   │
   ├─► Update Last Sign-in
   │   └─► updateLastSignIn()
   │
   ├─► Generate All Tokens
   │   ├─► Generate Access Token
   │   ├─► Generate Refresh Token
   │   ├─► Generate Session Token
   │   └─► Create Session ID
   │
   └─► Return All Tokens + User Data
```

**Use Cases:**
- Passwordless login
- Quick authentication
- Mobile app login

---

### Signup/Register

**Endpoint:** `POST /{MODE}/auth/verify`

**Description:** Verify OTP and create new user account. Supports master OTP for admin account creation.

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
    "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "session_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "session_id": "uuid",
    "token_type": "bearer",
    "user": { ... }
  }
}
```

**Workflow:**
```
1. Client Request
   │
   ├─► Validate Request
   │   ├─► user_id required
   │   ├─► channel required
   │   └─► otp required
   │
   ├─► Check Master OTP (if applicable)
   │   └─► If master OTP, skip verification
   │
   ├─► Verify OTP
   │   └─► verifyOtp() (consume=false)
   │
   ├─► Validate Email/Phone Format
   │   ├─► Email → validateEmail()
   │   └─► Phone → validatePhone()
   │
   ├─► Check User Exists
   │   └─► getUserByEmailOrPhone()
   │
   ├─► Create User Account
   │   ├─► Set Default Values
   │   │   ├─► is_active: true
   │   │   ├─► is_verified: true
   │   │   ├─► profile_accessibility: public
   │   │   ├─► theme: light
   │   │   ├─► user_type: customer
   │   │   ├─► language: en
   │   │   └─► status: ACTIVE
   │   ├─► Set Auth Type
   │   │   ├─► email → AuthTypeEnum.email
   │   │   └─► phone → AuthTypeEnum.phone
   │   └─► Set Verification Status
   │       ├─► Email verified if channel=email
   │       └─► Phone verified if channel=sms/whatsapp
   │
   ├─► Assign Groups (if master OTP)
   │   └─► Assign admin group
   │
   ├─► Generate All Tokens
   │   ├─► Generate Access Token
   │   ├─► Generate Refresh Token
   │   ├─► Generate Session Token
   │   └─► Create Session ID
   │
   ├─► Delete OTP (if not master OTP)
   │   └─► verifyOtp(consume=true)
   │
   └─► Return All Tokens + User Data
```

**Special Features:**
- **Master OTP**: If `MASTER_OTP` environment variable matches, user is assigned admin group
- **Auto-verification**: Email/phone is automatically verified during signup
- **Default Settings**: New users get sensible defaults

**Use Cases:**
- New user registration
- Account creation
- Onboarding flow

---

### Set Password

**Endpoint:** `POST /{MODE}/auth/set-password`

**Description:** Set password for authenticated user (for users who signed up with OTP).

**Authentication:** Required
**Permission:** `edit_profile`

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
  "data": {
    "message": "Password set successfully"
  }
}
```

**Workflow:**
```
1. Authenticated Request
   │
   ├─► Validate JWT Token
   │
   ├─► Validate Request
   │   ├─► password required
   │   ├─► confirm_password required
   │   └─► password === confirm_password
   │
   ├─► Hash Password
   │   └─► bcrypt.hash() (10 rounds)
   │
   ├─► Update User Password
   │   └─► updateUserPassword()
   │
   └─► Return Success Response
```

**Use Cases:**
- Initial password setup
- Passwordless signup completion

---

### Change Password

**Endpoint:** `POST /{MODE}/auth/change-password`

**Description:** Change user's existing password. Requires old password verification.

**Authentication:** Required
**Permission:** `edit_profile`

**Request Body:**
```json
{
  "user_id": "user@example.com",
  "channel": "email",
  "old_password": "current-password",
  "password": "new-password",
  "confirm_password": "new-password"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Password updated successfully",
  "data": {
    "message": "Password updated successfully"
  }
}
```

**Workflow:**
```
1. Authenticated Request
   │
   ├─► Validate JWT Token
   │
   ├─► Validate Request
   │   ├─► user_id required
   │   ├─► old_password required
   │   ├─► password required
   │   └─► confirm_password required
   │
   ├─► Verify Old Password
   │   ├─► authenticateUser(user_id, old_password)
   │   └─► Check if valid
   │
   ├─► Hash New Password
   │   └─► bcrypt.hash()
   │
   ├─► Update User Password
   │   └─► updateUserPassword(currentUserId, newPassword)
   │
   └─► Return Success Response
```

**Use Cases:**
- Password change
- Security updates
- Account security

---

### Forget Password

**Endpoint:** `POST /{MODE}/auth/forget-password`

**Description:** Reset password after verifying OTP. Used for password recovery.

**Authentication:** Not required

**Request Body:**
```json
{
  "user_id": "user@example.com",
  "otp": "123456",
  "password": "new-password",
  "confirm_password": "new-password"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Password updated successfully",
  "data": {
    "message": "Password updated successfully"
  }
}
```

**Workflow:**
```
1. Client Request
   │
   ├─► Validate Request
   │   ├─► user_id required
   │   ├─► otp required
   │   ├─► password required
   │   └─► confirm_password required
   │
   ├─► Verify OTP
   │   └─► verifyOtp(user_id, otp)
   │
   ├─► Validate Email/Phone Format
   │   └─► validateEmail() or validatePhone()
   │
   ├─► Get User
   │   └─► getUserByEmailOrPhone()
   │
   ├─► Hash New Password
   │   └─► bcrypt.hash()
   │
   ├─► Update User Password
   │   └─► updateUserPassword()
   │
   └─► Return Success Response
```

**Use Cases:**
- Password recovery
- Account reset
- Security recovery

---

### Logout

**Endpoint:** `POST /{MODE}/auth/logout` or `POST /{MODE}/logout` (deprecated)

**Description:** Logout user and revoke all tokens and sessions. The `/auth/logout` endpoint performs comprehensive token revocation, while `/logout` is deprecated and only returns user data.

**Authentication:** Required
**Permission:** `view_profile`

**Request Body:** None

**Response (`/auth/logout`):**
```json
{
  "success": true,
  "message": "Logged out successfully. All tokens and sessions have been revoked.",
  "data": {
    "message": "Logged out successfully",
    "access_token_revoked": true,
    "refresh_tokens_revoked": true,
    "sessions_revoked": true,
    "tokens_revoked": true
  }
}
```

**Response (`/logout` - deprecated):**
```json
{
  "success": true,
  "message": "Successfully fetched user data",
  "data": {
    "user_id": "uuid",
    "email": "user@example.com",
    "first_name": "John",
    "last_name": "Doe"
  }
}
```

**Workflow (`/auth/logout`):**
```
1. Authenticated Request
   │
   ├─► Validate JWT Token
   │
   ├─► Extract Token JTI
   │   └─► Decode token to get JTI
   │
   ├─► Blacklist Access Token
   │   └─► blacklistAccessTokenByJti()
   │
   ├─► Revoke All Refresh Tokens
   │   └─► revokeAllUserRefreshTokens()
   │
   ├─► Revoke All Sessions
   │   └─► blacklistAllUserSessions()
   │
   └─► Return Revocation Status
```

**Note:** The `/auth/logout` endpoint performs server-side token revocation using Redis blacklisting. All tokens and sessions are invalidated immediately. The deprecated `/logout` endpoint only returns user data without revoking tokens.

**Use Cases:**
- User logout
- Session termination
- Security logout
- Multi-device logout

---

### Refresh Token

**Endpoint:** `POST /{MODE}/auth/refresh-token`

**Description:** Refresh access, refresh, and session tokens using a valid refresh token. Implements token rotation - old tokens are blacklisted and new tokens are generated with a new session ID.

**Authentication:** Not required (refresh token in request body)

**Request Body:**
```json
{
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response:**
```json
{
  "success": true,
  "message": "Tokens refreshed successfully",
  "data": {
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "session_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "session_id": "uuid",
    "token_type": "bearer"
  }
}
```

**Workflow:**
```
1. Client Request
   │
   ├─► Validate Request
   │   └─► refresh_token required
   │
   ├─► Decode Refresh Token
   │   ├─► Verify JWT signature
   │   ├─► Check token type (must be "refresh")
   │   └─► Extract user_id and session_id
   │
   ├─► Get User from Database
   │   └─► getUserById()
   │
   ├─► Token Rotation
   │   ├─► Blacklist old refresh token
   │   └─► Blacklist old session (invalidates all old tokens)
   │
   ├─► Generate New Tokens
   │   ├─► Generate new access token
   │   ├─► Generate new refresh token
   │   ├─► Generate new session token
   │   └─► Create new session ID
   │
   └─► Return New Tokens
```

**Token Rotation:** The refresh endpoint implements token rotation for security. When refreshing, the old refresh token and session are blacklisted, and completely new tokens with a new session ID are generated.

**Use Cases:**
- Token renewal
- Session extension
- Security token rotation

---

### Token Info

**Endpoint:** `GET /{MODE}/auth/token-info` or `POST /{MODE}/auth/token-info`

**Description:** Get detailed information about authentication tokens including age, expiration, type, and status. The POST endpoint allows comparing tokens from the request body with the current token.

**Authentication:** Required

**Request Body (POST only, optional):**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "session_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response:**
```json
{
  "success": true,
  "message": "Token information retrieved successfully",
  "data": {
    "token_ages": {
      "current": {
        "token_type": "access",
        "token_age": "30 minutes",
        "token_age_minutes": 30,
        "expires_in": "30 minutes",
        "expires_in_minutes": 30,
        "lifetime_percentage_used": 50.0,
        "status": "ACTIVE"
      },
      "access_token": { ... },
      "session_token": { ... },
      "refresh_token": { ... }
    },
    "token_configuration": {
      "access_token": {
        "expiry_minutes": 60,
        "expires_in": "1 hour"
      },
      "session_token": {
        "expiry_minutes": 10080,
        "expires_in": "7 days"
      },
      "refresh_token": {
        "expiry_minutes": 43200,
        "expires_in": "30 days"
      }
    },
    "extension_info": {
      "current_expires_in": "30 minutes",
      "after_refresh_expires_in": "1 hour",
      "extension_minutes": 60
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
   ├─► Extract Tokens
   │   ├─► From Authorization header (Bearer)
   │   ├─► From X-Session-Token header
   │   └─► From request body (POST only)
   │
   ├─► Decode All Tokens
   │   ├─► Extract token type
   │   ├─► Calculate token age
   │   ├─► Calculate expiration time
   │   └─► Determine status (ACTIVE/EXPIRED)
   │
   ├─► Get Token Configuration
   │   └─► From environment variables
   │
   ├─► Calculate Extension Info
   │   └─► If token refreshed, show extension details
   │
   └─► Return Token Information
```

**Token Information Includes:**
- **Token Age**: How long the token has been active
- **Expiration**: Time until token expires
- **Lifetime Percentage**: Percentage of token lifetime used
- **Status**: ACTIVE or EXPIRED
- **Token Type**: access, refresh, or session
- **Session ID**: Associated session identifier

**Use Cases:**
- Token debugging
- Token expiration monitoring
- Security auditing
- Token comparison

---

### Check User Availability

**Endpoint:** `POST /{MODE}/auth/check-user-availability`

**Description:** Check if email or phone number is available for registration.

**Authentication:** Not required

**Request Body:**
```json
{
  "user_id": "user@example.com"
}
```

**Alternative:**
```json
{
  "email": "user@example.com"
}
```

or

```json
{
  "phone": "+1234567890"
}
```

**Response (Available):**
```json
{
  "success": true,
  "message": "User is not available",
  "data": {
    "available": false,
    "first_name": null,
    "last_name": null
  }
}
```

**Response (Not Available):**
```json
{
  "success": true,
  "message": "User is available",
  "data": {
    "available": true,
    "first_name": "John",
    "last_name": "Doe"
  }
}
```

**Workflow:**
```
1. Client Request
   │
   ├─► Validate Request
   │   ├─► user_id OR email OR phone required
   │   └─► Validate format (email or phone)
   │
   ├─► Get User
   │   └─► getUserByEmailOrPhone(identifier)
   │
   ├─► Check Availability
   │   ├─► If user exists → available: false
   │   └─► If user not exists → available: true
   │
   └─► Return Availability Status
       └─► Include user name if exists
```

**Use Cases:**
- Registration form validation
- Username/email availability check
- Phone number availability check

---

### Verify Email and Phone

**Endpoint:** `POST /{MODE}/auth/verify-email-and-phone`

**Description:** Verify email or phone number with OTP.

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
  "message": "Email/Phone verified successfully",
  "data": { ... }
}
```

**Workflow:**
```
1. Client Request
   │
   ├─► Validate Request
   │   ├─► user_id required
   │   ├─► channel required (email or sms)
   │   └─► otp required
   │
   ├─► Validate Channel
   │   └─► Must be "email" or "sms"
   │
   ├─► Validate Format
   │   ├─► Email → validateEmail()
   │   └─► Phone → validatePhone()
   │
   ├─► Verify OTP
   │   └─► verifyOtp(user_id, otp, consume=false)
   │
   └─► Return Success Response
```

**Use Cases:**
- Email verification
- Phone verification
- Account verification

---

## Workflows

### Complete Authentication Flow

```
┌─────────────────────────────────────────────────────────────┐
│              User Authentication Flow                       │
└────────────────────────────┬────────────────────────────────┘
                              │
                              ▼
                    ┌─────────────────┐
                    │  Registration?  │
                    └────────┬────────┘
                             │
                ┌────────────┴────────────┐
                │                         │
                ▼                         ▼
        ┌───────────────┐         ┌───────────────┐
        │   Signup      │         │    Login      │
        └───────┬───────┘         └───────┬───────┘
                │                         │
                ▼                         ▼
        ┌───────────────┐         ┌───────────────┐
        │  Send OTP     │         │ Password/OTP  │
        └───────┬───────┘         └───────┬───────┘
                │                         │
                ▼                         ▼
        ┌───────────────┐         ┌───────────────┐
        │  Verify OTP   │         │ Authenticate  │
        └───────┬───────┘         └───────┬───────┘
                │                         │
                └────────────┬─────────────┘
                             │
                             ▼
                    ┌─────────────────┐
                    │ Generate Token  │
                    └────────┬────────┘
                             │
                             ▼
                    ┌─────────────────┐
                    │  Return Token   │
                    └─────────────────┘
```

### Password Reset Flow

```
1. User Requests Password Reset
   │
   ├─► POST /auth/send-one-time-password
   │   └─► OTP sent to email/phone
   │
   ├─► User Receives OTP
   │
   ├─► POST /auth/forget-password
   │   ├─► Verify OTP
   │   ├─► Validate new password
   │   └─► Update password
   │
   └─► Password Reset Complete
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

**401 Unauthorized - Invalid Credentials:**
```json
{
  "success": false,
  "message": "Invalid credentials",
  "error": "Email/phone or password is incorrect",
  "statusCode": 401
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

**404 Not Found - User Not Found:**
```json
{
  "success": false,
  "message": "User not found",
  "error": "User with provided email/phone does not exist",
  "statusCode": 404
}
```

**409 Conflict - User Already Exists:**
```json
{
  "success": false,
  "message": "User already exists",
  "error": "User with this email/phone already registered",
  "statusCode": 409
}
```

---

## Best Practices

1. **Use Strong Passwords**: Enforce password complexity requirements
2. **OTP Expiration**: OTPs expire after 10 minutes for security
3. **Rate Limiting**: Implement rate limiting on authentication endpoints
4. **Token Storage**: Store JWT tokens securely (httpOnly cookies or secure storage)
5. **Password Hashing**: Always use bcrypt with appropriate salt rounds
6. **Email/Phone Validation**: Validate format before processing
7. **Error Messages**: Don't reveal if email/phone exists in system
8. **Master OTP**: Use master OTP only in development/staging environments

---

**Last Updated**: January 2025

