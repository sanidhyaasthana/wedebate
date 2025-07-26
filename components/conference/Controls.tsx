'use client';

import React, { useState, useEffect } from 'react';
import { Room, LocalParticipant } from 'livekit-client';
import { Button } from '@/components/ui/Button';
import { cn } from '../../lib/utils';

interface ControlsProps {
  room: Room | null;
  localParticipant: LocalParticipant | null;
  onLeave?: () => void;
  className?: string;
  role?: 'moderator' | 'participant' | 'audience';
}

const Controls: React.FC<ControlsProps> = ({
  room,
  localParticipant,
  onLeave,
  className,
  role = 'participant',
}) => {
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [availableDevices, setAvailableDevices] = useState<{
    cameras: MediaDeviceInfo[];
    microphones: MediaDeviceInfo[];
    speakers: MediaDeviceInfo[];
  }>({
    cameras: [],
    microphones: [],
    speakers: [],
  });
  const [showDeviceMenu, setShowDeviceMenu] = useState(false);

  // Update media states when participant changes
  useEffect(() => {
    if (!localParticipant) return;

    const updateMediaStates = () => {
      const videoTrack = localParticipant.videoTrackPublications.get('camera');
      const audioTrack = localParticipant.audioTrackPublications.get('microphone');
      const screenTrack = localParticipant.videoTrackPublications.get('screen_share');

      setIsVideoEnabled(videoTrack ? !videoTrack.isMuted : false);
      setIsAudioEnabled(audioTrack ? !audioTrack.isMuted : false);
      setIsScreenSharing(!!screenTrack && !screenTrack.isMuted);
    };

    // Initial state
    updateMediaStates();

    // Listen for track changes
    localParticipant.on('trackMuted', updateMediaStates);
    localParticipant.on('trackUnmuted', updateMediaStates);
    localParticipant.on('trackPublished', updateMediaStates);
    localParticipant.on('trackUnpublished', updateMediaStates);

    return () => {
      localParticipant.off('trackMuted', updateMediaStates);
      localParticipant.off('trackUnmuted', updateMediaStates);
      localParticipant.off('trackPublished', updateMediaStates);
      localParticipant.off('trackUnpublished', updateMediaStates);
    };
  }, [localParticipant]);

  // Get available media devices
  useEffect(() => {
    const getDevices = async () => {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        setAvailableDevices({
          cameras: devices.filter(d => d.kind === 'videoinput'),
          microphones: devices.filter(d => d.kind === 'audioinput'),
          speakers: devices.filter(d => d.kind === 'audiooutput'),
        });
      } catch (error) {
        console.error('Failed to enumerate devices:', error);
      }
    };

    getDevices();
    navigator.mediaDevices.addEventListener('devicechange', getDevices);

    return () => {
      navigator.mediaDevices.removeEventListener('devicechange', getDevices);
    };
  }, []);

  const toggleVideo = async () => {
    if (!localParticipant || role === 'audience') return;

    setIsLoading(true);
    try {
      if (isVideoEnabled) {
        await localParticipant.setCameraEnabled(false);
      } else {
        await localParticipant.setCameraEnabled(true);
      }
    } catch (error) {
      console.error('Failed to toggle video:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleAudio = async () => {
    if (!localParticipant || role === 'audience') return;

    setIsLoading(true);
    try {
      if (isAudioEnabled) {
        await localParticipant.setMicrophoneEnabled(false);
      } else {
        await localParticipant.setMicrophoneEnabled(true);
      }
    } catch (error) {
      console.error('Failed to toggle audio:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleScreenShare = async () => {
    if (!localParticipant || role === 'audience') return;

    setIsLoading(true);
    try {
      if (isScreenSharing) {
        await localParticipant.setScreenShareEnabled(false);
      } else {
        await localParticipant.setScreenShareEnabled(true);
      }
    } catch (error) {
      console.error('Failed to toggle screen share:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const switchCamera = async (deviceId: string) => {
    if (!localParticipant) return;
    
    setIsLoading(true);
    try {
      // For now, we'll just close the menu
      // Device switching can be implemented with more complex logic
      setShowDeviceMenu(false);
      console.log('Camera switch requested:', deviceId);
    } catch (error) {
      console.error('Failed to switch camera:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const switchMicrophone = async (deviceId: string) => {
    if (!localParticipant) return;

    setIsLoading(true);
    try {
      // For now, we'll just close the menu
      // Device switching can be implemented with more complex logic
      setShowDeviceMenu(false);
      console.log('Microphone switch requested:', deviceId);
    } catch (error) {
      console.error('Failed to switch microphone:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={cn('flex items-center justify-center space-x-4 p-4 bg-gray-900 rounded-lg', className)}>
      {/* Audio Control */}
      {role !== 'audience' && (
        <Button
          variant={isAudioEnabled ? 'secondary' : 'destructive'}
          size="icon"
          onClick={toggleAudio}
          disabled={isLoading}
          className="relative"
          title={isAudioEnabled ? 'Mute microphone' : 'Unmute microphone'}
        >
          {isAudioEnabled ? (
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clipRule="evenodd" />
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM15.657 6.343a1 1 0 011.414 0L18.485 7.757a1 1 0 010 1.414L17.071 10.585a1 1 0 11-1.414-1.414L16.242 8.586l-.585-.585a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          )}
        </Button>
      )}

      {/* Video Control */}
      {role !== 'audience' && (
        <Button
          variant={isVideoEnabled ? 'secondary' : 'destructive'}
          size="icon"
          onClick={toggleVideo}
          disabled={isLoading}
          title={isVideoEnabled ? 'Turn off camera' : 'Turn on camera'}
        >
          {isVideoEnabled ? (
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z" clipRule="evenodd" />
            </svg>
          )}
        </Button>
      )}

      {/* Screen Share Control */}
      {role !== 'audience' && (
        <Button
          variant={isScreenSharing ? 'default' : 'secondary'}
          size="icon"
          onClick={toggleScreenShare}
          disabled={isLoading}
          title={isScreenSharing ? 'Stop screen share' : 'Share screen'}
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 011 1v8a1 1 0 01-1 1h-5v2h3a1 1 0 110 2H6a1 1 0 110-2h3v-2H4a1 1 0 01-1-1V4zm1 1v6h12V5H4z" clipRule="evenodd" />
          </svg>
        </Button>
      )}

      {/* Device Settings */}
      {role !== 'audience' && (
        <div className="relative">
          <Button
            variant="secondary"
            size="icon"
            onClick={() => setShowDeviceMenu(!showDeviceMenu)}
            title="Device settings"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
            </svg>
          </Button>

          {showDeviceMenu && (
            <div className="absolute bottom-full mb-2 left-0 bg-white rounded-lg shadow-lg border p-4 min-w-64 z-50">
              <div className="space-y-4">
                {/* Camera Selection */}
                {availableDevices.cameras.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Camera</h4>
                    <div className="space-y-1">
                      {availableDevices.cameras.map((device) => (
                        <button
                          key={device.deviceId}
                          onClick={() => switchCamera(device.deviceId)}
                          className="w-full text-left px-2 py-1 text-sm hover:bg-gray-100 rounded"
                          disabled={isLoading}
                        >
                          {device.label || `Camera ${device.deviceId.slice(0, 8)}`}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Microphone Selection */}
                {availableDevices.microphones.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Microphone</h4>
                    <div className="space-y-1">
                      {availableDevices.microphones.map((device) => (
                        <button
                          key={device.deviceId}
                          onClick={() => switchMicrophone(device.deviceId)}
                          className="w-full text-left px-2 py-1 text-sm hover:bg-gray-100 rounded"
                          disabled={isLoading}
                        >
                          {device.label || `Microphone ${device.deviceId.slice(0, 8)}`}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Leave Button */}
      <Button
        variant="destructive"
        onClick={onLeave}
        disabled={isLoading}
        className="ml-4"
      >
        Leave
      </Button>
    </div>
  );
};

export default Controls;