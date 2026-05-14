/*
 * Sidebar — Nexus Networks
 * ────────────────────────
 * Facebook Messenger-style conversation list
 * Clean, simple, with circular avatars and message previews
 */

import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useChat } from "@/contexts/ChatContext";
import UserAvatar from "./UserAvatar";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Hash,
  Lock,
  MessageSquare,
  Plus,
  Users,
  Search,
  Settings,
  LogOut,
  Pencil,
  MoreHorizontal,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import type { Channel } from "@/lib/types";
import { cn } from "@/lib/utils";

interface SidebarProps {
  onSearchOpen: () => void;
  onSelectChannel?: () => void;
  isMobile?: boolean;
}

export default function Sidebar({ onSearchOpen, onSelectChannel, isMobile }: SidebarProps) {
  const { user, signOut } = useAuth();
  const { channels, currentChannel, setCurrentChannel, createChannel, users } = useChat();
  const [searchQuery, setSearchQuery] = useState("");
  const [newChannelOpen, setNewChannelOpen] = useState(false);
  const [newChannelName, setNewChannelName] = useState("");
  const [newChannelDesc, setNewChannelDesc] = useState("");
  const [newChannelPrivate, setNewChannelPrivate] = useState(false);

  // Filter conversations based on search
  const getFilteredChannels = () => {
    let filtered = channels;
    if (searchQuery.trim()) {
      filtered = filtered.filter((c) =>
        c.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    return filtered;
  };

  const handleCreateChannel = async () => {
    if (!newChannelName.trim()) return;
    try {
      const channel = await createChannel(
        newChannelName.trim().toLowerCase().replace(/\s+/g, "-"),
        newChannelDesc,
        "channel",
        newChannelPrivate
      );
      setCurrentChannel(channel);
      setNewChannelOpen(false);
      setNewChannelName("");
      setNewChannelDesc("");
      setNewChannelPrivate(false);
      toast.success(`#${channel.name} created`);
      onSelectChannel?.();
    } catch (error: any) {
      toast.error(error.message || "Failed to create channel");
    }
  };

  const handleSignOut = async () => {
    await signOut();
    window.location.href = "/login";
  };

  const handleSelectChannel = (channel: Channel) => {
    setCurrentChannel(channel);
    onSelectChannel?.();
  };

  const getLastMessagePreview = (channel: Channel) => {
    if (channel.last_message) {
      const content = channel.last_message.content;
      return content.length > 35 ? content.slice(0, 35) + "..." : content;
    }
    return channel.description
      ? channel.description.slice(0, 35) + (channel.description.length > 35 ? "..." : "")
      : "Tap to start chatting";
  };

  const getTimeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "now";
    if (mins < 60) return `${mins}m`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h`;
    const days = Math.floor(hrs / 24);
    if (days < 7) return `${days}d`;
    return new Date(dateStr).toLocaleDateString([], { month: "short", day: "numeric" });
  };

  const getChannelIcon = (channel: Channel) => {
    if (channel.type === "dm") {
      const otherUser = users.find((u) => u.id !== user?.id && channel.name.includes(u.display_name));
      return <UserAvatar user={otherUser || user} size="md" showStatus />;
    }
    if (channel.type === "group") {
      return (
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
          <Users className="w-5 h-5 text-white" />
        </div>
      );
    }
    // Channel
    return (
      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
        {channel.is_private ? (
          <Lock className="w-5 h-5 text-white" />
        ) : (
          <Hash className="w-5 h-5 text-white" />
        )}
      </div>
    );
  };

  const filteredChannels = getFilteredChannels();

  return (
    <div className={cn(
      "h-full flex flex-col bg-white dark:bg-[#0D1117]",
      !isMobile && "border-r border-gray-100 dark:border-[#21262D]"
    )}>
      {/* Header — Messenger style */}
      <div className="px-4 pt-4 pb-2 shrink-0">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-[26px] font-bold text-gray-900 dark:text-[#E6EDF3]">Chats</h1>
          <div className="flex items-center gap-2">
            <Dialog open={newChannelOpen} onOpenChange={setNewChannelOpen}>
              <DialogTrigger asChild>
                <button className="w-9 h-9 rounded-full bg-gray-100 dark:bg-[#21262D] flex items-center justify-center text-gray-600 dark:text-[#8B949E] hover:bg-gray-200 dark:hover:bg-[#30363D] transition-colors">
                  <Pencil className="w-4 h-4" />
                </button>
              </DialogTrigger>
              <DialogContent className="bg-white dark:bg-[#161B22] border-gray-200 dark:border-[#30363D]">
                <DialogHeader>
                  <DialogTitle className="text-gray-900 dark:text-[#E6EDF3]">New conversation</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 mt-2">
                  <div className="space-y-2">
                    <Label className="text-gray-600 dark:text-[#8B949E]">Name</Label>
                    <Input
                      placeholder="e.g. marketing"
                      value={newChannelName}
                      onChange={(e) => setNewChannelName(e.target.value)}
                      className="bg-gray-50 dark:bg-[#0D1117] border-gray-200 dark:border-[#30363D] text-gray-900 dark:text-[#E6EDF3]"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-gray-600 dark:text-[#8B949E]">Description (optional)</Label>
                    <Input
                      placeholder="What's this about?"
                      value={newChannelDesc}
                      onChange={(e) => setNewChannelDesc(e.target.value)}
                      className="bg-gray-50 dark:bg-[#0D1117] border-gray-200 dark:border-[#30363D] text-gray-900 dark:text-[#E6EDF3]"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label className="text-gray-600 dark:text-[#8B949E]">Private</Label>
                    <Switch
                      checked={newChannelPrivate}
                      onCheckedChange={setNewChannelPrivate}
                    />
                  </div>
                  <Button
                    onClick={handleCreateChannel}
                    className="w-full bg-blue-500 hover:bg-blue-600 text-white"
                    disabled={!newChannelName.trim()}
                  >
                    Create
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="w-9 h-9 rounded-full bg-gray-100 dark:bg-[#21262D] flex items-center justify-center text-gray-600 dark:text-[#8B949E] hover:bg-gray-200 dark:hover:bg-[#30363D] transition-colors">
                  <MoreHorizontal className="w-4 h-4" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-white dark:bg-[#161B22] border-gray-200 dark:border-[#30363D]">
                <DropdownMenuItem onClick={onSearchOpen} className="text-gray-700 dark:text-[#E6EDF3]">
                  <Search className="w-4 h-4 mr-2" />
                  Search messages
                </DropdownMenuItem>
                <DropdownMenuItem className="text-gray-700 dark:text-[#E6EDF3]">
                  <Settings className="w-4 h-4 mr-2" />
                  Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-gray-100 dark:bg-[#30363D]" />
                <DropdownMenuItem onClick={handleSignOut} className="text-red-500">
                  <LogOut className="w-4 h-4 mr-2" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Search bar — Messenger style rounded pill */}
        <div className="relative mb-2">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-[#484F58]" />
          <input
            type="text"
            placeholder="Search Messenger"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-10 pl-10 pr-4 bg-gray-100 dark:bg-[#161B22] rounded-full text-[15px] text-gray-900 dark:text-[#E6EDF3] placeholder:text-gray-400 dark:placeholder:text-[#484F58] outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
          />
        </div>
      </div>

      {/* Conversation list */}
      <ScrollArea className="flex-1">
        <div className="px-2 py-1">
          {filteredChannels.map((channel) => {
            const isActive = currentChannel?.id === channel.id;
            const hasUnread = (channel.unread_count || 0) > 0;

            return (
              <button
                key={channel.id}
                onClick={() => handleSelectChannel(channel)}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors text-left",
                  isActive
                    ? "bg-blue-50 dark:bg-blue-500/10"
                    : "hover:bg-gray-50 dark:hover:bg-[#161B22]"
                )}
              >
                {/* Avatar */}
                <div className="shrink-0">
                  {getChannelIcon(channel)}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className={cn(
                      "text-[15px] truncate",
                      hasUnread
                        ? "font-semibold text-gray-900 dark:text-[#E6EDF3]"
                        : "font-medium text-gray-800 dark:text-[#C9D1D9]"
                    )}>
                      {channel.type === "channel" ? `#${channel.name}` : channel.name}
                    </span>
                    <span className="text-[12px] text-gray-400 dark:text-[#484F58] shrink-0">
                      {getTimeAgo(channel.updated_at)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <p className={cn(
                      "text-[13px] truncate flex-1",
                      hasUnread
                        ? "text-gray-700 dark:text-[#C9D1D9] font-medium"
                        : "text-gray-500 dark:text-[#8B949E]"
                    )}>
                      {getLastMessagePreview(channel)}
                    </p>
                    {hasUnread && (
                      <span className="w-2.5 h-2.5 rounded-full bg-blue-500 shrink-0" />
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
}
