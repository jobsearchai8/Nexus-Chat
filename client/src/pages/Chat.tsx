/*
 * Chat Page — Nexus Networks
 * ──────────────────────────
 * Facebook Messenger-style layout
 *
 * MOBILE (<768px):
 *   Full-screen conversation list → tap → full-screen chat
 *   Back arrow returns to conversation list
 *
 * DESKTOP (≥768px):
 *   Two-panel: Conversation list (360px) | Chat area (flex)
 */

import { useState, useRef, useEffect } from "react";
import { useChat } from "@/contexts/ChatContext";
import { useIsMobile } from "@/hooks/useMobile";
import Sidebar from "@/components/Sidebar";
import ChannelHeader from "@/components/ChannelHeader";
import MessageBubble from "@/components/MessageBubble";
import MessageComposer from "@/components/MessageComposer";
import MembersPanel from "@/components/MembersPanel";
import SearchDialog from "@/components/SearchDialog";
import VideoCallModal from "@/components/VideoCallModal";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageCircle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";

export default function Chat() {
  const { currentChannel, setCurrentChannel, messages, isLoadingMessages } = useChat();
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const [showMembers, setShowMembers] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [callOpen, setCallOpen] = useState(false);
  const [callType, setCallType] = useState<"voice" | "video">("voice");
  const [mobileShowChat, setMobileShowChat] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // When a channel is selected on mobile, show the chat view
  useEffect(() => {
    if (isMobile && currentChannel) {
      setMobileShowChat(true);
    }
  }, [currentChannel, isMobile]);

  const handleStartCall = (type: "voice" | "video") => {
    setCallType(type);
    setCallOpen(true);
  };

  const handleMobileBack = () => {
    setMobileShowChat(false);
  };

  const handleMobileSelectChannel = () => {
    setMobileShowChat(true);
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

  // Empty state when no channel selected (desktop only)
  const renderEmptyState = () => (
    <div className="flex-1 flex flex-col items-center justify-center text-center px-6 bg-white dark:bg-[#0D1117]">
      <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center mb-5 mx-auto shadow-lg">
        <MessageCircle className="w-10 h-10 text-white" />
      </div>
      <h2 className="text-[22px] font-semibold text-gray-900 dark:text-[#E6EDF3] mb-2">Your Messages</h2>
      <p className="text-[15px] text-gray-500 dark:text-[#8B949E] max-w-sm">
        Select a conversation to start chatting
      </p>
    </div>
  );

  // Chat messages area
  const renderChatArea = () => {
    if (!currentChannel) return renderEmptyState();

    return (
      <div className="flex-1 flex flex-col min-w-0 bg-white dark:bg-[#0D1117]">
        <ChannelHeader
          onStartCall={handleStartCall}
          onToggleMembers={() => setShowMembers(!showMembers)}
          onSearchOpen={() => setSearchOpen(true)}
          onBack={isMobile ? handleMobileBack : undefined}
          isMobile={isMobile}
        />

        <div className="flex-1 flex overflow-hidden">
          {/* Messages area */}
          <div className="flex-1 flex flex-col min-w-0">
            <ScrollArea className="flex-1">
              <div className={cn("px-3 md:px-4 py-4", isMobile && "pb-2")}>
                {/* Messages */}
                {isLoadingMessages ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-bounce" />
                      <div className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-bounce [animation-delay:0.15s]" />
                      <div className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-bounce [animation-delay:0.3s]" />
                    </div>
                  </div>
                ) : messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-center px-6">
                    <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-[#161B22] flex items-center justify-center mb-4">
                      <MessageCircle className="w-8 h-8 text-gray-400 dark:text-[#8B949E]" />
                    </div>
                    <p className="text-[15px] text-gray-500 dark:text-[#8B949E] font-medium">
                      No messages yet
                    </p>
                    <p className="text-[13px] text-gray-400 dark:text-[#484F58] mt-1">
                      Say hello to start the conversation!
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

          {/* Members panel — desktop only inline */}
          {!isMobile && (
            <MembersPanel
              isOpen={showMembers}
              onClose={() => setShowMembers(false)}
              isMobile={false}
            />
          )}
        </div>
      </div>
    );
  };

  // ─── MOBILE LAYOUT ───
  if (isMobile) {
    return (
      <div className="h-[100dvh] flex flex-col overflow-hidden bg-white dark:bg-[#0D1117]">
        {/* Conversation list OR Chat view — full screen each */}
        {mobileShowChat && currentChannel ? (
          <div className="flex-1 flex flex-col">
            {renderChatArea()}
          </div>
        ) : (
          <div className="flex-1 flex flex-col">
            <Sidebar
              onSearchOpen={() => setSearchOpen(true)}
              onSelectChannel={handleMobileSelectChannel}
              isMobile={true}
            />
          </div>
        )}

        {/* Mobile members sheet */}
        <MembersPanel
          isOpen={showMembers}
          onClose={() => setShowMembers(false)}
          isMobile={true}
        />

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

  // ─── DESKTOP LAYOUT ───
  return (
    <div className="h-screen flex overflow-hidden bg-white dark:bg-[#0D1117]">
      {/* Conversation list — Messenger style */}
      <div className="w-[360px] shrink-0 border-r border-gray-200 dark:border-[#21262D]">
        <Sidebar
          onSearchOpen={() => setSearchOpen(true)}
          isMobile={false}
        />
      </div>

      {/* Main chat area */}
      <div className="flex-1 flex flex-col min-w-0">
        {renderChatArea()}
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
