export interface Note {
  id: string;
  user_id: string;
  title: string | null;
  content: string;
  summary: string | null;
  category: string | null;
  tags: string[] | null;
  key_topics: string[] | null;
  is_favorite: boolean;
  is_archived: boolean;
  embedding?: number[] | null;
  created_at: string;
  updated_at: string;
}

export interface Profile {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  use_cases: string[] | null;
  summary_time: string;
  timezone?: string;
  summary_enabled: boolean;
  chat_personality: string;
  onboarding_completed: boolean;
  galaxy_positions?: Record<string, { x: number; y: number }> | null;
  created_at: string;
}

export interface ChatMessage {
  id: string;
  user_id: string;
  role: 'user' | 'assistant';
  content: string;
  referenced_note_ids: string[] | null;
  created_at: string;
}

export interface Subscription {
  id: string;
  user_id: string;
  paypal_subscription_id: string | null;
  paypal_plan_id: string | null;
  status: 'trialing' | 'active' | 'cancelled' | 'suspended' | 'expired';
  trial_ends_at: string | null;
  current_period_end: string | null;
  created_at: string;
  updated_at: string;
}

export interface NoteConnection {
  id: string;
  note_id_1: string;
  note_id_2: string;
  connection_reason: string | null;
  strength: number;
  created_at: string;
}

export interface AIOrganizeResult {
  title: string;
  tags: string[];
  category: string;
  summary: string;
  keyTopics: string[];
}

export type NoteFilter = 'all' | 'today' | 'week' | 'favorites' | 'archived';
export type NoteSort = 'recent' | 'oldest' | 'connected';
