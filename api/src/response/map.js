/**
 * Error Code Map
 * Centralized error definitions matching FastAPI map.py
 * Each error has: code, message, reason (optional), http_status (optional), hint (optional)
 */

const ERRORS = {
  // 🌍 General / HTTP Errors (10xx)
  INVALID_REQUEST: { 
    code: 1001, 
    message: "Invalid request payload", 
    reason: "Malformed or missing parameters",
    http_status: 400,
    hint: "Check that all required fields are present and correctly formatted. Review the API documentation for the expected request structure."
  },
  UNAUTHORIZED: { 
    code: 1002, 
    message: "Unauthorized access", 
    reason: "User is not authenticated or token is invalid",
    http_status: 401,
    hint: "Ensure you are logged in and your authentication token is valid. Try refreshing your token or logging in again."
  },
  FORBIDDEN: { 
    code: 1003, 
    message: "Permission denied", 
    reason: "User lacks required permissions",
    http_status: 403,
    hint: "You don't have permission to perform this action. Contact your administrator if you believe this is an error."
  },
  NOT_FOUND: { 
    code: 1004, 
    message: "Requested resource not found", 
    reason: "The requested entity does not exist",
    http_status: 404,
    hint: "Verify the resource ID or identifier is correct. The resource may have been deleted or never existed."
  },
  METHOD_NOT_ALLOWED: { 
    code: 1005, 
    message: "HTTP method not allowed", 
    reason: "Attempted to use an unsupported HTTP method",
    http_status: 405,
    hint: "Check the API documentation for the correct HTTP method (GET, POST, PUT, DELETE, etc.) for this endpoint."
  },
  TIMEOUT: { 
    code: 1006, 
    message: "Request timed out", 
    reason: "The operation took too long to complete",
    http_status: 408,
    hint: "The server is taking too long to respond. Try again later or contact support if the issue persists."
  },
  CONFLICT: { 
    code: 1007, 
    message: "Resource conflict", 
    reason: "A conflicting resource already exists",
    http_status: 409,
    hint: "A resource with the same identifier already exists. Use a different identifier or update the existing resource."
  },
  UNPROCESSABLE: { 
    code: 1008, 
    message: "Unprocessable entity", 
    reason: "Server unable to process contained instructions",
    http_status: 422,
    hint: "The request is well-formed but contains semantic errors. Check your input data for logical inconsistencies."
  },
  TOO_MANY_REQUESTS: { 
    code: 1009, 
    message: "Too many requests", 
    reason: "Rate limit exceeded",
    http_status: 429,
    hint: "You have exceeded the rate limit. Please wait before making another request. Check the Retry-After header for wait time."
  },
  VALIDATION_ERROR: { 
    code: 1010, 
    message: "Validation failed", 
    reason: "One or more input fields failed validation",
    http_status: 400,
    hint: "Review the error details to see which fields failed validation. Ensure all required fields are provided and meet the specified format."
  },
  BAD_GATEWAY: {
    code: 1011,
    message: "Bad gateway",
    reason: "Invalid response from upstream server",
    http_status: 502,
    hint: "The server received an invalid response from an upstream server. This is usually temporary - try again in a moment."
  },
  SERVICE_UNAVAILABLE: {
    code: 1012,
    message: "Service unavailable",
    reason: "Service is temporarily unavailable",
    http_status: 503,
    hint: "The service is temporarily unavailable due to maintenance or high load. Please try again later."
  },
  GATEWAY_TIMEOUT: {
    code: 1013,
    message: "Gateway timeout",
    reason: "Upstream server did not respond in time",
    http_status: 504,
    hint: "The upstream server took too long to respond. This may be due to high load - please try again."
  },
  INTERNAL_ERROR: { 
    code: 1014, 
    message: "Internal server error", 
    reason: "Unexpected internal failure occurred",
    http_status: 500,
    hint: "An unexpected error occurred on the server. Please try again later. If the problem persists, contact support."
  },
  UNKNOWN_ERROR: { 
    code: 1015, 
    message: "Unknown error occurred", 
    reason: "An unspecified error occurred",
    http_status: 500,
    hint: "An unexpected error occurred. Please try again or contact support if the issue continues."
  },
  NOT_IMPLEMENTED: { 
    code: 1016, 
    message: "Not implemented", 
    reason: "Feature or endpoint not implemented",
    http_status: 501,
    hint: "This feature is not yet available. Check the API documentation for available endpoints or contact support for feature requests."
  },
  INVALID_TOKEN: { 
    code: 1017, 
    message: "Invalid or expired token", 
    reason: "Token expired or signature invalid",
    http_status: 401,
    hint: "Your authentication token is invalid or has expired. Please log in again to get a new token."
  },
  DUPLICATE_ENTRY: { 
    code: 1018, 
    message: "Duplicate entry not allowed", 
    reason: "A similar record already exists",
    http_status: 409,
    hint: "A record with the same unique identifier already exists. Use a different identifier or update the existing record."
  },
  PAYMENT_FAILED: { 
    code: 1019, 
    message: "Payment failed", 
    reason: "Payment gateway declined or error processing payment",
    http_status: 402,
    hint: "The payment could not be processed. Check your payment method details, ensure sufficient funds, and try again."
  },
  PAYMENT_DECLINED: { 
    code: 1020, 
    message: "Payment declined", 
    reason: "Payment authorization was denied",
    http_status: 402,
    hint: "Your payment was declined by the payment provider. Contact your bank or use a different payment method."
  },
  REQUEST_TOO_LARGE: {
    code: 1021,
    message: "Request entity too large",
    reason: "The request payload exceeds the maximum allowed size",
    http_status: 413,
    hint: "Your request is too large. Reduce the size of your payload or split it into multiple smaller requests."
  },
  UNSUPPORTED_MEDIA_TYPE: {
    code: 1022,
    message: "Unsupported media type",
    reason: "The request media type is not supported",
    http_status: 415,
    hint: "The Content-Type header is not supported. Check the API documentation for accepted media types."
  },

  // 🔐 Auth / Login / Signup (12xx)
  AUTH_INVALID_CREDENTIALS: { 
    code: 1201, 
    message: "Invalid username or password",
    http_status: 401,
    hint: "Check that your username/email and password are correct. Passwords are case-sensitive."
  },
  AUTH_SIGNIN_FAILED: { 
    code: 1202, 
    message: "Invalid login credentials", 
    reason: "Incorrect credentials or service error",
    http_status: 401,
    hint: "Your login credentials are incorrect. Verify your email/username and password, or try resetting your password."
  },
  AUTH_SIGNUP_FAILED: { 
    code: 1203, 
    message: "Failed to create account", 
    reason: "Database or validation error",
    http_status: 400,
    hint: "Account creation failed. Check that all required fields are provided and meet validation requirements (e.g., email format, password strength)."
  },
  AUTH_LOGOUT_FAILED: { 
    code: 1204, 
    message: "Failed to log out", 
    reason: "Token invalidation failed",
    http_status: 500,
    hint: "Logout failed due to a server error. Your session may still be active - try logging out again or clearing your browser cache."
  },
  AUTH_OTP_INVALID: { 
    code: 1205, 
    message: "Invalid or expired OTP", 
    reason: "OTP is incorrect, expired, or has been used",
    http_status: 400,
    hint: "The OTP code you entered is incorrect, expired, or has already been used. Request a new OTP code."
  },
  AUTH_OTP_SEND_FAILED: { 
    code: 1206, 
    message: "Failed to send OTP", 
    reason: "Messaging or email service failure",
    http_status: 500,
    hint: "We couldn't send the OTP code. Check your email/SMS service or try again in a few moments."
  },
  AUTH_OTP_VERIFY_FAILED: { 
    code: 1207, 
    message: "Failed to verify OTP", 
    reason: "Incorrect or expired OTP",
    http_status: 400,
    hint: "OTP verification failed. Ensure you entered the code correctly and that it hasn't expired (usually valid for 10 minutes)."
  },
  AUTH_CHANNEL_UNSUPPORTED: { 
    code: 1208, 
    message: "Unsupported authentication channel",
    http_status: 400,
    hint: "The selected authentication method (email/SMS/etc.) is not supported. Choose a different authentication channel."
  },
  AUTH_PASSWORD_UPDATE_FAILED: { 
    code: 1209, 
    message: "Failed to update password", 
    reason: "Database update failed",
    http_status: 500,
    hint: "Password update failed due to a server error. Ensure your new password meets the requirements and try again."
  },
  AUTH_PASSWORD_INVALID_OLD: { 
    code: 1210, 
    message: "Old password is incorrect",
    http_status: 400,
    hint: "The old password you provided is incorrect. Please enter your current password correctly."
  },
  AUTH_FORGOT_PASSWORD_FAILED: { 
    code: 1211, 
    message: "Failed to reset password", 
    reason: "Invalid token or email",
    http_status: 400,
    hint: "Password reset failed. The reset token may be expired or invalid. Request a new password reset link."
  },
  AUTH_INVALID_PAYLOAD: { 
    code: 1212, 
    message: "Invalid payload",
    http_status: 400,
    hint: "The authentication request payload is invalid. Check that all required fields (email, password, etc.) are provided."
  },
  AUTH_PROCESSING_ERROR: { 
    code: 1213, 
    message: "Unexpected error during authentication", 
    reason: "Unhandled exception during auth flow",
    http_status: 500,
    hint: "An unexpected error occurred during authentication. Please try again or contact support if the issue persists."
  },
  AUTH_USER_ALREADY_EXISTS: { 
    code: 1214, 
    message: "User already exists", 
    reason: "A user with this email or phone number already exists", 
    http_status: 409,
    hint: "An account with this email or phone number already exists. Try logging in instead or use a different email/phone."
  },
  TOKEN_DOMAIN_MISMATCH: { 
    code: 1215, 
    message: "Token domain mismatch", 
    reason: "Token was issued for a different domain and cannot be used on this domain", 
    http_status: 403,
    hint: "This token was issued for a different domain. Please log in again to get a token for this domain."
  },

  // 💼 User Profile (140x)
  PROFILE_NOT_FOUND: { 
    code: 1401, 
    message: "User profile not found",
    http_status: 404,
    hint: "The user profile does not exist. Verify the user ID or ensure the profile has been created."
  },
  PROFILE_ALREADY_EXISTS: { 
    code: 1402, 
    http_status: 400, 
    message: "User profile already exists",
    hint: "A profile for this user already exists. Use the update endpoint to modify the existing profile."
  },
  PROFILE_UPDATE_FAILED: { 
    code: 1403, 
    message: "Failed to update user profile", 
    reason: "Database update or validation error",
    http_status: 400,
    hint: "Profile update failed. Check that all fields meet validation requirements and that you have permission to update this profile."
  },
  PROFILE_PICTURE_UPDATE_FAILED: { 
    code: 1404, 
    message: "Failed to update profile picture", 
    reason: "File upload or storage service failed",
    http_status: 500,
    hint: "Failed to upload profile picture. Ensure the image file is valid (JPG, PNG, etc.) and under the size limit. Try again in a moment."
  },
  PROFILE_EMAIL_CHANGE_FAILED: { 
    code: 1405, 
    message: "Failed to change email", 
    reason: "Email already in use or invalid",
    http_status: 400,
    hint: "Email change failed. The email may already be in use by another account or the format is invalid. Use a different email address."
  },
  PROFILE_PHONE_CHANGE_FAILED: { 
    code: 1406, 
    message: "Failed to change phone", 
    reason: "Phone number invalid or already used",
    http_status: 400,
    hint: "Phone number change failed. Ensure the phone number is in the correct format and not already associated with another account."
  },
  PROFILE_PROCESSING_ERROR: { 
    code: 1407, 
    message: "Error processing user profile", 
    reason: "Unexpected profile operation failure",
    http_status: 500,
    hint: "An unexpected error occurred while processing your profile. Please try again or contact support."
  },
  PROFILE_INVALID_OTP: { 
    code: 1408, 
    message: "Invalid or expired OTP",
    http_status: 400,
    hint: "The OTP code for profile verification is invalid or expired. Request a new OTP code."
  },
  PROFILE_INVALID_PAYLOAD: { 
    code: 1409, 
    message: "Invalid profile payload",
    http_status: 400,
    hint: "The profile data you provided is invalid. Check that all required fields are present and correctly formatted."
  },
  EMAIL_ALREADY_EXISTS: { 
    code: 1410, 
    message: "Email already exists", 
    reason: "This email is already associated with another user account", 
    http_status: 400,
    hint: "This email address is already registered. Try logging in instead or use a different email address."
  },

  // 💰 Wallet / Payment / Transactions (11xx)
  WALLET_NOT_FOUND: { 
    code: 1101, 
    message: "Wallet not found",
    http_status: 404,
    hint: "The wallet does not exist. Ensure the wallet has been created for this user."
  },
  INSUFFICIENT_CREDITS: { 
    code: 1102, 
    message: "Insufficient credits in wallet",
    http_status: 402,
    hint: "You don't have enough credits to complete this transaction. Add credits to your wallet and try again."
  },
  INSUFFICIENT_POINTS: { 
    code: 1103, 
    message: "Insufficient points in wallet",
    http_status: 402,
    hint: "You don't have enough points to complete this transaction. Earn more points or convert credits to points."
  },
  INSUFFICIENT_COINS: { 
    code: 1104, 
    message: "Insufficient coins in wallet",
    http_status: 402,
    hint: "You don't have enough coins to complete this transaction. Purchase coins or earn them through activities."
  },
  WALLET_LOCKED: { 
    code: 1105, 
    message: "Wallet is locked",
    http_status: 423,
    hint: "Your wallet is temporarily locked, possibly due to suspicious activity. Contact support to unlock your wallet."
  },
  WALLET_TRANSACTION_FAILED: { 
    code: 1106, 
    message: "Wallet transaction failed", 
    reason: "Transaction rollback or DB error",
    http_status: 500,
    hint: "The transaction could not be completed due to a system error. Your balance was not changed. Please try again."
  },
  INVALID_TRANSACTION_TYPE: { 
    code: 1107, 
    message: "Invalid transaction type",
    http_status: 400,
    hint: "The transaction type you specified is not valid. Check the API documentation for supported transaction types."
  },
  INVALID_USAGE_TYPE: { 
    code: 1108, 
    message: "Invalid usage type",
    http_status: 400,
    hint: "The usage type specified is not valid. Verify the usage type matches the available options."
  },
  WALLET_UPDATE_FAILED: { 
    code: 1109, 
    message: "Failed to update wallet", 
    reason: "Wallet update or sync error",
    http_status: 500,
    hint: "Wallet update failed due to a system error. Your wallet balance may be out of sync. Contact support if the issue persists."
  },
  TRANSACTION_NOT_FOUND: { 
    code: 1110, 
    message: "Transaction not found",
    http_status: 404,
    hint: "The transaction you're looking for doesn't exist. Verify the transaction ID is correct."
  },
  TRANSACTION_DUPLICATE: { 
    code: 1111, 
    message: "Duplicate transaction detected",
    http_status: 409,
    hint: "This transaction has already been processed. Check your transaction history to see the existing transaction."
  },
  EXCEEDS_MAX_LIMIT: { 
    code: 1112, 
    message: "Transaction exceeds maximum limit",
    http_status: 400,
    hint: "The transaction amount exceeds the maximum allowed limit. Reduce the amount or split into multiple transactions."
  },
  NEGATIVE_BALANCE_NOT_ALLOWED: { 
    code: 1113, 
    message: "Negative balance not allowed",
    http_status: 400,
    hint: "This transaction would result in a negative balance, which is not allowed. Ensure you have sufficient funds."
  },
  INVALID_WALLET_ID: { 
    code: 1114, 
    message: "Invalid wallet ID",
    http_status: 400,
    hint: "The wallet ID provided is invalid or malformed. Check the wallet ID format and try again."
  },
  TRANSACTION_REVERSED: { 
    code: 1115, 
    message: "Transaction has been reversed",
    http_status: 409,
    hint: "This transaction has been reversed. Check your transaction history for details on the reversal."
  },
  WALLET_SYNC_ERROR: { 
    code: 1116, 
    message: "Wallet sync error", 
    reason: "Failed to reconcile wallet balance",
    http_status: 500,
    hint: "Wallet synchronization failed. Your balance may be temporarily inaccurate. The system will retry automatically."
  },
  CURRENCY_MISMATCH: { 
    code: 1117, 
    message: "Currency mismatch in wallet",
    http_status: 400,
    hint: "The transaction currency doesn't match your wallet currency. Ensure you're using the correct currency."
  },
  COUPON_ALREADY_USED: { 
    code: 1118, 
    message: "Coupon already used",
    http_status: 409,
    hint: "This coupon has already been redeemed. Each coupon can only be used once per user."
  },
  INVALID_COUPON: { 
    code: 1119, 
    message: "Invalid coupon",
    http_status: 400,
    hint: "The coupon code is invalid, expired, or doesn't exist. Check the code and ensure it hasn't expired."
  },
  EXCEEDED_DAILY_LIMIT: { 
    code: 1120, 
    message: "Exceeded daily wallet transaction limit",
    http_status: 429,
    hint: "You've reached the daily transaction limit. Wait until tomorrow or contact support to increase your limit."
  },


  // 📎 Media (125x)
  MEDIA_NOT_FOUND: { 
    code: 1251, 
    message: "Media file not found",
    http_status: 404,
    hint: "The requested media file doesn't exist or has been deleted. Verify the media ID or URL is correct."
  },
  MEDIA_UPLOAD_FAILED: { 
    code: 1252, 
    message: "Failed to upload media",
    http_status: 500,
    hint: "Media upload failed. Check your internet connection, ensure the file is valid, and try again."
  },
  MEDIA_TYPE_NOT_SUPPORTED: { 
    code: 1253, 
    message: "Unsupported media type",
    http_status: 415,
    hint: "The file type is not supported. Check the API documentation for accepted file formats (e.g., JPG, PNG, MP4)."
  },
  MEDIA_TOO_LARGE: { 
    code: 1254, 
    message: "Media file too large",
    http_status: 413,
    hint: "The file exceeds the maximum size limit. Compress or resize the file before uploading."
  },
  MEDIA_UPLOADING_PROCESSING_ERROR: { 
    code: 1255, 
    message: "Unexpected error during media uploading",
    http_status: 500,
    hint: "An error occurred while processing your media upload. The file may be corrupted. Try uploading again with a different file."
  },
  MEDIA_DELETING_PROCESSING_ERROR: { 
    code: 1256, 
    message: "Unexpected error during media deletion",
    http_status: 500,
    hint: "Failed to delete the media file. The file may have already been deleted or there was a system error. Try again."
  },
  MEDIA_FILE_OR_URL: { 
    code: 1257, 
    message: "At least one of 'url' or 'file' must be provided",
    http_status: 400,
    hint: "You must provide either a file to upload or a URL to download. Include one of these in your request."
  },

  // --- CREATE ERRORS ---
  CREATE_FAILED: {
    code: 2001,
    message: "Failed to create resource",
    reason: "Invalid data or constraint violation",
    http_status: 400,
    hint: "Resource creation failed. Check that all required fields are provided and meet validation requirements."
  },
  FOREIGN_KEY_VIOLATION: { 
    code: 2002, 
    message: "Invalid reference to related data", 
    reason: "Foreign key constraint failed",
    http_status: 400,
    hint: "The referenced resource (e.g., user ID, category ID) doesn't exist. Verify all referenced IDs are valid."
  },
  REQUIRED_FIELD_MISSING: {
    code: 2003,
    message: "Required field is missing",
    http_status: 400,
    hint: "One or more required fields are missing from your request. Check the API documentation for required fields."
  },
  INVALID_FIELD_FORMAT: {
    code: 2004,
    message: "Invalid field format",
    http_status: 400,
    hint: "One or more fields have an invalid format. Check field types (email, date, number, etc.) and formats."
  },

  // --- READ ERRORS ---
  RESOURCE_NOT_FOUND: { 
    code: 2100, 
    message: "Requested resource not found", 
    http_status: 404,
    hint: "The resource you're looking for doesn't exist. Verify the resource ID or identifier is correct."
  },
  USER_NOT_FOUND: { 
    code: 2101, 
    message: "User not found", 
    http_status: 404,
    hint: "The user account doesn't exist. Check the user ID or email address is correct."
  },
  INVALID_QUERY: { 
    code: 2102, 
    message: "Invalid filter or query parameters", 
    http_status: 400,
    hint: "Your query parameters are invalid. Check the API documentation for supported filters and their formats."
  },
  INVALID_PAGINATION: {
    code: 2103,
    message: "Invalid pagination parameters",
    http_status: 400,
    hint: "Pagination parameters (page, limit, offset) are invalid. Ensure they are positive numbers within allowed ranges."
  },
  SEARCH_FAILED: {
    code: 2104,
    message: "Search operation failed",
    http_status: 500,
    hint: "The search could not be completed. Try simplifying your search query or try again later."
  },

  // --- UPDATE ERRORS ---
  UPDATE_FAILED: { 
    code: 2200, 
    message: "Failed to update resource", 
    http_status: 400,
    hint: "Update failed. Check that the resource exists, you have permission to update it, and all fields are valid."
  },
  CONFLICT_UPDATE: { 
    code: 2201, 
    message: "Update conflict", 
    reason: "Resource modified by another process",
    http_status: 409,
    hint: "The resource was modified by another process. Refresh the resource and try updating again."
  },
  VERSION_MISMATCH: {
    code: 2202,
    message: "Resource version mismatch",
    http_status: 409,
    hint: "The resource version has changed. Fetch the latest version and retry your update."
  },
  UPDATE_PERMISSION_DENIED: {
    code: 2203,
    message: "Permission denied to update resource",
    http_status: 403,
    hint: "You don't have permission to update this resource. Only the owner or authorized users can update it."
  },

  // --- DELETE ERRORS ---
  DELETE_FAILED: { 
    code: 2300, 
    message: "Failed to delete resource", 
    http_status: 400,
    hint: "Deletion failed. Ensure the resource exists and you have permission to delete it."
  },
  RESOURCE_IN_USE: { 
    code: 2301, 
    message: "Cannot delete resource because it is in use", 
    http_status: 409,
    hint: "This resource cannot be deleted because it's being used by other resources. Remove dependencies first."
  },
  DELETE_PERMISSION_DENIED: {
    code: 2302,
    message: "Permission denied to delete resource",
    http_status: 403,
    hint: "You don't have permission to delete this resource. Only the owner or authorized users can delete it."
  },
  SOFT_DELETE_REQUIRED: {
    code: 2303,
    message: "Resource must be soft deleted first",
    http_status: 400,
    hint: "This resource must be soft deleted (marked as deleted) before it can be permanently removed."
  },

  // --- DATABASE / INTERNAL ERRORS ---
  DATABASE_CONNECTION_FAILED: { 
    code: 1500, 
    message: "Database connection failed", 
    http_status: 500,
    hint: "Unable to connect to the database. This is usually temporary - please try again in a moment."
  },
  DATABASE_HEALTH_CHECK_FAILED: { 
    code: 1504, 
    message: "Database health check failed", 
    reason: "Failed to check database health status",
    http_status: 500,
    hint: "Database health check failed. The database may be experiencing issues. Try again later."
  },
  DATABASE_UNHEALTHY: { 
    code: 1505, 
    message: "Database unhealthy", 
    reason: "Database is not responding or is in an unhealthy state",
    http_status: 503,
    hint: "The database is currently unavailable or unhealthy. Please try again later or contact support."
  },
  INTEGRITY_ERROR: { 
    code: 1501, 
    message: "Data integrity error", 
    reason: "Constraint violation",
    http_status: 400,
    hint: "The data violates database constraints (e.g., unique constraint, foreign key). Check your input data."
  },
  TRANSACTION_ERROR: { 
    code: 1502, 
    message: "Transaction rollback due to internal error", 
    http_status: 500,
    hint: "A database transaction failed and was rolled back. No changes were made. Please try again."
  },
  UNEXPECTED_ERROR: { 
    code: 1503, 
    message: "An unexpected database error occurred", 
    http_status: 500,
    hint: "An unexpected database error occurred. Please try again. If the issue persists, contact support."
  },
  QUERY_EXECUTION_FAILED: {
    code: 1506,
    message: "Query execution failed",
    http_status: 500,
    hint: "The database query could not be executed. Check your query syntax or try again later."
  },
  CONNECTION_POOL_EXHAUSTED: {
    code: 1507,
    message: "Database connection pool exhausted",
    http_status: 503,
    hint: "All database connections are in use. Please wait a moment and try again."
  },

  // 🏥 Health Check Errors (1800-1899)
  HEALTH_CHECK_FAILED: { 
    code: 1800, 
    message: "Health check failed", 
    reason: "Failed to perform health check",
    http_status: 503,
    hint: "The system health check failed. One or more services may be unavailable. Try again later."
  },
  STORAGE_HEALTH_CHECK_FAILED: { 
    code: 1801, 
    message: "Storage health check failed", 
    reason: "Failed to check storage service health status",
    http_status: 503,
    hint: "Storage service health check failed. File uploads/downloads may be temporarily unavailable."
  },
  STORAGE_UNHEALTHY: { 
    code: 1802, 
    message: "Storage unhealthy", 
    reason: "Storage service is not responding or is in an unhealthy state",
    http_status: 503,
    hint: "The storage service is currently unavailable. File operations may fail. Please try again later."
  },
  WALLET_HEALTH_CHECK_FAILED: { 
    code: 1803, 
    message: "Wallet health check failed", 
    reason: "Failed to check wallet service health status",
    http_status: 503,
    hint: "Wallet service health check failed. Wallet operations may be temporarily unavailable."
  },
  REDIS_HEALTH_CHECK_FAILED: {
    code: 1804,
    message: "Redis health check failed",
    reason: "Failed to check Redis service health status",
    http_status: 503,
    hint: "Redis cache service health check failed. Caching may be temporarily unavailable."
  },
  EXTERNAL_SERVICE_UNAVAILABLE: {
    code: 1805,
    message: "External service unavailable",
    http_status: 503,
    hint: "An external service required for this operation is currently unavailable. Please try again later."
  },

  // 🔐 Permissions & Groups (1900-1999)
  PERMISSION_NOT_FOUND: {
    code: 1901,
    message: "Permission not found",
    http_status: 404,
    hint: "The requested permission does not exist. Verify the permission ID or codename is correct."
  },
  PERMISSION_CREATE_FAILED: {
    code: 1902,
    message: "Failed to create permission",
    reason: "Database or validation error",
    http_status: 400,
    hint: "Permission creation failed. Check that the name and codename are unique and meet validation requirements."
  },
  PERMISSION_UPDATE_FAILED: {
    code: 1903,
    message: "Failed to update permission",
    reason: "Permission not found or validation error",
    http_status: 400,
    hint: "Permission update failed. Ensure the permission exists and all fields are valid."
  },
  PERMISSION_DELETE_FAILED: {
    code: 1904,
    message: "Failed to delete permission",
    reason: "Permission not found or in use",
    http_status: 400,
    hint: "Permission deletion failed. The permission may not exist or is being used by groups."
  },
  GROUP_NOT_FOUND: {
    code: 1911,
    message: "Group not found",
    http_status: 404,
    hint: "The requested group does not exist. Verify the group ID or codename is correct."
  },
  GROUP_CREATE_FAILED: {
    code: 1912,
    message: "Failed to create group",
    reason: "Database or validation error",
    http_status: 400,
    hint: "Group creation failed. Check that the name and codename are unique and meet validation requirements."
  },
  GROUP_UPDATE_FAILED: {
    code: 1913,
    message: "Failed to update group",
    reason: "Group not found or validation error",
    http_status: 400,
    hint: "Group update failed. Ensure the group exists and all fields are valid."
  },
  GROUP_DELETE_FAILED: {
    code: 1914,
    message: "Failed to delete group",
    reason: "Group not found or is a system group",
    http_status: 400,
    hint: "Group deletion failed. System groups cannot be deleted."
  },
  GROUP_ASSIGN_PERMISSIONS_FAILED: {
    code: 1915,
    message: "Failed to assign permissions to group",
    reason: "Group or permissions not found",
    http_status: 400,
    hint: "Failed to assign permissions. Verify the group and permission IDs are correct."
  },
  GROUP_ASSIGN_USERS_FAILED: {
    code: 1916,
    message: "Failed to assign groups to user",
    reason: "User or groups not found",
    http_status: 400,
    hint: "Failed to assign groups. Verify the user ID and group codenames are correct."
  },
  PERMISSION_DENIED: {
    code: 1920,
    message: "Permission denied",
    reason: "User lacks required permission",
    http_status: 403,
    hint: "You don't have the required permission to perform this action. Contact your administrator."
  },
  GROUP_DENIED: {
    code: 1921,
    message: "Group access denied",
    reason: "User is not a member of required group",
    http_status: 403,
    hint: "You must be a member of the required group to perform this action."
  },

  // 📊 Activity Logs (1950-1979)
  ACTIVITY_LOG_NOT_FOUND: {
    code: 1951,
    message: "Activity log not found",
    http_status: 404,
    hint: "The requested activity log does not exist. Verify the log ID is correct."
  },
  ACTIVITY_LOG_CREATE_FAILED: {
    code: 1952,
    message: "Failed to create activity log",
    reason: "Database or validation error",
    http_status: 400,
    hint: "Activity log creation failed. Ensure all required fields (message) are provided."
  },
  ACTIVITY_LOG_QUERY_FAILED: {
    code: 1953,
    message: "Failed to query activity logs",
    reason: "Invalid filters or query parameters",
    http_status: 400,
    hint: "Activity log query failed. Check your filter parameters and try again."
  },
  ACTIVITY_LOG_DELETE_FAILED: {
    code: 1954,
    message: "Failed to delete activity logs",
    reason: "Database error",
    http_status: 500,
    hint: "Failed to delete activity logs. Please try again later."
  },

  // 📤 Upload & Media (1980-1999)
  MEDIA_DOWNLOAD_ERROR: {
    code: 1981,
    message: "Failed to download media from URL",
    reason: "Invalid URL or download failed",
    http_status: 400,
    hint: "Failed to download the file from the provided URL. Check the URL is valid and accessible."
  },
  MEDIA_DELETE_ERROR: {
    code: 1982,
    message: "Failed to delete media file",
    reason: "File not found or storage error",
    http_status: 404,
    hint: "Failed to delete the media file. The file may not exist or there was a storage service error."
  },
  CONFIGURATION_ERROR: {
    code: 1983,
    message: "Configuration error",
    reason: "Required configuration is missing or invalid",
    http_status: 500,
    hint: "A required configuration is missing or invalid. Contact support to resolve this issue."
  },
  MEDIA_INVALID_URL: {
    code: 1984,
    message: "Invalid media URL",
    reason: "URL format is invalid or not supported",
    http_status: 400,
    hint: "The provided URL is invalid or not supported. Ensure it's a valid URL format."
  },

  // 📈 Dashboard (2000-2029)
  DASHBOARD_ERROR: {
    code: 2001,
    message: "Dashboard operation failed",
    reason: "Failed to retrieve dashboard data",
    http_status: 500,
    hint: "Failed to retrieve dashboard data. Please try again later."
  },
  DASHBOARD_QUERY_FAILED: {
    code: 2002,
    message: "Dashboard query failed",
    reason: "Invalid query parameters or database error",
    http_status: 400,
    hint: "Dashboard query failed. Check your query parameters and try again."
  },
};

/**
 * Get error by key
 * @param {string} errorKey - Error key
 * @returns {object|null} Error object or null if not found
 */
function getError(errorKey) {
  return ERRORS[errorKey] || null;
}

/**
 * Check if error exists
 * @param {string} errorKey - Error key
 * @returns {boolean} True if error exists
 */
function hasError(errorKey) {
  return errorKey in ERRORS;
}

/**
 * Get all error keys
 * @returns {string[]} Array of error keys
 */
function getAllErrorKeys() {
  return Object.keys(ERRORS);
}

/**
 * Get errors by code range
 * @param {number} minCode - Minimum code
 * @param {number} maxCode - Maximum code
 * @returns {object} Object with error keys and their definitions
 */
function getErrorsByCodeRange(minCode, maxCode) {
  const filtered = {};
  for (const [key, value] of Object.entries(ERRORS)) {
    if (value.code >= minCode && value.code <= maxCode) {
      filtered[key] = value;
    }
  }
  return filtered;
}

module.exports = {
  ERRORS,
  getError,
  hasError,
  getAllErrorKeys,
  getErrorsByCodeRange,
};

