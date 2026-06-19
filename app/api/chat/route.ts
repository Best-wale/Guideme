import { NextRequest, NextResponse } from 'next/server';
import { generateText } from 'ai';
import { model, createChatSystemPrompt } from '@/app/lib/openai-client';
import { parseGuidanceResponse, validatePageContext } from '@/app/lib/structured-output';
import { saveChatMessage, createSession } from '@/app/lib/dynamodb';
import { v4 as uuidv4 } from 'crypto';

// Enable CORS for extension
export const runtime = 'nodejs';

async function sha256(message: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export async function POST(request: NextRequest) {
  // Set CORS headers
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  try {
    const body = await request.json();
    const { message, pageUrl, pageContext, sessionId, userId } = body;

    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { error: 'Message is required and must be a string' },
        { status: 400, headers }
      );
    }

    if (!pageContext) {
      return NextResponse.json(
        { error: 'Page context is required' },
        { status: 400, headers }
      );
    }

    // Validate and sanitize page context
    const validatedContext = validatePageContext(pageContext);

    // Generate unique IDs
    const newSessionId = sessionId || `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const messageId = uuidv4();

    // Create session if new
    if (!sessionId) {
      const generatedUserId = await sha256(`${pageUrl}_${Date.now()}`);
      await createSession(newSessionId, generatedUserId, pageUrl);
    }

    // Create system prompt
    const systemPrompt = createChatSystemPrompt(validatedContext);

    // Call OpenAI via AI SDK
    const response = await generateText({
      model,
      system: systemPrompt,
      prompt: message,
      temperature: 0.7,
      maxTokens: 500,
    });

    // Parse the response for guidance steps
    const guidance = parseGuidanceResponse(response.text, response.text);

    // Save to DynamoDB
    await saveChatMessage(newSessionId, messageId, 'user', message, [], false);
    await saveChatMessage(newSessionId, messageId, 'assistant', guidance.response, guidance.steps, false);

    // Return response
    return NextResponse.json(
      {
        response: guidance.response,
        steps: guidance.steps || [],
        sessionId: newSessionId,
      },
      { status: 200, headers }
    );
  } catch (error) {
    console.error('[Chat API] Error:', error);

    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';

    return NextResponse.json(
      {
        error: 'Failed to process chat request',
        details: errorMessage,
        response: 'I apologize, but I encountered an error processing your request. Please try again.',
        steps: [],
      },
      { status: 500, headers }
    );
  }
}

export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
