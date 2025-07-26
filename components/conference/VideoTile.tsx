'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Participant, Track, RemoteTrack, LocalTrack, ConnectionQuality } from 'livekit-client';
import { cn } from '../../lib/utils';

interface VideoTileProps {
  participant: Participant;
  isLocal?: boolean;
  className?: string;
  showName?: boolean;
  showConnectionQuality?: boolean;
  muted?: boolean;
}

const VideoTile: React.FC<VideoTileProps> = ({
  participant,
  isLocal = false,
  className,
  showName = true,
  showConnectionQuality = true,
  muted = false,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const [videoTrack, setVideoTrack] = useState<Track | null>(null);
  const [audioTrack, setAudioTrack] = useState<Track | null>(null);
  const [isVideoEnabled, setIsVideoEnabled] = useState(false);
  const [isAudioEnabled, setIsAudioEnabled] = useState(false);
  const [connectionQuality, setConnectionQuality] = useState<ConnectionQuality>(ConnectionQuality.Unknown);
  const [isSpeaking, setIsSpeaking] = useState(false);

  // Track video track changes
  useEffect(() => {
    const updateVideoTrack = () => {
      const videoPublication = Array.from(participant.videoTrackPublications.values()).find(
        (pub) => pub.track && pub.track.source === Track.Source.Camera
      );
      
      if (videoPublication?.track) {
        setVideoTrack(videoPublication.track);
        setIsVideoEnabled(!videoPublication.isMuted);
      } else {
        setVideoTrack(null);
        setIsVideoEnabled(false);
      }
    };

    const updateAudioTrack = () => {
      const audioPublication = Array.from(participant.audioTrackPublications.values()).find(
        (pub) => pub.track && pub.track.source === Track.Source.Microphone
      );
      
      if (audioPublication?.track) {
        setAudioTrack(audioPublication.track);
        setIsAudioEnabled(!audioPublication.isMuted);
      } else {
        setAudioTrack(null);
        setIsAudioEnabled(false);
      }
    };

    // Initial setup
    updateVideoTrack();
    updateAudioTrack();

    // Listen for track changes
    participant.on('trackPublished', updateVideoTrack);
    participant.on('trackUnpublished', updateVideoTrack);
    participant.on('trackMuted', updateVideoTrack);
    participant.on('trackUnmuted', updateVideoTrack);
    participant.on('trackPublished', updateAudioTrack);
    participant.on('trackUnpublished', updateAudioTrack);
    participant.on('trackMuted', updateAudioTrack);
    participant.on('trackUnmuted', updateAudioTrack);

    // Listen for speaking changes
    participant.on('isSpeakingChanged', setIsSpeaking);

    // Listen for connection quality changes
    participant.on('connectionQualityChanged', setConnectionQuality);

    return () => {
      participant.off('trackPublished', updateVideoTrack);
      participant.off('trackUnpublished', updateVideoTrack);
      participant.off('trackMuted', updateVideoTrack);
      participant.off('trackUnmuted', updateVideoTrack);
      participant.off('trackPublished', updateAudioTrack);
      participant.off('trackUnpublished', updateAudioTrack);
      participant.off('trackMuted', updateAudioTrack);
      participant.off('trackUnmuted', updateAudioTrack);
      participant.off('isSpeakingChanged', setIsSpeaking);
      participant.off('connectionQualityChanged', setConnectionQuality);
    };
  }, [participant]);

  // Attach video track to video element
  useEffect(() => {
    if (videoTrack && videoRef.current) {
      videoTrack.attach(videoRef.current);
      return () => {
        videoTrack.detach();
      };
    }
  }, [videoTrack]);

  // Attach audio track to audio element (for remote participants only)
  useEffect(() => {
    if (audioTrack && audioRef.current && !isLocal) {
      audioTrack.attach(audioRef.current);
      return () => {
        audioTrack.detach();
      };
    }
  }, [audioTrack, isLocal]);

  const getConnectionQualityIcon = (quality: ConnectionQuality) => {
    switch (quality) {
      case ConnectionQuality.Excellent:
        return '📶';
      case ConnectionQuality.Good:
        return '📶';
      case ConnectionQuality.Poor:
        return '📶';
      default:
        return '❓';
    }
  };

  const getConnectionQualityColor = (quality: ConnectionQuality) => {
    switch (quality) {
      case ConnectionQuality.Excellent:
        return 'text-green-500';
      case ConnectionQuality.Good:
        return 'text-yellow-500';
      case ConnectionQuality.Poor:
        return 'text-red-500';
      default:
        return 'text-gray-500';
    }
  };

  return (
    <div
      className={cn(
        'relative bg-gray-900 rounded-lg overflow-hidden aspect-video',
        isSpeaking && 'ring-2 ring-blue-500',
        className
      )}
    >
      {/* Video Element */}
      {isVideoEnabled && videoTrack ? (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted={isLocal || muted}
          className="w-full h-full object-cover"
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-gray-800">
          <div className="text-center">
            <div className="w-16 h-16 bg-gray-600 rounded-full flex items-center justify-center mx-auto mb-2">
              <span className="text-2xl text-white">
                {participant.identity.charAt(0).toUpperCase()}
              </span>
            </div>
            <p className="text-white text-sm">Camera Off</p>
          </div>
        </div>
      )}

      {/* Audio Element (for remote participants) */}
      {!isLocal && (
        <audio
          ref={audioRef}
          autoPlay
          playsInline
          className="hidden"
        />
      )}

      {/* Overlay Information */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Top-left: Connection Quality */}
        {showConnectionQuality && (
          <div className="absolute top-2 left-2">
            <span
              className={cn(
                'text-sm',
                getConnectionQualityColor(connectionQuality)
              )}
              title={`Connection: ${connectionQuality}`}
            >
              {getConnectionQualityIcon(connectionQuality)}
            </span>
          </div>
        )}

        {/* Top-right: Audio/Video Status */}
        <div className="absolute top-2 right-2 flex space-x-1">
          {!isAudioEnabled && (
            <div className="bg-red-500 text-white p-1 rounded text-xs">
              🎤
            </div>
          )}
          {!isVideoEnabled && (
            <div className="bg-red-500 text-white p-1 rounded text-xs">
              📹
            </div>
          )}
        </div>

        {/* Bottom: Participant Name */}
        {showName && (
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3">
            <div className="flex items-center justify-between">
              <span className="text-white text-sm font-medium truncate">
                {participant.identity}
                {isLocal && ' (You)'}
              </span>
              {isSpeaking && (
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-green-400 text-xs">Speaking</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VideoTile;