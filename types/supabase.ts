export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      debate_topics: {
        Row: {
          id: string
          created_at: string
          topic: string
          active: boolean
        }
        Insert: {
          id?: string
          created_at?: string
          topic: string
          active?: boolean
        }
        Update: {
          id?: string
          created_at?: string
          topic?: string
          active?: boolean
        }
      }
      debates: {
        Row: {
          id: string
          created_at: string
          topic: string
          format_id: string
          status: 'waiting' | 'in_progress' | 'completed'
          creator_id: string
          opponent_id: string | null
          winner_id: string | null
          feedback: Json | null
          join_key: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          topic: string
          format_id: string
          status?: 'waiting' | 'in_progress' | 'completed'
          creator_id: string
          opponent_id?: string | null
          winner_id?: string | null
          feedback?: Json | null
          join_key?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          topic?: string
          format_id?: string
          status?: 'waiting' | 'in_progress' | 'completed'
          creator_id?: string
          opponent_id?: string | null
          winner_id?: string | null
          feedback?: Json | null
          join_key?: string | null
        }
      }
      debate_arguments: {
        Row: {
          id: string
          created_at: string
          debate_id: string
          user_id: string
          segment: string
          content: string
          sequence: number
        }
        Insert: {
          id?: string
          created_at?: string
          debate_id: string
          user_id: string
          segment: string
          content: string
          sequence: number
        }
        Update: {
          id?: string
          created_at?: string
          debate_id?: string
          user_id?: string
          segment?: string
          content?: string
          sequence?: number
        }
      }
      profiles: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          username: string
          full_name: string | null
          avatar_url: string | null
          debates_won: number
          debates_participated: number
          avg_clarity: number | null
          avg_logic: number | null
          avg_persuasiveness: number | null
        }
        Insert: {
          id: string
          created_at?: string
          updated_at?: string
          username: string
          full_name?: string | null
          avatar_url?: string | null
          debates_won?: number
          debates_participated?: number
          avg_clarity?: number | null
          avg_logic?: number | null
          avg_persuasiveness?: number | null
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          username?: string
          full_name?: string | null
          avatar_url?: string | null
          debates_won?: number
          debates_participated?: number
          avg_clarity?: number | null
          avg_logic?: number | null
          avg_persuasiveness?: number | null
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}

interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message: string;
  type: string;
}