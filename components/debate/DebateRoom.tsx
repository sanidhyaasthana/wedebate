

import React, { useState, useEffect, useRef } from 'react';
import DailyIframe from '@daily-co/daily-js';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

import type { DailyEventObjectParticipantLeft } from '@daily-co/daily-js';

import  {
  DailyCall,
  DailyParticipant,
  DailyEventObjectParticipant,
} from '@daily-co/daily-js';



const dailyClient = DailyIframe.createCallObject();



// Types
interface Participant {
  id: string;
  name: string;
  isModerator: boolean;
  videoEnabled: boolean;
  audioEnabled: boolean;
}

interface DebateSegment {
  id: string;
  title: string;
  duration: number;
  currentSpeaker?: string;
}

interface Argument {
  id: string;
  content: string;
  participantId: string;
  timestamp: string;
  segmentId: string;
}

const DebateRoom: React.FC = () => {
  const [dailyClient] = useState(() => DailyIframe.createCallObject());
  const supabase = createClientComponentClient();

  const [participants, setParticipants] = useState<Participant[]>([]);
  const [currentSegment, setCurrentSegment] = useState<DebateSegment | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [argumentsList, setArgumentsList] = useState<Argument[]>([]);
  const [isRecognizing, setIsRecognizing] = useState(false);
  const [aiResponse, setAiResponse] = useState<string>('');
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const videoElementRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const currentUserId = 'current-user-id'; // Replace with actual logic to get logged-in user ID

  const debateSegments: DebateSegment[] = [
    { id: 'opening', title: 'Opening Statements', duration: 180 },
    { id: 'rebuttal', title: 'Rebuttal Round', duration: 240 },
    { id: 'cross-examination', title: 'Cross Examination', duration: 300 },
    { id: 'closing', title: 'Closing Statements', duration: 180 }
  ];
useEffect(() => {
  const initVideoCall = async () => {
    try {
      const call: DailyCall = dailyClient;

      await call.join({
        url: process.env.NEXT_PUBLIC_DAILY_ROOM_URL!,
        subscribeToTracksAutomatically: true,
      });

      // Access local participant
   const videoElementRef = useRef<HTMLVideoElement>(null);

useEffect(() => {
  const localParticipant = call.participants().local;

  if (videoElementRef.current && localParticipant?.videoTrack) {
    videoElementRef.current.srcObject = new MediaStream([localParticipant.videoTrack as MediaStreamTrack]);
  }
}, [call]);

      // Handle participant joined
      call.on('participant-joined', (event: DailyEventObjectParticipant) => {
        const p: DailyParticipant = event.participant;
        setParticipants((prev) => [
          ...prev,
          {
            id: p.session_id,
            name: p.user_name || 'Anonymous',
            isModerator: p.user_id === 'moderator',
            videoEnabled: p.tracks.video?.state === 'playable',
            audioEnabled: p.tracks.audio?.state === 'playable',
          },
        ]);
      });

      // Handle participant left
      call.on('participant-left', (event: DailyEventObjectParticipantLeft) => {
        const sessionId = event.participant.session_id;
        console.log('Participant left with session_id:', sessionId);
        setParticipants((prev) => prev.filter((p) => p.id !== sessionId));
      });
    } catch (err) {
      console.error('Error joining Daily call:', err);
    }
  };

  initVideoCall();

  return () => {
    dailyClient.leave();
  };
}, []);

useEffect(() => {
  return () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
  };
}, []);

  const startDebate = () => {
    const firstSegment = debateSegments[0];
    setCurrentSegment(firstSegment);
    setTimeRemaining(firstSegment.duration);
    startTimer(firstSegment.duration);
  };

  const startTimer = (duration: number) => {
    if (timerRef.current) clearInterval(timerRef.current);

    timerRef.current = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          moveToNextSegment();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const moveToNextSegment = () => {
    const currentIndex = debateSegments.findIndex(seg => seg.id === currentSegment?.id);
    if (currentIndex < debateSegments.length - 1) {
      const nextSegment = debateSegments[currentIndex + 1];
      setCurrentSegment(nextSegment);
      setTimeRemaining(nextSegment.duration);
      startTimer(nextSegment.duration);
    } else {
      endDebate();
    }
  };

  const endDebate = () => {
    setShowFeedbackModal(true);
    if (timerRef.current) clearInterval(timerRef.current);
  };

  const handleArgumentSubmit = async (content: string) => {
    if (!currentSegment || !content.trim()) return;

    const newArgument: Argument = {
      id: crypto.randomUUID(),
      content,
      participantId: currentUserId,
      timestamp: new Date().toISOString(),
      segmentId: currentSegment.id
    };

    const { error } = await supabase.from('debate_arguments').insert(newArgument);
    if (!error) {
      setArgumentsList((prev) => [...prev, newArgument]);
      generateAIResponse(content);
    } else {
      console.error('Failed to insert argument:', error);
    }
  };

  const generateAIResponse = async (argument: string) => {
    setTimeout(() => {
      setAiResponse(`Interesting point. Have you considered the counter-argument that...?`);
    }, 1500);
  };

  const toggleSpeechRecognition = () => {
    if (isRecognizing) {
      stopSpeechRecognition();
    } else {
      startSpeechRecognition();
    }
  };

  const startSpeechRecognition = () => {
    const SpeechRecognition = window.SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Speech recognition not supported in your browser');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;


type CustomSpeechRecognitionEvent = Event & {
  results: SpeechRecognitionResultList;
};

type SpeechRecognitionAlternative = {
  transcript: string;
  confidence: number;
};

recognition.onresult = (event: CustomSpeechRecognitionEvent) => {
  const transcript = Array.from(event.results)
    .map((result) => result[0])
    .map((result) => result.transcript)
    .join('');

  if (event.results[event.results.length - 1].isFinal) {
    handleArgumentSubmit(transcript);
  }
};

   recognition.onerror = (event: Event) => {
  const errorEvent = event as SpeechRecognitionErrorEvent;
  console.error("Speech recognition error:", errorEvent.error);
  setIsRecognizing(false);
};

    recognition.start();
    recognitionRef.current = recognition;
    setIsRecognizing(true);
  };

  const stopSpeechRecognition = () => {
    recognitionRef.current?.stop();
    setIsRecognizing(false);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <div className="debate-room">
      <div className="video-grid" ref={videoElementRef}></div>

      <div className="debate-controls">
        <h2>{currentSegment?.title || 'Debate Not Started'}</h2>
        <div className="time-display">{formatTime(timeRemaining)}</div>

        <div className="argument-section">
          <textarea
            placeholder="Type your argument here..."
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleArgumentSubmit((e.target as HTMLTextAreaElement).value);
                (e.target as HTMLTextAreaElement).value = '';
              }
            }}
          />
          <button
            onClick={() => {
              const textarea = document.querySelector('textarea');
              if (textarea && textarea.value) {
                handleArgumentSubmit(textarea.value);
                textarea.value = '';
              }
            }}
          >
            Submit Argument
          </button>

          <button onClick={toggleSpeechRecognition}>
            {isRecognizing ? 'Stop Speech Recognition' : 'Start Speech Recognition'}
          </button>
        </div>

        {aiResponse && (
          <div className="ai-response">
            <h4>AI Feedback:</h4>
            <p>{aiResponse}</p>
          </div>
        )}

        <div className="navigation-buttons">
          <button onClick={startDebate} disabled={!!currentSegment}>Start Debate</button>
          <button onClick={moveToNextSegment} disabled={!currentSegment}>Next Segment</button>
          <button onClick={endDebate} disabled={!currentSegment}>End Debate</button>
        </div>
      </div>

      <div className="arguments-list">
        <h3>Arguments</h3>
        <ul>
          {argumentsList.map((arg) => (
            <li key={arg.id}>
              <strong>{participants.find((p) => p.id === arg.participantId)?.name || 'Unknown'}:</strong>
              <p>{arg.content}</p>
              <small>
                {new Date(arg.timestamp).toLocaleTimeString()} - {
                  debateSegments.find((s) => s.id === arg.segmentId)?.title
                }
              </small>
            </li>
          ))}
        </ul>
      </div>

      {showFeedbackModal && (
        <div className="feedback-modal">
          <div className="modal-content">
            <h2>Debate Summary</h2>
            <div className="stats">
              <p>Number of arguments submitted: {argumentsList.length}</p>
              <p>Participants: {participants.length}</p>
            </div>
            <button onClick={() => setShowFeedbackModal(false)}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DebateRoom;
