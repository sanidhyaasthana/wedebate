import { useState, useCallback } from 'react';
import { DebateFeedback } from '@/lib/openrouter';

interface DebateManagerProps {
  topic: string;
  position: 'for' | 'against';
  segment: 'opening' | 'rebuttal' | 'closing';
  onArgumentSubmit?: (argument: string) => void;
  onFeedbackReceived?: (feedback: DebateFeedback) => void;
  className?: string;
}

export default function DebateManager({
  topic,
  position,
  segment,
  onArgumentSubmit,
  onFeedbackReceived,
  className = ''
}: DebateManagerProps) {
  const [argument, setArgument] = useState('');
  const [aiArgument, setAiArgument] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateAIResponse = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/argument', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          topic,
          userArgument: argument,
          position: position === 'for' ? 'against' : 'for', // AI takes opposite position
          debateSegment: segment,
        }),
        credentials: 'include'
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to generate AI response');
      }

      const data = await response.json();
      setAiArgument(data.argument);
      return data.argument;
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to generate AI response');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [topic, argument, position, segment]);

  const getFeedback = useCallback(async (userArg: string, aiArg: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          topic,
          creatorArguments: userArg,
          opponentArguments: aiArg,
          isAIResponse: false,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to generate feedback');
      }

      const feedback = await response.json();
      onFeedbackReceived?.(feedback);
      return feedback;
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to generate feedback');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [topic, onFeedbackReceived]);

  const handleSubmit = useCallback(async () => {
    if (!argument.trim()) return;

    setIsLoading(true);
    setError(null);

    try {
      // First get AI's response
      const aiResponse = await generateAIResponse();
      if (!aiResponse) return;

      // Then get feedback
      await getFeedback(argument, aiResponse);
      
      // Notify parent
      onArgumentSubmit?.(argument);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Error in debate flow');
    } finally {
      setIsLoading(false);
    }
  }, [argument, generateAIResponse, getFeedback, onArgumentSubmit]);

  return (
    <div className={className}>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">
            Your {position === 'for' ? 'Supporting' : 'Opposing'} Argument ({segment})
          </label>
          <textarea
            value={argument}
            onChange={(e) => setArgument(e.target.value)}
            disabled={isLoading}
            className="w-full h-32 p-2 border rounded focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            placeholder="Enter your argument..."
          />
        </div>

        {aiArgument && (
          <div>
            <label className="block text-sm font-medium mb-2">
              AI's {position === 'for' ? 'Opposing' : 'Supporting'} Argument
            </label>
            <div className="w-full p-4 bg-gray-50 rounded">
              {aiArgument}
            </div>
          </div>
        )}

        {error && (
          <div className="text-red-500 text-sm">
            {error}
          </div>
        )}

        <div className="flex justify-end space-x-4">
          <button
            onClick={() => setArgument('')}
            disabled={isLoading || !argument}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 disabled:opacity-50"
          >
            Clear
          </button>
          <button
            onClick={handleSubmit}
            disabled={isLoading || !argument.trim()}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {isLoading ? 'Processing...' : 'Submit'}
          </button>
        </div>
      </div>
    </div>
  );
}
