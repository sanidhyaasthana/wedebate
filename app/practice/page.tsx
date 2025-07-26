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
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [feedback, setFeedback] = useState<any>(null);
  const [isGeneratingFeedback, setIsGeneratingFeedback] = useState(false);
  const [userArgument, setUserArgument] = useState('');
  const [aiResponse, setAiResponse] = useState<string | null>(null);
  const [feedbackError, setFeedbackError] = useState<string | null>(null);

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
        setTimeRemaining((prev) => prev - 1);
      }, 1000);
    } else if (timeRemaining === 0) {
      setIsTimerRunning(false);
      // Auto-submit when time runs out
      if (practiceMode === 'practice' && argument.trim()) {
        handleSubmitArgument();
      }
    }
    
    return () => clearInterval(interval);
  }, 
  
  
  
  [isTimerRunning, timeRemaining, practiceMode, argument]);
  useEffect(() => {
  console.log("Timer:", { isTimerRunning, timeRemaining });
}, [isTimerRunning, timeRemaining]);


  useEffect(() => {
  console.log("Timer:", { isTimerRunning, timeRemaining });
}, [isTimerRunning, timeRemaining]);
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
    setTimeRemaining(180); // Reset timer to 3 minutes
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
    setAiArgument('');
    setTimeRemaining(180);
    setIsTimerRunning(false);
    setFeedback(null);
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
          
          <div className="mb-8">
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
              <div className={`text-lg font-mono ${timeRemaining < 30 ? 'text-red-600 dark:text-red-400' : 'text-gray-700 dark:text-gray-300'}`}>
                {formatTime(timeRemaining)}
              </div>
            </div>
            
            <ArgumentEditor
              value={argument}
              onChange={(value) => {
                setArgument(value);
                setUserArgument(value);
              }}
              onSubmit={handleSubmitWithCurrentAI}
              timeRemaining={timeRemaining}
              isRecording={false} // Not using speech recognition in practice mode
              onToggleRecording={() => {}} // Placeholder function
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