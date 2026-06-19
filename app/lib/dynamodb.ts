import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, QueryCommand, GetCommand } from '@aws-sdk/lib-dynamodb';
import { fromEnv } from '@aws-sdk/credential-providers';

let dynamodbClient: DynamoDBDocumentClient | null = null;

export function getDynamoDBClient(): DynamoDBDocumentClient {
  if (dynamodbClient) {
    return dynamodbClient;
  }

  const region = process.env.AWS_REGION || 'us-east-1';

  const client = new DynamoDBClient({
    region,
    credentials: fromEnv(),
  });

  dynamodbClient = DynamoDBDocumentClient.from(client, {
    marshallOptions: {
      removeUndefinedValues: true,
    },
  });

  return dynamodbClient;
}

export async function saveChatMessage(
  sessionId: string,
  messageId: string,
  role: 'user' | 'assistant',
  content: string,
  steps?: any[],
  voiceInput?: boolean
) {
  try {
    const client = getDynamoDBClient();
    const timestamp = new Date().toISOString();

    const params = {
      TableName: 'ai-site-guide-messages',
      Item: {
        sessionId,
        messageId: `${timestamp}#${messageId}`,
        role,
        content,
        steps: steps || [],
        voiceInput: voiceInput || false,
        createdAt: timestamp,
        ttl: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60, // 30 days
      },
    };

    await client.send(new PutCommand(params));
  } catch (error) {
    console.error('[DynamoDB] Error saving chat message:', error);
    // Don't throw - logging failure is non-critical
  }
}

export async function createSession(sessionId: string, userId: string, pageUrl: string) {
  try {
    const client = getDynamoDBClient();
    const createdAt = new Date().toISOString();

    const params = {
      TableName: 'ai-site-guide-sessions',
      Item: {
        sessionId,
        createdAt,
        userId,
        pageUrl,
        userAgent: process.env.USER_AGENT || 'unknown',
        ttl: Math.floor(Date.now() / 1000) + 24 * 60 * 60, // 24 hours
      },
    };

    await client.send(new PutCommand(params));
  } catch (error) {
    console.error('[DynamoDB] Error creating session:', error);
  }
}

export async function saveFeedback(
  feedbackId: string,
  sessionId: string,
  messageId: string,
  rating: number,
  comment?: string
) {
  try {
    const client = getDynamoDBClient();
    const createdAt = new Date().toISOString();

    const params = {
      TableName: 'ai-site-guide-feedback',
      Item: {
        feedbackId,
        createdAt,
        sessionId,
        messageId,
        rating: Math.min(5, Math.max(1, rating)),
        comment: comment || '',
        ttl: Math.floor(Date.now() / 1000) + 90 * 24 * 60 * 60, // 90 days
      },
    };

    await client.send(new PutCommand(params));
  } catch (error) {
    console.error('[DynamoDB] Error saving feedback:', error);
  }
}

export async function getSessionMessages(sessionId: string) {
  try {
    const client = getDynamoDBClient();

    const params = {
      TableName: 'ai-site-guide-messages',
      KeyConditionExpression: 'sessionId = :sessionId',
      ExpressionAttributeValues: {
        ':sessionId': sessionId,
      },
      Limit: 100,
    };

    const result = await client.send(new QueryCommand(params));
    return result.Items || [];
  } catch (error) {
    console.error('[DynamoDB] Error retrieving session messages:', error);
    return [];
  }
}

export async function getSession(sessionId: string) {
  try {
    const client = getDynamoDBClient();

    const params = {
      TableName: 'ai-site-guide-sessions',
      Key: {
        sessionId,
      },
    };

    const result = await client.send(new GetCommand(params));
    return result.Item || null;
  } catch (error) {
    console.error('[DynamoDB] Error retrieving session:', error);
    return null;
  }
}
