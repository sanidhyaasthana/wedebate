'use client';

import { useState } from 'react';
import { formatTime, getTimeColor } from '@/utils/timeUtils';

type ArgumentEditorProps = {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  isRecording: boolean;
  onToggleRecording: () => void;
  timeRemaining: number;
  disabled?: boolean;
  onGenerateArgument?: () => void; // New prop for generating AI argument
  onGenerateFeedback?: () => void; // New prop for generating AI feedback
  showAIButtons?: boolean; // New prop to conditionally show AI buttons
};

const ArgumentEditor = ({
  value,
  onChange,
  onSubmit,
  isRecording,
  onToggleRecording,
  timeRemaining,
  disabled = false,
  onGenerateArgument,
  onGenerateFeedback,
  showAIButtons = false,
}: ArgumentEditorProps) => {
  const [charCount, setCharCount] = useState<number>(0);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    onChange(newValue);
    setCharCount(newValue.length);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (value.trim() !== '') {
      onSubmit();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex justify-between items-center mb-2">
        <div className="text-sm text-gray-600">
          {charCount} characters
        </div>
        <div className={`text-sm font-medium ${getTimeColor(timeRemaining, 180)}`}>
          Time remaining: {formatTime(timeRemaining)}
        </div>
      </div>

      <div className="relative">
        <textarea
          value={value}
          onChange={handleChange}
          placeholder="Write your argument here..."
          className={`w-full h-40 p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none ${
            isRecording 
              ? 'border-red-300 bg-red-50 dark:bg-red-900/10 dark:border-red-600' 
              : 'border-gray-300 dark:border-gray-600 dark:bg-gray-700'
          }`}
          disabled={disabled}
        />
        {isRecording && (
          <div className="absolute top-2 right-2 flex items-center gap-2 bg-red-100 dark:bg-red-900/30 px-2 py-1 rounded text-xs text-red-700 dark:text-red-300">
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
            Recording
          </div>
        )}
      </div>

      <div className="flex justify-between items-center">
        <button
          type="button"
          onClick={onToggleRecording}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${isRecording
            ? 'bg-red-500 hover:bg-red-600 text-white'
            : 'bg-gray-200 hover:bg-gray-300 text-gray-800'
            }`}
          disabled={disabled}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z"
              clipRule="evenodd"
            />
          </svg>
          {isRecording ? 'Stop Recording' : 'Start Recording'}
        </button>

        {showAIButtons && (
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onGenerateArgument}
              className="bg-green-600 hover:bg-green-700 text-white font-medium px-4 py-2 rounded-lg transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
              disabled={disabled}
            >
              Generate AI Argument
            </button>
            <button
              type="button"
              onClick={onGenerateFeedback}
              className="bg-purple-600 hover:bg-purple-700 text-white font-medium px-4 py-2 rounded-lg transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
              disabled={disabled}
            >
              Generate AI Feedback
            </button>
          </div>
        )}

        <button
          type="submit"
          className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-2 rounded-lg transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
          disabled={disabled || value.trim() === ''}
        >
          Submit Argument
        </button>
      </div>
    </form>
  );
};

export default ArgumentEditor;