/*
 * Chat Page — Nexus Chat
 * ──────────────────────
 * Midnight Command: Main messaging interface
 * Three-panel layout: Sidebar | Messages | Members
 */

import { useState, useRef, useEffect } from "react";
import { useChat } from "@/contexts/ChatContext";
import Sidebar from "@/components/Sidebar";
import ChannelHeader from "@/components/ChannelHeader";
import MessageBubble from "@/components/MessageBubble";
import MessageComposer from "@/components/MessageComposer";
import MembersPanel from "@/components/MembersPanel";
import SearchDialog from "@/components/SearchDialog";
import VideoCallModal from "@/components/VideoCallModal";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageSquare } from "lucide-react";
import { motion } from "framer-motion";

const EMPTY_STATE_IMG = "https://d2xsxph8kpxj0f.cloudfront.net/310519663435216308/2fgaxJv4JtYGP66iKhZqNw/empty-state-dNzCeebGh52hLzHEE4AaP9.webp";

export default function Chat() {
  const { currentChannel, messages, isLoadingMessages } = useChat();
  const [showMembers, setShowMembers] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [callOpen, setCallOpen] = useState(false);
  const [callType, setCallType] = useState<"voice" | "video">("voice");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleStartCall = (type: "voice" | "video") => {
    setCallType(type);
    setCallOpen(true);
  };

  // Check if messages should be grouped (same user, within 5 minutes)
  const shouldGroup = (current: typeof messages[0], prev: typeof messages[0] | undefined) => {
    if (!prev) return false;
    if (current.user_id !== prev.user_id) return false;
    if (current.type === "system" || prev.type === "system") return false;
    const timeDiff =
      new Date(current.created_at).getTime() - new Date(prev.created_at).getTime();
    return timeDiff < 5 * 60 * 1000;
  };

  return (
    <div className="dark h-screen flex overflow-hidden bg-[#0D1117] text-[#E6EDF3]">
      {/* Sidebar */}
      <Sidebar onSearchOpen={() => setSearchOpen(true)} />

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {currentChannel ? (
          <>
            <ChannelHeader
              onStartCall={handleStartCall}
              onToggleMembers={() => setShowMembers(!showMembers)}
              onSearchOpen={() => setSearchOpen(true)}
            />

            <div className="flex-1 flex overflow-hidden">
              {/* Messages area */}
              <div className="flex-1 flex flex-col min-w-0">
                <ScrollArea className="flex-1 custom-scrollbar">
                  <div className="py-4">
                    {/* Channel welcome */}
                    <div className="px-5 pb-6 mb-2 border-b border-border">
                      <div className="w-12 h-12 rounded-lg bg-indigo/15 flex items-center justify-center mb-3">
                        <MessageSquare className="w-6 h-6 text-indigo" />
                      </div>
                      <h3 className="text-xl font-bold mb-1">
                        {currentChannel.type === "dm"
                          ? currentChannel.name
                          : `#${currentChannel.name}`}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {currentChannel.description ||
                          (currentChannel.type === "dm"
                            ? `This is the beginning of your conversation with ${currentChannel.name}`
                            : `This is the start of the #${currentChannel.name} channel`)}
                      </p>
                    </div>

                    {/* Messages */}
                    {isLoadingMessages ? (
                      <div className="flex items-center justify-center py-12">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <div className="w-2 h-2 rounded-full bg-indigo animate-bounce" />
                          <div className="w-2 h-2 rounded-full bg-indigo animate-bounce [animation-delay:0.1s]" />
                          <div className="w-2 h-2 rounded-full bg-indigo animate-bounce [animation-delay:0.2s]" />
                        </div>
                      </div>
                    ) : messages.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-12 text-center px-6">
                        <p className="text-sm text-muted-foreground">
                          No messages yet. Start the conversation!
                        </p>
                      </div>
                    ) : (
                      messages.map((message, index) => (
                        <MessageBubble
                          key={message.id}
                          message={message}
                          isGrouped={shouldGroup(message, messages[index - 1])}
                        />
                      ))
                    )}
                    <div ref={messagesEndRef} />
                  </div>
                </ScrollArea>

                <MessageComposer />
              </div>

              {/* Members panel */}
              <MembersPanel
                isOpen={showMembers}
                onClose={() => setShowMembers(false)}
              />
            </div>
          </>
        ) : (
          /* Empty state — no channel selected */
          <div className="flex-1 flex flex-col items-center justify-center text-center px-6">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              <img
                src={EMPTY_STATE_IMG}
                alt="Select a conversation"
                className="w-48 h-48 mx-auto mb-6 opacity-60"
              />
              <h2 className="text-xl font-bold mb-2">Welcome to Nexus Chat</h2>
              <p className="text-sm text-muted-foreground max-w-sm">
                Select a channel or direct message from the sidebar to start
                chatting. Use{" "}
                <kbd className="text-[10px] font-mono bg-surface-2 px-1.5 py-0.5 rounded border border-border">
                  ⌘K
                </kbd>{" "}
                to search.
              </p>
            </motion.div>
          </div>
        )}
      </div>

      {/* Search dialog */}
      <SearchDialog open={searchOpen} onOpenChange={setSearchOpen} />

      {/* Video call modal */}
      <VideoCallModal
        isOpen={callOpen}
        callType={callType}
        onClose={() => setCallOpen(false)}
      />
    </div>
  );
}
