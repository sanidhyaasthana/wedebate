import { NextRequest, NextResponse } from 'next/server';
import { generateAIArgument } from '@/lib/openrouter';

export async function POST(request: NextRequest) {
  try {
    const { userArgument, topic, position, debateSegment } = await request.json();

    // Validate input
   
    // Generate AI argument using OpenRouter API
    const aiArgument = await generateAIArgument(
      userArgument,
      topic,
      position as 'for' | 'against',
      debateSegment
    );

    return NextResponse.json({ argument: aiArgument });
  } catch (error: any) {
    console.error('Error generating AI argument:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate AI argument' },
      { status: 500 }
    );
  }
}