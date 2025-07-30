import { NextRequest, NextResponse } from 'next/server';
import { generateAIArgument } from '@/lib/openrouter';
import { createClient } from '@/utils/supabase/server';

export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError) {
      console.error('Auth error in argument API:', authError);
      return NextResponse.json(
        { error: 'Auth session missing! Please sign in again.' },
        { status: 401 }
      );
    }
    
    if (!user) {
      console.error('No user found in argument API');
      return NextResponse.json(
        { error: 'Auth session missing! Please sign in again.' },
        { status: 401 }
      );
    }
    
    console.log('User authenticated in argument API:', user.email);

    const { userArgument, topic, position, debateSegment } = await request.json();

    // Validate input
    if (!topic || !position || !debateSegment) {
      console.error('Validation Error: Missing required fields', { topic, position, debateSegment });
      return NextResponse.json(
        { error: 'Missing required fields' }, 
        { status: 400 }
      );
    }

    if (typeof topic !== 'string' || 
        (userArgument && typeof userArgument !== 'string') ||
        !['for', 'against'].includes(position) ||
        !['Opening Statement', 'Rebuttal', 'Closing Statement'].includes(debateSegment)) {
      console.error('Validation Error: Invalid input types or values', { topic, userArgument, position, debateSegment });
      return NextResponse.json(
        { error: 'Invalid input types or values' },
        { status: 400 }
      );
    }

    try {
      // Convert debate segment to the format expected by generateAIArgument
      const normalizedDebateSegment = debateSegment === 'Opening Statement' 
        ? 'opening'
        : debateSegment === 'Closing Statement' 
          ? 'closing' 
          : 'rebuttal';

      // Generate AI argument
      const aiArgument = await generateAIArgument(
        userArgument || '',
        topic,
        position as 'for' | 'against',
        normalizedDebateSegment as 'opening' | 'rebuttal' | 'closing'
      );

      // Store AI response in debate history
      try {
        await supabase.from('debate_arguments').insert([{
          user_id: user.id,
          topic,
          position,
          segment: debateSegment,
          user_argument: userArgument || null,
          ai_argument: aiArgument,
          created_at: new Date().toISOString()
        }]);
      } catch (dbError) {
        console.error('Error storing AI argument:', dbError);
        // Continue even if storage fails
      }

      return NextResponse.json({ argument: aiArgument });
    } catch (error: any) {
      console.error('Error generating AI argument:', error);
      return NextResponse.json(
        { 
          error: error.message || 'Failed to generate AI argument',
          details: error.cause || error.stack
        },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('Error in argument route:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}