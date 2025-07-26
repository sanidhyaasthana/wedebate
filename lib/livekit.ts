// lib/livekit.ts
import { Room, RoomEvent, Track, RoomOptions } from 'livekit-client';

export const livekitConfig = {
  url: process.env.LIVEKIT_URL as string,
  apiKey: process.env.LIVEKIT_API_KEY as string,
  secretKey: process.env.LIVEKIT_SECRET_KEY as string,
};

export const createRoom = (): Room => {
  const options: RoomOptions = {
    adaptiveStream: true,
    dynacast: true,
    videoCaptureDefaults: {
      resolution: {
        width: 1280,
        height: 720,
      },
      facingMode: 'user',
    },
    audioCaptureDefaults: {
      echoCancellation: true,
      noiseSuppression: true,
    },
  };
  
  return new Room(options);
};

export const roomEvents = RoomEvent;
export const trackKind = Track;