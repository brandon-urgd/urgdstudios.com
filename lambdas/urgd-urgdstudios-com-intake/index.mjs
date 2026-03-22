import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';
import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';
import { randomUUID } from 'crypto';
import crypto from 'crypto';
import sanitizeHtml from 'sanitize-html';
import { createResponse, errorResponse, getCorsHeaders, validateEmail, hashIp, log } from './shared/utils.mjs';
import { handleHealthCheck } from './shared/healthCheck.mjs';

// Initialize AWS SDK clients
const dynamoClient = new DynamoDBClient({ region: process.env.AWS_REGION || 'us-west-2' });
const docClient = DynamoDBDocumentClient.from(dynamoClient);
const sesClient = new SESClient({ region: process.env.AWS_REGION || 'us-west-2' });

// Environment variables
const SUBMISSIONS_TABLE = process.env.SUBMISSIONS_TABLE;
const NOTIFICATION_TO_ADDRESS = process.env.NOTIFICATION_TO_ADDRESS || 'admin@urgdstudios.com';
const ENVIRONMENT = process.env.ENVIRONMENT || 'prod';
const VERSION = process.env.VERSION || '3.0.0';
const POW_DIFFICULTY = parseInt(process.env.POW_DIFFICULTY || '4', 10);
const SES_FROM_ADDRESS = process.env.SES_FROM_ADDRESS || 'command@urgdstudios.com';
const SES_FROM_DISPLAY_NAME = process.env.SES_FROM_DISPLAY_NAME || 'ur/gd Command';
const SES_REPLY_TO = process.env.SES_REPLY_TO || 'admin@urgdstudios.com';
const SITE_URL = process.env.SITE_URL || 'https://urgdstudios.com';
// Default to enabled if env var is missing (prevent silent disablement of auto-ack)
const COMMAND_CENTER_AUTO_RESPONSE = process.env.COMMAND_CENTER_AUTO_RESPONSE !== 'false';
const COMMAND_API_KEY = process.env.COMMAND_API_KEY;

// Valid submission types
const VALID_TYPES = [
  'general-inquiry',
  'bug-report',
  'feature-request',
  'privacy-question',
  'report-abuse'
];

// Type display labels for notifications
const TYPE_LABELS = {
  'general-inquiry': 'General Inquiry',
  'bug-report': 'Bug Report',
  'feature-request': 'Feature Request',
  'privacy-question': 'Privacy Question',
  'report-abuse': 'Abuse Report'
};

/**
 * Main Lambda handler
 * Routes requests to appropriate handlers
 */
export async function handler(event) {
  const requestId = event.requestContext?.requestId || 'unknown';
  const method = event.requestContext?.http?.method;
  const rawPath = event.requestContext?.http?.path;
  
  // Strip stage prefix from path (e.g., /prod/v1/intake/health → /v1/intake/health)
  const path = rawPath?.replace(/^\/[^/]+/, '') || rawPath;
  
  log('info', 'Request received', {
    requestId,
    method,
    path,
    environment: ENVIRONMENT
  });
  
  try {
    // Handle CORS preflight
    if (method === 'OPTIONS') {
      return createResponse(200, { message: 'OK' }, event);
    }
    
    // Route: GET /v1/intake/health
    if (method === 'GET' && path === '/v1/intake/health') {
      return await handleHealthCheck(event, requestId, {
        tableName: SUBMISSIONS_TABLE,
        requiredEnvVars: ['SUBMISSIONS_TABLE', 'NOTIFICATION_TO_ADDRESS', 'CORS_ALLOWED_ORIGINS', 'POW_DIFFICULTY']
      });
    }
    
    // Route: POST /v1/intake
    if (method === 'POST' && path === '/v1/intake') {
      return await handleIntakeSubmission(event, requestId);
    }
    
    // Route: POST /v1/intake/report (app-to-app reporting — no honeypot/PoW)
    if (method === 'POST' && path === '/v1/intake/report') {
      return await handleAppReport(event, requestId);
    }
    
    // Unknown route
    log('warn', 'Unknown route', { requestId, method, path });
    return errorResponse(404, 'Not found', null, event);
    
  } catch (error) {
    log('error', 'Unhandled error', {
      requestId,
      error: error.message,
      stack: error.stack
    });
    
    return errorResponse(
      500,
      'An unexpected error occurred. Please try again.',
      null,
      event
    );
  }
}

/**
 * Handles intake form submission with honeypot and proof-of-work verification
 */
async function handleIntakeSubmission(event, requestId) {
  try {
    // Parse request body
    let body;
    try {
      body = JSON.parse(event.body || '{}');
    } catch (error) {
      log('warn', 'Invalid JSON', { requestId });
      return errorResponse(400, 'Invalid request format', null, event);
    }
    
    // STEP 1: Honeypot check - FIRST defense layer
    // If honeypot is non-empty, silently reject (return 200 to avoid bot learning)
    if (body.honeypot && body.honeypot.trim().length > 0) {
      log('warn', 'Bot detected via honeypot', { requestId });
      
      // Return 200 with fake success (silent rejection)
      return createResponse(200, {
        message: 'Submission received',
        submissionId: `bot-${randomUUID()}`
      }, event);
    }
    
    // STEP 2: Validate required fields
    const validationErrors = validateInput(body);
    if (Object.keys(validationErrors).length > 0) {
      log('info', 'Validation failed', {
        requestId,
        errors: Object.keys(validationErrors)
      });
      
      // Return first error message
      const firstError = Object.values(validationErrors)[0];
      return errorResponse(400, firstError, null, event);
    }
    
    // STEP 3: Verify proof-of-work
    const powResult = verifyProofOfWork(body.proofOfWork, requestId);
    if (!powResult.valid) {
      log('warn', 'Proof of work verification failed', {
        requestId,
        reason: powResult.reason
      });
      
      return errorResponse(400, powResult.message, null, event);
    }
    
    // STEP 4: Get and hash IP address
    const sourceIp = event.requestContext?.http?.sourceIp || 'unknown';
    const ipHash = hashIp(sourceIp);
    
    // STEP 5: Rate limit check
    const isRateLimited = await checkRateLimit(ipHash, requestId);
    if (isRateLimited) {
      log('warn', 'Rate limit exceeded', {
        requestId,
        ipHash
      });
      
      return errorResponse(
        429,
        'Too many submissions. Please try again later.',
        null,
        event
      );
    }
    
    // STEP 6: Sanitize input (especially message field)
    const sanitizedMessage = sanitizeHtml(body.message.trim(), {
      allowedTags: [],
      allowedAttributes: {},
      disallowedTagsMode: 'discard'
    });
    
    const name = body.name.trim().substring(0, 200);
    const email = body.email.trim().substring(0, 200);
    const type = body.type;
    
    // STEP 7: Store submission in DynamoDB (with status: 'new' for Command Center)
    const submissionId = randomUUID();
    const timestamp = new Date().toISOString();
    const ttl = Math.floor(Date.now() / 1000) + (90 * 24 * 60 * 60); // 90 days
    
    await storeSubmission({
      submissionId,
      timestamp,
      name,
      email,
      type,
      message: sanitizedMessage,
      source: 'urgdstudios.com',
      status: 'new',
      ipHash,
      honeypot: body.honeypot || '',
      proofOfWork: body.proofOfWork,
      ttl
    });
    
    // STEP 8: Send auto-acknowledgment email (non-blocking — failure does not affect submission)
    if (COMMAND_CENTER_AUTO_RESPONSE && email) {
      try {
        await sendAutoAck({ name, email, requestId });
      } catch (sesError) {
        log('error', 'Auto-ack email failed — submission saved, command notification will still be sent', {
          requestId,
          submissionId,
          error: sesError.message,
        });
      }
    }
    
    // STEP 9: Send SES notification to admin (heads-up only — no PII, no message content)
    try {
      await sendCommandNotification({
        submissionId,
        timestamp,
        type,
        appName: 'urgdstudios.com'
      });
    } catch (sesError) {
      log('error', 'Command notification email failed — submission saved, auto-ack may have been sent', {
        requestId,
        submissionId,
        error: sesError.message,
      });
    }
    
    log('info', 'Submission received', {
      requestId,
      submissionId,
      type,
      ipHash
    });
    
    // STEP 10: Return success
    return createResponse(200, {
      message: 'Submission received',
      submissionId
    }, event);
    
  } catch (error) {
    log('error', 'Intake processing failed', {
      requestId,
      error: error.message,
      stack: error.stack
    });
    
    return errorResponse(
      500,
      'An unexpected error occurred. Please try again.',
      null,
      event
    );
  }
}

/**
 * Handles app-to-app report submissions from other ur/gd apps.
 * No honeypot or proof-of-work — server-to-server only.
 * Authenticated via X-Api-Key header.
 * Rate limited by app name (50/min per app).
 */
async function handleAppReport(event, requestId) {
  try {
    // Validate API key
    const apiKey = event.headers?.['x-api-key'] || event.headers?.['X-Api-Key'];
    if (!COMMAND_API_KEY || !apiKey || apiKey !== COMMAND_API_KEY) {
      log('warn', 'App report: invalid API key', { requestId });
      return errorResponse(401, 'Unauthorized', null, event);
    }

    // Parse body
    let body;
    try {
      body = JSON.parse(event.body || '{}');
    } catch {
      return errorResponse(400, 'Invalid request format', null, event);
    }

    // Validate required fields
    const { app, type, name, email, message, metadata } = body;

    if (!app || typeof app !== 'string' || app.trim().length === 0) {
      return errorResponse(400, 'app is required', null, event);
    }
    if (!type || !VALID_TYPES.includes(type)) {
      return errorResponse(400, 'Invalid type', null, event);
    }
    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return errorResponse(400, 'message is required', null, event);
    }
    if (message.trim().length > 5000) {
      return errorResponse(400, 'message must be 5000 characters or fewer', null, event);
    }

    const appName = app.trim().substring(0, 50);

    // Rate limit by app name (50/min per app)
    const isRateLimited = await checkAppRateLimit(appName, requestId);
    if (isRateLimited) {
      log('warn', 'App report: rate limit exceeded', { requestId, app: appName });
      return errorResponse(429, 'Too many requests. Please try again later.', null, event);
    }

    // Sanitize message
    const sanitizedMessage = sanitizeHtml(message.trim(), {
      allowedTags: [],
      allowedAttributes: {},
      disallowedTagsMode: 'discard'
    });

    // Store submission
    const submissionId = randomUUID();
    const timestamp = new Date().toISOString();
    const ttl = Math.floor(Date.now() / 1000) + (90 * 24 * 60 * 60); // 90 days

    await storeSubmission({
      submissionId,
      timestamp,
      name: name?.trim().substring(0, 200) || '',
      email: email?.trim().substring(0, 200) || '',
      type,
      message: sanitizedMessage,
      source: appName,
      status: 'new',
      ipHash: `app:${appName}`,
      honeypot: '',
      proofOfWork: null,
      ...(metadata && typeof metadata === 'object' ? { metadata } : {}),
      ttl
    });

    // Send SES notification with app name in subject
    try {
      await sendCommandNotification({
        submissionId,
        timestamp,
        type,
        appName: appName.charAt(0).toUpperCase() + appName.slice(1)
      });
    } catch (sesError) {
      log('error', 'App report: notification email failed — submission saved', {
        requestId,
        submissionId,
        error: sesError.message,
      });
    }

    log('info', 'App report received', { requestId, submissionId, type, app: appName });

    return createResponse(200, { submissionId }, event);

  } catch (error) {
    log('error', 'App report processing failed', {
      requestId,
      error: error.message,
      stack: error.stack
    });
    return errorResponse(500, 'An unexpected error occurred.', null, event);
  }
}

/**
 * Rate limit check by app name — 50 submissions per minute per app
 */
async function checkAppRateLimit(appName, requestId) {
  try {
    const oneMinuteAgo = new Date(Date.now() - 60 * 1000).toISOString();

    const command = new QueryCommand({
      TableName: SUBMISSIONS_TABLE,
      IndexName: 'ipHash-timestamp-index',
      KeyConditionExpression: 'ipHash = :appKey AND #ts > :timestamp',
      ExpressionAttributeNames: { '#ts': 'timestamp' },
      ExpressionAttributeValues: {
        ':appKey': `app:${appName}`,
        ':timestamp': oneMinuteAgo
      },
      Select: 'COUNT'
    });

    const response = await docClient.send(command);
    return (response.Count || 0) >= 50;
  } catch (error) {
    log('error', 'App rate limit check failed', { requestId, error: error.message });
    return false; // Fail open
  }
}

/**
 * Validates intake form input
 * Returns object with field-specific error messages
 */
function validateInput(body) {
  const errors = {};
  
  // Name validation
  if (!body.name || typeof body.name !== 'string' || body.name.trim().length === 0) {
    errors.name = 'Name is required';
  } else if (body.name.trim().length > 200) {
    errors.name = 'Name must be 200 characters or fewer';
  }
  
  // Email validation
  if (!body.email || typeof body.email !== 'string' || body.email.trim().length === 0) {
    errors.email = 'Email is required';
  } else if (!validateEmail(body.email.trim())) {
    errors.email = 'Invalid email address';
  }
  
  // Type validation
  if (!body.type || !VALID_TYPES.includes(body.type)) {
    errors.type = 'Invalid inquiry type';
  }
  
  // Message validation
  if (!body.message || typeof body.message !== 'string' || body.message.trim().length === 0) {
    errors.message = 'Message is required';
  } else if (body.message.trim().length > 5000) {
    errors.message = 'Message must be 5,000 characters or fewer';
  }
  
  // Proof-of-work validation (presence check only - verification happens separately)
  if (!body.proofOfWork || typeof body.proofOfWork !== 'object') {
    errors.proofOfWork = 'Proof of work is required';
  } else {
    if (!body.proofOfWork.challenge || !body.proofOfWork.nonce || !body.proofOfWork.solution) {
      errors.proofOfWork = 'Proof of work is required';
    }
  }
  
  return errors;
}

/**
 * Verifies proof-of-work solution
 * @param {object} proofOfWork - PoW object from client
 * @param {string} requestId - Request ID for logging
 * @returns {object} Verification result { valid: boolean, reason?: string, message?: string }
 */
function verifyProofOfWork(proofOfWork, requestId) {
  if (!proofOfWork) {
    return {
      valid: false,
      reason: 'missing',
      message: 'Proof of work is required'
    };
  }
  
  const { challenge, nonce, solution } = proofOfWork;
  
  // Validate presence
  if (!challenge || !nonce || !solution) {
    return {
      valid: false,
      reason: 'missing fields',
      message: 'Proof of work verification failed'
    };
  }
  
  // Extract timestamp from challenge (format: urgd-{ISO timestamp}-{random})
  const challengeParts = challenge.split('-');
  if (challengeParts.length < 3 || challengeParts[0] !== 'urgd') {
    return {
      valid: false,
      reason: 'invalid challenge format',
      message: 'Proof of work verification failed'
    };
  }
  
  // Parse timestamp (second part is ISO timestamp)
  const timestampStr = challengeParts.slice(1, -1).join('-'); // Handle ISO format with multiple dashes
  let challengeTime;
  try {
    challengeTime = new Date(timestampStr).getTime();
    if (isNaN(challengeTime)) {
      throw new Error('Invalid timestamp');
    }
  } catch (error) {
    return {
      valid: false,
      reason: 'invalid timestamp',
      message: 'Proof of work verification failed'
    };
  }
  
  // Check if challenge is within 5-minute window
  const now = Date.now();
  const fiveMinutes = 5 * 60 * 1000;
  
  if (now - challengeTime > fiveMinutes) {
    return {
      valid: false,
      reason: 'expired challenge',
      message: 'Challenge expired. Please try again.'
    };
  }
  
  if (challengeTime > now + 60000) { // Allow 1 min clock skew
    return {
      valid: false,
      reason: 'future challenge',
      message: 'Challenge expired. Please try again.'
    };
  }
  
  // Compute SHA-256 hash of challenge + nonce
  const hash = crypto
    .createHash('sha256')
    .update(challenge + nonce.toString())
    .digest('hex');
  
  // Verify hash matches solution
  if (hash !== solution) {
    return {
      valid: false,
      reason: 'hash mismatch',
      message: 'Proof of work verification failed'
    };
  }
  
  // Verify hash has required leading zeros
  const leadingZeros = hash.match(/^0*/)[0].length;
  if (leadingZeros < POW_DIFFICULTY) {
    return {
      valid: false,
      reason: 'insufficient leading zeros',
      message: 'Proof of work verification failed'
    };
  }
  
  // All checks passed
  return { valid: true };
}

/**
 * Checks if the IP has exceeded the rate limit
 * Limit: 3 submissions per 5 minutes
 */
async function checkRateLimit(ipHash, requestId) {
  try {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    
    const command = new QueryCommand({
      TableName: SUBMISSIONS_TABLE,
      IndexName: 'ipHash-timestamp-index',
      KeyConditionExpression: 'ipHash = :ipHash AND #ts > :timestamp',
      ExpressionAttributeNames: {
        '#ts': 'timestamp'
      },
      ExpressionAttributeValues: {
        ':ipHash': ipHash,
        ':timestamp': fiveMinutesAgo
      },
      Select: 'COUNT'
    });
    
    const response = await docClient.send(command);
    const recentCount = response.Count || 0;
    
    log('info', 'Rate limit check', {
      requestId,
      ipHash,
      recentCount,
      limit: 3
    });
    
    return recentCount >= 3;
    
  } catch (error) {
    log('error', 'Rate limit check failed', {
      requestId,
      error: error.message
    });
    
    // Fail open - don't block on rate limit errors
    return false;
  }
}

/**
 * Stores submission in DynamoDB
 */
async function storeSubmission(submission) {
  const command = new PutCommand({
    TableName: SUBMISSIONS_TABLE,
    Item: submission
  });
  
  await docClient.send(command);
}

/**
 * Sends auto-acknowledgment email to the visitor via SES.
 * Called only when COMMAND_CENTER_AUTO_RESPONSE is true and email is present.
 * Failures are logged and non-blocking — submission is already saved.
 */
async function sendAutoAck({ name, email, requestId }) {
  const textBody = `Hi ${name},

We received your message. Someone from our team will follow up with you directly.

Thanks for reaching out.

— ur/gd Studios

---
Sent by ur/gd Studios (https://www.urgdstudios.com)
ur/gd Studios LLC · The Cloud Room · 1424 11th Ave STE 400 · Seattle, WA 98122-4271
Privacy Policy: https://www.urgdstudios.com/privacy | Terms: https://www.urgdstudios.com/terms`;

  const htmlBody = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
<style>
  @import url('https://fonts.googleapis.com/css2?family=Archivo:wght@700&family=Rubik&display=swap');
</style>
</head>
<body style="margin:0;padding:0;background-color:#ffffff;">
  <div style="max-width:600px;margin:0 auto;padding:24px;color:#111827;font-family:'Rubik',sans-serif;">
    <h2 style="color:#111827;margin-bottom:8px;font-family:'Archivo',sans-serif;">We got your message.</h2>
    <p style="font-size:16px;margin-top:0;">Hi ${name},</p>
    <p style="font-size:16px;">We received your message. Someone from our team will follow up with you directly.</p>
    <p style="font-size:16px;">Thanks for reaching out.</p>
    <p style="font-size:16px;">— ur/gd Studios</p>

    <hr style="border:none;border-top:1px solid #e5e7eb;margin:28px 0 16px;">
    <p style="font-size:11px;color:#6b7280;margin:4px 0;">
      Sent by <a href="https://www.urgdstudios.com" style="color:#6b7280;">ur/gd Studios</a>
    </p>
    <p style="font-size:11px;color:#6b7280;margin:4px 0;">
      ur/gd Studios LLC &middot; The Cloud Room &middot; 1424 11th Ave STE 400 &middot; Seattle, WA 98122-4271
    </p>
    <p style="font-size:11px;color:#6b7280;margin:4px 0;">
      <a href="https://www.urgdstudios.com/privacy" style="color:#6b7280;">Privacy Policy</a>
      &nbsp;&middot;&nbsp;
      <a href="https://www.urgdstudios.com/terms" style="color:#6b7280;">Terms of Use</a>
    </p>
  </div>
</body>
</html>`;

  await sesClient.send(new SendEmailCommand({
    Source: `"ur/gd Studios" <admin@urgdstudios.com>`,
    ReplyToAddresses: ['admin@urgdstudios.com'],
    Destination: { ToAddresses: [email] },
    Message: {
      Subject: { Data: 'We received your message — ur/gd Studios', Charset: 'UTF-8' },
      Body: {
        Text: { Data: textBody, Charset: 'UTF-8' },
        Html: { Data: htmlBody, Charset: 'UTF-8' },
      },
    },
  }));

  log('info', 'Auto-ack email sent', {
    requestId,
    recipientDomain: email.split('@')[1],
  });
}

/**
 * Sends a branded SES notification to the admin when a new submission arrives.
 * Contains NO PII — heads-up only. Admin reads the full message in Command Center.
 * See ur/gd Email Standards for layout/color spec.
 */
async function sendCommandNotification({ submissionId, timestamp, type, appName }) {
  const categoryLabel = TYPE_LABELS[type] || type;
  const formattedDate = formatEmailDatetime(timestamp);
  const commandUrl = `${SITE_URL}/command/dashboard/messages/${submissionId}`;

  const textBody = `New ${categoryLabel} received via ${appName}.

Submitted: ${formattedDate}

View in Command Center:
${commandUrl}

---
Sent by ur/gd Command, powered by ur/gd Studios (https://www.urgdstudios.com)
ur/gd Studios LLC · The Cloud Room · 1424 11th Ave STE 400 · Seattle, WA 98122-4271
Privacy Policy: https://www.urgdstudios.com/privacy | Terms: https://www.urgdstudios.com/terms`;

  const htmlBody = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
<style>
  @import url('https://fonts.googleapis.com/css2?family=Archivo:wght@700&family=Rubik&display=swap');
</style>
</head>
<body style="margin:0;padding:0;background-color:#ffffff;">
  <div style="max-width:600px;margin:0 auto;padding:24px;color:#111827;font-family:'Rubik',sans-serif;">
    <h2 style="color:#111827;margin-bottom:8px;font-family:'Archivo',sans-serif;">${appName}: ${categoryLabel}</h2>
    <p style="font-size:16px;margin-top:0;">A new submission has been received.</p>
    <p style="font-size:14px;color:#4b5563;margin-top:0;">Submitted: ${formattedDate}</p>

    <table cellpadding="0" cellspacing="0" border="0" style="margin:28px 0;">
      <tr>
        <td style="background-color:#4f46e5;border-radius:8px;padding:12px 24px;">
          <a href="${commandUrl}" style="color:#ffffff;text-decoration:none;font-size:16px;font-weight:600;font-family:'Rubik',sans-serif;">
            View in Command Center
          </a>
        </td>
      </tr>
    </table>

    <hr style="border:none;border-top:1px solid #e5e7eb;margin:28px 0 16px;">
    <p style="font-size:11px;color:#6b7280;margin:4px 0;">
      Sent by Command, powered by <a href="https://www.urgdstudios.com" style="color:#6b7280;">ur/gd Studios</a>
    </p>
    <p style="font-size:11px;color:#6b7280;margin:4px 0;">
      ur/gd Studios LLC &middot; The Cloud Room &middot; 1424 11th Ave STE 400 &middot; Seattle, WA 98122-4271
    </p>
    <p style="font-size:11px;color:#6b7280;margin:4px 0;">
      <a href="https://www.urgdstudios.com/privacy" style="color:#6b7280;">Privacy Policy</a>
      &nbsp;&middot;&nbsp;
      <a href="https://www.urgdstudios.com/terms" style="color:#6b7280;">Terms of Use</a>
    </p>
  </div>
</body>
</html>`;

  await sesClient.send(new SendEmailCommand({
    Source: `"${SES_FROM_DISPLAY_NAME}" <${SES_FROM_ADDRESS}>`,
    ReplyToAddresses: [SES_REPLY_TO],
    Destination: { ToAddresses: [NOTIFICATION_TO_ADDRESS] },
    Message: {
      Subject: { Data: `${appName}: ${categoryLabel}`, Charset: 'UTF-8' },
      Body: {
        Text: { Data: textBody, Charset: 'UTF-8' },
        Html: { Data: htmlBody, Charset: 'UTF-8' },
      },
    },
  }));
}

/**
 * Formats an ISO 8601 timestamp as "Month Day, Year at H:MM AM/PM UTC"
 */
function formatEmailDatetime(isoTimestamp) {
  if (!isoTimestamp) return 'unknown';
  try {
    const date = new Date(isoTimestamp);
    const datePart = date.toLocaleDateString('en-US', {
      year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC',
    });
    const timePart = date.toLocaleTimeString('en-US', {
      hour: 'numeric', minute: '2-digit', hour12: true, timeZone: 'UTC',
    });
    return `${datePart} at ${timePart} UTC`;
  } catch {
    return isoTimestamp;
  }
}
