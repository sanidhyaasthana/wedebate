// Debug script to test LiveKit token generation
const testTokenGeneration = async () => {
  try {
    console.log('Testing token generation...');
    
    const response = await fetch('http://localhost:3001/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        roomName: 'test-room',
        participantName: 'TestUser',
        role: 'participant',
      }),
    });

    console.log('Response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Token request failed:', errorText);
      return;
    }

    const tokenData = await response.json();
    console.log('Token data received:', tokenData);
    
    // Validate token format
    if (tokenData.token && tokenData.token.split('.').length === 3) {
      console.log('✅ Token format is valid JWT');
    } else {
      console.error('❌ Invalid token format');
    }
    
    // Validate URL format
    if (tokenData.url && (tokenData.url.startsWith('ws://') || tokenData.url.startsWith('wss://'))) {
      console.log('✅ URL format is valid WebSocket');
    } else {
      console.error('❌ Invalid URL format');
    }
    
  } catch (error) {
    console.error('Error testing token generation:', error);
  }
};

testTokenGeneration();
