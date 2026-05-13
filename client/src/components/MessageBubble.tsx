/*
 * MessageBubble — Nexus Networks
 * ──────────────────────────
 * Midnight Command: Compact message display with monospace timestamps
 */

import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useChat } from "@/contexts/ChatContext";
import UserAvatar from "./UserAvatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  MoreHorizontal,
  Pencil,
  Trash2,
  FileIcon,
  ImageIcon,
  Download,
  Reply,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import type { Message } from "@/lib/types";
import { cn } from "@/lib/utils";

interface MessageBubbleProps {
  message: Message;
  isGrouped: boolean;
}

export default function MessageBubble({ message, isGrouped }: MessageBubbleProps) {
  const { user } = useAuth();
  const { editMessage, deleteMessage } = useChat();
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(message.content);
  const [isHovered, setIsHovered] = useState(false);

  const isOwn = user?.id === message.user_id;
  const time = new Date(message.created_at);
  const timeStr = time.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  const dateStr = time.toLocaleDateString([], { month: "short", day: "numeric" });

  const handleEdit = async () => {
    if (editContent.trim() && editContent !== message.content) {
      await editMessage(message.id, editContent.trim());
    }
    setIsEditing(false);
  };

  const handleDelete = async () => {
    await deleteMessage(message.id);
  };

  const renderContent = () => {
    if (message.type === "system") {
      return (
        <div className="flex items-center justify-center py-2">
          <span className="text-xs text-muted-foreground font-mono bg-surface-2 px-3 py-1 rounded-full">
            {message.content}
          </span>
        </div>
      );
    }

    if (message.type === "image" && message.file_url) {
      return (
        <div className="mt-1">
          {message.content && <p className="text-sm mb-2">{message.content}</p>}
          <div className="rounded-md overflow-hidden border border-border max-w-sm">
            <img
              src={message.file_url}
              alt={message.file_name || "Image"}
              className="max-w-full h-auto"
              loading="lazy"
            />
          </div>
        </div>
      );
    }

    if (message.type === "file" && message.file_url) {
      return (
        <div className="mt-1">
          {message.content && <p className="text-sm mb-2">{message.content}</p>}
          <a
            href={message.file_url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 bg-surface-2 border border-border rounded-md p-3 max-w-sm hover:bg-surface-3 transition-colors"
          >
            <FileIcon className="w-8 h-8 text-indigo shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{message.file_name}</p>
              <p className="text-xs text-muted-foreground font-mono">
                {message.file_size
                  ? `${(message.file_size / 1024).toFixed(1)} KB`
                  : "File"}
              </p>
            </div>
            <Download className="w-4 h-4 text-muted-foreground" />
          </a>
        </div>
      );
    }

    if (message.type === "call") {
      return (
        <div className="flex items-center gap-2 bg-surface-2 border border-border rounded-md p-3 max-w-sm mt-1">
          <div className="w-8 h-8 rounded-full bg-neon-green/20 flex items-center justify-center">
            <span className="text-neon-green text-lg">📞</span>
          </div>
          <div>
            <p className="text-sm font-medium">{message.content}</p>
            <p className="text-xs text-muted-foreground font-mono">Call ended</p>
          </div>
        </div>
      );
    }

    // Text message with URL detection
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const parts = message.content.split(urlRegex);

    return (
      <p className="text-sm leading-relaxed">
        {parts.map((part, i) =>
          urlRegex.test(part) ? (
            <a
              key={i}
              href={part}
              target="_blank"
              rel="noopener noreferrer"
              className="text-cyan-accent hover:underline break-all"
            >
              {part}
            </a>
          ) : (
            <span key={i}>{part}</span>
          )
        )}
        {message.edited_at && (
          <span className="text-[10px] text-muted-foreground ml-1 font-mono">
            (edited)
          </span>
        )}
      </p>
    );
  };

  if (message.type === "system") {
    return renderContent();
  }

  return (
    <div
      className={cn(
        "group relative flex gap-3 px-5 py-0.5 hover:bg-surface-1/50 transition-colors",
        !isGrouped && "mt-3 pt-2"
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Avatar or time gutter */}
      <div className="w-9 shrink-0 flex items-start justify-center">
        {!isGrouped ? (
          <UserAvatar user={message.user} size="sm" />
        ) : (
          <span
            className={cn(
              "text-[10px] font-mono text-muted-foreground/0 mt-1 transition-colors",
              isHovered && "text-muted-foreground/60"
            )}
          >
            {timeStr}
          </span>
        )}
      </div>

      {/* Message content */}
      <div className="flex-1 min-w-0">
        {!isGrouped && (
          <div className="flex items-baseline gap-2 mb-0.5">
            <span className="font-semibold text-sm">
              {message.user?.display_name || message.user?.username || "Unknown"}
            </span>
            <span className="text-[10px] font-mono text-muted-foreground">
              {dateStr} {timeStr}
            </span>
          </div>
        )}

        {isEditing ? (
          <div className="flex items-center gap-2">
            <Input
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleEdit();
                if (e.key === "Escape") setIsEditing(false);
              }}
              className="h-8 bg-surface-0 border-border text-sm"
              autoFocus
            />
            <Button size="sm" variant="ghost" onClick={() => setIsEditing(false)}>
              Cancel
            </Button>
            <Button
              size="sm"
              className="bg-indigo hover:bg-indigo/90 text-white"
              onClick={handleEdit}
            >
              Save
            </Button>
          </div>
        ) : (
          renderContent()
        )}
      </div>

      {/* Action buttons */}
      {isHovered && !isEditing && (
        <div className="absolute right-4 -top-3 flex items-center bg-surface-1 border border-border rounded-md shadow-lg">
          <button className="p-1.5 hover:bg-surface-2 rounded-l-md transition-colors text-muted-foreground hover:text-foreground">
            <Reply className="w-3.5 h-3.5" />
          </button>
          {isOwn && (
            <>
              <button
                onClick={() => {
                  setEditContent(message.content);
                  setIsEditing(true);
                }}
                className="p-1.5 hover:bg-surface-2 transition-colors text-muted-foreground hover:text-foreground"
              >
                <Pencil className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={handleDelete}
                className="p-1.5 hover:bg-surface-2 rounded-r-md transition-colors text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
