/*
 * Chat Page — Nexus Networks
 * ───────────────────────────
 * Facebook Messenger-style layout:
 * - Bottom nav: Chats, AI Chats, Notifications, Menu
 * - Mobile: Full-screen transitions between tabs and conversations
 * - Desktop: Two-panel (left tabs + right active chat)
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
import AiChat from "@/components/AiChat";
import NotificationsTab from "@/components/NotificationsTab";
import MenuTab from "@/components/MenuTab";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageCircle, Bot, Bell, Menu } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";

type TabId = "chats" | "ai" | "notifications" | "menu";

export default function Chat() {
  const { currentChannel, setCurrentChannel, messages, isLoadingMessages } = useChat();
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const [activeTab, setActiveTab] = useState<TabId>("chats");
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
    if (isMobile && currentChannel && activeTab === "chats") {
      setMobileShowChat(true);
    }
  }, [currentChannel, isMobile, activeTab]);

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

  // Bottom navigation tabs
  const tabs: { id: TabId; icon: typeof MessageCircle; label: string }[] = [
    { id: "chats", icon: MessageCircle, label: "Chats" },
    { id: "ai", icon: Bot, label: "AI Chats" },
    { id: "notifications", icon: Bell, label: "Notifications" },
    { id: "menu", icon: Menu, label: "Menu" },
  ];

  // Render tab content for the left panel
  const renderTabContent = () => {
    switch (activeTab) {
      case "chats":
        return (
          <Sidebar
            onSearchOpen={() => setSearchOpen(true)}
            onSelectChannel={handleMobileSelectChannel}
            isMobile={isMobile}
          />
        );
      case "ai":
        return <AiChat />;
      case "notifications":
        return <NotificationsTab />;
      case "menu":
        return <MenuTab />;
    }
  };

  // Bottom Navigation Bar component
  const BottomNav = () => (
    <div className="shrink-0 border-t border-gray-100 dark:border-[#21262D] bg-white dark:bg-[#0D1117] px-2 pb-[env(safe-area-inset-bottom)]">
      <div className="flex items-center justify-around py-1.5">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                if (isMobile) setMobileShowChat(false);
              }}
              className={cn(
                "flex flex-col items-center gap-0.5 px-4 py-1.5 rounded-lg transition-colors min-w-[60px]",
                isActive
                  ? "text-blue-500"
                  : "text-gray-500 dark:text-[#8B949E] hover:text-gray-700 dark:hover:text-[#C9D1D9]"
              )}
            >
              <tab.icon
                className={cn("w-6 h-6 md:w-5 md:h-5", isActive && "fill-blue-500/10")}
                strokeWidth={isActive ? 2.2 : 1.8}
              />
              <span className={cn(
                "text-[10px]",
                isActive ? "font-semibold" : "font-medium"
              )}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );

  // Empty state when no channel selected (desktop only)
  const renderEmptyState = () => (
    <div className="flex-1 flex flex-col items-center justify-center text-center px-6 bg-gray-50 dark:bg-[#010409]">
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

  /* ─── MOBILE LAYOUT ─── */
  if (isMobile) {
    return (
      <div className="h-[100dvh] flex flex-col overflow-hidden bg-white dark:bg-[#0D1117]">
        {/* Show chat view or tab content */}
        {mobileShowChat && currentChannel && activeTab === "chats" ? (
          <div className="flex-1 flex flex-col">
            {renderChatArea()}
          </div>
        ) : (
          <>
            {/* Tab content */}
            <div className="flex-1 min-h-0 overflow-hidden">
              {renderTabContent()}
            </div>

            {/* Bottom Navigation Bar */}
            <BottomNav />
          </>
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

  /* ─── DESKTOP LAYOUT ─── */
  return (
    <div className="h-screen flex overflow-hidden bg-white dark:bg-[#0D1117]">
      {/* Left panel — Tabs + Content */}
      <div className="w-[360px] shrink-0 border-r border-gray-200 dark:border-[#21262D] flex flex-col">
        {/* Tab content area */}
        <div className="flex-1 min-h-0 overflow-hidden">
          {renderTabContent()}
        </div>

        {/* Bottom Navigation Bar (desktop left panel) */}
        <BottomNav />
      </div>

      {/* Right panel — Active chat or full-screen content */}
      <div className="flex-1 flex flex-col min-w-0">
        {activeTab === "chats" ? renderChatArea() : activeTab === "ai" ? (
          <AiChat fullScreen />
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center px-6 bg-gray-50 dark:bg-[#010409]">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center mb-5 mx-auto shadow-lg">
              {activeTab === "notifications" && <Bell className="w-10 h-10 text-white" />}
              {activeTab === "menu" && <Menu className="w-10 h-10 text-white" />}
            </div>
            <h2 className="text-[22px] font-semibold text-gray-900 dark:text-[#E6EDF3] mb-2">
              {activeTab === "notifications" && "Notifications"}
              {activeTab === "menu" && "Settings"}
            </h2>
            <p className="text-[15px] text-gray-500 dark:text-[#8B949E] max-w-sm">
              Content shown in the left panel
            </p>
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
