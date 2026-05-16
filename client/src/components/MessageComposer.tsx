/*
 * MessageComposer — Nexus Networks
 * ────────────────────────────────
 * Facebook Messenger-style message input
 * Rounded pill input, plus/attach on left, send/like on right
 * Functional emoji picker via @emoji-mart
 */

import { useState, useRef, useCallback, useEffect } from "react";
import { useChat } from "@/contexts/ChatContext";
import Picker from "@emoji-mart/react";
import data from "@emoji-mart/data";
import {
  Plus,
  Send,
  Smile,
  ThumbsUp,
  X,
  FileIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { toast } from "sonner";

export default function MessageComposer() {
  const { currentChannel, sendMessage, setTyping } = useChat();
  const [content, setContent] = useState("");
  const [attachedFile, setAttachedFile] = useState<File | null>(null);
  const [attachedPreview, setAttachedPreview] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [showEmoji, setShowEmoji] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const emojiRef = useRef<HTMLDivElement>(null);

  // Close emoji picker on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (emojiRef.current && !emojiRef.current.contains(e.target as Node)) {
        setShowEmoji(false);
      }
    };
    if (showEmoji) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showEmoji]);

  const handleEmojiSelect = (emoji: any) => {
    const sym = emoji.native;
    if (!sym) return;
    setContent((prev) => prev + sym);
    // Focus textarea after inserting emoji
    textareaRef.current?.focus();
  };

  const handleSend = useCallback(async () => {
    if (!currentChannel || isSending) return;
    if (!content.trim() && !attachedFile) return;

    setIsSending(true);
    setShowEmoji(false);
    try {
      if (attachedFile) {
        if (isSupabaseConfigured) {
          const fileExt = attachedFile.name.split(".").pop();
          const fileName = `${Date.now()}.${fileExt}`;
          const { data, error } = await supabase!.storage
            .from("chat-files")
            .upload(fileName, attachedFile);

          if (error) throw error;

          const { data: urlData } = supabase!.storage
            .from("chat-files")
            .getPublicUrl(fileName);

          const type = attachedFile.type.startsWith("image/") ? "image" : "file";
          await sendMessage(content || attachedFile.name, type as any, {
            url: urlData.publicUrl,
            name: attachedFile.name,
            size: attachedFile.size,
            type: attachedFile.type,
          });
        } else {
          const type = attachedFile.type.startsWith("image/") ? "image" : "file";
          await sendMessage(content || attachedFile.name, type as any, {
            url: attachedPreview || "#",
            name: attachedFile.name,
            size: attachedFile.size,
            type: attachedFile.type,
          });
        }
        clearAttachment();
      } else {
        await sendMessage(content.trim());
      }
      setContent("");
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to send message");
    } finally {
      setIsSending(false);
    }
  }, [content, attachedFile, currentChannel, isSending, sendMessage, attachedPreview]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);
    const textarea = e.target;
    textarea.style.height = "auto";
    textarea.style.height = Math.min(textarea.scrollHeight, 120) + "px";
    if (currentChannel) {
      setTyping(currentChannel.id);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      toast.error("File must be under 10MB");
      return;
    }
    setAttachedFile(file);
    if (file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = () => setAttachedPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const clearAttachment = () => {
    setAttachedFile(null);
    setAttachedPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  if (!currentChannel) return null;

  const hasContent = content.trim().length > 0 || attachedFile;

  return (
    <div className="shrink-0 border-t border-gray-100 dark:border-[#21262D] bg-white dark:bg-[#0D1117] px-3 py-2 relative">
      {/* Emoji Picker Popover */}
      {showEmoji && (
        <div
          ref={emojiRef}
          className="absolute bottom-full right-4 mb-2 z-50 shadow-xl rounded-xl overflow-hidden"
        >
          <Picker
            data={data}
            onEmojiSelect={handleEmojiSelect}
            theme="light"
            previewPosition="none"
            skinTonePosition="search"
            maxFrequentRows={2}
            perLine={8}
          />
        </div>
      )}

      {/* Attached file preview */}
      {attachedFile && (
        <div className="mb-2 flex items-center gap-2 bg-gray-50 dark:bg-[#161B22] rounded-xl px-3 py-2">
          {attachedPreview ? (
            <img src={attachedPreview} alt="" className="w-12 h-12 rounded-lg object-cover" />
          ) : (
            <div className="w-10 h-10 rounded-lg bg-gray-200 dark:bg-[#21262D] flex items-center justify-center">
              <FileIcon className="w-5 h-5 text-gray-500 dark:text-[#8B949E]" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-medium text-gray-700 dark:text-[#E6EDF3] truncate">{attachedFile.name}</p>
            <p className="text-[11px] text-gray-400 dark:text-[#484F58]">
              {(attachedFile.size / 1024).toFixed(0)} KB
            </p>
          </div>
          <button onClick={clearAttachment} className="w-7 h-7 rounded-full hover:bg-gray-200 dark:hover:bg-[#21262D] flex items-center justify-center">
            <X className="w-4 h-4 text-gray-500 dark:text-[#8B949E]" />
          </button>
        </div>
      )}

      {/* Input row */}
      <div className="flex items-end gap-2">
        {/* Attach button */}
        <button
          onClick={() => fileInputRef.current?.click()}
          className="w-9 h-9 rounded-full flex items-center justify-center text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-colors shrink-0 mb-0.5"
        >
          <Plus className="w-5 h-5" />
        </button>

        {/* Text input — Messenger pill style */}
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={content}
            onChange={handleInput}
            onKeyDown={handleKeyDown}
            placeholder="Aa"
            rows={1}
            className="w-full resize-none bg-gray-100 dark:bg-[#303030] rounded-[20px] px-4 pr-10 py-2.5 text-[15px] text-gray-900 dark:text-[#E6EDF3] placeholder:text-gray-400 dark:placeholder:text-[#6E7681] outline-none focus:ring-2 focus:ring-blue-500/20 transition-all max-h-[120px] leading-[1.35]"
            style={{ height: "auto", minHeight: "40px" }}
          />
          {/* Emoji toggle button inside input */}
          <button
            onClick={() => setShowEmoji((prev) => !prev)}
            className={cn(
              "absolute right-3 bottom-2.5 transition-colors",
              showEmoji
                ? "text-blue-600 dark:text-blue-400"
                : "text-blue-500 hover:text-blue-600"
            )}
          >
            <Smile className="w-5 h-5" />
          </button>
        </div>

        {/* Send or Like button */}
        {hasContent ? (
          <button
            onClick={handleSend}
            disabled={isSending}
            className="w-9 h-9 rounded-full flex items-center justify-center text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-colors shrink-0 mb-0.5 disabled:opacity-50"
          >
            <Send className="w-5 h-5" />
          </button>
        ) : (
          <button className="w-9 h-9 rounded-full flex items-center justify-center text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-colors shrink-0 mb-0.5">
            <ThumbsUp className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        onChange={handleFileSelect}
        accept="image/*,.pdf,.doc,.docx,.txt,.zip"
      />
    </div>
  );
}
