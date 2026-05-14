/*
 * MessageBubble — Nexus Networks
 * ──────────────────────────────
 * Facebook Messenger-style message bubbles
 * - Own messages: blue background, white text, right-aligned
 * - Others: light gray background, dark text, left-aligned with avatar
 * - Rounded pill shape with tail
 */

import { useState, useRef, useCallback } from "react";
import { useChat } from "@/contexts/ChatContext";
import { useAuth } from "@/contexts/AuthContext";
import UserAvatar from "./UserAvatar";
import type { Message } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Copy, Pencil, Trash2, Check, FileIcon, Download } from "lucide-react";
import { toast } from "sonner";

interface MessageBubbleProps {
  message: Message;
  isGrouped: boolean;
}

export default function MessageBubble({ message, isGrouped }: MessageBubbleProps) {
  const { user } = useAuth();
  const { editMessage, deleteMessage, users } = useChat();
  const [hovered, setHovered] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editContent, setEditContent] = useState(message.content);

  const isOwn = user?.id === message.user_id;
  const sender = message.user || users.find((u) => u.id === message.user_id);

  // System messages
  if (message.type === "system") {
    return (
      <div className="flex justify-center py-2 px-4">
        <span className="text-[12px] text-gray-400 dark:text-[#484F58] bg-gray-50 dark:bg-[#161B22] px-3 py-1 rounded-full">
          {message.content}
        </span>
      </div>
    );
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    toast.success("Copied");
  };

  const handleEdit = async () => {
    if (editContent.trim() && editContent !== message.content) {
      await editMessage(message.id, editContent.trim());
      toast.success("Edited");
    }
    setEditing(false);
  };

  const handleDelete = async () => {
    await deleteMessage(message.id);
    toast.success("Deleted");
  };

  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString([], {
      hour: "numeric",
      minute: "2-digit",
    });
  };

  // Editing mode
  if (editing) {
    return (
      <div className={cn("flex gap-2 px-3 md:px-4 py-1", isOwn ? "justify-end" : "justify-start")}>
        <div className="max-w-[85%] md:max-w-[60%] flex items-center gap-2">
          <input
            type="text"
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleEdit();
              if (e.key === "Escape") setEditing(false);
            }}
            className="flex-1 bg-gray-100 dark:bg-[#161B22] border border-gray-200 dark:border-[#30363D] rounded-full px-4 py-2 text-[15px] text-gray-900 dark:text-[#E6EDF3] outline-none focus:ring-2 focus:ring-blue-500/30"
            autoFocus
          />
          <button onClick={handleEdit} className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white shrink-0">
            <Check className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  // Render content
  const renderContent = () => {
    if (message.type === "image" && message.file_url) {
      return (
        <div>
          {message.content && (
            <p className="text-[15px] leading-relaxed mb-2">{message.content}</p>
          )}
          <img
            src={message.file_url}
            alt={message.file_name || "Image"}
            className="max-w-[260px] rounded-xl"
            loading="lazy"
          />
        </div>
      );
    }

    if (message.type === "file" && message.file_url) {
      return (
        <div>
          {message.content && (
            <p className="text-[15px] leading-relaxed mb-2">{message.content}</p>
          )}
          <a
            href={message.file_url}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              "flex items-center gap-2 rounded-lg p-2.5 transition-colors",
              isOwn ? "bg-blue-600 hover:bg-blue-700" : "bg-gray-200 dark:bg-[#21262D] hover:bg-gray-300 dark:hover:bg-[#282E36]"
            )}
          >
            <FileIcon className="w-4 h-4 shrink-0" />
            <span className="text-[13px] truncate">{message.file_name}</span>
            <Download className="w-3.5 h-3.5 shrink-0 opacity-60" />
          </a>
        </div>
      );
    }

    // Text message with URL detection
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const parts = message.content.split(urlRegex);

    return (
      <p className="text-[15px] leading-[1.4] whitespace-pre-wrap break-words">
        {parts.map((part, i) =>
          urlRegex.test(part) ? (
            <a
              key={i}
              href={part}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(
                "underline underline-offset-2 break-all",
                isOwn ? "text-white/90" : "text-blue-500"
              )}
            >
              {part}
            </a>
          ) : (
            <span key={i}>{part}</span>
          )
        )}
        {message.edited_at && (
          <span className={cn(
            "text-[10px] ml-1.5 italic",
            isOwn ? "text-blue-200" : "text-gray-400 dark:text-[#484F58]"
          )}>
            edited
          </span>
        )}
      </p>
    );
  };

  return (
    <div
      className={cn(
        "flex gap-2 px-3 md:px-4 group",
        isOwn ? "justify-end" : "justify-start",
        isGrouped ? "py-[1px]" : "py-1"
      )}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Avatar — left side for others */}
      {!isOwn && (
        <div className="w-7 shrink-0 self-end">
          {!isGrouped ? (
            <UserAvatar user={sender} size="xs" />
          ) : (
            <div className="w-7" />
          )}
        </div>
      )}

      {/* Bubble + actions */}
      <div className={cn(
        "flex items-center gap-1",
        isOwn && "flex-row-reverse"
      )}>
        {/* Message bubble */}
        <div className="flex flex-col max-w-[75vw] md:max-w-[420px]">
          {/* Sender name */}
          {!isOwn && !isGrouped && (
            <span className="text-[11px] font-medium text-gray-500 dark:text-[#8B949E] mb-0.5 ml-2">
              {sender?.display_name || "Unknown"}
            </span>
          )}

          <div
            className={cn(
              "px-3 py-[7px] select-text",
              isOwn
                ? "bg-[#0084FF] text-white rounded-[18px]"
                : "bg-[#F0F0F0] dark:bg-[#303030] text-gray-900 dark:text-[#E6EDF3] rounded-[18px]",
              // Tail adjustments
              !isGrouped && isOwn && "rounded-br-[4px]",
              !isGrouped && !isOwn && "rounded-bl-[4px]",
              isGrouped && isOwn && "rounded-r-[18px]",
              isGrouped && !isOwn && "rounded-l-[18px]"
            )}
          >
            {renderContent()}
          </div>

          {/* Timestamp — only when not grouped */}
          {!isGrouped && (
            <span className={cn(
              "text-[10px] text-gray-400 dark:text-[#6E7681] mt-0.5 px-2",
              isOwn ? "text-right" : "text-left"
            )}>
              {formatTime(message.created_at)}
            </span>
          )}
        </div>

        {/* Hover actions */}
        <div className={cn(
          "flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity",
        )}>
          <button
            onClick={handleCopy}
            className="w-6 h-6 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-600 dark:hover:text-[#E6EDF3] hover:bg-gray-100 dark:hover:bg-[#21262D] transition-colors"
            title="Copy"
          >
            <Copy className="w-3 h-3" />
          </button>
          {isOwn && (
            <>
              <button
                onClick={() => { setEditContent(message.content); setEditing(true); }}
                className="w-6 h-6 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-600 dark:hover:text-[#E6EDF3] hover:bg-gray-100 dark:hover:bg-[#21262D] transition-colors"
                title="Edit"
              >
                <Pencil className="w-3 h-3" />
              </button>
              <button
                onClick={handleDelete}
                className="w-6 h-6 rounded-full flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                title="Delete"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
