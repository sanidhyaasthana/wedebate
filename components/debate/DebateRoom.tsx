

import React, { useState, useEffect, useRef } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import Script from 'next/script';



// Types
interface Participant {
  id: string;
  name: string;
  isModerator: boolean;
  videoEnabled: boolean;
  audioEnabled: boolean;
}

declare global {
  interface Window {
    JitsiMeetExternalAPI: any;
  }
}

interface DebateRoomProps {
  debateId: string;
  userId: string;
  roomName: string;
}

interface JitsiParticipant {
  id: string;
  displayName?: string;
  role?: string;
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

const DebateRoom: React.FC<DebateRoomProps> = ({ debateId, userId, roomName }) => {
  const [isCallStarted, setIsCallStarted] = useState(false);
  const [isSpeakerTurn, setIsSpeakerTurn] = useState(false);
  const jitsiRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

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
  const loadJitsiAndInitialize = async () => {
    try {
      if (!window.JitsiMeetExternalAPI) {
        console.log('Loading Jitsi script...');
        await new Promise<void>((resolve) => {
          const script = document.createElement('script');
          script.src = 'https://8x8.vc/vpaas-magic-cookie-5e8e0def5859454485843092f994fcc3/external_api.js';
          script.async = true;
          script.onload = () => resolve();
          document.body.appendChild(script);
        });
      }

      if (containerRef.current && window.JitsiMeetExternalAPI) {
        const domain = '8x8.vc';
        const options = {
          roomName: roomName,
          width: '100%',
          height: '100%',
          parentNode: containerRef.current,
          configOverwrite: {
            startWithAudioMuted: !isSpeakerTurn,
            prejoinPageEnabled: false,
            toolbarButtons: [
              'microphone', 'camera', 'fullscreen', 'chat',
              'settings', 'raisehand', 'videoquality'
            ]
          },
          interfaceConfigOverwrite: {
            SHOW_JITSI_WATERMARK: false,
            DISABLE_JOIN_LEAVE_NOTIFICATIONS: true
          },
          userInfo: {
            displayName: userId
          }
        };

        console.log('Initializing Jitsi with options:', options);
        const jitsi = new window.JitsiMeetExternalAPI(domain, options);
        jitsiRef.current = jitsi;

        jitsi.addEventListeners({
          participantJoined: (participant: JitsiParticipant) => {
            console.log('Participant joined:', participant);
            setParticipants(prev => [...prev, {
              id: participant.id,
              name: participant.displayName || 'Anonymous',
              isModerator: participant.role === 'moderator',
              videoEnabled: true,
              audioEnabled: true
            }]);
          },
          participantLeft: (participant: { id: string }) => {
            console.log('Participant left:', participant);
            setParticipants(prev => prev.filter(p => p.id !== participant.id));
          }
        });

        setIsCallStarted(true);
      }
    } catch (error) {
      console.error('Error initializing Jitsi:', error);
    }
  };

  loadJitsiAndInitialize();

  return () => {
    if (jitsiRef.current) {
      jitsiRef.current.dispose();
    }
  };
}, [roomName, userId, isSpeakerTurn]);

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
      <Script
        src="https://8x8.vc/vpaas-magic-cookie-5e8e0def5859454485843092f994fcc3/external_api.js"
        strategy="lazyOnload"
      />
      <div 
        id="jaas-container"
        ref={containerRef}
        style={{ 
          width: '100%', 
          height: 'calc(100vh - 200px)', 
          marginBottom: '20px',
          position: 'relative'
        }}
      />

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
