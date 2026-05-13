/*
 * Nexus Networks — Type Definitions
 * ─────────────────────────────
 * Midnight Command theme
 */

export interface User {
  id: string;
  email: string;
  username: string;
  display_name: string;
  avatar_url?: string;
  status: "online" | "away" | "dnd" | "offline";
  status_text?: string;
  created_at: string;
  last_seen?: string;
}

export interface Channel {
  id: string;
  name: string;
  description?: string;
  type: "channel" | "dm" | "group";
  is_private: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
  members?: ChannelMember[];
  last_message?: Message;
  unread_count?: number;
}

export interface ChannelMember {
  user_id: string;
  channel_id: string;
  role: "owner" | "admin" | "member";
  joined_at: string;
  user?: User;
}

export interface Message {
  id: string;
  channel_id: string;
  user_id: string;
  content: string;
  type: "text" | "image" | "file" | "system" | "call";
  file_url?: string;
  file_name?: string;
  file_size?: number;
  file_type?: string;
  parent_id?: string;
  edited_at?: string;
  created_at: string;
  user?: User;
  reactions?: Reaction[];
  thread_count?: number;
}

export interface Reaction {
  id: string;
  message_id: string;
  user_id: string;
  emoji: string;
  created_at: string;
}

export interface CallSession {
  id: string;
  channel_id: string;
  initiated_by: string;
  type: "voice" | "video";
  status: "ringing" | "active" | "ended";
  participants: CallParticipant[];
  started_at: string;
  ended_at?: string;
}

export interface CallParticipant {
  user_id: string;
  joined_at: string;
  left_at?: string;
  is_muted: boolean;
  is_video_on: boolean;
  user?: User;
}

export interface TypingIndicator {
  user_id: string;
  channel_id: string;
  username: string;
}
