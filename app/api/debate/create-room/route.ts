import { NextRequest, NextResponse } from 'next/server';
import { createDailyRoom } from '@/utils/dailyco';
import { createClient } from '@/utils/supabase/server';

export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      console.error('Authentication error:', authError);
      return NextResponse.json(
        { error: 'Unauthorized. Please sign in.' },
        { status: 401 }
      );
    }

    // Log the current user state
    console.log('Authenticated user:', {
      id: user.id,
      email: user.email
    });

    // Verify Daily.co API key is configured
    if (!process.env.DAILY_API_KEY) {
      console.error('Daily.co API key not configured in environment variables');
      return NextResponse.json(
        { error: 'Server configuration error: Daily.co API key missing' },
        { status: 500 }
      );
    }

    console.log('Creating Daily.co room for user:', user.id);
    // Create a Daily.co room
    const roomUrl = await createDailyRoom();
    console.log('Room created successfully:', roomUrl);

    return NextResponse.json({ roomUrl });
  } catch (error: any) {
    console.error('Error creating debate room:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create debate room' },
      { status: 500 }
    );
  }
}
