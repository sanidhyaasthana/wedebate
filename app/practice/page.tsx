'use client';


// Example debate structure — replace this with real data if needed
const selectedDebateFormat = {
  structure: [
    { name: "Opening Statement" },
    { name: "Rebuttal" },
    { name: "Closing Statement" }
  ]
};







import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import Link from 'next/link';
import { sampleDebateTopics, debateFormats } from '@/utils/aiPrompts';
import ArgumentEditor from '@/components/debate/ArgumentEditor';
import FeedbackModal from '@/components/debate/FeedbackModal';
import { formatTime } from '@/utils/timeUtils';
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition';


export default function PracticePage() { 
  const router = useRouter();
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [practiceMode, setPracticeMode] = useState<'select' | 'practice' | 'feedback'>('select');
  
  const [selectedTopic, setSelectedTopic] = useState('');
  const [customTopic, setCustomTopic] = useState('');
  const [position, setPosition] = useState<'for' | 'against'>('for');
  const [argument, setArgument] = useState('');
  const [aiArgument, setAiArgument] = useState('');
  const [timeRemaining, setTimeRemaining] = useState(180); // 3 minutes default
  const [initialTime, setInitialTime] = useState(180); // Track initial time for progress bar
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [feedback, setFeedback] = useState<any>(null);
  const [isGeneratingFeedback, setIsGeneratingFeedback] = useState(false);
  const [userArgument, setUserArgument] = useState('');
  const [aiResponse, setAiResponse] = useState<string | null>(null);
  const [feedbackError, setFeedbackError] = useState<string | null>(null);
  const [timerFinished, setTimerFinished] = useState(false);

  // Speech recognition hook
  const {
    isListening,
    transcript,
    interimTranscript,
    startListening,
    stopListening,
    resetTranscript,
    isSupported: speechSupported,
    error: speechError
  } = useSpeechRecognition();

  // Check authentication status
  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUser(session.user);
      }
      setLoading(false);
    };
    
    checkUser();
    
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (session?.user) {
          setUser(session.user);
        } else {
          setUser(null);
        }
        setLoading(false);
      }
    );
    
    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [supabase]);

  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isTimerRunning && timeRemaining > 0) {
      interval = setInterval(() => {
        setTimeRemaining((prev) => {
          const newTime = prev - 1;
          console.log("Timer tick:", newTime);
          return newTime;
        });
      }, 1000);
    } else if (timeRemaining === 0 && isTimerRunning) {
      setIsTimerRunning(false);
      setTimerFinished(true);
      console.log("Timer finished - auto-submitting");
      
      // Play a sound notification (if supported)
      try {
        const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUarm7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWT');
        audio.play().catch(() => {
          // Fallback: just log if audio fails
          console.log("Timer finished!");
        });
      } catch (error) {
        console.log("Timer finished!");
      }
      
      // Clear the notification after 3 seconds
      setTimeout(() => setTimerFinished(false), 3000);
      
      // Auto-submit when time runs out
      if (practiceMode === 'practice' && argument.trim()) {
        handleSubmitArgument();
      }
    }
    
    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [isTimerRunning, timeRemaining, practiceMode, argument]);

  // Debug timer state
  useEffect(() => {
    console.log("Timer state:", { isTimerRunning, timeRemaining, practiceMode });
  }, [isTimerRunning, timeRemaining, practiceMode]);

  // Handle speech recognition transcript
  useEffect(() => {
    if (transcript) {
      // Append the new transcript to the current argument
      setArgument(prev => {
        const newValue = prev + (prev ? ' ' : '') + transcript;
        setUserArgument(newValue);
        return newValue;
      });
      // Reset transcript after adding it to prevent duplication
      resetTranscript();
    }
  }, [transcript, resetTranscript]);

  // Show interim transcript in real-time
  const displayValue = argument + (interimTranscript ? (argument ? ' ' : '') + interimTranscript : '');

  // Handle speech recognition toggle
  const handleToggleRecording = () => {
    if (!speechSupported) {
      alert('Speech recognition is not supported in your browser. Please use Chrome, Edge, or Safari.');
      return;
    }

    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };
  // Start practice session
  const handleStartPractice = () => {
    const topic = customTopic.trim() || selectedTopic;
    if (!topic) return;
    
    // Generate an opposing argument from AI (in a real app, this would call the AI API)
    // For MVP, we'll use a placeholder
    const placeholderAiArgument = position === 'for' ?
      `As someone arguing against the proposition that "${topic}," I believe there are several key points to consider...` :
      `As someone arguing in favor of the proposition that "${topic}," I believe there are several compelling reasons to support this view...`;
    
    setAiArgument(placeholderAiArgument);
    setPracticeMode('practice');
    setInitialTime(timeRemaining); // Store the initial time for progress calculation
    setIsTimerRunning(true); // Start the timer automatically
    console.log("Practice started - timer should be running with", timeRemaining, "seconds");
  };

  // Submit user argument and get feedback - Modified to accept optional aiArgumentOverride
  const handleSubmitArgument = async (aiArgumentOverride?: string) => {
    if (!argument.trim()) return;

    setIsTimerRunning(false);
    setIsGeneratingFeedback(true);

    try {
      setFeedbackError(null);
      const topic = customTopic.trim() || selectedTopic;
      const userPosition = position === 'for' ? 'supporting' : 'opposing';
      const aiPosition = position === 'for' ? 'opposing' : 'supporting';

      // Use the override if provided, otherwise use the current aiArgument state
      const currentAiArgument = aiArgumentOverride || aiArgument;

      if (!argument.trim() || !currentAiArgument.trim()) {
        throw new Error('Both your argument and AI response are required for feedback');
      }

      // Call the API endpoint to generate feedback
      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          topic,
          creatorArguments: argument.trim(),
          opponentArguments: currentAiArgument.trim(),
        }),
        credentials: 'include', // Important for auth cookies
      });

      const data = await response.json();

      if (!response.ok) {
        console.error('Feedback API error:', data);
        throw new Error(data.error || 'Failed to generate feedback');
      }
      
      // Validate feedback structure
      if (!data || typeof data !== 'object' || !('clarity' in data)) {
        throw new Error('Invalid feedback format received');
      }

      const feedbackResult = data;

      setFeedback(feedbackResult);
      setPracticeMode('feedback');

      // Save practice session to user history if authenticated
      if (user) {
        await supabase.from('practice_sessions').insert([
          {
            user_id: user.id,
            topic,
            user_position: position,
            user_argument: argument,
            ai_argument: currentAiArgument,
            feedback: feedbackResult
          }
        ]);
      }
    } catch (error) {
      console.error('Error generating feedback:', error);
      // Fallback feedback in case of error
      setFeedback({
        clarity: 7,
        logic: 6,
        persuasiveness: 7,
        weakSpots: ['Your argument could use more specific examples.'],
        suggestions: ['Consider addressing counterarguments more directly.'],
        summary: "You presented a reasonable argument with good structure, but there's room for improvement in terms of evidence and addressing counterarguments."
      });
      setPracticeMode('feedback');
    } finally {
      setIsGeneratingFeedback(false);
    }
  };

const [currentSegmentIndex, setCurrentSegmentIndex] = useState(0);



const currentSegment = selectedDebateFormat.structure[currentSegmentIndex].name;



 const handleGenerateAIArgument = async () => {
  if (!userArgument.trim()) {
    console.error('Error: userArgument is empty');
    alert('Please provide your argument before generating an AI response.');
    return;
  }

  setIsGeneratingFeedback(true);
  try {
    const topic = customTopic.trim() || selectedTopic;
    const stance = position === 'for' ? 'against' : 'for';

    const response = await fetch('/api/argument', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userArgument: userArgument.trim(),
        topic: topic,
        position: position, // 'for' or 'against'
        debateSegment: currentSegment // 
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to generate AI argument');
    }

    const data = await response.json();
    const newAiArgument = data.argument;  // Expected { argument: string }
    setAiArgument(newAiArgument);

    // Return the new AI argument so it can be used immediately if needed
    return newAiArgument;
  } catch (error) {
    console.error('Error generating AI argument:', error);
    const fallbackArgument = `Could not generate argument. Please try again later or enter one manually.`;
    setAiArgument(fallbackArgument);
    return fallbackArgument;
  } finally {
    setIsGeneratingFeedback(false);
  }
};

  // Modified submit handler that works with fresh AI argument
  const handleSubmitWithCurrentAI = async () => {
    // If we just generated an AI argument, we need to make sure we use the latest version
    // Since state updates are async, we'll pass the current aiArgument directly
    await handleSubmitArgument(aiArgument);
  };

  // Reset practice session
  const handleReset = () => {
    setPracticeMode('select');
    setArgument('');
    setUserArgument('');
    setAiArgument('');
    setTimeRemaining(180);
    setInitialTime(180);
    setIsTimerRunning(false);
    setTimerFinished(false);
    setFeedback(null);
    setFeedbackError(null);
    
    // Stop speech recognition if it's running
    if (isListening) {
      stopListening();
    }
    resetTranscript();
    
    console.log("Practice session reset");
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-12 flex justify-center items-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-8">Solo Practice</h1>
      
      {practiceMode === 'select' && (
        <div className="bg-white dark:bg-gray-800 rounded-lg p-8 shadow-md max-w-3xl mx-auto">
          <h2 className="text-2xl font-semibold mb-6">Start a Practice Session</h2>
          
          <div className="mb-6">
            <label className="block text-gray-700 dark:text-gray-300 mb-2">
              Select a Topic
            </label>
            <select
              value={selectedTopic}
              onChange={(e) => {
                setSelectedTopic(e.target.value);
                if (e.target.value) setCustomTopic('');
              }}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 mb-4"
            >
              <option value="">-- Select a topic --</option>
              {sampleDebateTopics.map((topic, index) => (
                <option key={index} value={topic}>{topic}</option>
              ))}
            </select>
            
            <div className="flex items-center">
              <span className="text-gray-700 dark:text-gray-300 mr-2">Or</span>
              <div className="flex-1">
                <input
                  type="text"
                  value={customTopic}
                  onChange={(e) => {
                    setCustomTopic(e.target.value);
                    if (e.target.value) setSelectedTopic('');
                  }}
                  placeholder="Enter your own topic"
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600"
                />
              </div>
            </div>
          </div>
          
          <div className="mb-6">
            <label className="block text-gray-700 dark:text-gray-300 mb-2">
              Choose Your Position
            </label>
            <div className="flex gap-4">
              <button
                onClick={() => setPosition('for')}
                className={`flex-1 py-3 px-4 rounded-lg border ${position === 'for' ? 'bg-blue-100 border-blue-500 dark:bg-blue-900/50 dark:border-blue-400' : 'border-gray-300 dark:border-gray-600'}`}
              >
                For
              </button>
              <button
                onClick={() => setPosition('against')}
                className={`flex-1 py-3 px-4 rounded-lg border ${position === 'against' ? 'bg-blue-100 border-blue-500 dark:bg-blue-900/50 dark:border-blue-400' : 'border-gray-300 dark:border-gray-600'}`}
              >
                Against
              </button>
            </div>
          </div>

          <div className="mb-8">
            <label className="block text-gray-700 dark:text-gray-300 mb-2">
              Time Limit
            </label>
            <div className="flex gap-4">
              <button
                onClick={() => {
                  setTimeRemaining(120);
                  setInitialTime(120);
                }}
                className={`flex-1 py-2 px-3 rounded-lg border text-sm ${timeRemaining === 120 ? 'bg-blue-100 border-blue-500 dark:bg-blue-900/50 dark:border-blue-400' : 'border-gray-300 dark:border-gray-600'}`}
              >
                2 min
              </button>
              <button
                onClick={() => {
                  setTimeRemaining(180);
                  setInitialTime(180);
                }}
                className={`flex-1 py-2 px-3 rounded-lg border text-sm ${timeRemaining === 180 ? 'bg-blue-100 border-blue-500 dark:bg-blue-900/50 dark:border-blue-400' : 'border-gray-300 dark:border-gray-600'}`}
              >
                3 min
              </button>
              <button
                onClick={() => {
                  setTimeRemaining(300);
                  setInitialTime(300);
                }}
                className={`flex-1 py-2 px-3 rounded-lg border text-sm ${timeRemaining === 300 ? 'bg-blue-100 border-blue-500 dark:bg-blue-900/50 dark:border-blue-400' : 'border-gray-300 dark:border-gray-600'}`}
              >
                5 min
              </button>
              <button
                onClick={() => {
                  setTimeRemaining(600);
                  setInitialTime(600);
                }}
                className={`flex-1 py-2 px-3 rounded-lg border text-sm ${timeRemaining === 600 ? 'bg-blue-100 border-blue-500 dark:bg-blue-900/50 dark:border-blue-400' : 'border-gray-300 dark:border-gray-600'}`}
              >
                10 min
              </button>
            </div>
          </div>
          
          <div className="flex justify-end">
            <button
              onClick={handleStartPractice}
              disabled={!selectedTopic && !customTopic.trim()}
              className={`px-6 py-3 rounded-lg text-white font-bold transition duration-200 ${selectedTopic || customTopic.trim() ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-400 cursor-not-allowed'}`}
            >
              Start Practice
            </button>
          </div>
        </div>
      )}
      
      {practiceMode === 'practice' && (
        <div>
          {/* Timer finished notification */}
          {timerFinished && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg animate-pulse">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
                    Time's Up!
                  </h3>
                  <div className="mt-1 text-sm text-red-700 dark:text-red-300">
                    Your practice time has ended. Submit your argument to get feedback.
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Speech recognition not supported notification */}
          {!speechSupported && (
            <div className="mb-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                    Speech Recognition Not Available
                  </h3>
                  <div className="mt-1 text-sm text-yellow-700 dark:text-yellow-300">
                    Voice recording is not supported in your browser. Please use Chrome, Edge, or Safari for the best experience.
                  </div>
                </div>
              </div>
            </div>
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* AI Argument */}
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-md">
            <h2 className="text-xl font-semibold mb-4">
              {position === 'for' ? 'Opposing' : 'Supporting'} Argument
            </h2>
            <div className="prose dark:prose-invert max-w-none mb-4">
              <p>{aiArgument}</p>
            </div>
          </div>
          
          {/* User Argument Editor */}
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">
                Your {position === 'for' ? 'Supporting' : 'Opposing'} Argument
              </h2>
              <div className="flex flex-col items-end gap-2">
                <div className="flex items-center gap-3">
                  <div className={`text-lg font-mono ${timeRemaining < 30 ? 'text-red-600 dark:text-red-400' : 'text-gray-700 dark:text-gray-300'}`}>
                    {formatTime(timeRemaining)}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setIsTimerRunning(!isTimerRunning);
                        console.log("Timer toggled:", !isTimerRunning);
                      }}
                      className={`px-3 py-1 text-sm rounded ${
                        isTimerRunning 
                          ? 'bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-300' 
                          : 'bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-300'
                      } transition duration-200`}
                    >
                      {isTimerRunning ? 'Pause' : 'Start'}
                    </button>
                    <button
                      onClick={() => {
                        setTimeRemaining(initialTime);
                        setIsTimerRunning(false);
                        console.log("Timer reset to", initialTime, "seconds");
                      }}
                      className="px-3 py-1 text-sm rounded bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600 transition duration-200"
                    >
                      Reset
                    </button>
                  </div>
                </div>
                {/* Timer progress bar */}
                <div className="w-48 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full transition-all duration-1000 ${
                      timeRemaining < 30 ? 'bg-red-500' : timeRemaining < 60 ? 'bg-yellow-500' : 'bg-green-500'
                    } ${isTimerRunning ? 'animate-pulse' : ''}`}
                    style={{ 
                      width: `${Math.max(0, (timeRemaining / initialTime) * 100)}%` 
                    }}
                  ></div>
                </div>
                {isTimerRunning && (
                  <div className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    Timer running
                  </div>
                )}
                {isListening && (
                  <div className="text-xs text-red-600 dark:text-red-400 flex items-center gap-1">
                    <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                    Recording...
                  </div>
                )}
                {speechError && (
                  <div className="text-xs text-orange-600 dark:text-orange-400">
                    Speech error: {speechError}
                  </div>
                )}
              </div>
            </div>
            
            <ArgumentEditor
              value={displayValue}
              onChange={(value) => {
                // Only update if it's not from speech recognition
                if (!isListening) {
                  setArgument(value);
                  setUserArgument(value);
                }
              }}
              onSubmit={handleSubmitWithCurrentAI}
              timeRemaining={timeRemaining}
              isRecording={isListening}
              onToggleRecording={handleToggleRecording}
              disabled={isGeneratingFeedback}
              onGenerateArgument={handleGenerateAIArgument}
              showAIButtons={true}
            />
            
            <div className="flex justify-between mt-4">
              <button
                onClick={handleReset}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition duration-200"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitWithCurrentAI}
                disabled={!argument.trim() || isGeneratingFeedback}
                className={`px-6 py-2 rounded-lg text-white font-bold transition duration-200 ${argument.trim() && !isGeneratingFeedback ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-400 cursor-not-allowed'}`}
              >
                {isGeneratingFeedback ? 'Generating Feedback...' : 'Submit & Get Feedback'}
              </button>
            </div>
          </div>
          </div>
        </div>
      )}
      
      {practiceMode === 'feedback' && feedback && (
        <div className="max-w-4xl mx-auto">
          <FeedbackModal
            feedback={feedback}
            onClose={handleReset}
            showClose={true}
          />
          
          <div className="mt-8 flex justify-center gap-4">
            <button
              onClick={handleReset}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition duration-200"
            >
              Practice Again
            </button>
            <Link
              href="/profile"
              className="px-6 py-3 border border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400 font-bold rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/30 transition duration-200"
            >
              View History
            </Link>
          </div>
        </div>
      )}
      
      {!user && practiceMode === 'select' && (
        <div className="mt-12 bg-blue-50 dark:bg-blue-900/30 rounded-lg p-6 shadow-md max-w-3xl mx-auto">
          <h3 className="text-xl font-semibold mb-3">Sign In to Track Your Progress</h3>
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            Create an account or sign in to save your practice sessions and track your improvement over time.
          </p>
          <Link
            href="/auth/signin?redirect=/practice"
            className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-lg transition duration-200"
          >
            Sign In / Sign Up
          </Link>
        </div>
      )}
    </div>
  );
}