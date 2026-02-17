import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';
import { SNSClient, PublishCommand } from '@aws-sdk/client-sns';
import { randomUUID } from 'crypto';
import crypto from 'crypto';
import sanitizeHtml from 'sanitize-html';
import { createResponse, errorResponse, getCorsHeaders, validateEmail, hashIp, log } from './shared/utils.mjs';
import { handleHealthCheck } from './shared/healthCheck.mjs';

// Initialize AWS SDK clients
const dynamoClient = new DynamoDBClient({ region: process.env.AWS_REGION || 'us-west-2' });
const docClient = DynamoDBDocumentClient.from(dynamoClient);
const snsClient = new SNSClient({ region: process.env.AWS_REGION || 'us-west-2' });

// Environment variables
const SUBMISSIONS_TABLE = process.env.SUBMISSIONS_TABLE;
const INTAKE_TOPIC_ARN = process.env.INTAKE_TOPIC_ARN;
const ENVIRONMENT = process.env.ENVIRONMENT || 'prod';
const VERSION = process.env.VERSION || '2.0.0';
const POW_DIFFICULTY = parseInt(process.env.POW_DIFFICULTY || '4', 10);

// Valid submission types
const VALID_TYPES = [
  'general-inquiry',
  'bug-report',
  'feature-request',
  'privacy-question',
  'report-abuse'
];

// Type display labels for SNS notifications
const TYPE_LABELS = {
  'general-inquiry': 'General inquiry',
  'bug-report': 'Bug report',
  'feature-request': 'Feature request',
  'privacy-question': 'Privacy question',
  'report-abuse': 'Abuse report'
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
        topicArn: INTAKE_TOPIC_ARN,
        requiredEnvVars: ['SUBMISSIONS_TABLE', 'INTAKE_TOPIC_ARN', 'CORS_ALLOWED_ORIGINS', 'POW_DIFFICULTY']
      });
    }
    
    // Route: POST /v1/intake
    if (method === 'POST' && path === '/v1/intake') {
      return await handleIntakeSubmission(event, requestId);
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
    
    // STEP 7: Store submission in DynamoDB
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
      ipHash,
      honeypot: body.honeypot || '',
      proofOfWork: body.proofOfWork,
      ttl
    });
    
    // STEP 8: Publish SNS notification
    await publishNotification({
      submissionId,
      timestamp,
      name,
      email,
      type,
      message: sanitizedMessage
    });
    
    log('info', 'Submission received', {
      requestId,
      submissionId,
      type,
      ipHash
    });
    
    // STEP 9: Return success
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
 * Publishes notification to SNS with full submission details
 * Uses MessageAttributes for type-based routing via filter policies
 */
async function publishNotification({ submissionId, timestamp, name, email, type, message }) {
  // Format notification message (plaintext)
  const messageBody = `New submission from urgdstudios.com contact form.

Name: ${name}
Email: ${email}
Type: ${TYPE_LABELS[type] || type}
Submission ID: ${submissionId}
Timestamp: ${timestamp}

Message:
${message}

---
This is an automated notification from urgdstudios.com.
To manage notifications, update the SNS subscription in AWS Console.`;

  const command = new PublishCommand({
    TopicArn: INTAKE_TOPIC_ARN,
    Message: messageBody,
    Subject: 'New contact form submission — urgdstudios.com',
    MessageAttributes: {
      type: {
        DataType: 'String',
        StringValue: type
      }
    }
  });
  
  await snsClient.send(command);
}
