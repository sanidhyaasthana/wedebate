'use client';

import {
  Room,
  RoomEvent,
  Track,
  RoomOptions,
  ConnectionState,
  DisconnectReason,
  RemoteParticipant,
  LocalParticipant,
  Participant,
  RemoteTrack,
  RemoteTrackPublication,
  DataPacket_Kind,
} from 'livekit-client';

export interface ConnectionConfig {
  url: string;
  token: string;
  roomName: string;
  participantName: string;
  role: 'moderator' | 'participant' | 'audience';
}

export interface ConnectionManager {
  room: Room | null;
  connect: (config: ConnectionConfig) => Promise<void>;
  disconnect: () => Promise<void>;
  reconnect: () => Promise<void>;
  isConnected: boolean;
  connectionState: ConnectionState;
  participants: Map<string, Participant>;
  onStateChange: (callback: (state: ConnectionState) => void) => void;
  onParticipantChange: (callback: (participants: Map<string, Participant>) => void) => void;
  onError: (callback: (error: Error) => void) => void;
}

class LiveKitConnectionManager implements ConnectionManager {
  public room: Room | null = null;
  public isConnected: boolean = false;
  public connectionState: ConnectionState = ConnectionState.Disconnected;
  public participants: Map<string, Participant> = new Map();

  private config: ConnectionConfig | null = null;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;
  private reconnectDelay: number = 1000; // Start with 1 second
  private maxReconnectDelay: number = 30000; // Max 30 seconds
  private reconnectTimer: NodeJS.Timeout | null = null;
  private stateChangeCallbacks: ((state: ConnectionState) => void)[] = [];
  private participantChangeCallbacks: ((participants: Map<string, Participant>) => void)[] = [];
  private errorCallbacks: ((error: Error) => void)[] = [];

  constructor() {
    this.setupRoom();
  }

  private setupRoom(): void {
    const options: RoomOptions = {
      adaptiveStream: true,
      dynacast: true,
      videoCaptureDefaults: {
        resolution: {
          width: 1280,
          height: 720,
        },
        facingMode: 'user',
      },
      audioCaptureDefaults: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      },
    };

    this.room = new Room(options);
    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    if (!this.room) return;

    this.room.on(RoomEvent.Connected, () => {
      console.log('✅ Connected to LiveKit room');
      this.isConnected = true;
      this.connectionState = ConnectionState.Connected;
      this.reconnectAttempts = 0;
      this.updateParticipants();
      this.notifyStateChange(ConnectionState.Connected);
    });

    this.room.on(RoomEvent.Disconnected, (reason?: DisconnectReason) => {
      console.log('❌ Disconnected from LiveKit room:', reason);
      this.isConnected = false;
      this.connectionState = ConnectionState.Disconnected;
      this.notifyStateChange(ConnectionState.Disconnected);

      // Auto-reconnect logic
      if (reason !== DisconnectReason.CLIENT_INITIATED && this.config) {
        this.scheduleReconnect();
      }
    });

    this.room.on(RoomEvent.Reconnecting, () => {
      console.log('🔄 Reconnecting to LiveKit room...');
      this.connectionState = ConnectionState.Reconnecting;
      this.notifyStateChange(ConnectionState.Reconnecting);
    });

    this.room.on(RoomEvent.Reconnected, () => {
      console.log('✅ Reconnected to LiveKit room');
      this.isConnected = true;
      this.connectionState = ConnectionState.Connected;
      this.reconnectAttempts = 0;
      this.notifyStateChange(ConnectionState.Connected);
    });

    this.room.on(RoomEvent.ParticipantConnected, (participant: RemoteParticipant) => {
      console.log('👤 Participant connected:', participant.identity);
      this.updateParticipants();
    });

    this.room.on(RoomEvent.ParticipantDisconnected, (participant: RemoteParticipant) => {
      console.log('👤 Participant disconnected:', participant.identity);
      this.updateParticipants();
    });

    this.room.on(RoomEvent.TrackSubscribed, (track: RemoteTrack, publication: RemoteTrackPublication, participant: RemoteParticipant) => {
      console.log('🎥 Track subscribed:', track.kind, 'from', participant.identity);
    });

    this.room.on(RoomEvent.TrackUnsubscribed, (track: RemoteTrack, publication: RemoteTrackPublication, participant: RemoteParticipant) => {
      console.log('🎥 Track unsubscribed:', track.kind, 'from', participant.identity);
    });

    this.room.on(RoomEvent.ConnectionQualityChanged, (quality, participant) => {
      console.log('📶 Connection quality changed:', quality, 'for', participant?.identity || 'local');
    });

    this.room.on(RoomEvent.MediaDevicesError, (error: Error) => {
      console.error('🎤 Media devices error:', error);
      this.notifyError(error);
    });
  }

  private updateParticipants(): void {
    if (!this.room) return;

    const newParticipants = new Map<string, Participant>();
    
    // Add local participant
    if (this.room.localParticipant) {
      newParticipants.set(this.room.localParticipant.sid, this.room.localParticipant);
    }

    // Add remote participants
    this.room.remoteParticipants.forEach((participant, sid) => {
      newParticipants.set(sid, participant);
    });

    this.participants = newParticipants;
    this.notifyParticipantChange(newParticipants);
  }

  private scheduleReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('❌ Max reconnect attempts reached');
      this.notifyError(new Error('Failed to reconnect after maximum attempts'));
      return;
    }

    const delay = Math.min(
      this.reconnectDelay * Math.pow(2, this.reconnectAttempts),
      this.maxReconnectDelay
    );

    console.log(`🔄 Scheduling reconnect attempt ${this.reconnectAttempts + 1} in ${delay}ms`);

    this.reconnectTimer = setTimeout(() => {
      this.reconnectAttempts++;
      this.reconnect();
    }, delay);
  }

  public async connect(config: ConnectionConfig): Promise<void> {
    try {
      // Check if already connected to the same room
      if (this.isConnected && this.room && this.config?.roomName === config.roomName) {
        console.log('✅ Already connected to room:', config.roomName);
        return;
      }

      // Check if connection is in progress
      if (this.connectionState === ConnectionState.Connecting) {
        console.log('⏳ Connection already in progress...');
        return;
      }

      this.config = config;
      
      // Disconnect from any existing room first
      if (this.room && this.isConnected) {
        console.log('🔄 Disconnecting from existing room before connecting to new one...');
        await this.room.disconnect();
      }
      
      // Always create a fresh room instance
      this.setupRoom();

      if (!this.room) {
        throw new Error('Failed to create room');
      }

      console.log('🔗 Connecting to LiveKit room:', config.roomName);
      console.log('🔗 Using URL:', config.url);
      console.log('🔗 Participant:', config.participantName, 'Role:', config.role);
      
      this.connectionState = ConnectionState.Connecting;
      this.notifyStateChange(ConnectionState.Connecting);

      // Validate token format
      if (!config.token || config.token.split('.').length !== 3) {
        throw new Error('Invalid JWT token format');
      }

      // Validate URL format
      if (!config.url || (!config.url.startsWith('ws://') && !config.url.startsWith('wss://'))) {
        throw new Error('Invalid WebSocket URL format');
      }

      console.log('🔌 Calling room.connect...');
      await this.room.connect(config.url, config.token);
      console.log('✅ Room.connect completed successfully');

      // Enable camera and microphone based on role
      if (config.role !== 'audience') {
        try {
          console.log('🎥 Enabling camera and microphone...');
          await this.room.localParticipant.enableCameraAndMicrophone();
          console.log('✅ Camera and microphone enabled');
        } catch (error) {
          console.warn('⚠️ Failed to enable camera/microphone:', error);
          // Continue without media - user can enable later
        }
      }

    } catch (error) {
      console.error('❌ Failed to connect to room:', error);
      this.connectionState = ConnectionState.Disconnected;
      this.notifyStateChange(ConnectionState.Disconnected);
      
      // Provide more specific error messages
      let errorMessage = 'Connection failed';
      if (error instanceof Error) {
        if (error.message.includes('token')) {
          errorMessage = 'Invalid access token. Please try again.';
        } else if (error.message.includes('network') || error.message.includes('websocket')) {
          errorMessage = 'Network connection failed. Please check your internet connection.';
        } else if (error.message.includes('permission')) {
          errorMessage = 'Permission denied. Please allow camera and microphone access.';
        } else if (error.message.includes('timeout')) {
          errorMessage = 'Connection timeout. Please try again.';
        } else {
          errorMessage = error.message;
        }
      }
      
      this.notifyError(new Error(errorMessage));
      throw error;
    }
  }

  public async disconnect(): Promise<void> {
    try {
      if (this.reconnectTimer) {
        clearTimeout(this.reconnectTimer);
        this.reconnectTimer = null;
      }

      if (this.room) {
        await this.room.disconnect();
      }

      this.isConnected = false;
      this.connectionState = ConnectionState.Disconnected;
      this.participants.clear();
      this.config = null;
      this.reconnectAttempts = 0;

    } catch (error) {
      console.error('❌ Error during disconnect:', error);
      throw error;
    }
  }

  public async reconnect(): Promise<void> {
    if (!this.config) {
      throw new Error('No connection config available for reconnect');
    }

    try {
      if (this.room) {
        await this.room.disconnect();
      }
      
      this.setupRoom();
      await this.connect(this.config);
    } catch (error) {
      console.error('❌ Reconnect failed:', error);
      this.scheduleReconnect();
      throw error;
    }
  }

  public onStateChange(callback: (state: ConnectionState) => void): void {
    this.stateChangeCallbacks.push(callback);
  }

  public onParticipantChange(callback: (participants: Map<string, Participant>) => void): void {
    this.participantChangeCallbacks.push(callback);
  }

  public onError(callback: (error: Error) => void): void {
    this.errorCallbacks.push(callback);
  }

  private notifyStateChange(state: ConnectionState): void {
    this.stateChangeCallbacks.forEach(callback => {
      try {
        callback(state);
      } catch (error) {
        console.error('Error in state change callback:', error);
      }
    });
  }

  private notifyParticipantChange(participants: Map<string, Participant>): void {
    this.participantChangeCallbacks.forEach(callback => {
      try {
        callback(participants);
      } catch (error) {
        console.error('Error in participant change callback:', error);
      }
    });
  }

  private notifyError(error: Error): void {
    this.errorCallbacks.forEach(callback => {
      try {
        callback(error);
      } catch (error) {
        console.error('Error in error callback:', error);
      }
    });
  }

  public cleanup(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
    }
    
    this.stateChangeCallbacks = [];
    this.participantChangeCallbacks = [];
    this.errorCallbacks = [];
    
    if (this.room) {
      this.room.removeAllListeners();
    }
  }
}

// Singleton instance
let connectionManager: LiveKitConnectionManager | null = null;

export function getConnectionManager(): LiveKitConnectionManager {
  if (!connectionManager) {
    connectionManager = new LiveKitConnectionManager();
  }
  return connectionManager;
}

// Utility functions
export async function getAccessToken(roomName: string, participantName: string, role: string): Promise<{ token: string; url: string }> {
  console.log('🎫 Requesting access token for:', { roomName, participantName, role });
  
  try {
    const response = await fetch('/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        roomName,
        participantName,
        role,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Token request failed:', response.status, errorText);
      
      let errorMessage = 'Failed to get access token';
      try {
        const errorJson = JSON.parse(errorText);
        errorMessage = errorJson.error || errorMessage;
      } catch {
        errorMessage = `HTTP ${response.status}: ${errorText}`;
      }
      
      throw new Error(errorMessage);
    }

    const tokenData = await response.json();
    console.log('✅ Access token received successfully');
    return tokenData;
  } catch (error) {
    console.error('❌ Error getting access token:', error);
    throw error;
  }
}

export { RoomEvent, Track, ConnectionState, DisconnectReason };
