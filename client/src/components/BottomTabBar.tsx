/*
 * BottomTabBar — Nexus Networks
 * ─────────────────────────────
 * Mobile-only bottom navigation bar for chat mode
 * Inspired by Telegram/Messenger with unique Nexus Networks styling
 */

import { cn } from "@/lib/utils";
import {
  MessageCircle,
  Hash,
  Phone,
  User,
} from "lucide-react";

export type MobileTab = "chats" | "channels" | "calls" | "profile";

interface BottomTabBarProps {
  activeTab: MobileTab;
  onTabChange: (tab: MobileTab) => void;
  unreadChats?: number;
  unreadChannels?: number;
}

const tabs: { id: MobileTab; label: string; icon: typeof MessageCircle }[] = [
  { id: "chats", label: "Chats", icon: MessageCircle },
  { id: "channels", label: "Channels", icon: Hash },
  { id: "calls", label: "Calls", icon: Phone },
  { id: "profile", label: "Profile", icon: User },
];

export default function BottomTabBar({
  activeTab,
  onTabChange,
  unreadChats = 0,
  unreadChannels = 0,
}: BottomTabBarProps) {
  const getUnread = (tabId: MobileTab) => {
    if (tabId === "chats") return unreadChats;
    if (tabId === "channels") return unreadChannels;
    return 0;
  };

  return (
    <div className="md:hidden bg-[#0D1117]/95 backdrop-blur-xl border-t border-white/[0.06] safe-area-bottom shrink-0">
      <div className="flex items-center justify-around h-14 px-2">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          const unread = getUnread(tab.id);
          const Icon = tab.icon;

          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={cn(
                "relative flex flex-col items-center justify-center gap-0.5 flex-1 h-full transition-colors",
                isActive ? "text-indigo" : "text-[#8B949E]"
              )}
            >
              <div className="relative">
                <Icon
                  className={cn(
                    "w-5 h-5 transition-all",
                    isActive && "scale-110"
                  )}
                  strokeWidth={isActive ? 2.5 : 1.8}
                />
                {unread > 0 && (
                  <span className="absolute -top-1.5 -right-2.5 bg-red-500 text-white text-[9px] font-bold min-w-[16px] h-4 flex items-center justify-center rounded-full px-1">
                    {unread > 99 ? "99+" : unread}
                  </span>
                )}
              </div>
              <span className={cn(
                "text-[10px] font-medium transition-colors",
                isActive ? "text-indigo" : "text-[#8B949E]"
              )}>
                {tab.label}
              </span>
              {isActive && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full bg-indigo" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
