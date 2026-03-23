export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  public: {
    Tables: {
      cards: {
        Row: {
          challenge_leader: boolean
          created_at: string
          id: string
          image_url: string
          is_played: boolean
          player_id: string
          prompt: string
          round_id: string
          tactical_action: string | null
        }
        Insert: {
          challenge_leader?: boolean
          created_at?: string
          id?: string
          image_url: string
          is_played?: boolean
          player_id: string
          prompt: string
          round_id: string
          tactical_action?: string | null
        }
        Update: {
          challenge_leader?: boolean
          created_at?: string
          id?: string
          image_url?: string
          is_played?: boolean
          player_id?: string
          prompt?: string
          round_id?: string
          tactical_action?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'cards_player_id_fkey'
            columns: ['player_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'cards_round_id_fkey'
            columns: ['round_id']
            isOneToOne: false
            referencedRelation: 'rounds'
            referencedColumns: ['id']
          },
        ]
      }
      gallery_cards: {
        Row: {
          created_at: string
          id: string
          image_url: string
          player_id: string
          prompt: string
          title: string
        }
        Insert: {
          created_at?: string
          id?: string
          image_url: string
          player_id: string
          prompt: string
          title?: string
        }
        Update: {
          created_at?: string
          id?: string
          image_url?: string
          player_id?: string
          prompt?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: 'gallery_cards_player_id_fkey'
            columns: ['player_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      lobby_messages: {
        Row: {
          created_at: string
          id: string
          player_id: string
          room_id: string
          sender_name: string
          text: string
        }
        Insert: {
          created_at?: string
          id?: string
          player_id: string
          room_id: string
          sender_name: string
          text: string
        }
        Update: {
          created_at?: string
          id?: string
          player_id?: string
          room_id?: string
          sender_name?: string
          text?: string
        }
        Relationships: [
          {
            foreignKeyName: 'lobby_messages_player_id_fkey'
            columns: ['player_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'lobby_messages_room_id_fkey'
            columns: ['room_id']
            isOneToOne: false
            referencedRelation: 'rooms'
            referencedColumns: ['id']
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          display_name: string
          id: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          display_name?: string
          id: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          display_name?: string
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      room_players: {
        Row: {
          challenge_leader_used: boolean
          display_name: string
          id: string
          intuition_tokens: number
          is_active: boolean
          is_host: boolean
          joined_at: string
          player_id: string
          room_id: string
          score: number
          wildcards_remaining: number
        }
        Insert: {
          challenge_leader_used?: boolean
          display_name: string
          id?: string
          intuition_tokens?: number
          is_active?: boolean
          is_host?: boolean
          joined_at?: string
          player_id: string
          room_id: string
          score?: number
          wildcards_remaining?: number
        }
        Update: {
          challenge_leader_used?: boolean
          display_name?: string
          id?: string
          intuition_tokens?: number
          is_active?: boolean
          is_host?: boolean
          joined_at?: string
          player_id?: string
          room_id?: string
          score?: number
          wildcards_remaining?: number
        }
        Relationships: [
          {
            foreignKeyName: 'room_players_player_id_fkey'
            columns: ['player_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'room_players_room_id_fkey'
            columns: ['room_id']
            isOneToOne: false
            referencedRelation: 'rooms'
            referencedColumns: ['id']
          },
        ]
      }
      rooms: {
        Row: {
          code: string
          created_at: string
          ended_at: string | null
          host_id: string
          id: string
          max_rounds: number
          narrator_order: string[]
          status: string
        }
        Insert: {
          code: string
          created_at?: string
          ended_at?: string | null
          host_id: string
          id?: string
          max_rounds?: number
          narrator_order?: string[]
          status?: string
        }
        Update: {
          code?: string
          created_at?: string
          ended_at?: string | null
          host_id?: string
          id?: string
          max_rounds?: number
          narrator_order?: string[]
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: 'rooms_host_id_fkey'
            columns: ['host_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      round_scores: {
        Row: {
          id: string
          player_id: string
          points: number
          reason: string
          round_id: string
        }
        Insert: {
          id?: string
          player_id: string
          points: number
          reason: string
          round_id: string
        }
        Update: {
          id?: string
          player_id?: string
          points?: number
          reason?: string
          round_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'round_scores_player_id_fkey'
            columns: ['player_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'round_scores_round_id_fkey'
            columns: ['round_id']
            isOneToOne: false
            referencedRelation: 'rounds'
            referencedColumns: ['id']
          },
        ]
      }
      round_resolution_summaries: {
        Row: {
          created_at: string
          round_id: string
          summary: Json
        }
        Insert: {
          created_at?: string
          round_id: string
          summary: Json
        }
        Update: {
          created_at?: string
          round_id?: string
          summary?: Json
        }
        Relationships: [
          {
            foreignKeyName: 'round_resolution_summaries_round_id_fkey'
            columns: ['round_id']
            isOneToOne: false
            referencedRelation: 'rounds'
            referencedColumns: ['id']
          },
        ]
      }
      rounds: {
        Row: {
          clue: string | null
          created_at: string
          id: string
          narrator_id: string
          results_started_at: string | null
          room_id: string
          round_number: number
          status: string
        }
        Insert: {
          clue?: string | null
          created_at?: string
          id?: string
          narrator_id: string
          results_started_at?: string | null
          room_id: string
          round_number: number
          status?: string
        }
        Update: {
          clue?: string | null
          created_at?: string
          id?: string
          narrator_id?: string
          results_started_at?: string | null
          room_id?: string
          round_number?: number
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: 'rounds_narrator_id_fkey'
            columns: ['narrator_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'rounds_room_id_fkey'
            columns: ['room_id']
            isOneToOne: false
            referencedRelation: 'rooms'
            referencedColumns: ['id']
          },
        ]
      }
      temporary_generation_assets: {
        Row: {
          bucket_id: string
          created_at: string
          deleted_at: string | null
          expires_at: string
          id: string
          mime_type: string
          model: string
          object_path: string
          owner_id: string
          provider: string
          refined_brief: string
          room_code: string | null
          round_id: string | null
          scope: string
        }
        Insert: {
          bucket_id: string
          created_at?: string
          deleted_at?: string | null
          expires_at: string
          id?: string
          mime_type?: string
          model: string
          object_path: string
          owner_id: string
          provider: string
          refined_brief: string
          room_code?: string | null
          round_id?: string | null
          scope: string
        }
        Update: {
          bucket_id?: string
          created_at?: string
          deleted_at?: string | null
          expires_at?: string
          id?: string
          mime_type?: string
          model?: string
          object_path?: string
          owner_id?: string
          provider?: string
          refined_brief?: string
          room_code?: string | null
          round_id?: string | null
          scope?: string
        }
        Relationships: [
          {
            foreignKeyName: 'temporary_generation_assets_owner_id_fkey'
            columns: ['owner_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      votes: {
        Row: {
          card_id: string
          challenge_leader: boolean
          id: string
          round_id: string
          spent_intuition_token: boolean
          tactical_action: string | null
          voter_id: string
        }
        Insert: {
          card_id: string
          challenge_leader?: boolean
          id?: string
          round_id: string
          spent_intuition_token?: boolean
          tactical_action?: string | null
          voter_id: string
        }
        Update: {
          card_id?: string
          challenge_leader?: boolean
          id?: string
          round_id?: string
          spent_intuition_token?: boolean
          tactical_action?: string | null
          voter_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'votes_card_id_fkey'
            columns: ['card_id']
            isOneToOne: false
            referencedRelation: 'cards'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'votes_round_id_fkey'
            columns: ['round_id']
            isOneToOne: false
            referencedRelation: 'rounds'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'votes_voter_id_fkey'
            columns: ['voter_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}

// Convenience row types
export type Profile = Database['public']['Tables']['profiles']['Row']
export type Room = Database['public']['Tables']['rooms']['Row']
export type RoomPlayer = Database['public']['Tables']['room_players']['Row']
export type Round = Database['public']['Tables']['rounds']['Row']
export type Card = Database['public']['Tables']['cards']['Row']
export type Vote = Database['public']['Tables']['votes']['Row']
export type RoundScore = Database['public']['Tables']['round_scores']['Row']
export type GalleryCard = Database['public']['Tables']['gallery_cards']['Row']
export type LobbyMessage = Database['public']['Tables']['lobby_messages']['Row']
export type TemporaryGenerationAsset = Database['public']['Tables']['temporary_generation_assets']['Row']

export type RoomStatus = 'lobby' | 'playing' | 'ended'
export type RoundStatus = 'narrator_turn' | 'players_turn' | 'voting' | 'results'
export type ScoreReason =
  | 'narrator_success'
  | 'narrator_fail'
  | 'correct_vote'
  | 'received_vote'
  | 'consolation_bonus'

/**
 * A Card whose player_id has been nulled during the voting phase
 * to prevent the UI from revealing who played which card.
 */
export type MaskedCard = Omit<Card, 'player_id'> & { player_id: string | null }

/**
 * Structured error payload thrown by Supabase Edge Functions.
 * Callers receive this as `{ error: EdgeFunctionError }`.
 */
export interface EdgeFunctionError {
  code: string
  message?: string
}
