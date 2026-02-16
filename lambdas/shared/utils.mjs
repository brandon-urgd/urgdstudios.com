import crypto from 'crypto';

/**
 * Creates a standardized successful API response
 * @param {number} statusCode - HTTP status code
 * @param {object} body - Response body object
 * @param {object} event - API Gateway event (for CORS)
 * @returns {object} API Gateway response format
 */
export function createResponse(statusCode, body, event) {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      ...getCorsHeaders(event)
    },
    body: JSON.stringify(body)
  };
}

/**
 * Creates a standardized error response
 * @param {number} statusCode - HTTP status code
 * @param {string} error - Error message
 * @param {object} [details] - Optional error details
 * @param {object} event - API Gateway event (for CORS)
 * @returns {object} API Gateway response format
 */
export function errorResponse(statusCode, error, details, event) {
  const body = { error };
  if (details) {
    body.details = details;
  }
  return createResponse(statusCode, body, event);
}

/**
 * Gets CORS headers for the response
 * Only returns headers if the origin is allowed
 * @param {object} event - API Gateway event
 * @returns {object} CORS headers object
 */
export function getCorsHeaders(event) {
  const origin = event?.headers?.origin || event?.headers?.Origin;
  const allowedOrigins = (process.env.CORS_ALLOWED_ORIGINS || '').split(',');
  
  // Check if origin is allowed
  if (origin && allowedOrigins.includes(origin)) {
    return {
      'Access-Control-Allow-Origin': origin,
      'Access-Control-Allow-Methods': process.env.CORS_ALLOWED_METHODS || 'GET,POST,OPTIONS',
      'Access-Control-Allow-Headers': process.env.CORS_ALLOWED_HEADERS || 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'
    };
  }
  
  return {};
}

/**
 * Sanitizes user input by trimming whitespace and stripping HTML tags
 * @param {string} input - User input string
 * @param {number} maxLength - Maximum allowed length
 * @returns {string} Sanitized string
 */
export function sanitizeInput(input, maxLength) {
  if (!input || typeof input !== 'string') {
    return '';
  }
  
  // Trim whitespace
  let sanitized = input.trim();
  
  // Strip HTML tags (simple approach - removes anything between < and >)
  sanitized = sanitized.replace(/<[^>]*>/g, '');
  
  // Enforce max length
  if (maxLength && sanitized.length > maxLength) {
    sanitized = sanitized.substring(0, maxLength);
  }
  
  return sanitized;
}

/**
 * Validates an email address format
 * @param {string} email - Email address to validate
 * @returns {boolean} True if valid email format
 */
export function validateEmail(email) {
  if (!email || typeof email !== 'string') {
    return false;
  }
  
  // Basic email regex - checks for format user@domain.tld
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 200;
}

/**
 * Hashes an IP address using SHA-256
 * Raw IP is never stored or logged
 * @param {string} ip - IP address to hash
 * @returns {string} SHA-256 hash of the IP address
 */
export function hashIp(ip) {
  if (!ip) {
    return '';
  }
  
  return crypto
    .createHash('sha256')
    .update(ip)
    .digest('hex');
}

/**
 * Logs a structured JSON log entry to CloudWatch
 * @param {string} level - Log level (INFO, WARN, ERROR)
 * @param {string} message - Log message
 * @param {object} [metadata] - Optional metadata object
 */
export function log(level, message, metadata = {}) {
  const logEntry = {
    timestamp: new Date().toISOString(),
    level,
    message,
    ...metadata
  };
  
  console.log(JSON.stringify(logEntry));
}
