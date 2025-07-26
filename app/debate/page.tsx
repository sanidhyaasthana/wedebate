'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import LiveKitRoomComponent from '../../components/conference/LiveKitRoomComponent';

export default function DebatePage() {
  const router = useRouter();
  const [showJoinForm, setShowJoinForm] = useState(true);
  const [roomName, setRoomName] = useState('');
  const [participantName, setParticipantName] = useState('');
  const [role, setRole] = useState<'moderator' | 'debater' | 'audience'>('debater');
  const [topic, setTopic] = useState('');

  const handleJoinRoom = () => {
    if (!roomName.trim() || !participantName.trim()) {
      alert('Please fill in all required fields');
      return;
    }
    setShowJoinForm(false);
  };

  const handleLeaveRoom = () => {
    setShowJoinForm(true);
    setRoomName('');
    setParticipantName('');
    setTopic('');
  };

  if (showJoinForm) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-md p-8 w-full max-w-md">
          <h1 className="text-2xl font-bold text-center mb-6">Join Debate Room</h1>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Room Name *</label>
              <input
                type="text"
                value={roomName}
                onChange={(e) => setRoomName(e.target.value)}
                placeholder="Enter room name"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Your Name *</label>
              <input
                type="text"
                value={participantName}
                onChange={(e) => setParticipantName(e.target.value)}
                placeholder="Enter your name"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as 'moderator' | 'debater' | 'audience')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="debater">Debater</option>
                <option value="moderator">Moderator</option>
                <option value="audience">Audience</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Debate Topic (Optional)</label>
              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="Enter debate topic"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <button
              onClick={handleJoinRoom}
              className="w-full bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 transition-colors"
            >
              Join Room
            </button>
          </div>

          <div className="mt-6 text-center">
            <button
              onClick={() => router.push('/')}
              className="text-gray-500 hover:text-gray-700 text-sm"
            >
              ← Back to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <LiveKitRoomComponent
      roomName={roomName}
      participantName={participantName}
      role={role === 'debater' ? 'participant' : role}
      onLeave={handleLeaveRoom}
    />
  );
}
