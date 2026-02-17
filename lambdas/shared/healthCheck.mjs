import { DynamoDBClient, DescribeTableCommand } from '@aws-sdk/client-dynamodb';
import { SNSClient, GetTopicAttributesCommand } from '@aws-sdk/client-sns';

const dynamoClient = new DynamoDBClient({ region: process.env.AWS_REGION || 'us-west-2' });
const snsClient = new SNSClient({ region: process.env.AWS_REGION || 'us-west-2' });

/**
 * Performs health checks on backend dependencies
 * @param {object} options - Health check options
 * @param {string} options.tableName - DynamoDB table name
 * @param {string} options.topicArn - SNS topic ARN
 * @param {Array<string>} options.requiredEnvVars - Required environment variables
 * @returns {Promise<object>} Health check results
 */
export async function performHealthCheck({ tableName, topicArn, requiredEnvVars = [] }) {
  const checks = {
    dynamodb: { status: 'unknown', message: '' },
    sns: { status: 'unknown', message: '' },
    environment: { status: 'unknown', message: '' }
  };
  
  // Check DynamoDB table connectivity
  try {
    const command = new DescribeTableCommand({ TableName: tableName });
    const response = await dynamoClient.send(command);
    
    if (response.Table && response.Table.TableStatus === 'ACTIVE') {
      checks.dynamodb = {
        status: 'healthy',
        message: 'Connection successful'
      };
    } else {
      checks.dynamodb = {
        status: 'unhealthy',
        message: `Table status: ${response.Table?.TableStatus || 'unknown'}`
      };
    }
  } catch (error) {
    checks.dynamodb = {
      status: 'unhealthy',
      message: error.message
    };
  }
  
  // Check SNS topic accessibility
  try {
    const command = new GetTopicAttributesCommand({ TopicArn: topicArn });
    await snsClient.send(command);
    
    checks.sns = {
      status: 'healthy',
      message: 'Topic accessible'
    };
  } catch (error) {
    checks.sns = {
      status: 'unhealthy',
      message: error.message
    };
  }
  
  // Check environment variables
  const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length === 0) {
    checks.environment = {
      status: 'healthy',
      message: 'All variables present'
    };
  } else {
    checks.environment = {
      status: 'unhealthy',
      message: `Missing: ${missingVars.join(', ')}`
    };
  }
  
  // Overall health status
  const allHealthy = Object.values(checks).every(check => check.status === 'healthy');
  
  return {
    healthy: allHealthy,
    checks
  };
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
    
    log('info', 'Health check completed', {
      requestId,
      status: response.status
    });
    
    return createResponse(statusCode, response, event);
    
  } catch (error) {
    log('error', 'Health check failed', {
      requestId,
      error: error.message
    });
    
    return errorResponse(503, 'Health check failed', null, event);
  }
}
