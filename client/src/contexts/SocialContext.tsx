/*
 * Social Context — Nexus Networks
 * ────────────────────────────
 * Manages social feed state: posts, stories, notifications, friends
 */

import { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import type { Post, Story, Notification, FriendRequest, Comment } from "@/lib/socialTypes";
import type { User } from "@/lib/types";
import { mockPosts, mockStories, mockNotifications, mockFriendRequests, mockSuggestedFriends } from "@/lib/socialMockData";
import { useAuth } from "./AuthContext";

interface SocialContextType {
  posts: Post[];
  stories: Story[];
  notifications: Notification[];
  friendRequests: FriendRequest[];
  suggestedFriends: User[];
  createPost: (content: string, media?: File[]) => void;
  likePost: (postId: string) => void;
  commentOnPost: (postId: string, content: string) => void;
  sharePost: (postId: string) => void;
  deletePost: (postId: string) => void;
  likeComment: (postId: string, commentId: string) => void;
  acceptFriendRequest: (requestId: string) => void;
  rejectFriendRequest: (requestId: string) => void;
  sendFriendRequest: (userId: string) => void;
  markNotificationRead: (notifId: string) => void;
  markAllNotificationsRead: () => void;
  unreadNotifCount: number;
}

const SocialContext = createContext<SocialContextType | undefined>(undefined);

export function SocialProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [posts, setPosts] = useState<Post[]>(mockPosts);
  const [stories] = useState<Story[]>(mockStories);
  const [notifications, setNotifications] = useState<Notification[]>(mockNotifications);
  const [friendRequests, setFriendRequests] = useState<FriendRequest[]>(mockFriendRequests);
  const [suggestedFriends, setSuggestedFriends] = useState<User[]>(mockSuggestedFriends);

  const unreadNotifCount = notifications.filter((n) => !n.is_read).length;

  const createPost = useCallback((content: string, _media?: File[]) => {
    if (!user) return;
    const newPost: Post = {
      id: `post-${Date.now()}`,
      user_id: user.id,
      content,
      media: [],
      privacy: "public",
      likes_count: 0,
      comments_count: 0,
      shares_count: 0,
      is_liked: false,
      is_shared: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      user,
      comments: [],
    };
    setPosts((prev) => [newPost, ...prev]);
  }, [user]);

  const likePost = useCallback((postId: string) => {
    setPosts((prev) =>
      prev.map((p) =>
        p.id === postId
          ? {
              ...p,
              is_liked: !p.is_liked,
              likes_count: p.is_liked ? p.likes_count - 1 : p.likes_count + 1,
            }
          : p
      )
    );
  }, []);

  const commentOnPost = useCallback((postId: string, content: string) => {
    if (!user) return;
    const newComment: Comment = {
      id: `comment-${Date.now()}`,
      post_id: postId,
      user_id: user.id,
      content,
      likes_count: 0,
      is_liked: false,
      created_at: new Date().toISOString(),
      user,
    };
    setPosts((prev) =>
      prev.map((p) =>
        p.id === postId
          ? {
              ...p,
              comments: [...(p.comments || []), newComment],
              comments_count: p.comments_count + 1,
            }
          : p
      )
    );
  }, [user]);

  const sharePost = useCallback((postId: string) => {
    setPosts((prev) =>
      prev.map((p) =>
        p.id === postId
          ? { ...p, is_shared: true, shares_count: p.shares_count + 1 }
          : p
      )
    );
  }, []);

  const deletePost = useCallback((postId: string) => {
    setPosts((prev) => prev.filter((p) => p.id !== postId));
  }, []);

  const likeComment = useCallback((postId: string, commentId: string) => {
    setPosts((prev) =>
      prev.map((p) =>
        p.id === postId
          ? {
              ...p,
              comments: (p.comments || []).map((c) =>
                c.id === commentId
                  ? {
                      ...c,
                      is_liked: !c.is_liked,
                      likes_count: c.is_liked ? c.likes_count - 1 : c.likes_count + 1,
                    }
                  : c
              ),
            }
          : p
      )
    );
  }, []);

  const acceptFriendRequest = useCallback((requestId: string) => {
    setFriendRequests((prev) =>
      prev.map((fr) => (fr.id === requestId ? { ...fr, status: "accepted" as const } : fr))
    );
  }, []);

  const rejectFriendRequest = useCallback((requestId: string) => {
    setFriendRequests((prev) => prev.filter((fr) => fr.id !== requestId));
  }, []);

  const sendFriendRequest = useCallback((userId: string) => {
    setSuggestedFriends((prev) => prev.filter((u) => u.id !== userId));
  }, []);

  const markNotificationRead = useCallback((notifId: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === notifId ? { ...n, is_read: true } : n))
    );
  }, []);

  const markAllNotificationsRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
  }, []);

  return (
    <SocialContext.Provider
      value={{
        posts,
        stories,
        notifications,
        friendRequests,
        suggestedFriends,
        createPost,
        likePost,
        commentOnPost,
        sharePost,
        deletePost,
        likeComment,
        acceptFriendRequest,
        rejectFriendRequest,
        sendFriendRequest,
        markNotificationRead,
        markAllNotificationsRead,
        unreadNotifCount,
      }}
    >
      {children}
    </SocialContext.Provider>
  );
}

export function useSocial() {
  const context = useContext(SocialContext);
  if (context === undefined) {
    throw new Error("useSocial must be used within a SocialProvider");
  }
  return context;
}
