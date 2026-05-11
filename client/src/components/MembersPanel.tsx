/*
 * MembersPanel — Nexus Chat
 * ─────────────────────────
 * Midnight Command: Side panel showing channel members with status
 */

import { useChat } from "@/contexts/ChatContext";
import UserAvatar from "./UserAvatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { X } from "lucide-react";
import type { User } from "@/lib/types";

interface MembersPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function MembersPanel({ isOpen, onClose }: MembersPanelProps) {
  const { users } = useChat();

  if (!isOpen) return null;

  const onlineUsers = users.filter((u) => u.status === "online");
  const awayUsers = users.filter((u) => u.status === "away");
  const dndUsers = users.filter((u) => u.status === "dnd");
  const offlineUsers = users.filter((u) => u.status === "offline");

  return (
    <div className="w-60 h-full border-l border-border bg-surface-0 flex flex-col shrink-0">
      <div className="h-[52px] px-4 flex items-center justify-between border-b border-border shrink-0">
        <h3 className="text-sm font-semibold">Members</h3>
        <button
          onClick={onClose}
          className="p-1 rounded hover:bg-surface-2 text-muted-foreground"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <ScrollArea className="flex-1 custom-scrollbar">
        <div className="p-3 space-y-4">
          {onlineUsers.length > 0 && (
            <MemberSection title="Online" count={onlineUsers.length} users={onlineUsers} />
          )}
          {awayUsers.length > 0 && (
            <MemberSection title="Away" count={awayUsers.length} users={awayUsers} />
          )}
          {dndUsers.length > 0 && (
            <MemberSection title="Do Not Disturb" count={dndUsers.length} users={dndUsers} />
          )}
          {offlineUsers.length > 0 && (
            <MemberSection title="Offline" count={offlineUsers.length} users={offlineUsers} />
          )}
        </div>
      </ScrollArea>
    </div>
  );
}

function MemberSection({
  title,
  count,
  users,
}: {
  title: string;
  count: number;
  users: User[];
}) {
  return (
    <div>
      <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-1 mb-1.5">
        {title} — {count}
      </p>
      <div className="space-y-0.5">
        {users.map((user) => (
          <div
            key={user.id}
            className="flex items-center gap-2.5 px-2 py-1.5 rounded-md hover:bg-surface-2 transition-colors"
          >
            <UserAvatar user={user} size="sm" showStatus />
            <div className="flex-1 min-w-0">
              <p className="text-sm truncate">{user.display_name}</p>
              {user.status_text && (
                <p className="text-[10px] text-muted-foreground truncate font-mono">
                  {user.status_text}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
