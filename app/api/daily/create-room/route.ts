import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const { debateId } = await request.json();

  if (!debateId) {
    return NextResponse.json({ error: 'Debate ID is required' }, { status: 400 });
  }

  const DAILY_API_KEY = process.env.DAILY_API_KEY;
  if (!DAILY_API_KEY) {
    return NextResponse.json({ error: 'DAILY_API_KEY is not set' }, { status: 500 });
  }

  try {
    const response = await fetch('https://api.daily.co/v1/rooms/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${DAILY_API_KEY}`,
      },
      body: JSON.stringify({
        name: `wedebate-${debateId}`,
        properties: {
          enable_prejoin_ui: false,
          enable_knocking: true,
          enable_chat: true,
          enable_people_ui: true,
          enable_screenshare: true,
          enable_network_ui: true,
          enable_noise_cancellation: true,
          max_participants: 2,
          start_video_off: false,
          start_audio_off: false,
          exp: Math.floor(Date.now() / 1000) + 24 * 60 * 60 // 24 hours from now
        },
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Daily.co API error:', data);
      return NextResponse.json({ error: data.info || 'Failed to create Daily.co room' }, { status: response.status });
    }

    return NextResponse.json({ url: data.url });
  } catch (error) {
    console.error('Server error creating Daily.co room:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}