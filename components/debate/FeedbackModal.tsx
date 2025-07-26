'use client';

import { useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { DebateFeedback } from '@/lib/openrouter';

type FeedbackModalProps = {
  feedback: DebateFeedback | null;
  onClose: () => void;
  showClose?: boolean;
  error?: string | null;
};

const FeedbackModal = ({ feedback, onClose, showClose = true, error }: FeedbackModalProps) => {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscapeKey);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, [onClose]);

  if (error) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg max-w-lg w-full">
          <h2 className="text-xl font-bold text-red-600 mb-4">Error</h2>
          <p className="text-gray-700 dark:text-gray-300">{error}</p>
          <button
            onClick={onClose}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  if (!feedback) {
    return null;
  }

  // Helper function to get color based on score
  const getScoreColor = (score: number) => {
    if (score >= 8) return 'text-green-600 dark:text-green-400';
    if (score >= 6) return 'text-blue-600 dark:text-blue-400';
    if (score >= 4) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };
  
  // Helper function to get background color based on score
  const getScoreBgColor = (score: number) => {
    if (score >= 8) return 'bg-green-50 dark:bg-green-900/20';
    if (score >= 6) return 'bg-blue-50 dark:bg-blue-900/20';
    if (score >= 4) return 'bg-yellow-50 dark:bg-yellow-900/20';
    return 'bg-red-50 dark:bg-red-900/20';
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div 
        ref={modalRef}
        className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto"
      >
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold dark:text-white">Debate Feedback</h2>
            {showClose && (
              <button 
                onClick={onClose}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div> 

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className={`${getScoreBgColor(feedback.clarity)} p-4 rounded-lg text-center`}>
              <h3 className="text-lg font-medium mb-2 dark:text-white">Clarity</h3>
              <div className={`text-3xl font-bold ${getScoreColor(feedback.clarity)}`}>
                {feedback.clarity}/10
              </div>
              <div className="w-full bg-white/50 dark:bg-black/20 rounded-full h-2 mt-2">
                <div 
                  className={`h-2 rounded-full bg-current ${getScoreColor(feedback.clarity)}`} 
                  style={{ width: `${feedback.clarity * 10}%` }}
                ></div>
              </div>
            </div>
            <div className={`${getScoreBgColor(feedback.logic)} p-4 rounded-lg text-center`}>
              <h3 className="text-lg font-medium mb-2 dark:text-white">Logic</h3>
              <div className={`text-3xl font-bold ${getScoreColor(feedback.logic)}`}>
                {feedback.logic}/10
              </div>
              <div className="w-full bg-white/50 dark:bg-black/20 rounded-full h-2 mt-2">
                <div 
                  className={`h-2 rounded-full bg-current ${getScoreColor(feedback.logic)}`} 
                  style={{ width: `${feedback.logic * 10}%` }}
                ></div>
              </div>
            </div>
            <div className={`${getScoreBgColor(feedback.persuasiveness)} p-4 rounded-lg text-center`}>
              <h3 className="text-lg font-medium mb-2 dark:text-white">Persuasiveness</h3>
              <div className={`text-3xl font-bold ${getScoreColor(feedback.persuasiveness)}`}>
                {feedback.persuasiveness}/10
              </div>
              <div className="w-full bg-white/50 dark:bg-black/20 rounded-full h-2 mt-2">
                <div 
                  className={`h-2 rounded-full bg-current ${getScoreColor(feedback.persuasiveness)}`} 
                  style={{ width: `${feedback.persuasiveness * 10}%` }}
                ></div>
              </div>
            </div>
          </div>

          <div className="mb-6">
            <h3 className="text-xl font-semibold mb-3 dark:text-white">Summary</h3>
            <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
             <div className="prose dark:prose-invert max-w-none">
  <ReactMarkdown>
    {feedback.summary}
  </ReactMarkdown>
</div>
                {feedback.summary}
             
            </div>
          </div>

          <div className="mb-6">
            <h3 className="text-xl font-semibold mb-3 dark:text-white">Areas for Improvement</h3>
            <ul className="list-disc pl-5 space-y-2 bg-red-50 dark:bg-red-900/20 p-4 rounded-lg">
              {feedback.weakSpots.map((spot: string, index: number) => (
                <li key={index} className="text-gray-700 dark:text-gray-300">{spot}</li>
              ))}
            </ul>
          </div>

          <div className="mb-6">
            <h3 className="text-xl font-semibold mb-3 dark:text-white">Suggestions to Improve</h3>
            <ul className="list-disc pl-5 space-y-2 bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
              {feedback.suggestions.map((suggestion: string, index: number) => (
                <li key={index} className="text-gray-700 dark:text-gray-300">{suggestion}</li>
              ))}
            </ul>
          </div>

          {showClose && (
            <div className="mt-8 text-center">
              <button
                onClick={onClose}
                className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-2 rounded-lg transition-colors"
              >
                Close Feedback
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FeedbackModal;