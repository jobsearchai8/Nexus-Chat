/*
 * PeopleTab — Nexus Networks
 * ──────────────────────────
 * Messenger-style People/Friends list for the Chat section.
 * Shows all users with online status indicators.
 * Clicking a user opens (or creates) a DM conversation.
 */

import { useState } from "react";
import { useChat } from "@/contexts/ChatContext";
import { useAuth } from "@/contexts/AuthContext";
import UserAvatar from "./UserAvatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, UserPlus } from "lucide-react";
import { cn } from "@/lib/utils";
import type { User } from "@/lib/types";

interface PeopleTabProps {
  onSelectChannel?: () => void;
}

export default function PeopleTab({ onSelectChannel }: PeopleTabProps) {
  const { users, channels, setCurrentChannel, createChannel } = useChat();
  const { user: currentUser } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");

  // Filter out current user and apply search
  const otherUsers = users.filter(
    (u) => u.id !== currentUser?.id
  );

  const filteredUsers = searchQuery.trim()
    ? otherUsers.filter(
        (u) =>
          u.display_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          u.username.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : otherUsers;

  // Group by status
  const onlineUsers = filteredUsers.filter((u) => u.status === "online");
  const awayUsers = filteredUsers.filter((u) => u.status === "away");
  const otherStatusUsers = filteredUsers.filter(
    (u) => u.status !== "online" && u.status !== "away"
  );

  const handleUserClick = async (targetUser: User) => {
    // Check if a DM channel already exists with this user
    const existingDm = channels.find(
      (ch) =>
        ch.type === "dm" &&
        ch.name.includes(targetUser.display_name)
    );

    if (existingDm) {
      setCurrentChannel(existingDm);
    } else {
      // Create a new DM channel
      try {
        const newChannel = await createChannel(
          targetUser.display_name,
          `Direct message with ${targetUser.display_name}`,
          "dm",
          true
        );
        setCurrentChannel(newChannel);
      } catch {
        // Fallback: just select the first DM or do nothing
      }
    }
    onSelectChannel?.();
  };

  const statusLabel = (status: User["status"]) => {
    switch (status) {
      case "online":
        return "Active Now";
      case "away":
        return "Away";
      case "dnd":
        return "Do Not Disturb";
      case "offline":
        return "Offline";
      default:
        return "Offline";
    }
  };

  const statusDotColor = (status: User["status"]) => {
    switch (status) {
      case "online":
        return "bg-green-500";
      case "away":
        return "bg-yellow-500";
      case "dnd":
        return "bg-red-500";
      case "offline":
        return "bg-gray-400 dark:bg-[#484F58]";
      default:
        return "bg-gray-400 dark:bg-[#484F58]";
    }
  };

  const renderUserRow = (u: User) => (
    <button
      key={u.id}
      onClick={() => handleUserClick(u)}
      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-[#161B22] transition-colors text-left rounded-xl"
    >
      {/* Avatar with status */}
      <div className="relative shrink-0">
        <UserAvatar user={u} size="md" />
        <span
          className={cn(
            "absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2 border-white dark:border-[#0D1117]",
            statusDotColor(u.status)
          )}
        />
      </div>

      {/* Name and status */}
      <div className="flex-1 min-w-0">
        <p className="text-[15px] font-medium text-gray-900 dark:text-[#E6EDF3] truncate">
          {u.display_name}
        </p>
        <p className="text-[13px] text-gray-500 dark:text-[#8B949E] truncate">
          {u.status_text || statusLabel(u.status)}
        </p>
      </div>

      {/* Status indicator text */}
      <span
        className={cn(
          "text-[11px] font-medium shrink-0 px-2 py-0.5 rounded-full",
          u.status === "online"
            ? "text-green-600 bg-green-50 dark:text-green-400 dark:bg-green-500/10"
            : u.status === "away"
            ? "text-yellow-600 bg-yellow-50 dark:text-yellow-400 dark:bg-yellow-500/10"
            : "text-gray-400 dark:text-[#484F58]"
        )}
      >
        {u.status === "online" ? "Active" : u.status === "away" ? "Away" : ""}
      </span>
    </button>
  );

  return (
    <div className="h-full flex flex-col bg-white dark:bg-[#0D1117]">
      {/* Header */}
      <div className="px-4 pt-4 pb-2 shrink-0">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-[26px] font-bold text-gray-900 dark:text-[#E6EDF3]">
            People
          </h1>
          <button className="w-9 h-9 rounded-full bg-gray-100 dark:bg-[#21262D] flex items-center justify-center text-gray-600 dark:text-[#8B949E] hover:bg-gray-200 dark:hover:bg-[#30363D] transition-colors">
            <UserPlus className="w-4 h-4" />
          </button>
        </div>

        {/* Search */}
        <div className="relative mb-2">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-[#484F58]" />
          <input
            type="text"
            placeholder="Search people"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-10 pl-10 pr-4 bg-gray-100 dark:bg-[#161B22] rounded-full text-[15px] text-gray-900 dark:text-[#E6EDF3] placeholder:text-gray-400 dark:placeholder:text-[#484F58] outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
          />
        </div>
      </div>

      {/* People list */}
      <ScrollArea className="flex-1">
        <div className="px-2 py-1">
          {/* Active Now section */}
          {onlineUsers.length > 0 && (
            <div className="mb-2">
              <p className="px-4 py-2 text-[12px] font-semibold text-gray-500 dark:text-[#8B949E] uppercase tracking-wider">
                Active Now ({onlineUsers.length})
              </p>

              {/* Horizontal active avatars row */}
              <div className="flex gap-3 px-4 pb-3 overflow-x-auto scrollbar-hide">
                {onlineUsers.map((u) => (
                  <button
                    key={`avatar-${u.id}`}
                    onClick={() => handleUserClick(u)}
                    className="flex flex-col items-center gap-1 shrink-0"
                  >
                    <div className="relative">
                      <UserAvatar user={u} size="md" />
                      <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-green-500 border-2 border-white dark:border-[#0D1117]" />
                    </div>
                    <span className="text-[11px] text-gray-600 dark:text-[#8B949E] max-w-[56px] truncate">
                      {u.display_name.split(" ")[0]}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Full list */}
          <p className="px-4 py-2 text-[12px] font-semibold text-gray-500 dark:text-[#8B949E] uppercase tracking-wider">
            All People ({filteredUsers.length})
          </p>

          {filteredUsers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center px-6">
              <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-[#161B22] flex items-center justify-center mb-4">
                <Search className="w-7 h-7 text-gray-400 dark:text-[#8B949E]" />
              </div>
              <p className="text-[15px] text-gray-500 dark:text-[#8B949E] font-medium">
                No people found
              </p>
              <p className="text-[13px] text-gray-400 dark:text-[#484F58] mt-1">
                Try a different search term
              </p>
            </div>
          ) : (
            <>
              {onlineUsers.map(renderUserRow)}
              {awayUsers.map(renderUserRow)}
              {otherStatusUsers.map(renderUserRow)}
            </>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
