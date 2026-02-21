import { DynamoDBClient, DescribeTableCommand } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, ScanCommand, GetCommand, UpdateCommand, DeleteCommand } from '@aws-sdk/lib-dynamodb';
import { SESClient, SendEmailCommand, GetSendQuotaCommand } from '@aws-sdk/client-ses';
import { createResponse, errorResponse, getCorsHeaders, log, createAdminError, isAdminHttpError } from './shared/utils.mjs';

// ── Environment validation (fail-fast at cold start) ──────────────────────────
const SUBMISSIONS_TABLE = process.env.SUBMISSIONS_TABLE;
const ENVIRONMENT = process.env.ENVIRONMENT || 'prod';
const VERSION = process.env.VERSION || '3.0.0';
const SES_FROM_ADDRESS = process.env.SES_FROM_ADDRESS || 'admin@urgdstudios.com';
const SITE_URL = process.env.SITE_URL || 'https://urgdstudios.com';
// Feature flags default to 'true' if env var is missing (prevent silent disablement).
const COMMAND_CENTER_REPLY = process.env.COMMAND_CENTER_REPLY !== 'false';

const REQUIRED_VARS = { SUBMISSIONS_TABLE, SES_FROM_ADDRESS, SITE_URL };
for (const [name, value] of Object.entries(REQUIRED_VARS)) {
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
}
if (!process.env.COMMAND_CENTER_REPLY) {
  console.warn(JSON.stringify({ level: 'warn', message: 'COMMAND_CENTER_REPLY env var missing — defaulting to enabled' }));
}

// ── AWS clients (initialized outside handler for connection reuse) ─────────────
const dynamoClient = new DynamoDBClient({ region: process.env.AWS_REGION || 'us-west-2' });
const docClient = DynamoDBDocumentClient.from(dynamoClient);
const sesClient = new SESClient({ region: process.env.AWS_REGION || 'us-west-2' });

// ── Constants ─────────────────────────────────────────────────────────────────
const VALID_STATUSES = ['new', 'in-progress', 'closed'];

const CATEGORY_LABELS = {
  'general-inquiry': 'General Inquiry',
  'feature-request': 'Feature Request',
  'bug-report': 'Bug Report',
  'privacy-question': 'Privacy Question',
  'report-abuse': 'Abuse Report',
};

// UUID v4 pattern for path parameter validation
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

// ── Main handler ──────────────────────────────────────────────────────────────
export async function handler(event) {
  const requestId = event.requestContext?.requestId || 'unknown';
  const method = event.requestContext?.http?.method;
  const rawPath = event.requestContext?.http?.path;

  // Strip stage prefix (e.g. /prod/v1/admin/messages → /v1/admin/messages)
  const stage = event.requestContext?.stage;
  const stagePrefix = stage && stage !== '$default' ? `/${stage}` : '';
  const path = (stagePrefix && rawPath?.startsWith(stagePrefix))
    ? rawPath.slice(stagePrefix.length)
    : rawPath;

  log('info', 'Request received', {
    requestId,
    method,
    path,
    environment: ENVIRONMENT,
    service: `urgd-urgdstudios-com-admin-${ENVIRONMENT}`,
  });

  try {
    // CORS preflight
    if (method === 'OPTIONS') {
      return createResponse(200, { message: 'OK' }, event);
    }

    // ── Route dispatch ───────────────────────────────────────────────────────
    // Health check (no auth)
    if (method === 'GET' && path === '/v1/admin/health') {
      return await handleHealthCheck(event, requestId);
    }

    // List messages
    if (method === 'GET' && path === '/v1/admin/messages') {
      return await listMessages(event, requestId);
    }

    // Get single message or reply (path contains /{id})
    const messageIdMatch = path.match(/^\/v1\/admin\/messages\/([^/]+)$/);
    if (messageIdMatch) {
      const id = messageIdMatch[1];
      if (method === 'GET') return await getMessage(event, requestId, id);
      if (method === 'PATCH') return await updateMessageStatus(event, requestId, id);
      if (method === 'DELETE') return await deleteMessage(event, requestId, id);
    }

    // Reply route: /v1/admin/messages/{id}/reply
    const replyMatch = path.match(/^\/v1\/admin\/messages\/([^/]+)\/reply$/);
    if (replyMatch && method === 'POST') {
      return await replyToMessage(event, requestId, replyMatch[1]);
    }

    log('warn', 'Unknown route', { requestId, method, path });
    return errorResponse(404, 'Not found', {}, event);

  } catch (error) {
    log('error', 'Unhandled error', {
      requestId,
      error: error.message,
      stack: error.stack,
    });
    return errorResponse(500, 'An unexpected error occurred. Please try again.', {}, event);
  }
}

// ── Health check ──────────────────────────────────────────────────────────────
async function handleHealthCheck(event, requestId) {
  const checks = { dynamodb: 'unknown', ses: 'unknown' };

  try {
    const cmd = new DescribeTableCommand({ TableName: SUBMISSIONS_TABLE });
    const res = await dynamoClient.send(cmd);
    checks.dynamodb = res.Table?.TableStatus === 'ACTIVE' ? 'connected' : 'error';
  } catch {
    checks.dynamodb = 'error';
  }

  try {
    await sesClient.send(new GetSendQuotaCommand({}));
    checks.ses = 'available';
  } catch {
    checks.ses = 'error';
  }

  const isHealthy = checks.dynamodb === 'connected' && checks.ses === 'available';

  log('info', 'Health check completed', {
    requestId,
    action: 'healthCheck',
    outcome: isHealthy ? 'success' : 'failure',
    checks,
  });

  return createResponse(200, {
    service: `urgd-urgdstudios-com-admin-${ENVIRONMENT}`,
    status: isHealthy ? 'healthy' : 'degraded',
    checks,
    timestamp: new Date().toISOString(),
  }, event);
}

// ── List messages ─────────────────────────────────────────────────────────────
async function listMessages(event, requestId) {
  const start = Date.now();
  try {
    const result = await docClient.send(new ScanCommand({
      TableName: SUBMISSIONS_TABLE,
      ProjectionExpression: 'submissionId, #n, email, #t, #msg, #s, #ts',
      ExpressionAttributeNames: {
        '#n': 'name',
        '#t': 'type',
        '#msg': 'message',
        '#s': 'status',
        '#ts': 'timestamp',
      },
    }));

    const messages = (result.Items || [])
      .map(item => {
        const fullMsg = item.message || '';
        const preview = fullMsg.length > 100
          ? `${fullMsg.slice(0, 100)}...`
          : fullMsg;
        return {
          submissionId: item.submissionId,
          name: item.name,
          email: item.email,
          type: item.type,
          preview,
          status: item.status || 'new',
          timestamp: item.timestamp,
        };
      })
      .sort((a, b) => {
        if (!a.timestamp) return 1;
        if (!b.timestamp) return -1;
        return b.timestamp.localeCompare(a.timestamp);
      });

    log('info', 'Messages listed', {
      requestId,
      action: 'listMessages',
      outcome: 'success',
      count: messages.length,
      duration: Date.now() - start,
      statusCode: 200,
    });

    return createResponse(200, { messages }, event);

  } catch (error) {
    log('error', 'listMessages failed', {
      requestId,
      action: 'listMessages',
      outcome: 'failure',
      error: error.message,
      duration: Date.now() - start,
    });
    throw createAdminError(500, 'Failed to retrieve messages');
  }
}

// ── Get single message ────────────────────────────────────────────────────────
async function getMessage(event, requestId, id) {
  const start = Date.now();

  if (!UUID_REGEX.test(id)) {
    throw createAdminError(400, 'Invalid message ID');
  }

  try {
    const result = await docClient.send(new GetCommand({
      TableName: SUBMISSIONS_TABLE,
      Key: { submissionId: id },
    }));

    if (!result.Item) {
      throw createAdminError(404, 'Message not found');
    }

    const item = result.Item;
    const message = {
      submissionId: item.submissionId,
      name: item.name,
      email: item.email,
      type: item.type,
      message: item.message,
      status: item.status || 'new',
      timestamp: item.timestamp,
    };
    if (item.replies) message.replies = item.replies;

    log('info', 'Message retrieved', {
      requestId,
      action: 'getMessage',
      outcome: 'success',
      submissionId: id,
      duration: Date.now() - start,
      statusCode: 200,
    });

    return createResponse(200, { message }, event);

  } catch (error) {
    if (isAdminHttpError(error)) throw error;
    log('error', 'getMessage failed', {
      requestId,
      action: 'getMessage',
      outcome: 'failure',
      error: error.message,
      duration: Date.now() - start,
    });
    throw createAdminError(500, 'Failed to retrieve message');
  }
}

// ── Update message status ─────────────────────────────────────────────────────
async function updateMessageStatus(event, requestId, id) {
  const start = Date.now();

  if (!UUID_REGEX.test(id)) {
    throw createAdminError(400, 'Invalid message ID');
  }

  let body;
  try {
    body = JSON.parse(event.body || '{}');
  } catch {
    throw createAdminError(400, 'Invalid request format');
  }

  if (!body.status) {
    throw createAdminError(400, 'Status is required');
  }
  if (!VALID_STATUSES.includes(body.status)) {
    throw createAdminError(400, 'Invalid status. Must be one of: new, in-progress, closed');
  }

  try {
    await docClient.send(new UpdateCommand({
      TableName: SUBMISSIONS_TABLE,
      Key: { submissionId: id },
      UpdateExpression: 'SET #s = :status',
      ConditionExpression: 'attribute_exists(submissionId)',
      ExpressionAttributeNames: { '#s': 'status' },
      ExpressionAttributeValues: { ':status': body.status },
    }));

    log('info', 'Message status updated', {
      requestId,
      action: 'updateStatus',
      outcome: 'success',
      submissionId: id,
      status: body.status,
      duration: Date.now() - start,
      statusCode: 200,
    });

    return createResponse(200, { message: { submissionId: id, status: body.status } }, event);

  } catch (error) {
    if (isAdminHttpError(error)) throw error;
    if (error.name === 'ConditionalCheckFailedException') {
      throw createAdminError(404, 'Message not found');
    }
    log('error', 'updateMessageStatus failed', {
      requestId,
      action: 'updateStatus',
      outcome: 'failure',
      error: error.message,
      duration: Date.now() - start,
    });
    throw createAdminError(500, 'Failed to update status');
  }
}

// ── Delete message ────────────────────────────────────────────────────────────
async function deleteMessage(event, requestId, id) {
  const start = Date.now();

  if (!UUID_REGEX.test(id)) {
    throw createAdminError(400, 'Invalid message ID');
  }

  try {
    await docClient.send(new DeleteCommand({
      TableName: SUBMISSIONS_TABLE,
      Key: { submissionId: id },
      ConditionExpression: 'attribute_exists(submissionId)',
    }));

    log('info', 'Message deleted', {
      requestId,
      action: 'deleteMessage',
      outcome: 'success',
      submissionId: id,
      duration: Date.now() - start,
      statusCode: 204,
    });

    return {
      statusCode: 204,
      headers: { ...getCorsHeaders(event) },
      body: '',
    };

  } catch (error) {
    if (isAdminHttpError(error)) throw error;
    if (error.name === 'ConditionalCheckFailedException') {
      throw createAdminError(404, 'Message not found');
    }
    log('error', 'deleteMessage failed', {
      requestId,
      action: 'deleteMessage',
      outcome: 'failure',
      error: error.message,
      duration: Date.now() - start,
    });
    throw createAdminError(500, 'Failed to delete message');
  }
}

// ── Reply to message ──────────────────────────────────────────────────────────
async function replyToMessage(event, requestId, id) {
  const start = Date.now();

  // Feature flag check — first gate before any other work
  if (!COMMAND_CENTER_REPLY) {
    throw createAdminError(403, 'Reply feature is disabled');
  }

  if (!UUID_REGEX.test(id)) {
    throw createAdminError(400, 'Invalid message ID');
  }

  let body;
  try {
    body = JSON.parse(event.body || '{}');
  } catch {
    throw createAdminError(400, 'Invalid request format');
  }

  if (!body.body || !body.body.trim()) {
    throw createAdminError(400, 'Reply body is required');
  }
  if (body.body.trim().length > 5000) {
    throw createAdminError(400, 'Reply body must be 5000 characters or fewer');
  }

  const replyText = body.body.trim();

  // 1. Retrieve the submission to get recipient details
  let item;
  try {
    const result = await docClient.send(new GetCommand({
      TableName: SUBMISSIONS_TABLE,
      Key: { submissionId: id },
    }));
    item = result.Item;
  } catch (error) {
    log('error', 'replyToMessage: GetItem failed', {
      requestId,
      action: 'replyToMessage',
      error: error.message,
    });
    throw createAdminError(500, 'Failed to send reply');
  }

  if (!item) {
    throw createAdminError(404, 'Message not found');
  }

  const recipientEmail = item.email;
  const recipientName = item.name;
  const categoryLabel = CATEGORY_LABELS[item.type] || item.type;
  const formattedDate = formatDate(item.timestamp);

  // 2. Send email via SES (before DynamoDB write — per SLICE_00_UX.md §2.8)
  const emailBody = buildReplyEmailBody(recipientName, replyText, categoryLabel, formattedDate);

  try {
    await sesClient.send(new SendEmailCommand({
      Source: SES_FROM_ADDRESS,
      ReplyToAddresses: [SES_FROM_ADDRESS],
      Destination: { ToAddresses: [recipientEmail] },
      Message: {
        Subject: { Data: 'Re: Your message to ur/gd Studios', Charset: 'UTF-8' },
        Body: { Text: { Data: emailBody, Charset: 'UTF-8' } },
      },
    }));
  } catch (error) {
    log('error', 'replyToMessage: SES send failed', {
      requestId,
      action: 'replyToMessage',
      outcome: 'failure',
      // Redact full email — log domain only
      recipientDomain: recipientEmail?.split('@')[1],
      error: error.message,
      duration: Date.now() - start,
    });
    throw createAdminError(500, 'Failed to send reply');
  }

  // 3. Append reply to DynamoDB (after confirmed SES delivery)
  const sentAt = new Date().toISOString();
  const replyEntry = { body: replyText, sentAt, sentTo: recipientEmail };

  try {
    await docClient.send(new UpdateCommand({
      TableName: SUBMISSIONS_TABLE,
      Key: { submissionId: id },
      UpdateExpression: 'SET replies = list_append(if_not_exists(replies, :empty), :reply), #s = :status',
      ExpressionAttributeNames: { '#s': 'status' },
      ExpressionAttributeValues: {
        ':reply': [replyEntry],
        ':empty': [],
        ':status': 'in-progress',
      },
    }));
  } catch (error) {
    log('error', 'replyToMessage: DynamoDB append failed (SES already sent)', {
      requestId,
      action: 'replyToMessage',
      outcome: 'partial_failure',
      recipientDomain: recipientEmail?.split('@')[1],
      error: error.message,
      duration: Date.now() - start,
    });
    throw createAdminError(500, 'Reply sent but failed to save record. Contact was notified.');
  }

  log('info', 'Reply sent', {
    requestId,
    action: 'replyToMessage',
    outcome: 'success',
    submissionId: id,
    recipientDomain: recipientEmail?.split('@')[1],
    duration: Date.now() - start,
    statusCode: 200,
  });

  return createResponse(200, {
    reply: { body: replyText, sentAt, sentTo: recipientEmail },
  }, event);
}

// ── Email builders ────────────────────────────────────────────────────────────
function buildReplyEmailBody(name, replyText, categoryLabel, formattedDate) {
  return `Hi ${name},

${replyText}

— ur/gd Studios

---
In response to your ${categoryLabel} submitted on ${formattedDate}.

ur/gd Studios LLC
The Cloud Room
1424 11th Ave STE 400
Seattle, WA 98122`;
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function formatDate(isoTimestamp) {
  if (!isoTimestamp) return 'unknown date';
  try {
    return new Date(isoTimestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      timeZone: 'UTC',
    });
  } catch {
    return isoTimestamp;
  }
}
