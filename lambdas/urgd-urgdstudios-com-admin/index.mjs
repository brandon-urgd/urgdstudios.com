import { DynamoDBClient, DescribeTableCommand } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, ScanCommand, GetCommand, UpdateCommand, DeleteCommand } from '@aws-sdk/lib-dynamodb';
import { SESClient, SendEmailCommand, GetSendQuotaCommand } from '@aws-sdk/client-ses';
import { createResponse, errorResponse, getCorsHeaders, log, createAdminError, isAdminHttpError } from './shared/utils.mjs';

// ── Environment validation (fail-fast at cold start) ──────────────────────────
const SUBMISSIONS_TABLE = process.env.SUBMISSIONS_TABLE;
const BETA_TABLE = process.env.BETA_TABLE;
const ENVIRONMENT = process.env.ENVIRONMENT || 'prod';
const VERSION = process.env.VERSION || '3.0.0';
const SES_FROM_ADDRESS = process.env.SES_FROM_ADDRESS || 'command@urgdstudios.com';
const SES_FROM_DISPLAY_NAME = process.env.SES_FROM_DISPLAY_NAME || 'ur/gd Command';
const SES_REPLY_TO = process.env.SES_REPLY_TO || 'admin@urgdstudios.com';
const SITE_URL = process.env.SITE_URL || 'https://urgdstudios.com';
// Feature flags default to 'true' if env var is missing (prevent silent disablement).
const COMMAND_CENTER_REPLY = process.env.COMMAND_CENTER_REPLY !== 'false';

const REQUIRED_VARS = { SUBMISSIONS_TABLE, SES_FROM_ADDRESS, SITE_URL, SES_REPLY_TO };
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

    // Beta admin routes
    if (method === 'GET' && path === '/v1/admin/beta/signups') {
      return await listBetaSignups(event, requestId);
    }

    const betaUpdateMatch = path.match(/^\/v1\/admin\/beta\/signups\/([^/]+)$/);
    if (betaUpdateMatch && method === 'PATCH') {
      return await updateBetaSignup(event, requestId, betaUpdateMatch[1]);
    }

    log('warn', 'Unknown route', { requestId, method, path });
    return errorResponse(404, 'Not found', {}, event);

  } catch (error) {
    if (isAdminHttpError(error)) {
      log('info', 'Request error', {
        requestId,
        statusCode: error.statusCode,
        message: error.message,
      });
      return errorResponse(error.statusCode, error.message, {}, event);
    }
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
      ProjectionExpression: 'submissionId, #n, email, #t, #msg, #s, #ts, #src, metadata',
      ExpressionAttributeNames: {
        '#n': 'name',
        '#t': 'type',
        '#msg': 'message',
        '#s': 'status',
        '#ts': 'timestamp',
        '#src': 'source',
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
          ...(item.source ? { source: item.source } : {}),
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
      ...(item.source ? { source: item.source } : {}),
      ...(item.metadata ? { metadata: item.metadata } : {}),
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
  const { text: replyTextBody, html: replyHtmlBody } = buildReplyEmailBody(recipientName, replyText, categoryLabel, formattedDate);

  try {
    await sesClient.send(new SendEmailCommand({
      Source: `"ur/gd Studios" <${SES_FROM_ADDRESS}>`,
      ReplyToAddresses: [SES_REPLY_TO],
      Destination: { ToAddresses: [recipientEmail] },
      Message: {
        Subject: { Data: 'Re: Your message to ur/gd Studios', Charset: 'UTF-8' },
        Body: {
          Text: { Data: replyTextBody, Charset: 'UTF-8' },
          Html: { Data: replyHtmlBody, Charset: 'UTF-8' },
        },
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

// ── List beta signups ──────────────────────────────────────────────────────────
async function listBetaSignups(event, requestId) {
  const start = Date.now();

  if (!BETA_TABLE) {
    log('warn', 'BETA_TABLE not configured', { requestId });
    return errorResponse(503, 'Beta signups service is not configured', {}, event);
  }

  try {
    const result = await docClient.send(new ScanCommand({
      TableName: BETA_TABLE,
    }));

    const signups = (result.Items || [])
      .map(item => ({
        signupId: item.signupId,
        name: item.name,
        email: item.email,
        app: item.app,
        signupTimestamp: item.signupTimestamp,
        sessionsSent: item.sessionsSent || false,
        hasSurvey: !!item.surveyResponses,
        surveyTimestamp: item.surveyTimestamp || null,
      }))
      .sort((a, b) => {
        if (!a.signupTimestamp) return 1;
        if (!b.signupTimestamp) return -1;
        return b.signupTimestamp.localeCompare(a.signupTimestamp);
      });

    log('info', 'Beta signups listed', {
      requestId,
      action: 'listBetaSignups',
      outcome: 'success',
      count: signups.length,
      duration: Date.now() - start,
      statusCode: 200,
    });

    return createResponse(200, { signups }, event);

  } catch (error) {
    log('error', 'listBetaSignups failed', {
      requestId,
      action: 'listBetaSignups',
      outcome: 'failure',
      error: error.message,
      duration: Date.now() - start,
    });
    throw createAdminError(500, 'Failed to retrieve beta signups');
  }
}

// ── Update beta signup ────────────────────────────────────────────────────────
async function updateBetaSignup(event, requestId, signupId) {
  const start = Date.now();

  if (!BETA_TABLE) {
    log('warn', 'BETA_TABLE not configured', { requestId });
    return errorResponse(503, 'Beta signups service is not configured', {}, event);
  }

  // General UUID pattern (not restricted to v4 — randomUUID produces v4 but no reason to reject others)
  const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidPattern.test(signupId)) {
    throw createAdminError(400, 'Invalid signup ID');
  }

  let body;
  try {
    body = JSON.parse(event.body || '{}');
  } catch {
    throw createAdminError(400, 'Invalid request format');
  }

  if (typeof body.sessionsSent !== 'boolean') {
    throw createAdminError(400, 'sessionsSent must be a boolean');
  }

  try {
    await docClient.send(new UpdateCommand({
      TableName: BETA_TABLE,
      Key: { signupId },
      UpdateExpression: 'SET sessionsSent = :val',
      ConditionExpression: 'attribute_exists(signupId)',
      ExpressionAttributeValues: { ':val': body.sessionsSent },
    }));

    log('info', 'Beta signup updated', {
      requestId,
      action: 'updateBetaSignup',
      outcome: 'success',
      signupId,
      sessionsSent: body.sessionsSent,
      duration: Date.now() - start,
      statusCode: 200,
    });

    return createResponse(200, { signupId, sessionsSent: body.sessionsSent }, event);

  } catch (error) {
    if (isAdminHttpError(error)) throw error;
    if (error.name === 'ConditionalCheckFailedException') {
      throw createAdminError(404, 'Signup not found');
    }
    log('error', 'updateBetaSignup failed', {
      requestId,
      action: 'updateBetaSignup',
      outcome: 'failure',
      error: error.message,
      duration: Date.now() - start,
    });
    throw createAdminError(500, 'Failed to update beta signup');
  }
}

// ── Email builders ────────────────────────────────────────────────────────────
function buildReplyEmailBody(name, replyText, categoryLabel, formattedDate) {
  const text = `Hi ${name},

${replyText}

— ur/gd Studios

---
In response to your ${categoryLabel} submitted on ${formattedDate}.

Sent by ur/gd Command, powered by ur/gd Studios (https://www.urgdstudios.com)
ur/gd Studios LLC · The Cloud Room · 1424 11th Ave STE 400 · Seattle, WA 98122-4271
Privacy Policy: https://www.urgdstudios.com/privacy | Terms: https://www.urgdstudios.com/terms`;

  const html = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
<style>
  @import url('https://fonts.googleapis.com/css2?family=Archivo:wght@700&family=Rubik&display=swap');
</style>
</head>
<body style="margin:0;padding:0;background-color:#ffffff;">
  <div style="max-width:600px;margin:0 auto;padding:24px;color:#111827;font-family:'Rubik',sans-serif;">
    <h2 style="color:#111827;margin-bottom:8px;font-family:'Archivo',sans-serif;">Re: Your ${categoryLabel}</h2>
    <p style="font-size:16px;margin-top:0;">Hi ${name},</p>
    <p style="font-size:16px;">${replyText.replace(/\n/g, '<br>')}</p>
    <p style="font-size:14px;color:#4b5563;">In response to your ${categoryLabel} submitted on ${formattedDate}.</p>

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

  return { text, html };
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
