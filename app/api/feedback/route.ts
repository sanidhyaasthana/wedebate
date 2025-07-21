import { NextRequest, NextResponse } from 'next/server';
import { generateDebateFeedback } from '@/lib/openrouter';

export async function POST(request: NextRequest) {
  try {
    const { topic, creatorArguments, opponentArguments } = await request.json();

    // Validate input
    if (!topic || !creatorArguments || !opponentArguments) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Generate feedback using OpenRouter API
    const feedback = await generateDebateFeedback(
      creatorArguments,
      opponentArguments,
      topic
    );

    return NextResponse.json(feedback);
  } catch (error: any) {
    console.error('Error generating feedback:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate feedback' },
      { status: 500 }
    );
  }
}