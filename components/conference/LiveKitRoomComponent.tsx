'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { ConnectionState, Participant } from 'livekit-client';
import { getConnectionManager, getAccessToken, ConnectionConfig } from '@/utils/livekitClient';
import VideoTile from './VideoTile';
import Controls from './Controls';
import ChatComponent from './ChatComponent';
import ErrorBoundary, { useErrorHandler } from './ErrorBoundary';
import { cn } from '../../lib/utils';

interface LiveKitRoomComponentProps {
  roomName: string;
  participantName: string;
  role: 'moderator' | 'participant' | 'audience';
  onLeave?: () => void;
  className?: string;
}

const LiveKitRoomComponent: React.FC<LiveKitRoomComponentProps> = ({
  roomName,
  participantName,
  role,
  onLeave,
  className,
}) => {
  const [connectionState, setConnectionState] = useState<ConnectionState>(ConnectionState.Disconnected);
  const [participants, setParticipants] = useState<Map<string, Participant>>(new Map());
  const [error, setError] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [showChat, setShowChat] = useState(true);
  const [connectionQuality, setConnectionQuality] = useState<string>('Unknown');
  
  const connectionManager = getConnectionManager();
  const handleError = useErrorHandler();

  // Connect to room
  const connectToRoom = useCallback(async () => {
    if (isConnecting) return;
    
    setIsConnecting(true);
    setError(null);

    try {
      // Get access token
      const { token, url } = await getAccessToken(roomName, participantName, role);

      // Prepare connection config
      const config: ConnectionConfig = {
        url,
        token,
        roomName,
        participantName,
        role,
      };

      // Connect using connection manager
      await connectionManager.connect(config);
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to connect to room';
      setError(errorMessage);
      handleError(err instanceof Error ? err : new Error(errorMessage));
    } finally {
      setIsConnecting(false);
    }
  }, [roomName, participantName, role, isConnecting, handleError]);

  // Disconnect from room
  const disconnectFromRoom = useCallback(async () => {
    try {
      await connectionManager.disconnect();
      onLeave?.();
    } catch (err) {
      console.error('Error disconnecting:', err);
      handleError(err instanceof Error ? err : new Error('Disconnect failed'));
    }
  }, [onLeave, handleError]);

  // Set up connection manager listeners
  useEffect(() => {
    const handleStateChange = (state: ConnectionState) => {
      setConnectionState(state);
      
      // Update connection quality based on state
      switch (state) {
        case ConnectionState.Connected:
          setConnectionQuality('Good');
          break;
        case ConnectionState.Reconnecting:
          setConnectionQuality('Reconnecting');
          break;
        case ConnectionState.Disconnected:
          setConnectionQuality('Disconnected');
          break;
        default:
          setConnectionQuality('Unknown');
      }
    };

    const handleParticipantChange = (newParticipants: Map<string, Participant>) => {
      setParticipants(new Map(newParticipants));
    };

    const handleConnectionError = (error: Error) => {
      setError(error.message);
      handleError(error);
    };

    // Register listeners
    connectionManager.onStateChange(handleStateChange);
    connectionManager.onParticipantChange(handleParticipantChange);
    connectionManager.onError(handleConnectionError);

    // Initial connection
    connectToRoom();

    // Cleanup on unmount
    return () => {
      connectionManager.cleanup();
    };
  }, [connectToRoom, handleError]);

  // Handle retry connection
  const handleRetry = useCallback(() => {
    setError(null);
    connectToRoom();
  }, [connectToRoom]);

  // Get participant arrays
  const participantArray = Array.from(participants.values());
  const localParticipant = participantArray.find(p => p.sid === connectionManager.room?.localParticipant?.sid);
  const remoteParticipants = participantArray.filter(p => p.sid !== connectionManager.room?.localParticipant?.sid);

  // Loading state
  if (isConnecting || connectionState === ConnectionState.Connecting) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center text-white">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold mb-2">Connecting to room...</h2>
          <p className="text-gray-300">Please wait while we connect you to "{roomName}"</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error && connectionState === ConnectionState.Disconnected) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center text-white max-w-md">
          <div className="bg-red-600 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold mb-2">Connection Failed</h2>
          <p className="text-gray-300 mb-6">{error}</p>
          <div className="space-y-3">
            <button
              onClick={handleRetry}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Try Again
            </button>
            <button
              onClick={onLeave}
              className="w-full bg-gray-600 text-white py-2 px-4 rounded-lg hover:bg-gray-700 transition-colors"
            >
              Back to Join Form
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Reconnecting state
  if (connectionState === ConnectionState.Reconnecting) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center text-white">
          <div className="animate-pulse rounded-full h-12 w-12 bg-yellow-500 mx-auto mb-4 flex items-center justify-center">
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold mb-2">Reconnecting...</h2>
          <p className="text-gray-300">Connection lost. Attempting to reconnect...</p>
        </div>
      </div>
    );
  }

  // Main room interface
  return (
    <div className={cn('h-screen bg-gray-900 flex flex-col', className)}>
      {/* Header */}
      <div className="bg-gray-800 text-white p-4 flex justify-between items-center">
        <div>
          <h1 className="text-lg font-semibold">{roomName}</h1>
          <div className="flex items-center space-x-4 text-sm text-gray-300">
            <span>{participants.size} participants</span>
            <span className="flex items-center">
              <div className={cn(
                'w-2 h-2 rounded-full mr-2',
                connectionState === ConnectionState.Connected ? 'bg-green-500' : 'bg-red-500'
              )}></div>
              {connectionQuality}
            </span>
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <button
            onClick={() => setShowChat(!showChat)}
            className="p-2 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors"
            title={showChat ? 'Hide chat' : 'Show chat'}
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
            </svg>
          </button>
          <span className="text-sm text-gray-300">
            {participantName} ({role})
          </span>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Video Area */}
        <div className="flex-1 p-4">
          <div className={cn(
            'grid gap-4 h-full',
            participants.size <= 1 && 'grid-cols-1',
            participants.size === 2 && 'grid-cols-2',
            participants.size <= 4 && participants.size > 2 && 'grid-cols-2 grid-rows-2',
            participants.size > 4 && 'grid-cols-3 grid-rows-2'
          )}>
            {/* Local Participant */}
            {localParticipant && (
              <VideoTile
                key={localParticipant.sid}
                participant={localParticipant}
                isLocal={true}
                className="bg-gray-800 rounded-lg"
              />
            )}

            {/* Remote Participants */}
            {remoteParticipants.map((participant) => (
              <VideoTile
                key={participant.sid}
                participant={participant}
                isLocal={false}
                className="bg-gray-800 rounded-lg"
              />
            ))}

            {/* Empty slots for better layout */}
            {participants.size < 6 && Array.from({ length: Math.max(0, 6 - participants.size) }).map((_, index) => (
              <div
                key={`empty-${index}`}
                className="bg-gray-800 rounded-lg flex items-center justify-center"
              >
                <div className="text-gray-500 text-center">
                  <div className="w-12 h-12 bg-gray-700 rounded-full mx-auto mb-2 flex items-center justify-center">
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <p className="text-sm">Waiting for participant...</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Chat Sidebar */}
        {showChat && (
          <div className="w-80 border-l border-gray-700">
            <ChatComponent
              room={connectionManager.room}
              participantName={participantName}
              role={role}
              className="h-full"
            />
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="p-4 bg-gray-800">
        <Controls
          room={connectionManager.room}
          localParticipant={connectionManager.room?.localParticipant || null}
          onLeave={disconnectFromRoom}
          role={role}
        />
      </div>
    </div>
  );
};

// Wrap with ErrorBoundary
const LiveKitRoomComponentWithErrorBoundary: React.FC<LiveKitRoomComponentProps> = (props) => {
  return (
    <ErrorBoundary>
      <LiveKitRoomComponent {...props} />
    </ErrorBoundary>
  );
};

export default LiveKitRoomComponentWithErrorBoundary;