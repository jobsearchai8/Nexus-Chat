/*
 * Sidebar — Nexus Chat
 * ────────────────────
 * Midnight Command: Dense sidebar with channels, DMs, groups
 * Dark anchor panel, sharp geometry, monospace metadata
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
  ChevronDown,
  ChevronRight,
  Users,
  Phone,
  Video,
  Search,
  Settings,
  LogOut,
  Circle,
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
}

export default function Sidebar({ onSearchOpen }: SidebarProps) {
  const { user, signOut } = useAuth();
  const { channels, currentChannel, setCurrentChannel, createChannel, users } = useChat();
  const [channelsExpanded, setChannelsExpanded] = useState(true);
  const [dmsExpanded, setDmsExpanded] = useState(true);
  const [groupsExpanded, setGroupsExpanded] = useState(true);
  const [newChannelOpen, setNewChannelOpen] = useState(false);
  const [newChannelName, setNewChannelName] = useState("");
  const [newChannelDesc, setNewChannelDesc] = useState("");
  const [newChannelPrivate, setNewChannelPrivate] = useState(false);

  const channelList = channels.filter((c) => c.type === "channel");
  const dmList = channels.filter((c) => c.type === "dm");
  const groupList = channels.filter((c) => c.type === "group");

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
    } catch (error: any) {
      toast.error(error.message || "Failed to create channel");
    }
  };

  const handleSignOut = async () => {
    await signOut();
    window.location.href = "/login";
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "online": return "text-neon-green";
      case "away": return "text-yellow-500";
      case "dnd": return "text-red-500";
      default: return "text-[#484F58]";
    }
  };

  return (
    <div className="w-64 h-full flex flex-col bg-surface-0 border-r border-border">
      {/* Workspace header */}
      <div className="h-[52px] px-4 flex items-center justify-between border-b border-border shrink-0">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2 hover:bg-surface-2 rounded-md px-2 py-1.5 transition-colors">
              <div className="w-6 h-6 rounded bg-indigo/20 flex items-center justify-center">
                <MessageSquare className="w-3.5 h-3.5 text-indigo" />
              </div>
              <span className="font-semibold text-sm truncate">Nexus Chat</span>
              <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56 bg-surface-1 border-border">
            <DropdownMenuItem className="text-muted-foreground text-xs cursor-default">
              Workspace
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-border" />
            <DropdownMenuItem onClick={onSearchOpen}>
              <Search className="w-4 h-4 mr-2" />
              Search messages
              <span className="ml-auto text-xs text-muted-foreground font-mono">⌘K</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-border" />
            <DropdownMenuItem onClick={handleSignOut} className="text-destructive">
              <LogOut className="w-4 h-4 mr-2" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Quick actions */}
      <div className="px-2 py-2 space-y-0.5 border-b border-border shrink-0">
        <button
          onClick={onSearchOpen}
          className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-sm text-muted-foreground hover:bg-surface-2 hover:text-foreground transition-colors"
        >
          <Search className="w-4 h-4" />
          <span>Search</span>
          <span className="ml-auto text-xs font-mono text-muted-foreground/60">⌘K</span>
        </button>
      </div>

      {/* Channel list */}
      <ScrollArea className="flex-1 custom-scrollbar">
        <div className="px-2 py-2">
          {/* Channels section */}
          <div className="mb-2">
            <button
              onClick={() => setChannelsExpanded(!channelsExpanded)}
              className="w-full flex items-center gap-1 px-1.5 py-1 text-xs font-semibold text-muted-foreground uppercase tracking-wider hover:text-foreground transition-colors"
            >
              {channelsExpanded ? (
                <ChevronDown className="w-3 h-3" />
              ) : (
                <ChevronRight className="w-3 h-3" />
              )}
              Channels
              <Dialog open={newChannelOpen} onOpenChange={setNewChannelOpen}>
                <DialogTrigger asChild>
                  <span
                    className="ml-auto p-0.5 rounded hover:bg-surface-2"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </span>
                </DialogTrigger>
                <DialogContent className="bg-surface-1 border-border">
                  <DialogHeader>
                    <DialogTitle>Create a channel</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 mt-2">
                    <div className="space-y-2">
                      <Label>Channel name</Label>
                      <Input
                        placeholder="e.g. marketing"
                        value={newChannelName}
                        onChange={(e) => setNewChannelName(e.target.value)}
                        className="bg-surface-0 border-border"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Description (optional)</Label>
                      <Input
                        placeholder="What's this channel about?"
                        value={newChannelDesc}
                        onChange={(e) => setNewChannelDesc(e.target.value)}
                        className="bg-surface-0 border-border"
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label>Private channel</Label>
                      <Switch
                        checked={newChannelPrivate}
                        onCheckedChange={setNewChannelPrivate}
                      />
                    </div>
                    <Button
                      onClick={handleCreateChannel}
                      className="w-full bg-indigo hover:bg-indigo/90 text-white"
                      disabled={!newChannelName.trim()}
                    >
                      Create Channel
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </button>
            {channelsExpanded && (
              <div className="space-y-0.5 mt-0.5">
                {channelList.map((channel) => (
                  <ChannelItem
                    key={channel.id}
                    channel={channel}
                    isActive={currentChannel?.id === channel.id}
                    onClick={() => setCurrentChannel(channel)}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Direct Messages section */}
          <div className="mb-2">
            <button
              onClick={() => setDmsExpanded(!dmsExpanded)}
              className="w-full flex items-center gap-1 px-1.5 py-1 text-xs font-semibold text-muted-foreground uppercase tracking-wider hover:text-foreground transition-colors"
            >
              {dmsExpanded ? (
                <ChevronDown className="w-3 h-3" />
              ) : (
                <ChevronRight className="w-3 h-3" />
              )}
              Direct Messages
            </button>
            {dmsExpanded && (
              <div className="space-y-0.5 mt-0.5">
                {dmList.map((dm) => {
                  const otherUser = users.find(
                    (u) => u.display_name === dm.name || u.username === dm.name
                  );
                  return (
                    <button
                      key={dm.id}
                      onClick={() => setCurrentChannel(dm)}
                      className={cn(
                        "w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-sm transition-colors",
                        currentChannel?.id === dm.id
                          ? "bg-indigo/15 text-foreground"
                          : "text-muted-foreground hover:bg-surface-2 hover:text-foreground"
                      )}
                    >
                      <div className="relative">
                        <UserAvatar user={otherUser} size="sm" />
                        <Circle
                          className={cn(
                            "w-2 h-2 absolute -bottom-0 -right-0 fill-current",
                            getStatusColor(otherUser?.status || "offline")
                          )}
                        />
                      </div>
                      <span className="truncate">{dm.name}</span>
                      {dm.unread_count ? (
                        <span className="ml-auto bg-indigo text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                          {dm.unread_count}
                        </span>
                      ) : null}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Groups section */}
          {groupList.length > 0 && (
            <div className="mb-2">
              <button
                onClick={() => setGroupsExpanded(!groupsExpanded)}
                className="w-full flex items-center gap-1 px-1.5 py-1 text-xs font-semibold text-muted-foreground uppercase tracking-wider hover:text-foreground transition-colors"
              >
                {groupsExpanded ? (
                  <ChevronDown className="w-3 h-3" />
                ) : (
                  <ChevronRight className="w-3 h-3" />
                )}
                Groups
              </button>
              {groupsExpanded && (
                <div className="space-y-0.5 mt-0.5">
                  {groupList.map((group) => (
                    <button
                      key={group.id}
                      onClick={() => setCurrentChannel(group)}
                      className={cn(
                        "w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-sm transition-colors",
                        currentChannel?.id === group.id
                          ? "bg-indigo/15 text-foreground"
                          : "text-muted-foreground hover:bg-surface-2 hover:text-foreground"
                      )}
                    >
                      <Users className="w-4 h-4 shrink-0" />
                      <span className="truncate">{group.name}</span>
                      {group.unread_count ? (
                        <span className="ml-auto bg-indigo text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                          {group.unread_count}
                        </span>
                      ) : null}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </ScrollArea>

      {/* User panel */}
      <div className="h-[52px] px-3 flex items-center gap-2 border-t border-border shrink-0">
        <UserAvatar user={user} size="sm" showStatus />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{user?.display_name}</p>
          <p className="text-[10px] font-mono text-muted-foreground truncate">
            {user?.status_text || user?.status || "online"}
          </p>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="p-1.5 rounded-md hover:bg-surface-2 text-muted-foreground transition-colors">
              <Settings className="w-4 h-4" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" side="top" className="bg-surface-1 border-border">
            <DropdownMenuItem>
              <Circle className="w-3 h-3 mr-2 fill-neon-green text-neon-green" />
              Set as Online
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Circle className="w-3 h-3 mr-2 fill-yellow-500 text-yellow-500" />
              Set as Away
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Circle className="w-3 h-3 mr-2 fill-red-500 text-red-500" />
              Do Not Disturb
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-border" />
            <DropdownMenuItem onClick={handleSignOut} className="text-destructive">
              <LogOut className="w-4 h-4 mr-2" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}

function ChannelItem({
  channel,
  isActive,
  onClick,
}: {
  channel: Channel;
  isActive: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-sm transition-colors",
        isActive
          ? "bg-indigo/15 text-foreground"
          : "text-muted-foreground hover:bg-surface-2 hover:text-foreground"
      )}
    >
      {channel.is_private ? (
        <Lock className="w-4 h-4 shrink-0" />
      ) : (
        <Hash className="w-4 h-4 shrink-0" />
      )}
      <span className="truncate">{channel.name}</span>
      {channel.unread_count ? (
        <span className="ml-auto bg-indigo text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
          {channel.unread_count}
        </span>
      ) : null}
    </button>
  );
}
