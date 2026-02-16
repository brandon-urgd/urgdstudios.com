import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';
import { SNSClient, PublishCommand } from '@aws-sdk/client-sns';
import { randomUUID } from 'crypto';
import { createResponse, errorResponse, getCorsHeaders, sanitizeInput, validateEmail, hashIp, log } from './shared/utils.mjs';
import { performHealthCheck } from './shared/healthCheck.mjs';

// Initialize AWS SDK clients
const dynamoClient = new DynamoDBClient({ region: process.env.AWS_REGION || 'us-west-2' });
const docClient = DynamoDBDocumentClient.from(dynamoClient);
const snsClient = new SNSClient({ region: process.env.AWS_REGION || 'us-west-2' });

// Environment variables
const SUBMISSIONS_TABLE = process.env.SUBMISSIONS_TABLE;
const INTAKE_TOPIC_ARN = process.env.INTAKE_TOPIC_ARN;
const ENVIRONMENT = process.env.ENVIRONMENT || 'prod';
const VERSION = process.env.VERSION || '1.0.0';

// Valid submission types
const VALID_TYPES = [
  'general-contact',
  'bug-report',
  'feature-request',
  'privacy-question',
  'report-abuse',
  'other'
];

/**
 * Main Lambda handler
 * Routes requests to appropriate handlers
 */
export async function handler(event) {
  const requestId = event.requestContext?.requestId || 'unknown';
  const method = event.requestContext?.http?.method;
  const path = event.requestContext?.http?.path;
  
  log('INFO', 'Request received', {
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
      return await handleHealthCheck(event, requestId);
    }
    
    // Route: POST /v1/intake
    if (method === 'POST' && path === '/v1/intake') {
      return await handleIntake(event, requestId);
    }
    
    // Unknown route
    log('WARN', 'Unknown route', { requestId, method, path });
    return errorResponse(404, 'Not found', null, event);
    
  } catch (error) {
    log('ERROR', 'Unhandled error', {
      requestId,
      error: error.message,
      stack: error.stack
    });
    
    return errorResponse(
      500,
      'Something went wrong. Please try again later.',
      null,
      event
    );
  }
}

/**
 * Handles health check requests
 */
async function handleHealthCheck(event, requestId) {
  try {
    const healthResult = await performHealthCheck({
      tableName: SUBMISSIONS_TABLE,
      topicArn: INTAKE_TOPIC_ARN,
      requiredEnvVars: ['SUBMISSIONS_TABLE', 'INTAKE_TOPIC_ARN', 'CORS_ALLOWED_ORIGINS']
    });
    
    const response = {
      status: healthResult.healthy ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      service: `urgd-urgdstudios-com-intake-${ENVIRONMENT}`,
      runtime: 'nodejs22.x',
      region: process.env.AWS_REGION || 'us-west-2',
      checks: healthResult.checks
    };
    
    const statusCode = healthResult.healthy ? 200 : 503;
    
    log('INFO', 'Health check completed', {
      requestId,
      status: response.status
    });
    
    return createResponse(statusCode, response, event);
    
  } catch (error) {
    log('ERROR', 'Health check failed', {
      requestId,
      error: error.message
    });
    
    return errorResponse(
      503,
      'Health check failed',
      null,
      event
    );
  }
}

/**
 * Handles intake form submission
 */
async function handleIntake(event, requestId) {
  try {
    // Parse request body
    let body;
    try {
      body = JSON.parse(event.body || '{}');
    } catch (error) {
      return errorResponse(400, 'Invalid JSON', null, event);
    }
    
    // Validate input
    const validationErrors = validateInput(body);
    if (Object.keys(validationErrors).length > 0) {
      return errorResponse(
        400,
        'Validation failed',
        validationErrors,
        event
      );
    }
    
    // Sanitize input
    const name = sanitizeInput(body.name, 200);
    const email = sanitizeInput(body.email, 200);
    const message = sanitizeInput(body.message, 5000);
    const type = body.type; // Already validated against allowlist
    
    // Hash IP address
    const sourceIp = event.requestContext?.http?.sourceIp || 'unknown';
    const ipHash = hashIp(sourceIp);
    
    // Rate limit check
    const isRateLimited = await checkRateLimit(ipHash, requestId);
    if (isRateLimited) {
      return errorResponse(
        429,
        "You've sent several messages recently. Please wait a few minutes and try again.",
        null,
        event
      );
    }
    
    // Generate submission
    const submissionId = randomUUID();
    const submittedAt = new Date().toISOString();
    const ttl = Math.floor(Date.now() / 1000) + (365 * 24 * 60 * 60); // 1 year
    const userAgent = event.headers?.['user-agent'] || event.headers?.['User-Agent'] || 'unknown';
    
    // Store in DynamoDB
    await storeSubmission({
      submissionId,
      type,
      name,
      email,
      message,
      submittedAt,
      ipHash,
      userAgent,
      status: 'received',
      ttl
    });
    
    // Publish SNS notification (no PII)
    await publishNotification({
      submissionId,
      type,
      submittedAt
    });
    
    log('INFO', 'Submission processed successfully', {
      requestId,
      submissionId,
      type
    });
    
    return createResponse(200, {
      message: 'Message received',
      submissionId
    }, event);
    
  } catch (error) {
    log('ERROR', 'Intake processing failed', {
      requestId,
      error: error.message,
      stack: error.stack
    });
    
    return errorResponse(
      500,
      'Something went wrong. Please try again later.',
      null,
      event
    );
  }
}

/**
 * Validates intake form input
 */
function validateInput(body) {
  const errors = {};
  
  // Name validation
  if (!body.name || typeof body.name !== 'string' || body.name.trim().length === 0) {
    errors.name = 'Please enter your name.';
  } else if (body.name.trim().length > 200) {
    errors.name = 'Name must be 200 characters or less.';
  }
  
  // Email validation
  if (!body.email || typeof body.email !== 'string' || body.email.trim().length === 0) {
    errors.email = 'Please enter your email address.';
  } else if (!validateEmail(body.email.trim())) {
    errors.email = 'Please enter a valid email address.';
  }
  
  // Type validation
  if (!body.type || !VALID_TYPES.includes(body.type)) {
    errors.type = 'Please select a valid reason.';
  }
  
  // Message validation
  if (!body.message || typeof body.message !== 'string' || body.message.trim().length === 0) {
    errors.message = 'Please enter a message.';
  } else if (body.message.trim().length > 5000) {
    errors.message = 'Message must be 5,000 characters or less.';
  }
  
  return errors;
}

/**
 * Checks if the IP has exceeded the rate limit
 * Limit: 5 submissions per 15 minutes
 */
async function checkRateLimit(ipHash, requestId) {
  try {
    const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000).toISOString();
    
    const command = new QueryCommand({
      TableName: SUBMISSIONS_TABLE,
      IndexName: 'ipHash-submittedAt-index',
      KeyConditionExpression: 'ipHash = :ipHash AND submittedAt > :timestamp',
      ExpressionAttributeValues: {
        ':ipHash': ipHash,
        ':timestamp': fifteenMinutesAgo
      },
      Select: 'COUNT'
    });
    
    const response = await docClient.send(command);
    const recentCount = response.Count || 0;
    
    log('INFO', 'Rate limit check', {
      requestId,
      recentCount,
      limit: 5
    });
    
    return recentCount >= 5;
    
  } catch (error) {
    log('ERROR', 'Rate limit check failed', {
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
 * Publishes notification to SNS
 * Does NOT include PII - only submissionId, type, and timestamp
 */
async function publishNotification({ submissionId, type, submittedAt }) {
  const message = JSON.stringify({
    submissionId,
    type,
    submittedAt,
    environment: ENVIRONMENT
  });
  
  const command = new PublishCommand({
    TopicArn: INTAKE_TOPIC_ARN,
    Message: message,
    Subject: `New ${type} submission`,
    MessageAttributes: {
      type: {
        DataType: 'String',
        StringValue: type
      }
    }
  });
  
  await snsClient.send(command);
}
