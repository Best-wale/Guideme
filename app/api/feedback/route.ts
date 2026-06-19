import { NextRequest, NextResponse } from 'next/server';
import { saveFeedback } from '@/app/lib/dynamodb';
import { v4 as uuidv4 } from 'crypto';

const headers = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sessionId, messageId, rating, comment } = body;

    if (!sessionId || !messageId || !rating) {
      return NextResponse.json(
        { error: 'sessionId, messageId, and rating are required' },
        { status: 400, headers }
      );
    }

    if (rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: 'rating must be between 1 and 5' },
        { status: 400, headers }
      );
    }

    const feedbackId = `feedback_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    await saveFeedback(feedbackId, sessionId, messageId, rating, comment);

    return NextResponse.json(
      {
        feedbackId,
        createdAt: new Date().toISOString(),
      },
      { status: 201, headers }
    );
  } catch (error) {
    console.error('[Feedback API] POST Error:', error);
    return NextResponse.json(
      { error: 'Failed to save feedback' },
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
