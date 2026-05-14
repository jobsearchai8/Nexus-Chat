/*
 * ChannelHeader — Nexus Networks
 * ──────────────────────────────
 * Facebook Messenger-style header
 * Shows avatar + name + status on left, call/info buttons on right
 * Mobile: back arrow on left
 */

import { useChat } from "@/contexts/ChatContext";
import { useAuth } from "@/contexts/AuthContext";
import UserAvatar from "./UserAvatar";
import {
  ArrowLeft,
  Phone,
  Video,
  Info,
  Search,
  Hash,
  Lock,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ChannelHeaderProps {
  onStartCall: (type: "voice" | "video") => void;
  onToggleMembers: () => void;
  onSearchOpen: () => void;
  onBack?: () => void;
  isMobile?: boolean;
}

export default function ChannelHeader({
  onStartCall,
  onToggleMembers,
  onSearchOpen,
  onBack,
  isMobile,
}: ChannelHeaderProps) {
  const { currentChannel, users, typingUsers } = useChat();
  const { user } = useAuth();

  if (!currentChannel) return null;

  // Get other user for DMs
  const otherUser = currentChannel.type === "dm"
    ? users.find((u) => u.display_name === currentChannel.name || u.username === currentChannel.name)
    : null;

  // Get online member count for channels/groups
  const onlineCount = users.filter((u) => u.status === "online").length;

  const getStatusText = () => {
    if (currentChannel.type === "dm" && otherUser) {
      if (otherUser.status === "online") return "Active now";
      if (otherUser.last_seen) {
        const diff = Date.now() - new Date(otherUser.last_seen).getTime();
        const mins = Math.floor(diff / 60000);
        if (mins < 60) return `Active ${mins}m ago`;
        const hrs = Math.floor(mins / 60);
        if (hrs < 24) return `Active ${hrs}h ago`;
        return "Offline";
      }
      return otherUser.status === "away" ? "Away" : "Offline";
    }
    return `${onlineCount} active · ${users.length} members`;
  };

  const typingInChannel = typingUsers.filter(
    (t) => t.channel_id === currentChannel.id && t.user_id !== user?.id
  );

  const isOnline = otherUser?.status === "online";

  return (
    <div className={cn(
      "shrink-0 flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-[#21262D] bg-white dark:bg-[#0D1117]",
      isMobile && "px-2"
    )}>
      {/* Left side: back + avatar + name */}
      <div className="flex items-center gap-2.5 min-w-0">
        {onBack && (
          <button
            onClick={onBack}
            className="w-9 h-9 rounded-full flex items-center justify-center text-blue-500 hover:bg-gray-100 dark:hover:bg-[#161B22] transition-colors shrink-0"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
        )}

        {/* Avatar */}
        <div className="shrink-0">
          {currentChannel.type === "dm" && otherUser ? (
            <UserAvatar user={otherUser} size="sm" showStatus />
          ) : currentChannel.type === "group" ? (
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
              <Users className="w-4 h-4 text-white" />
            </div>
          ) : (
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
              {currentChannel.is_private ? (
                <Lock className="w-4 h-4 text-white" />
              ) : (
                <Hash className="w-4 h-4 text-white" />
              )}
            </div>
          )}
        </div>

        {/* Name + status */}
        <div className="min-w-0">
          <h2 className="text-[15px] font-semibold text-gray-900 dark:text-[#E6EDF3] truncate leading-tight">
            {currentChannel.type === "channel"
              ? `#${currentChannel.name}`
              : currentChannel.name}
          </h2>
          <p className={cn(
            "text-[12px] truncate leading-tight mt-0.5",
            isOnline ? "text-green-500" : "text-gray-500 dark:text-[#8B949E]"
          )}>
            {typingInChannel.length > 0
              ? `${typingInChannel.map((t) => {
                  const typingUser = users.find((u) => u.id === t.user_id);
                  return typingUser?.display_name || "Someone";
                }).join(", ")} typing...`
              : getStatusText()}
          </p>
        </div>
      </div>

      {/* Right side: action buttons — Messenger style blue icons */}
      <div className="flex items-center gap-1 shrink-0">
        <button
          onClick={() => onStartCall("voice")}
          className="w-9 h-9 rounded-full flex items-center justify-center text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-colors"
          title="Voice call"
        >
          <Phone className="w-[18px] h-[18px]" />
        </button>
        <button
          onClick={() => onStartCall("video")}
          className="w-9 h-9 rounded-full flex items-center justify-center text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-colors"
          title="Video call"
        >
          <Video className="w-[18px] h-[18px]" />
        </button>
        {!isMobile && (
          <button
            onClick={onToggleMembers}
            className="w-9 h-9 rounded-full flex items-center justify-center text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-colors"
            title="Info"
          >
            <Info className="w-[18px] h-[18px]" />
          </button>
        )}
      </div>
    </div>
  );
}
