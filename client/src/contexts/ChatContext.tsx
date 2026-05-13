/*
 * Chat Context — Nexus Networks
 * ─────────────────────────
 * Manages channels, messages, and real-time state
 */

import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from "react";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { mockChannels, mockMessages, mockUsers } from "@/lib/mockData";
import type { Channel, Message, User, TypingIndicator } from "@/lib/types";
import { useAuth } from "./AuthContext";

interface ChatContextType {
  channels: Channel[];
  currentChannel: Channel | null;
  messages: Message[];
  users: User[];
  typingUsers: TypingIndicator[];
  isLoadingMessages: boolean;
  setCurrentChannel: (channel: Channel | null) => void;
  sendMessage: (content: string, type?: Message["type"], fileData?: { url: string; name: string; size: number; type: string }) => Promise<void>;
  editMessage: (messageId: string, content: string) => Promise<void>;
  deleteMessage: (messageId: string) => Promise<void>;
  createChannel: (name: string, description: string, type: Channel["type"], isPrivate: boolean) => Promise<Channel>;
  searchMessages: (query: string) => Message[];
  setTyping: (channelId: string) => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export function ChatProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [channels, setChannels] = useState<Channel[]>([]);
  const [currentChannel, setCurrentChannel] = useState<Channel | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [typingUsers, setTypingUsers] = useState<TypingIndicator[]>([]);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const isDemo = !isSupabaseConfigured;

  // Load channels
  useEffect(() => {
    if (!user) return;

    if (isDemo) {
      setChannels(mockChannels);
      setUsers(mockUsers);
      return;
    }

    const loadChannels = async () => {
      const { data, error } = await supabase!
        .from("channels")
        .select("*")
        .order("updated_at", { ascending: false });

      if (!error && data) {
        setChannels(data as Channel[]);
      }
    };

    const loadUsers = async () => {
      const { data, error } = await supabase!
        .from("profiles")
        .select("*");

      if (!error && data) {
        setUsers(data as User[]);
      }
    };

    loadChannels();
    loadUsers();
  }, [user, isDemo]);

  // Load messages for current channel
  useEffect(() => {
    if (!currentChannel || !user) return;

    setIsLoadingMessages(true);

    if (isDemo) {
      const channelMessages = mockMessages[currentChannel.id] || [];
      setMessages(channelMessages);
      setIsLoadingMessages(false);
      return;
    }

    const loadMessages = async () => {
      const { data, error } = await supabase!
        .from("messages")
        .select("*, user:profiles(*)")
        .eq("channel_id", currentChannel.id)
        .order("created_at", { ascending: true })
        .limit(100);

      if (!error && data) {
        setMessages(data as Message[]);
      }
      setIsLoadingMessages(false);
    };

    loadMessages();

    // Subscribe to real-time messages
    if (!isDemo) {
      const channel = supabase!
        .channel(`messages:${currentChannel.id}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "messages",
            filter: `channel_id=eq.${currentChannel.id}`,
          },
          async (payload) => {
            const { data: messageWithUser } = await supabase!
              .from("messages")
              .select("*, user:profiles(*)")
              .eq("id", payload.new.id)
              .single();

            if (messageWithUser) {
              setMessages((prev) => [...prev, messageWithUser as Message]);
            }
          }
        )
        .on(
          "postgres_changes",
          {
            event: "DELETE",
            schema: "public",
            table: "messages",
            filter: `channel_id=eq.${currentChannel.id}`,
          },
          (payload) => {
            setMessages((prev) => prev.filter((m) => m.id !== payload.old.id));
          }
        )
        .subscribe();

      return () => {
        supabase!.removeChannel(channel);
      };
    }
  }, [currentChannel, user, isDemo]);

  const sendMessage = useCallback(
    async (
      content: string,
      type: Message["type"] = "text",
      fileData?: { url: string; name: string; size: number; type: string }
    ) => {
      if (!currentChannel || !user) return;

      if (isDemo) {
        const newMessage: Message = {
          id: `msg-${Date.now()}`,
          channel_id: currentChannel.id,
          user_id: user.id,
          content,
          type,
          file_url: fileData?.url,
          file_name: fileData?.name,
          file_size: fileData?.size,
          file_type: fileData?.type,
          created_at: new Date().toISOString(),
          user,
          reactions: [],
          thread_count: 0,
        };
        setMessages((prev) => [...prev, newMessage]);
        return;
      }

      const messageData: Record<string, unknown> = {
        channel_id: currentChannel.id,
        user_id: user.id,
        content,
        type,
      };

      if (fileData) {
        messageData.file_url = fileData.url;
        messageData.file_name = fileData.name;
        messageData.file_size = fileData.size;
        messageData.file_type = fileData.type;
      }

      await supabase!.from("messages").insert(messageData);
    },
    [currentChannel, user, isDemo]
  );

  const editMessage = useCallback(
    async (messageId: string, content: string) => {
      if (isDemo) {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === messageId
              ? { ...m, content, edited_at: new Date().toISOString() }
              : m
          )
        );
        return;
      }

      await supabase!
        .from("messages")
        .update({ content, edited_at: new Date().toISOString() })
        .eq("id", messageId);
    },
    [isDemo]
  );

  const deleteMessage = useCallback(
    async (messageId: string) => {
      if (isDemo) {
        setMessages((prev) => prev.filter((m) => m.id !== messageId));
        return;
      }

      await supabase!.from("messages").delete().eq("id", messageId);
    },
    [isDemo]
  );

  const createChannel = useCallback(
    async (
      name: string,
      description: string,
      type: Channel["type"],
      isPrivate: boolean
    ): Promise<Channel> => {
      if (!user) throw new Error("Not authenticated");

      const newChannel: Channel = {
        id: isDemo ? `ch-${Date.now()}` : "",
        name,
        description,
        type,
        is_private: isPrivate,
        created_by: user.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        unread_count: 0,
      };

      if (isDemo) {
        setChannels((prev) => [newChannel, ...prev]);
        return newChannel;
      }

      const { data, error } = await supabase!
        .from("channels")
        .insert({
          name,
          description,
          type,
          is_private: isPrivate,
          created_by: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      const channel = data as Channel;
      setChannels((prev) => [channel, ...prev]);
      return channel;
    },
    [user, isDemo]
  );

  const searchMessages = useCallback(
    (query: string): Message[] => {
      const lowerQuery = query.toLowerCase();
      if (isDemo) {
        return Object.values(mockMessages)
          .flat()
          .filter((m) => m.content.toLowerCase().includes(lowerQuery));
      }
      return messages.filter((m) => m.content.toLowerCase().includes(lowerQuery));
    },
    [messages, isDemo]
  );

  const setTyping = useCallback(
    (channelId: string) => {
      if (!user || isDemo) return;

      supabase!.channel(`typing:${channelId}`).send({
        type: "broadcast",
        event: "typing",
        payload: {
          user_id: user.id,
          username: user.username,
          channel_id: channelId,
        },
      });
    },
    [user, isDemo]
  );

  return (
    <ChatContext.Provider
      value={{
        channels,
        currentChannel,
        messages,
        users,
        typingUsers,
        isLoadingMessages,
        setCurrentChannel,
        sendMessage,
        editMessage,
        deleteMessage,
        createChannel,
        searchMessages,
        setTyping,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
}

export function useChat() {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error("useChat must be used within a ChatProvider");
  }
  return context;
}
