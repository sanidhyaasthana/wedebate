// types/index.ts
export interface ParticipantData {
  id: string;
  identity: string;
  role: 'moderator' | 'debater' | 'audience';
  isConnected: boolean;
}

export interface DebateState {
  debateState: 'waiting' | 'active' | 'paused' | 'ended';
  topic: string;
  participants: ParticipantData[];
  moderator: ParticipantData | null;
  currentSpeaker: string | null;
  currentRound: number;
  timeRemaining: number;
  maxRounds: number;
  timeLimit: number;
}

export interface DebateAction {
  type: 
    | 'SET_DEBATE_STATE'
    | 'SET_CURRENT_SPEAKER'
    | 'SET_TIME_REMAINING'
    | 'SET_DEBATE_TOPIC'
    | 'ADD_PARTICIPANT'
    | 'REMOVE_PARTICIPANT'
    | 'SET_MODERATOR'
    | 'START_DEBATE'
    | 'END_DEBATE'
    | 'NEXT_ROUND';
  payload?: any;
}

export interface DebateContextType {
  state: DebateState;
  dispatch: React.Dispatch<DebateAction>;
}

export interface TokenRequest {
  roomName: string;
  participantName: string;
  role: 'moderator' | 'debater' | 'audience';
}

export interface TokenResponse {
  token: string;
  url: string;
}

export interface DebateMessage {
  type: 
    | 'DEBATE_STARTED'
    | 'DEBATE_ENDED'
    | 'TIMER_STARTED'
    | 'TIMER_PAUSED'
    | 'TIMER_RESET'
    | 'TIME_UP'
    | 'SPEAKER_CHANGED'
    | 'NEXT_ROUND';
  speaker?: string;
  round?: number;
  timeRemaining?: number;
  timeLimit?: number;
  topic?: string;
}