'use client';

import React, { useState } from 'react';
import JoinRoom from '../../components/conference/JoinRoom';
import LiveKitRoomComponent from '../../components/conference/LiveKitRoomComponent';
import ErrorBoundary from '../../components/conference/ErrorBoundary';

interface JoinRoomFormData {
  roomName: string;
  participantName: string;
  role: 'moderator' | 'participant' | 'audience';
}

export default function ConferenceClient() {
  const [isJoined, setIsJoined] = useState(false);
  const [roomData, setRoomData] = useState<JoinRoomFormData | null>(null);
  const [isJoining, setIsJoining] = useState(false);

  const handleJoinRoom = async (data: JoinRoomFormData) => {
    setIsJoining(true);
    
    try {
      // Simulate a brief delay for better UX
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setRoomData(data);
      setIsJoined(true);
    } catch (error) {
      console.error('Failed to join room:', error);
    } finally {
      setIsJoining(false);
    }
  };

  const handleLeaveRoom = () => {
    setIsJoined(false);
    setRoomData(null);
    setIsJoining(false);
  };

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        {!isJoined ? (
          <div className="flex items-center justify-center min-h-screen p-4">
            <div className="w-full max-w-md">
              {/* Header */}
              <div className="text-center mb-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  WeDebate 
                </h1>
                <p className="text-gray-600">
                 Debate like real with Video Debating 
                </p>
              </div>

              {/* Join Form */}
              <JoinRoom
                onJoin={handleJoinRoom}
                isLoading={isJoining}
              />

              {/* Features */}
              <div className="mt-8 text-center">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Features
                </h3>
                <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                  <div className="flex items-center space-x-2">
                    <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span>HD Video & Audio</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span>Screen Sharing</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span>Real-time Chat</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span>Auto Reconnect</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span>Role-based Access</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span>Mobile Responsive</span>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="mt-8 text-center text-xs text-gray-500">
                <p>Powered by LiveKit • Built with Next.js</p>
                <p className="mt-1">
                  <a href="/" className="text-blue-600 hover:text-blue-800">
                    ← Back to Home
                  </a>
                </p>
              </div>
            </div>
          </div>
        ) : (
          roomData && (
            <LiveKitRoomComponent
              key={`${roomData.roomName}-${roomData.participantName}`}
              roomName={roomData.roomName}
              participantName={roomData.participantName}
              role={roomData.role}
              onLeave={handleLeaveRoom}
            />
          )
        )}
      </div>
    </ErrorBoundary>
  );
}