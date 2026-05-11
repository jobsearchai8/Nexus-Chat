/*
 * ChannelHeader — Nexus Chat
 * ──────────────────────────
 * Midnight Command: Channel info bar with call actions
 */

import { useChat } from "@/contexts/ChatContext";
import {
  Hash,
  Lock,
  Users,
  Phone,
  Video,
  Pin,
  Search,
  Settings,
  Star,
  UserPlus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";

interface ChannelHeaderProps {
  onStartCall: (type: "voice" | "video") => void;
  onToggleMembers: () => void;
  onSearchOpen: () => void;
}

export default function ChannelHeader({
  onStartCall,
  onToggleMembers,
  onSearchOpen,
}: ChannelHeaderProps) {
  const { currentChannel } = useChat();

  if (!currentChannel) return null;

  const getIcon = () => {
    if (currentChannel.type === "dm") return null;
    if (currentChannel.type === "group") return <Users className="w-4 h-4 text-muted-foreground" />;
    if (currentChannel.is_private) return <Lock className="w-4 h-4 text-muted-foreground" />;
    return <Hash className="w-4 h-4 text-muted-foreground" />;
  };

  return (
    <div className="h-[52px] px-4 flex items-center gap-3 border-b border-border shrink-0 bg-surface-0">
      <div className="flex items-center gap-2 flex-1 min-w-0">
        {getIcon()}
        <h2 className="font-semibold text-sm truncate">{currentChannel.name}</h2>
        {currentChannel.description && (
          <>
            <Separator orientation="vertical" className="h-4 bg-border" />
            <p className="text-xs text-muted-foreground truncate hidden md:block">
              {currentChannel.description}
            </p>
          </>
        )}
      </div>

      <div className="flex items-center gap-1">
        <button
          onClick={() => onStartCall("voice")}
          className="p-2 rounded-md hover:bg-surface-2 text-muted-foreground hover:text-foreground transition-colors"
          title="Start voice call"
        >
          <Phone className="w-4 h-4" />
        </button>
        <button
          onClick={() => onStartCall("video")}
          className="p-2 rounded-md hover:bg-surface-2 text-muted-foreground hover:text-foreground transition-colors"
          title="Start video call"
        >
          <Video className="w-4 h-4" />
        </button>
        <Separator orientation="vertical" className="h-4 bg-border mx-1" />
        <button
          onClick={onSearchOpen}
          className="p-2 rounded-md hover:bg-surface-2 text-muted-foreground hover:text-foreground transition-colors"
          title="Search in channel"
        >
          <Search className="w-4 h-4" />
        </button>
        <button
          onClick={onToggleMembers}
          className="p-2 rounded-md hover:bg-surface-2 text-muted-foreground hover:text-foreground transition-colors"
          title="Members"
        >
          <Users className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
