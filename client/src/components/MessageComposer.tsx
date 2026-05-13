/*
 * MessageComposer — Nexus Networks
 * ────────────────────────────
 * Midnight Command: Message input with file upload, emoji, and formatting
 */

import { useState, useRef, useCallback } from "react";
import { useChat } from "@/contexts/ChatContext";
import { Button } from "@/components/ui/button";
import {
  Paperclip,
  Send,
  Smile,
  Image as ImageIcon,
  X,
  FileIcon,
  Bold,
  Italic,
  Code,
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
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSend = useCallback(async () => {
    if ((!content.trim() && !attachedFile) || !currentChannel) return;

    setIsSending(true);
    try {
      if (attachedFile) {
        let fileUrl = "";
        let fileType: "image" | "file" = "file";

        if (attachedFile.type.startsWith("image/")) {
          fileType = "image";
        }

        if (isSupabaseConfigured) {
          const fileName = `${Date.now()}-${attachedFile.name}`;
          const { data, error } = await supabase!.storage
            .from("chat-files")
            .upload(fileName, attachedFile);

          if (error) throw error;

          const { data: urlData } = supabase!.storage
            .from("chat-files")
            .getPublicUrl(data.path);

          fileUrl = urlData.publicUrl;
        } else {
          // Demo mode: create a local URL
          fileUrl = URL.createObjectURL(attachedFile);
        }

        await sendMessage(content, fileType, {
          url: fileUrl,
          name: attachedFile.name,
          size: attachedFile.size,
          type: attachedFile.type,
        });
      } else {
        await sendMessage(content);
      }

      setContent("");
      setAttachedFile(null);
      setAttachedPreview(null);
      textareaRef.current?.focus();
    } catch (error: any) {
      toast.error(error.message || "Failed to send message");
    } finally {
      setIsSending(false);
    }
  }, [content, attachedFile, currentChannel, sendMessage]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      toast.error("File size must be less than 10MB");
      return;
    }

    setAttachedFile(file);

    if (file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (ev) => setAttachedPreview(ev.target?.result as string);
      reader.readAsDataURL(file);
    } else {
      setAttachedPreview(null);
    }
  };

  const removeAttachment = () => {
    setAttachedFile(null);
    setAttachedPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  if (!currentChannel) return null;

  return (
    <div className="px-5 pb-4">
      {/* Attachment preview */}
      {attachedFile && (
        <div className="mb-2 flex items-center gap-3 bg-surface-1 border border-border rounded-md p-2">
          {attachedPreview ? (
            <img
              src={attachedPreview}
              alt="Preview"
              className="w-12 h-12 rounded object-cover"
            />
          ) : (
            <div className="w-12 h-12 rounded bg-surface-2 flex items-center justify-center">
              <FileIcon className="w-5 h-5 text-muted-foreground" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm truncate">{attachedFile.name}</p>
            <p className="text-xs text-muted-foreground font-mono">
              {(attachedFile.size / 1024).toFixed(1)} KB
            </p>
          </div>
          <button
            onClick={removeAttachment}
            className="p-1 rounded hover:bg-surface-2 text-muted-foreground"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Composer */}
      <div className="bg-surface-1 border border-border rounded-lg overflow-hidden focus-within:border-indigo/50 focus-within:shadow-[0_0_0_1px_oklch(0.585_0.233_277_/_0.2)] transition-all">
        <textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => {
            setContent(e.target.value);
            if (currentChannel) setTyping(currentChannel.id);
          }}
          onKeyDown={handleKeyDown}
          placeholder={`Message #${currentChannel.name}`}
          className="w-full bg-transparent px-4 pt-3 pb-2 text-sm resize-none outline-none placeholder:text-muted-foreground/50 min-h-[44px] max-h-[200px]"
          rows={1}
          style={{
            height: "auto",
            minHeight: "44px",
          }}
          onInput={(e) => {
            const target = e.target as HTMLTextAreaElement;
            target.style.height = "auto";
            target.style.height = Math.min(target.scrollHeight, 200) + "px";
          }}
        />

        {/* Toolbar */}
        <div className="flex items-center justify-between px-2 pb-2">
          <div className="flex items-center gap-0.5">
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              onChange={handleFileSelect}
              accept="image/*,.pdf,.doc,.docx,.txt,.zip,.csv,.xls,.xlsx"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="p-1.5 rounded hover:bg-surface-2 text-muted-foreground hover:text-foreground transition-colors"
              title="Attach file"
            >
              <Paperclip className="w-4 h-4" />
            </button>
            <button
              className="p-1.5 rounded hover:bg-surface-2 text-muted-foreground hover:text-foreground transition-colors"
              title="Add emoji"
              onClick={() => toast.info("Emoji picker coming soon")}
            >
              <Smile className="w-4 h-4" />
            </button>
            <div className="w-px h-4 bg-border mx-1" />
            <button
              className="p-1.5 rounded hover:bg-surface-2 text-muted-foreground hover:text-foreground transition-colors"
              title="Bold"
              onClick={() => {
                setContent((prev) => prev + "**bold**");
                textareaRef.current?.focus();
              }}
            >
              <Bold className="w-4 h-4" />
            </button>
            <button
              className="p-1.5 rounded hover:bg-surface-2 text-muted-foreground hover:text-foreground transition-colors"
              title="Italic"
              onClick={() => {
                setContent((prev) => prev + "*italic*");
                textareaRef.current?.focus();
              }}
            >
              <Italic className="w-4 h-4" />
            </button>
            <button
              className="p-1.5 rounded hover:bg-surface-2 text-muted-foreground hover:text-foreground transition-colors"
              title="Code"
              onClick={() => {
                setContent((prev) => prev + "`code`");
                textareaRef.current?.focus();
              }}
            >
              <Code className="w-4 h-4" />
            </button>
          </div>

          <Button
            size="sm"
            className={cn(
              "h-8 px-3 transition-all",
              content.trim() || attachedFile
                ? "bg-indigo hover:bg-indigo/90 text-white"
                : "bg-surface-2 text-muted-foreground cursor-not-allowed"
            )}
            disabled={(!content.trim() && !attachedFile) || isSending}
            onClick={handleSend}
          >
            <Send className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      <p className="text-[10px] text-muted-foreground/50 mt-1.5 px-1 font-mono">
        Press Enter to send · Shift+Enter for new line
      </p>
    </div>
  );
}
