import { NextRequest, NextResponse } from 'next/server';
import { getSessionMessages, createSession } from '@/app/lib/dynamodb';
import { v4 as uuidv4 } from 'crypto';

const headers = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');

    if (!sessionId) {
      return NextResponse.json({ error: 'sessionId query parameter is required' }, { status: 400, headers });
    }

    const messages = await getSessionMessages(sessionId);

    return NextResponse.json(
      {
        sessionId,
        messages,
      },
      { status: 200, headers }
    );
  } catch (error) {
    console.error('[Sessions API] GET Error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve session' },
      { status: 500, headers }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { pageUrl, userId } = body;

    if (!pageUrl) {
      return NextResponse.json({ error: 'pageUrl is required' }, { status: 400, headers });
    }

    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    await createSession(sessionId, userId || 'anonymous', pageUrl);

    return NextResponse.json(
      {
        sessionId,
        createdAt: new Date().toISOString(),
      },
      { status: 201, headers }
    );
  } catch (error) {
    console.error('[Sessions API] POST Error:', error);
    return NextResponse.json(
      { error: 'Failed to create session' },
      { status: 500, headers }
    );
  }
}

export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers,
  });
}
