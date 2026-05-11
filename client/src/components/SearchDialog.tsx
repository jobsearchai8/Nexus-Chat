/*
 * SearchDialog — Nexus Chat
 * ─────────────────────────
 * Midnight Command: Spotlight-style command palette (CMD+K)
 */

import { useState, useEffect, useCallback } from "react";
import { useChat } from "@/contexts/ChatContext";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Search, Hash, MessageSquare, Users, ArrowRight } from "lucide-react";
import type { Message, Channel } from "@/lib/types";
import { cn } from "@/lib/utils";

interface SearchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function SearchDialog({ open, onOpenChange }: SearchDialogProps) {
  const { channels, searchMessages, setCurrentChannel } = useChat();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Message[]>([]);
  const [filteredChannels, setFilteredChannels] = useState<Channel[]>([]);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setFilteredChannels([]);
      return;
    }

    const lowerQuery = query.toLowerCase();
    setFilteredChannels(
      channels.filter(
        (c) =>
          c.name.toLowerCase().includes(lowerQuery) ||
          c.description?.toLowerCase().includes(lowerQuery)
      )
    );
    setResults(searchMessages(query).slice(0, 10));
  }, [query, channels, searchMessages]);

  const handleChannelSelect = (channel: Channel) => {
    setCurrentChannel(channel);
    onOpenChange(false);
    setQuery("");
  };

  // Keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        onOpenChange(!open);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onOpenChange]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-surface-1 border-border p-0 max-w-lg gap-0 [&>button]:hidden">
        {/* Search input */}
        <div className="flex items-center gap-3 px-4 border-b border-border">
          <Search className="w-4 h-4 text-muted-foreground shrink-0" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search channels, messages, or people..."
            className="flex-1 h-12 bg-transparent text-sm outline-none placeholder:text-muted-foreground/50"
            autoFocus
          />
          <kbd className="text-[10px] font-mono text-muted-foreground bg-surface-2 px-1.5 py-0.5 rounded border border-border">
            ESC
          </kbd>
        </div>

        {/* Results */}
        <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
          {!query.trim() ? (
            <div className="p-6 text-center">
              <p className="text-sm text-muted-foreground">
                Type to search channels, messages, or people
              </p>
              <p className="text-xs text-muted-foreground/50 mt-1 font-mono">
                Tip: Use ⌘K to open this anytime
              </p>
            </div>
          ) : (
            <>
              {/* Channel results */}
              {filteredChannels.length > 0 && (
                <div className="p-2">
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-2 py-1">
                    Channels
                  </p>
                  {filteredChannels.map((channel) => (
                    <button
                      key={channel.id}
                      onClick={() => handleChannelSelect(channel)}
                      className="w-full flex items-center gap-3 px-3 py-2 rounded-md hover:bg-surface-2 transition-colors text-left"
                    >
                      {channel.type === "channel" ? (
                        <Hash className="w-4 h-4 text-muted-foreground" />
                      ) : channel.type === "group" ? (
                        <Users className="w-4 h-4 text-muted-foreground" />
                      ) : (
                        <MessageSquare className="w-4 h-4 text-muted-foreground" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{channel.name}</p>
                        {channel.description && (
                          <p className="text-xs text-muted-foreground truncate">
                            {channel.description}
                          </p>
                        )}
                      </div>
                      <ArrowRight className="w-3.5 h-3.5 text-muted-foreground" />
                    </button>
                  ))}
                </div>
              )}

              {/* Message results */}
              {results.length > 0 && (
                <div className="p-2">
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-2 py-1">
                    Messages
                  </p>
                  {results.map((msg) => {
                    const channel = channels.find((c) => c.id === msg.channel_id);
                    return (
                      <button
                        key={msg.id}
                        onClick={() => {
                          if (channel) handleChannelSelect(channel);
                        }}
                        className="w-full flex items-start gap-3 px-3 py-2 rounded-md hover:bg-surface-2 transition-colors text-left"
                      >
                        <MessageSquare className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-medium">
                              {msg.user?.display_name}
                            </span>
                            <span className="text-[10px] text-muted-foreground font-mono">
                              in #{channel?.name}
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground truncate mt-0.5">
                            {msg.content}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}

              {filteredChannels.length === 0 && results.length === 0 && (
                <div className="p-6 text-center">
                  <p className="text-sm text-muted-foreground">
                    No results found for "{query}"
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
