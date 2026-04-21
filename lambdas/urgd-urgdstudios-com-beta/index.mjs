import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, GetCommand, UpdateCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';
import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';
import { randomUUID } from 'crypto';
import { createResponse, errorResponse, hashIp, log } from './shared/utils.mjs';
import { handleHealthCheck } from './shared/healthCheck.mjs';
import { sanitizeText, validateSignupInput, validateSurveyResponses } from './validation.mjs';

// Initialize AWS SDK clients
const dynamoClient = new DynamoDBClient({ region: process.env.AWS_REGION || 'us-west-2' });
const docClient = DynamoDBDocumentClient.from(dynamoClient);
const sesClient = new SESClient({ region: process.env.AWS_REGION || 'us-west-2' });

// Environment variables
const TABLE_NAME = process.env.TABLE_NAME;
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@urgdstudios.com';
const ENVIRONMENT = process.env.ENVIRONMENT || 'prod';
const VERSION = process.env.VERSION || '1.0.0';

/**
 * Main Lambda handler
 * Routes requests to appropriate handlers
 */
export async function handler(event) {
  const requestId = event.requestContext?.requestId || 'unknown';
  const method = event.requestContext?.http?.method;
  const rawPath = event.requestContext?.http?.path;

  // Strip stage prefix from path (e.g., /prod/v1/beta/health → /v1/beta/health)
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

    // Route: GET /v1/beta/health
    if (method === 'GET' && path === '/v1/beta/health') {
      return await handleHealthCheck(event, requestId, {
        tableName: TABLE_NAME,
        requiredEnvVars: ['TABLE_NAME', 'CORS_ALLOWED_ORIGINS', 'ADMIN_EMAIL']
      });
    }

    // Route: POST /v1/beta/signup
    if (method === 'POST' && path === '/v1/beta/signup') {
      return await handleSignup(event, requestId);
    }

    // Route: POST /v1/beta/survey
    if (method === 'POST' && path === '/v1/beta/survey') {
      return await handleSurvey(event, requestId);
    }

    // Route: GET /v1/beta/lookup
    if (method === 'GET' && path === '/v1/beta/lookup') {
      return await handleLookup(event, requestId);
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
 * Handles beta signup submissions
 * Validates input, checks honeypot, rate limits, deduplicates, stores record, notifies admin
 */
async function handleSignup(event, requestId) {
  try {
    // Parse request body
    let body;
    try {
      body = JSON.parse(event.body || '{}');
    } catch (error) {
      log('warn', 'Invalid JSON', { requestId });
      return errorResponse(400, 'Invalid request format', null, event);
    }

    // STEP 1: Honeypot check — silent rejection (return 200 to avoid bot learning)
    if (body.honeypot && body.honeypot.trim().length > 0) {
      log('warn', 'Bot detected via honeypot', { requestId });
      return createResponse(200, {
        message: 'Signup received',
        signupId: `bot-${randomUUID()}`
      }, event);
    }

    // STEP 2: Validate required fields
    const validationErrors = validateSignupInput(body);
    if (Object.keys(validationErrors).length > 0) {
      log('info', 'Validation failed', {
        requestId,
        errors: Object.keys(validationErrors)
      });
      const firstError = Object.values(validationErrors)[0];
      return errorResponse(400, firstError, null, event);
    }

    // STEP 3: Sanitize input
    const sanitizedName = sanitizeText(body.name.trim());
    const sanitizedEmail = sanitizeText(body.email.trim().toLowerCase());

    // STEP 4: Get and hash IP address
    const sourceIp = event.requestContext?.http?.sourceIp || 'unknown';
    const ipHash = hashIp(sourceIp);

    // STEP 5: Rate limit check (3 per IP per 5 minutes)
    const isRateLimited = await checkSignupRateLimit(ipHash, requestId);
    if (isRateLimited) {
      log('warn', 'Rate limit exceeded', { requestId, ipHash });
      return errorResponse(429, 'Too many submissions. Please try again later.', null, event);
    }

    // STEP 6: Duplicate email check
    const isDuplicate = await checkDuplicateEmail(sanitizedEmail, requestId);
    if (isDuplicate) {
      log('info', 'Duplicate email', { requestId });
      return errorResponse(409, 'This email is already signed up.', null, event);
    }

    // STEP 7: Store record in DynamoDB
    const signupId = randomUUID();
    const signupTimestamp = new Date().toISOString();
    const ttl = Math.floor(Date.now() / 1000) + (90 * 24 * 60 * 60); // 90 days

    await docClient.send(new PutCommand({
      TableName: TABLE_NAME,
      Item: {
        signupId,
        email: sanitizedEmail,
        app: 'pulse',
        name: sanitizedName,
        consentGiven: true,
        signupTimestamp,
        status: 'active',
        ipHash,
        ttl,
      }
    }));

    // STEP 8: Send SES admin notification (no PII — signupId, timestamp, app only)
    try {
      await sendSignupNotification({ signupId, timestamp: signupTimestamp, app: 'pulse' });
    } catch (sesError) {
      log('error', 'Admin notification email failed — signup saved', {
        requestId,
        signupId,
        error: sesError.message
      });
    }

    log('info', 'Signup received', { requestId, signupId, ipHash });

    // STEP 9: Return success
    return createResponse(200, { signupId }, event);

  } catch (error) {
    log('error', 'Signup processing failed', {
      requestId,
      error: error.message,
      stack: error.stack
    });
    return errorResponse(500, 'An unexpected error occurred. Please try again.', null, event);
  }
}



/**
 * Checks if the IP has exceeded the signup rate limit
 * Limit: 3 signups per 5 minutes
 */
async function checkSignupRateLimit(ipHash, requestId) {
  try {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();

    const command = new QueryCommand({
      TableName: TABLE_NAME,
      IndexName: 'ipHash-timestamp-index',
      KeyConditionExpression: 'ipHash = :ipHash AND signupTimestamp > :fiveMinutesAgo',
      ExpressionAttributeValues: {
        ':ipHash': ipHash,
        ':fiveMinutesAgo': fiveMinutesAgo
      },
      Select: 'COUNT'
    });

    const response = await docClient.send(command);
    const recentCount = response.Count || 0;

    log('info', 'Rate limit check', { requestId, ipHash, recentCount, limit: 3 });

    return recentCount >= 3;
  } catch (error) {
    log('error', 'Rate limit check failed', { requestId, error: error.message });
    // Fail open — don't block on rate limit errors
    return false;
  }
}

/**
 * Checks if an email already exists in the Beta Table for the pulse app
 */
async function checkDuplicateEmail(email, requestId) {
  try {
    const command = new QueryCommand({
      TableName: TABLE_NAME,
      IndexName: 'email-app-index',
      KeyConditionExpression: 'email = :email AND app = :app',
      ExpressionAttributeValues: {
        ':email': email,
        ':app': 'pulse'
      },
      Select: 'COUNT'
    });

    const response = await docClient.send(command);
    return (response.Count || 0) > 0;
  } catch (error) {
    log('error', 'Duplicate email check failed', { requestId, error: error.message });
    // Fail open
    return false;
  }
}

/**
 * Sends admin notification for a new beta signup.
 * Contains NO PII — signupId, timestamp, and app name only.
 */
async function sendSignupNotification({ signupId, timestamp, app }) {
  const formattedDate = formatEmailDatetime(timestamp);

  const textBody = `New beta signup received for ${app}.

Signup ID: ${signupId}
Submitted: ${formattedDate}

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
    <h2 style="color:#111827;margin-bottom:8px;font-family:'Archivo',sans-serif;">Beta Signup: ${app}</h2>
    <p style="font-size:16px;margin-top:0;">A new beta signup has been received.</p>
    <p style="font-size:14px;color:#4b5563;margin-top:0;">Signup ID: ${signupId}</p>
    <p style="font-size:14px;color:#4b5563;margin-top:0;">Submitted: ${formattedDate}</p>

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
    Source: `"ur/gd Command" <command@urgdstudios.com>`,
    ReplyToAddresses: ['admin@urgdstudios.com'],
    Destination: { ToAddresses: [ADMIN_EMAIL] },
    Message: {
      Subject: { Data: `Beta Signup: ${app}`, Charset: 'UTF-8' },
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

/**
 * Handles beta survey submissions
 * Validates signupId exists, validates responses, sanitizes text, updates record, notifies admin
 */
async function handleSurvey(event, requestId) {
  try {
    // STEP 1: Parse request body
    let body;
    try {
      body = JSON.parse(event.body || '{}');
    } catch (error) {
      log('warn', 'Invalid JSON', { requestId });
      return errorResponse(400, 'Invalid request format', null, event);
    }

    // STEP 2: Validate signupId is present
    if (!body.signupId || typeof body.signupId !== 'string' || body.signupId.trim().length === 0) {
      log('info', 'Survey missing signupId', { requestId });
      return errorResponse(400, 'signupId is required', null, event);
    }

    const signupId = body.signupId.trim();

    // STEP 3: Look up the signup record by signupId (direct PK lookup)
    let existingRecord;
    try {
      const getResult = await docClient.send(new GetCommand({
        TableName: TABLE_NAME,
        Key: { signupId }
      }));
      existingRecord = getResult.Item;
    } catch (error) {
      log('error', 'Failed to look up signup record', { requestId, error: error.message });
      return errorResponse(500, 'An unexpected error occurred. Please try again.', null, event);
    }

    // STEP 4: If record not found → 404
    if (!existingRecord) {
      log('info', 'Signup not found for survey', { requestId, signupId });
      return errorResponse(404, 'Signup not found', null, event);
    }

    // STEP 5: If record already has surveyResponses → 409
    if (existingRecord.surveyResponses) {
      log('info', 'Survey already submitted', { requestId, signupId });
      return errorResponse(409, 'Survey already submitted.', null, event);
    }

    // STEP 6: Validate responses object
    const validationErrors = validateSurveyResponses(body.responses);
    if (Object.keys(validationErrors).length > 0) {
      log('info', 'Survey validation failed', {
        requestId,
        errors: Object.keys(validationErrors)
      });
      const firstError = Object.values(validationErrors)[0];
      return errorResponse(400, firstError, null, event);
    }

    // STEP 7: Sanitize text fields
    const sanitizedResponses = {
      deviceUsed: body.responses.deviceUsed,
      aiConversationQuality: body.responses.aiConversationQuality,
      aiAccuracy: body.responses.aiAccuracy,
      sessionPreference: body.responses.sessionPreference,
      biggestFriction: sanitizeText(body.responses.biggestFriction.trim()),
      wouldUseAgain: body.responses.wouldUseAgain,
    };

    // anythingElse is optional — only include if provided
    if (body.responses.anythingElse !== undefined && body.responses.anythingElse !== null && body.responses.anythingElse !== '') {
      sanitizedResponses.anythingElse = sanitizeText(body.responses.anythingElse.trim());
    }

    // STEP 8: Update the record with surveyResponses and surveyTimestamp
    const surveyTimestamp = new Date().toISOString();

    try {
      await docClient.send(new UpdateCommand({
        TableName: TABLE_NAME,
        Key: { signupId },
        UpdateExpression: 'SET surveyResponses = :responses, surveyTimestamp = :timestamp',
        ConditionExpression: 'attribute_not_exists(surveyResponses)',
        ExpressionAttributeValues: {
          ':responses': sanitizedResponses,
          ':timestamp': surveyTimestamp
        }
      }));
    } catch (error) {
      // ConditionalCheckFailedException means another request beat us (race condition)
      if (error.name === 'ConditionalCheckFailedException') {
        log('info', 'Survey race condition — already submitted', { requestId, signupId });
        return errorResponse(409, 'Survey already submitted.', null, event);
      }
      log('error', 'Failed to update survey record', { requestId, error: error.message });
      return errorResponse(500, 'An unexpected error occurred. Please try again.', null, event);
    }

    // STEP 9: Send SES admin notification (no PII)
    try {
      await sendSurveyNotification({ signupId, timestamp: surveyTimestamp, app: existingRecord.app || 'pulse' });
    } catch (sesError) {
      log('error', 'Survey admin notification email failed — survey saved', {
        requestId,
        signupId,
        error: sesError.message
      });
    }

    log('info', 'Survey submitted', { requestId, signupId });

    // STEP 10: Return 200
    return createResponse(200, { message: 'Survey submitted' }, event);

  } catch (error) {
    log('error', 'Survey processing failed', {
      requestId,
      error: error.message,
      stack: error.stack
    });
    return errorResponse(500, 'An unexpected error occurred. Please try again.', null, event);
  }
}



/**
 * Sends admin notification for a completed beta survey.
 * Contains NO PII — signupId, timestamp, and app name only.
 */
async function sendSurveyNotification({ signupId, timestamp, app }) {
  const formattedDate = formatEmailDatetime(timestamp);

  const textBody = `New beta survey completed for ${app}.

Signup ID: ${signupId}
Submitted: ${formattedDate}

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
    <h2 style="color:#111827;margin-bottom:8px;font-family:'Archivo',sans-serif;">Beta Survey: ${app}</h2>
    <p style="font-size:16px;margin-top:0;">A beta survey has been completed.</p>
    <p style="font-size:14px;color:#4b5563;margin-top:0;">Signup ID: ${signupId}</p>
    <p style="font-size:14px;color:#4b5563;margin-top:0;">Submitted: ${formattedDate}</p>

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
    Source: `"ur/gd Command" <command@urgdstudios.com>`,
    ReplyToAddresses: ['admin@urgdstudios.com'],
    Destination: { ToAddresses: [ADMIN_EMAIL] },
    Message: {
      Subject: { Data: `Beta Survey: ${app}`, Charset: 'UTF-8' },
      Body: {
        Text: { Data: textBody, Charset: 'UTF-8' },
        Html: { Data: htmlBody, Charset: 'UTF-8' },
      },
    },
  }));
}

/**
 * Handles email lookup for survey linking
 * Queries email-app-index GSI and returns signupId + name if found
 */
async function handleLookup(event, requestId) {
  try {
    const params = event.queryStringParameters || {};
    const email = params.email;
    const app = params.app;

    // Validate required query parameters
    if (!email || typeof email !== 'string' || email.trim().length === 0) {
      log('info', 'Lookup missing email', { requestId });
      return errorResponse(400, 'Email is required', null, event);
    }

    if (!app || typeof app !== 'string' || app.trim().length === 0) {
      log('info', 'Lookup missing app', { requestId });
      return errorResponse(400, 'App is required', null, event);
    }

    // Lowercase email to match stored format
    const normalizedEmail = email.trim().toLowerCase();

    // Query email-app-index GSI
    const command = new QueryCommand({
      TableName: TABLE_NAME,
      IndexName: 'email-app-index',
      KeyConditionExpression: 'email = :email AND app = :app',
      ExpressionAttributeValues: {
        ':email': normalizedEmail,
        ':app': app.trim()
      },
      Select: 'ALL_ATTRIBUTES'
    });

    const response = await docClient.send(command);

    if (!response.Items || response.Items.length === 0) {
      log('info', 'Email not found', { requestId });
      return errorResponse(404, 'Email not found', null, event);
    }

    const record = response.Items[0];

    log('info', 'Lookup successful', { requestId, signupId: record.signupId });

    return createResponse(200, {
      signupId: record.signupId,
      name: record.name,
      hasSurvey: !!record.surveyResponses
    }, event);

  } catch (error) {
    log('error', 'Lookup failed', {
      requestId,
      error: error.message,
      stack: error.stack
    });
    return errorResponse(500, 'An unexpected error occurred. Please try again.', null, event);
  }
}
