import { NextRequest, NextResponse } from 'next/server';
import { generateDebateFeedback, FeedbackSchema } from '@/lib/openrouter';
import { createClient } from '@/utils/supabase/server';

export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { topic, creatorArguments, opponentArguments, isAIResponse = false } = await request.json();

    // Validate input
    if (!topic || !creatorArguments || !opponentArguments) {
      console.error('Validation Error: Missing required fields', { topic, creatorArguments, opponentArguments });
      return NextResponse.json(
        { error: 'All fields (topic, creatorArguments, opponentArguments) are required.' },
        { status: 400 }
      );
    }

    if (typeof topic !== 'string' || 
        typeof creatorArguments !== 'string' || 
        typeof opponentArguments !== 'string' || 
        typeof isAIResponse !== 'boolean') {
      console.error('Validation Error: Invalid input types', { topic, creatorArguments, opponentArguments, isAIResponse });
      return NextResponse.json(
        { error: 'Invalid input types. Arguments must be strings and isAIResponse must be boolean.' },
        { status: 400 }
      );
    }

    // Ensure the arguments are not empty after trimming
    if (!creatorArguments.trim() || !opponentArguments.trim()) {
      console.error('Validation Error: Empty arguments after trimming', { creatorArguments, opponentArguments });
      return NextResponse.json(
        { error: 'Arguments cannot be empty' },
        { status: 400 }
      );
    }

    try {
      // Generate feedback using OpenRouter API
      console.log('Generating feedback with arguments:', { creatorArguments, opponentArguments, topic });
      const feedback = await generateDebateFeedback(
        creatorArguments,
        opponentArguments,
        topic
      );

      console.log('Feedback generated successfully:', feedback);

      // Store feedback in database if authenticated
      try {
        await supabase.from('debate_feedback').insert([{
          user_id: user.id,
          topic,
          creator_arguments: creatorArguments,
          opponent_arguments: opponentArguments,
          feedback: feedback, // Already validated by generateDebateFeedback
          is_ai_response: isAIResponse,
          created_at: new Date().toISOString()
        }]);
        console.log('Feedback stored in database successfully');
      } catch (dbError) {
        console.error('Error storing feedback in database:', dbError);
        // Continue even if storage fails - don't block the user from getting feedback
      }

      return NextResponse.json(feedback);
    } catch (error: any) {
      console.error('Feedback generation error:', error);
      
      // Return a more specific error message to help debugging
      return NextResponse.json(
        { 
          error: error.message || 'Failed to generate feedback',
          details: error.cause || error.stack
        },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('Error generating feedback:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate feedback' },
      { status: 500 }
    );
  }
}