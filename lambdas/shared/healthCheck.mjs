import { DynamoDBClient, DescribeTableCommand } from '@aws-sdk/client-dynamodb';
import { SESClient, GetSendQuotaCommand } from '@aws-sdk/client-ses';

const dynamoClient = new DynamoDBClient({ region: process.env.AWS_REGION || 'us-west-2' });
const sesClient = new SESClient({ region: process.env.AWS_REGION || 'us-west-2' });

/**
 * Performs health checks on backend dependencies
 * @param {object} options - Health check options
 * @param {string} options.tableName - DynamoDB table name
 * @param {Array<string>} options.requiredEnvVars - Required environment variables
 * @returns {Promise<object>} Health check results
 */
export async function performHealthCheck({ tableName, requiredEnvVars = [] }) {
  const checks = {
    dynamodb: { status: 'unknown', message: '' },
    ses: { status: 'unknown', message: '' },
    environment: { status: 'unknown', message: '' }
  };

  // Check DynamoDB table connectivity
  try {
    const command = new DescribeTableCommand({ TableName: tableName });
    const response = await dynamoClient.send(command);

    if (response.Table && response.Table.TableStatus === 'ACTIVE') {
      checks.dynamodb = { status: 'healthy', message: 'Connection successful' };
    } else {
      checks.dynamodb = {
        status: 'unhealthy',
        message: `Table status: ${response.Table?.TableStatus || 'unknown'}`
      };
    }
  } catch (error) {
    checks.dynamodb = { status: 'unhealthy', message: error.message };
  }

  // Check SES availability
  try {
    await sesClient.send(new GetSendQuotaCommand({}));
    checks.ses = { status: 'healthy', message: 'Available' };
  } catch (error) {
    checks.ses = { status: 'unhealthy', message: error.message };
  }

  // Check environment variables
  const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

  if (missingVars.length === 0) {
    checks.environment = { status: 'healthy', message: 'All variables present' };
  } else {
    checks.environment = {
      status: 'unhealthy',
      message: `Missing: ${missingVars.join(', ')}`
    };
  }

  const allHealthy = Object.values(checks).every(check => check.status === 'healthy');

  return { healthy: allHealthy, checks };
}

/**
 * Handles health check requests
 * @param {object} event - API Gateway event
 * @param {string} requestId - Request ID for logging
 * @param {object} options - Health check options
 * @returns {object} API Gateway response
 */
export async function handleHealthCheck(event, requestId, options) {
  const { createResponse, errorResponse, log } = await import('./utils.mjs');

  try {
    const healthResult = await performHealthCheck(options);

    const response = {
      status: healthResult.healthy ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      version: process.env.VERSION || '2.0.0',
      checks: healthResult.checks
    };

    const statusCode = healthResult.healthy ? 200 : 503;

    log('info', 'Health check completed', { requestId, status: response.status });

    return createResponse(statusCode, response, event);

  } catch (error) {
    log('error', 'Health check failed', { requestId, error: error.message });
    return errorResponse(503, 'Health check failed', null, event);
  }
}
