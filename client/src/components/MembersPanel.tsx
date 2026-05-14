/*
 * MembersPanel — Nexus Networks
 * ─────────────────────────────
 * Messenger-style members panel
 * Desktop: Right side panel
 * Mobile: Sheet drawer
 */

import { useChat } from "@/contexts/ChatContext";
import UserAvatar from "./UserAvatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { X, Search } from "lucide-react";
import { useState } from "react";
import type { User } from "@/lib/types";
import { cn } from "@/lib/utils";

interface MembersPanelProps {
  isOpen: boolean;
  onClose: () => void;
  isMobile?: boolean;
}

export default function MembersPanel({ isOpen, onClose, isMobile }: MembersPanelProps) {
  const { users } = useChat();
  const [searchQuery, setSearchQuery] = useState("");

  const filteredUsers = searchQuery.trim()
    ? users.filter((u) =>
        u.display_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.username.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : users;

  const onlineUsers = filteredUsers.filter((u) => u.status === "online");
  const offlineUsers = filteredUsers.filter((u) => u.status !== "online");

  const memberContent = (
    <>
      {/* Search */}
      <div className="px-4 pb-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-[#484F58]" />
          <input
            type="text"
            placeholder="Search members..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-9 pl-9 pr-3 bg-gray-100 dark:bg-[#161B22] rounded-full text-[14px] text-gray-900 dark:text-[#E6EDF3] placeholder:text-gray-400 dark:placeholder:text-[#484F58] outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
          />
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="px-3 pb-4 space-y-4">
          {onlineUsers.length > 0 && (
            <MemberSection title="Active" count={onlineUsers.length} users={onlineUsers} />
          )}
          {offlineUsers.length > 0 && (
            <MemberSection title="Offline" count={offlineUsers.length} users={offlineUsers} />
          )}
          {filteredUsers.length === 0 && (
            <div className="text-center py-8">
              <p className="text-[14px] text-gray-500 dark:text-[#8B949E]">No members found</p>
            </div>
          )}
        </div>
      </ScrollArea>
    </>
  );

  // Mobile: use Sheet (drawer)
  if (isMobile) {
    return (
      <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <SheetContent side="right" className="bg-white dark:bg-[#0D1117] border-gray-200 dark:border-[#21262D] p-0 w-[85%] max-w-sm">
          <SheetHeader className="px-4 py-3 border-b border-gray-100 dark:border-[#21262D]">
            <SheetTitle className="text-[16px] font-semibold text-gray-900 dark:text-[#E6EDF3]">
              Members ({users.length})
            </SheetTitle>
          </SheetHeader>
          <div className="flex flex-col h-[calc(100%-52px)] pt-3">
            {memberContent}
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  // Desktop: side panel
  if (!isOpen) return null;

  return (
    <div className="w-72 h-full border-l border-gray-100 dark:border-[#21262D] bg-white dark:bg-[#0D1117] flex flex-col shrink-0">
      <div className="h-14 px-4 flex items-center justify-between border-b border-gray-100 dark:border-[#21262D] shrink-0">
        <h3 className="text-[15px] font-semibold text-gray-900 dark:text-[#E6EDF3]">Members ({users.length})</h3>
        <button
          onClick={onClose}
          className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-600 dark:text-[#8B949E] dark:hover:text-[#E6EDF3] hover:bg-gray-100 dark:hover:bg-[#161B22] transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
      <div className="flex flex-col flex-1 pt-3">
        {memberContent}
      </div>
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
      <p className="text-[12px] font-semibold text-gray-400 dark:text-[#484F58] uppercase tracking-wider px-2 mb-2">
        {title} — {count}
      </p>
      <div className="space-y-0.5">
        {users.map((user) => (
          <div
            key={user.id}
            className="flex items-center gap-3 px-2 py-2 rounded-xl hover:bg-gray-50 dark:hover:bg-[#161B22] transition-colors"
          >
            <UserAvatar user={user} size="sm" showStatus />
            <div className="flex-1 min-w-0">
              <p className="text-[14px] text-gray-900 dark:text-[#E6EDF3] truncate font-medium">{user.display_name}</p>
              {user.status_text && (
                <p className="text-[12px] text-gray-500 dark:text-[#8B949E] truncate">
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
