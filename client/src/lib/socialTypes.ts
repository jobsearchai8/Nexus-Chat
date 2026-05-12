/*
 * Nexus Chat — Social Network Type Definitions
 * ──────────────────────────────────────────────
 * Types for the Facebook-style social feed mode
 */

import type { User } from "./types";

export interface Post {
  id: string;
  user_id: string;
  content: string;
  media: PostMedia[];
  privacy: "public" | "friends" | "private";
  likes_count: number;
  comments_count: number;
  shares_count: number;
  is_liked: boolean;
  is_shared: boolean;
  created_at: string;
  updated_at: string;
  user?: User;
  comments?: Comment[];
}

export interface PostMedia {
  id: string;
  url: string;
  type: "image" | "video" | "file";
  file_name?: string;
  file_size?: number;
  thumbnail_url?: string;
}

export interface Comment {
  id: string;
  post_id: string;
  user_id: string;
  content: string;
  likes_count: number;
  is_liked: boolean;
  created_at: string;
  user?: User;
  replies?: Comment[];
  parent_id?: string;
}

export interface FriendRequest {
  id: string;
  from_user_id: string;
  to_user_id: string;
  status: "pending" | "accepted" | "rejected";
  created_at: string;
  from_user?: User;
  to_user?: User;
}

export interface Notification {
  id: string;
  user_id: string;
  type: "like" | "comment" | "friend_request" | "share" | "mention" | "message";
  content: string;
  is_read: boolean;
  reference_id?: string;
  created_at: string;
  actor?: User;
}

export interface Story {
  id: string;
  user_id: string;
  media_url: string;
  media_type: "image" | "video";
  caption?: string;
  views_count: number;
  created_at: string;
  expires_at: string;
  user?: User;
}
