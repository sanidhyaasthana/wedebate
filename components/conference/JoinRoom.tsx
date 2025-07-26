'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { cn } from '../../lib/utils';

interface JoinRoomFormData {
  roomName: string;
  participantName: string;
  role: 'moderator' | 'participant' | 'audience';
}

interface JoinRoomProps {
  onJoin: (data: JoinRoomFormData) => void;
  isLoading?: boolean;
  className?: string;
}

interface FormErrors {
  roomName?: string;
  participantName?: string;
  role?: string;
}

const JoinRoom: React.FC<JoinRoomProps> = ({
  onJoin,
  isLoading = false,
  className,
}) => {
  const [formData, setFormData] = useState<JoinRoomFormData>({
    roomName: '',
    participantName: '',
    role: 'participant',
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  // Validation rules
  const validateField = (name: keyof JoinRoomFormData, value: string): string | undefined => {
    switch (name) {
      case 'roomName':
        if (!value.trim()) {
          return 'Room name is required';
        }
        if (value.length < 3) {
          return 'Room name must be at least 3 characters';
        }
        if (value.length > 50) {
          return 'Room name must be less than 50 characters';
        }
        if (!/^[a-zA-Z0-9\s\-_]+$/.test(value)) {
          return 'Room name can only contain letters, numbers, spaces, hyphens, and underscores';
        }
        break;

      case 'participantName':
        if (!value.trim()) {
          return 'Your name is required';
        }
        if (value.length < 2) {
          return 'Name must be at least 2 characters';
        }
        if (value.length > 30) {
          return 'Name must be less than 30 characters';
        }
        if (!/^[a-zA-Z0-9\s\-_]+$/.test(value)) {
          return 'Name can only contain letters, numbers, spaces, hyphens, and underscores';
        }
        break;

      case 'role':
        if (!['moderator', 'participant', 'audience'].includes(value)) {
          return 'Please select a valid role';
        }
        break;

      default:
        break;
    }
    return undefined;
  };

  // Validate all fields
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};
    let isValid = true;

    (Object.keys(formData) as Array<keyof JoinRoomFormData>).forEach((key) => {
      const error = validateField(key, formData[key]);
      if (error) {
        newErrors[key] = error;
        isValid = false;
      }
    });

    setErrors(newErrors);
    return isValid;
  };

  // Handle input changes
  const handleInputChange = (name: keyof JoinRoomFormData, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }

    // Validate field if it has been touched
    if (touched[name]) {
      const error = validateField(name, value);
      setErrors(prev => ({ ...prev, [name]: error }));
    }
  };

  // Handle field blur
  const handleBlur = (name: keyof JoinRoomFormData) => {
    setTouched(prev => ({ ...prev, [name]: true }));
    const error = validateField(name, formData[name]);
    setErrors(prev => ({ ...prev, [name]: error }));
  };

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Mark all fields as touched
    setTouched({
      roomName: true,
      participantName: true,
      role: true,
    });

    if (validateForm()) {
      onJoin(formData);
    }
  };

  // Generate random room name
  const generateRoomName = () => {
    const adjectives = ['Quick', 'Smart', 'Cool', 'Fast', 'Bright', 'Swift', 'Bold', 'Clear'];
    const nouns = ['Meeting', 'Chat', 'Talk', 'Room', 'Space', 'Hub', 'Zone', 'Call'];
    const randomAdjective = adjectives[Math.floor(Math.random() * adjectives.length)];
    const randomNoun = nouns[Math.floor(Math.random() * nouns.length)];
    const randomNumber = Math.floor(Math.random() * 1000);
    
    const generatedName = `${randomAdjective}-${randomNoun}-${randomNumber}`;
    handleInputChange('roomName', generatedName);
  };

  return (
    <div className={cn('w-full max-w-md mx-auto', className)}>
      <div className="bg-white rounded-lg shadow-lg p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Join Video Conference
          </h1>
          <p className="text-gray-600">
            Enter your details to join or create a room
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Room Name */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label htmlFor="roomName" className="block text-sm font-medium text-gray-700">
                Room Name
              </label>
              <button
                type="button"
                onClick={generateRoomName}
                className="text-xs text-blue-600 hover:text-blue-800"
                disabled={isLoading}
              >
                Generate Random
              </button>
            </div>
            <Input
              id="roomName"
              type="text"
              value={formData.roomName}
              onChange={(e) => handleInputChange('roomName', e.target.value)}
              onBlur={() => handleBlur('roomName')}
              placeholder="Enter room name"
              error={touched.roomName ? errors.roomName : undefined}
              disabled={isLoading}
              className="w-full"
            />
            <p className="mt-1 text-xs text-gray-500">
              This will create a new room or join an existing one
            </p>
          </div>

          {/* Participant Name */}
          <div>
            <Input
              id="participantName"
              type="text"
              label="Your Name"
              value={formData.participantName}
              onChange={(e) => handleInputChange('participantName', e.target.value)}
              onBlur={() => handleBlur('participantName')}
              placeholder="Enter your name"
              error={touched.participantName ? errors.participantName : undefined}
              disabled={isLoading}
              className="w-full"
            />
          </div>

          {/* Role Selection */}
          <div>
            <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-2">
              Join as
            </label>
            <select
              id="role"
              value={formData.role}
              onChange={(e) => handleInputChange('role', e.target.value as JoinRoomFormData['role'])}
              onBlur={() => handleBlur('role')}
              disabled={isLoading}
              className={cn(
                'w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed',
                errors.role && touched.role && 'border-red-500 focus:ring-red-500'
              )}
            >
              <option value="participant">Participant</option>
              <option value="moderator">Moderator</option>
              <option value="audience">Audience (View Only)</option>
            </select>
            {touched.role && errors.role && (
              <p className="mt-1 text-sm text-red-600">{errors.role}</p>
            )}
            
            {/* Role descriptions */}
            <div className="mt-2 text-xs text-gray-500">
              {formData.role === 'moderator' && (
                <p>• Can control the meeting, mute participants, and manage chat</p>
              )}
              {formData.role === 'participant' && (
                <p>• Can share video/audio and participate in chat</p>
              )}
              {formData.role === 'audience' && (
                <p>• Can view and chat but cannot share video/audio</p>
              )}
            </div>
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            className="w-full"
            disabled={isLoading}
            loading={isLoading}
          >
            {isLoading ? 'Joining...' : 'Join Room'}
          </Button>
        </form>

        {/* Additional Info */}
        <div className="mt-6 text-center">
          <div className="text-xs text-gray-500 space-y-1">
            <p>• Rooms are created automatically when you join</p>
            <p>• Share the room name with others to invite them</p>
            <p>• Your camera and microphone will be requested upon joining</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default JoinRoom;