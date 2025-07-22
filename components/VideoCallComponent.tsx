import { useEffect, useRef, useState } from 'react';
import DailyIframe, { DailyCall, DailyEventObjectParticipantLeft } from '@daily-co/daily-js';

const VideoCallComponent = () => {
  const videoElementRef = useRef<HTMLVideoElement | null>(null);
  const [participants, setParticipants] = useState<any[]>([]);
  const dailyClientRef = useRef<DailyCall | null>(null);

  useEffect(() => {
    const initVideoCall = async () => {
      try {
        const daily = DailyIframe.createCallObject();
        dailyClientRef.current = daily;

      await daily.join({
  url: process.env.NEXT_PUBLIC_DAILY_ROOM_URL!,
  subscribeToTracksAutomatically: true
});

const localParticipant = daily.participants().local;

        if (videoElementRef.current && localParticipant?.videoTrack) {
          videoElementRef.current.srcObject = new MediaStream([localParticipant.videoTrack as MediaStreamTrack]);
        }

        daily.on('participant-joined', (event) => {
          const p = event.participant;
          setParticipants((prev) => [
            ...prev,
            {
              id: p.session_id,
              name: p.user_name || 'Anonymous',
              isModerator: p.user_id === 'moderator',
              videoEnabled: p.tracks?.video?.state === 'playable',
              audioEnabled: p.tracks?.audio?.state === 'playable'
            }
          ]);
        });

        daily.on('participant-left', (event: DailyEventObjectParticipantLeft) => {
          const sessionId = event.participant.session_id;
          console.log('Participant left with session_id:', sessionId);
        });

      } catch (err) {
        console.error('Error joining call:', err);
      }
    };

    initVideoCall();

    return () => {
      dailyClientRef.current?.leave();
    };
  }, []);

  return (
    <div>
      <video ref={videoElementRef} autoPlay muted playsInline style={{ width: '100%', borderRadius: 8 }} />
    </div>
  );
};

export default VideoCallComponent;
