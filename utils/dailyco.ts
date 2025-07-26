// Function to create a Daily.co room
export async function createDailyRoom() {
  const apiKey = process.env.DAILY_API_KEY;
  
  if (!apiKey) {
    console.error('Daily.co API key not found in environment variables');
    throw new Error('Daily.co API key not configured');
  }

  // Log that we have the API key (without exposing it)
  console.log('Daily.co API key found, attempting to create room...');

  try {
    // Create a room name with a timestamp to ensure uniqueness
    const roomName = `debate-${Date.now()}-${Math.random().toString(36).substring(7)}`;
    console.log('Creating Daily.co room with name:', roomName);

    const response = await fetch('https://api.daily.co/v1/rooms', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        name: roomName,
        properties: {
          enable_chat: true,
          enable_screenshare: true,
          start_video_off: false,
          start_audio_off: false,
          max_participants: 2,
          exp: Math.round(Date.now() / 1000) + 7200, // Room expires in 2 hours
          enable_network_ui: true, // Show network quality indicators
          enable_prejoin_ui: true, // Show prejoin screen
          enable_recording: "cloud", // Enable cloud recording
        },
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to create Daily.co room');
    }

    const data = await response.json();
    return data.url; // Returns the URL of the created room
  } catch (error) {
    console.error('Error creating Daily.co room:', error);
    throw error;
  }
}
