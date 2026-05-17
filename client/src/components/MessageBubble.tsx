/*
 * MessageBubble — Nexus Networks
 * ──────────────────────────────
 * Facebook Messenger-style message bubbles with emoji reactions
 * - Own messages: blue background, white text, right-aligned
 * - Others: light gray background, dark text, left-aligned with avatar
 * - Quick emoji reactions on hover (desktop) / long-press (mobile)
 * - Reaction pills displayed below the bubble
 */

import { useState, useRef, useCallback, useEffect } from "react";
import { useChat } from "@/contexts/ChatContext";
import { useAuth } from "@/contexts/AuthContext";
import UserAvatar from "./UserAvatar";
import type { Message } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Copy, Pencil, Trash2, Check, FileIcon, Download, SmilePlus } from "lucide-react";
import { toast } from "sonner";

const QUICK_EMOJIS = ["❤️", "😂", "😮", "😢", "😡", "👍"];

interface MessageBubbleProps {
  message: Message;
  isGrouped: boolean;
}

export default function MessageBubble({ message, isGrouped }: MessageBubbleProps) {
  const { user } = useAuth();
  const { editMessage, deleteMessage, users, toggleReaction } = useChat();
  const [hovered, setHovered] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editContent, setEditContent] = useState(message.content);
  const [showReactionPicker, setShowReactionPicker] = useState(false);
  const [longPressTimer, setLongPressTimer] = useState<ReturnType<typeof setTimeout> | null>(null);
  const bubbleRef = useRef<HTMLDivElement>(null);
  const reactionRef = useRef<HTMLDivElement>(null);

  const isOwn = user?.id === message.user_id;
  const sender = message.user || users.find((u) => u.id === message.user_id);
  const reactions = message.reactions || [];

  // Close reaction picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        reactionRef.current &&
        !reactionRef.current.contains(e.target as Node) &&
        bubbleRef.current &&
        !bubbleRef.current.contains(e.target as Node)
      ) {
        setShowReactionPicker(false);
      }
    };
    if (showReactionPicker) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [showReactionPicker]);

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

  const handleReaction = (emoji: string) => {
    toggleReaction(message.id, emoji);
    setShowReactionPicker(false);
  };

  // Long press for mobile
  const handleTouchStart = () => {
    const timer = setTimeout(() => {
      setShowReactionPicker(true);
    }, 500);
    setLongPressTimer(timer);
  };

  const handleTouchEnd = () => {
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      setLongPressTimer(null);
    }
  };

  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString([], {
      hour: "numeric",
      minute: "2-digit",
    });
  };

  // Group reactions by emoji
  const groupedReactions = reactions.reduce<
    Record<string, { emoji: string; count: number; userIds: string[]; hasOwn: boolean }>
  >((acc, r) => {
    if (!acc[r.emoji]) {
      acc[r.emoji] = { emoji: r.emoji, count: 0, userIds: [], hasOwn: false };
    }
    acc[r.emoji].count++;
    acc[r.emoji].userIds.push(r.user_id);
    if (r.user_id === user?.id) acc[r.emoji].hasOwn = true;
    return acc;
  }, {});

  const reactionEntries = Object.values(groupedReactions);

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
        "flex gap-2 px-3 md:px-4 group relative",
        isOwn ? "justify-end" : "justify-start",
        isGrouped ? "py-[1px]" : "py-1"
      )}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => { setHovered(false); }}
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
        "flex items-center gap-1 relative",
        isOwn && "flex-row-reverse"
      )}>
        {/* Message bubble */}
        <div className="flex flex-col max-w-[75vw] md:max-w-[420px] relative">
          {/* Sender name */}
          {!isOwn && !isGrouped && (
            <span className="text-[11px] font-medium text-gray-500 dark:text-[#8B949E] mb-0.5 ml-2">
              {sender?.display_name || "Unknown"}
            </span>
          )}

          <div
            ref={bubbleRef}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
            onTouchCancel={handleTouchEnd}
            className={cn(
              "px-3 py-[7px] select-text relative",
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

          {/* Reaction pills below the bubble */}
          {reactionEntries.length > 0 && (
            <div className={cn(
              "flex flex-wrap gap-1 mt-0.5 px-1",
              isOwn ? "justify-end" : "justify-start"
            )}>
              {reactionEntries.map((r) => (
                <button
                  key={r.emoji}
                  onClick={() => handleReaction(r.emoji)}
                  className={cn(
                    "inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[12px] border transition-all",
                    "hover:scale-105 active:scale-95",
                    r.hasOwn
                      ? "bg-blue-50 dark:bg-blue-500/20 border-blue-200 dark:border-blue-500/40 text-blue-600 dark:text-blue-300"
                      : "bg-gray-50 dark:bg-[#21262D] border-gray-200 dark:border-[#30363D] text-gray-600 dark:text-[#8B949E]"
                  )}
                >
                  <span className="text-[13px]">{r.emoji}</span>
                  {r.count > 1 && <span className="text-[11px] font-medium">{r.count}</span>}
                </button>
              ))}
            </div>
          )}

          {/* Timestamp — only when not grouped */}
          {!isGrouped && (
            <span className={cn(
              "text-[10px] text-gray-400 dark:text-[#6E7681] mt-0.5 px-2",
              isOwn ? "text-right" : "text-left"
            )}>
              {formatTime(message.created_at)}
            </span>
          )}

          {/* Quick reaction picker — appears above the bubble */}
          {showReactionPicker && (
            <div
              ref={reactionRef}
              className={cn(
                "absolute bottom-full mb-1 z-50",
                "bg-white dark:bg-[#1C2128] rounded-full shadow-lg border border-gray-200 dark:border-[#30363D]",
                "flex items-center gap-0.5 px-1.5 py-1",
                "animate-in fade-in zoom-in-95 duration-150",
                isOwn ? "right-0" : "left-0"
              )}
            >
              {QUICK_EMOJIS.map((emoji) => {
                const hasReacted = reactions.some(
                  (r) => r.emoji === emoji && r.user_id === user?.id
                );
                return (
                  <button
                    key={emoji}
                    onClick={() => handleReaction(emoji)}
                    className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center text-[18px]",
                      "hover:bg-gray-100 dark:hover:bg-[#21262D] hover:scale-125",
                      "transition-all duration-150 active:scale-90",
                      hasReacted && "bg-blue-50 dark:bg-blue-500/20"
                    )}
                  >
                    {emoji}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Hover actions — desktop only */}
        <div className={cn(
          "hidden md:flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity",
        )}>
          {/* Reaction button */}
          <button
            onClick={() => setShowReactionPicker(!showReactionPicker)}
            className="w-6 h-6 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-600 dark:hover:text-[#E6EDF3] hover:bg-gray-100 dark:hover:bg-[#21262D] transition-colors"
            title="React"
          >
            <SmilePlus className="w-3.5 h-3.5" />
          </button>
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
