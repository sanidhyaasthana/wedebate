import React, { useState, useEffect, useRef } from 'react';
import { createClient } from '@daily-co/daily-js';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

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
  duration: number; // in seconds
  currentSpeaker?: string;
}

interface Argument {
  id: string;
  content: string;
  participantId: string;
  timestamp: Date;
  segmentId: string;
}

const DebateRoom: React.FC = () => {
  // State management
  const [dailyClient] = useState(() => createClient());
  const supabase = createClientComponentClient();
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [currentSegment, setCurrentSegment] = useState<DebateSegment | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [argumentsList, setArgumentsList] = useState<Argument[]>([]);
  const [isRecognizing, setIsRecognizing] = useState(false);
  const [aiResponse, setAiResponse] = useState<string>('');
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const videoElementRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null); 
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Debate segments configuration
  const debateSegments: DebateSegment[] = [
    { id: 'opening', title: 'Opening Statements', duration: 180 },
    { id: 'rebuttal', title: 'Rebuttal Round', duration: 240 },
    { id: 'cross-examination', title: 'Cross Examination', duration: 300 },
    { id: 'closing', title: 'Closing Statements', duration: 180 }
  ];

  // Initialize Daily.co video call
  useEffect(() => {
    const initVideoCall = async () => {
      try {
        const call = await dailyClient.join({
          url: process.env.NEXT_PUBLIC_DAILY_ROOM_URL,
          subscribeToTracksAutomatically: true
        });

        if (videoElementRef.current) {
          dailyClient.attach(call.participants.local, videoElementRef.current);
        }

        dailyClient.on('participant-joined', (p) => {
          setParticipants(prev => [...prev, {
            id: p.session_id,
            name: p.user_name,
            isModerator: p.user_is_moderator,
            videoEnabled: p.video,
            audioEnabled: p.audio
          }]);
        });

        dailyClient.on('participant-left', (p) => {
          setParticipants(prev => prev.filter(participant => participant.id !== p.session_id));
        });
      } catch (error) {
        console.error('Error initializing video call:', error);
      }
    };

    initVideoCall();

    return () => {
      dailyClient.leave();
    };
  }, []);

  // Initialize debate timer
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  const startDebate = () => {
    if (debateSegments.length > 0) {
      setCurrentSegment(debateSegments[0]);
      setTimeRemaining(debateSegments[0].duration);
      startTimer(debateSegments[0].duration);
    }
  };

  const startTimer = (duration: number) => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    timerRef.current = setInterval(() => {
      setTimeRemaining(prev => {
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
    if (!currentSegment) return;

    const currentIndex = debateSegments.findIndex(seg => seg.id === currentSegment.id);
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
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
  };

  const handleArgumentSubmit = async (content: string) => {
    if (!currentSegment) return;

    const newArgument: Argument = {
      id: crypto.randomUUID(),
      content,
      participantId: 'current-user-id', // Would be replaced with actual user ID
      timestamp: new Date(),
      segmentId: currentSegment.id
    };

    // Save to Supabase
    const { error } = await supabase.from('arguments').insert(newArgument);
    
    if (!error) {
      setArgumentsList(prev => [...prev, newArgument]);
      generateAIResponse(content);
    }
  };

  const generateAIResponse = async (argument: string) => {
    // In a real implementation, this would call an AI service
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
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      alert('Speech recognition not supported in your browser');
      return;
    }

    recognitionRef.current = new SpeechRecognition();
    recognitionRef.current.continuous = true;
    recognitionRef.current.interimResults = true;
    
    recognitionRef.current.onresult = (event) => {
      const transcript = Array.from(event.results)
        .map(result => result[0])
        .map(result => result.transcript)
        .join('');

      // Only submit when final result is available
      if (event.results[0].isFinal) {
        handleArgumentSubmit(transcript);
      }
    };

    recognitionRef.current.onerror = (event) => {
      console.error('Speech recognition error', event.error);
      setIsRecognizing(false);
    };

    recognitionRef.current.start();
    setIsRecognizing(true);
  };

  const stopSpeechRecognition = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsRecognizing(false);
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <div className="debate-room">
      {/* Video Grid */}
      <div className="video-grid" ref={videoElementRef}>
        {participants.map(participant => (
          <div key={participant.id} className="participant-video">
            <div className="participant-name">{participant.name}</div>
          </div>
        ))}
      </div>

      {/* Debate Controls */}
      <div className="debate-controls">
        <h2>{currentSegment?.title || 'Debate Not Started'}</h2>
        <div className="time-display">{formatTime(timeRemaining)}</div>
        
        <div className="argument-section">
          <textarea 
            placeholder="Type your argument here..."
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleArgumentSubmit(e.currentTarget.value);
                e.currentTarget.value = '';
              }
            }}
          />
          <button onClick={() => {
            const textarea = document.querySelector('textarea');
            if (textarea?.value) {
              handleArgumentSubmit(textarea.value);
              textarea.value = '';
            }
          }}>
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
          <button onClick={startDebate} disabled={!!currentSegment}>
            Start Debate
          </button>
          <button onClick={moveToNextSegment} disabled={!currentSegment}>
            Next Segment
          </button>
          <button onClick={endDebate} disabled={!currentSegment}>
            End Debate
          </button>
        </div>
      </div>

      {/* Arguments List */}
      <div className="arguments-list">
        <h3>Arguments</h3>
        <ul>
          {argumentsList.map(arg => (
            <li key={arg.id}>
              <strong>{participants.find(p => p.id === arg.participantId)?.name || 'Unknown'}:</strong>
              <p>{arg.content}</p>
              <small>{arg.timestamp.toLocaleTimeString()} - {debateSegments.find(s => s.id === arg.segmentId)?.title}</small>
            </li>
          ))}
        </ul>
      </div>

      {/* Feedback Modal */}
      {showFeedbackModal && (
        <div className="feedback-modal">
          <div className="modal-content">
            <h2>Debate Summary</h2>
            <div className="stats">
              <p>Number of arguments submitted: {argumentsList.length}</p>
              <p>Participants: {participants.length}</p>
              {/* More detailed feedback would be here in a real implementation */}
            </div>
            <button onClick={() => setShowFeedbackModal(false)}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DebateRoom;
