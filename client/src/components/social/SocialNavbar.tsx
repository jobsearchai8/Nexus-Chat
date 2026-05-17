/*
 * SocialNavbar — Nexus Networks
 * ─────────────────────────────
 * LinkedIn/Facebook-inspired responsive top navigation
 * Desktop: Full top bar with logo, search, center tabs, actions
 * Mobile: Compact top bar + bottom tab navigation
 */

import { useState, useRef, useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { useSocial } from "@/contexts/SocialContext";
import UserAvatar from "@/components/UserAvatar";
import {
  Home,
  Users,
  Film,
  Bell,
  MessageCircle,
  Search,
  LogOut,
  Settings,
  Zap,
  X,
  ChevronDown,
  Compass,
  User,
  Menu,
  Moon,
  Sun,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

export function SocialNavbar() {
  const [location, navigate] = useLocation();
  const { user, signOut } = useAuth();
  const { notifications, unreadNotifCount, markNotificationRead, markAllNotificationsRead } = useSocial();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);
  const [showNotifs, setShowNotifs] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  const handleSignOut = async () => {
    await signOut();
    navigate("/login");
  };

  // Close notifs on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifs(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const centerTabs = [
    { icon: Home, label: "Home", path: "/feed" },
    { icon: Users, label: "Friends", path: "/friends" },
    { icon: Film, label: "Watch", path: "/feed" },
    { icon: Compass, label: "Discover", path: "/feed" },
  ];

  const mobileBottomTabs = [
    { icon: Home, label: "Home", path: "/feed" },
    { icon: Users, label: "Friends", path: "/friends" },
    { icon: Compass, label: "Discover", path: "/feed" },
    { icon: Bell, label: "Alerts", path: "/feed", badge: unreadNotifCount },
    { icon: Menu, label: "Menu", path: "__menu__" },
  ];

  const timeAgo = (dateStr: string) => {
    const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
    if (seconds < 60) return "Just now";
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  const notifIcon = (type: string) => {
    switch (type) {
      case "like": return "❤️";
      case "comment": return "💬";
      case "friend_request": return "👤";
      case "share": return "🔄";
      case "mention": return "📢";
      default: return "🔔";
    }
  };

  return (
    <>
      {/* ─── DESKTOP + MOBILE TOP BAR ─── */}
      <header className="fixed top-0 left-0 right-0 z-50 h-14 bg-white/95 backdrop-blur-md border-b border-gray-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
        <div className="h-full max-w-[1280px] mx-auto flex items-center justify-between px-4 gap-2">
          {/* Left: Logo + Search */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => navigate("/home")}
              className="flex items-center gap-2 shrink-0 group"
            >
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#1B2A4A] to-[#2D4A7A] flex items-center justify-center shadow-sm group-hover:shadow-md transition-shadow">
                <Zap className="w-4.5 h-4.5 text-[#4ECDC4]" />
              </div>
              <span className="hidden sm:block text-[17px] font-bold text-[#1C1E21] tracking-tight">
                Nexus Networks
              </span>
            </button>

            <div className={`relative transition-all duration-200 ${searchFocused ? "w-[300px]" : "w-[220px]"} hidden md:block`}>
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#65676B]" />
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setSearchFocused(true)}
                onBlur={() => setSearchFocused(false)}
                className="w-full h-9 pl-9 pr-4 rounded-lg bg-[#EFF1F5] text-[13px] text-[#1C1E21] placeholder:text-[#65676B]/70 focus:outline-none focus:ring-2 focus:ring-[#1877F2]/20 focus:bg-white transition-all"
              />
            </div>
          </div>

          {/* Center: Tab Navigation (desktop) */}
          <nav className="hidden lg:flex items-center gap-1 flex-1 justify-center max-w-[520px]">
            {centerTabs.map(({ icon: Icon, label, path }) => {
              const isActive = location === path;
              return (
                <button
                  key={label}
                  onClick={() => navigate(path)}
                  className={`relative flex flex-col items-center justify-center h-14 px-5 transition-all group ${
                    isActive
                      ? "text-[#1877F2]"
                      : "text-[#65676B] hover:text-[#1C1E21]"
                  }`}
                  title={label}
                >
                  <Icon className={`w-5.5 h-5.5 transition-transform ${isActive ? "" : "group-hover:scale-110"}`} />
                  <span className="text-[10px] font-medium mt-0.5 leading-none">{label}</span>
                  {isActive && (
                    <div className="absolute bottom-0 left-2 right-2 h-[2.5px] rounded-full bg-[#1877F2]" />
                  )}
                </button>
              );
            })}
          </nav>

          {/* Right: User Actions */}
          <div className="flex items-center gap-1.5 shrink-0">
            {/* Mobile search */}
            <button className="md:hidden w-9 h-9 rounded-full bg-[#EFF1F5] hover:bg-[#E4E6EB] flex items-center justify-center transition-colors">
              <Search className="w-4.5 h-4.5 text-[#1C1E21]" />
            </button>

            {/* Switch to Chat */}
            <button
              onClick={() => navigate("/chat")}
              className="w-9 h-9 rounded-full bg-[#EFF1F5] hover:bg-[#E4E6EB] flex items-center justify-center transition-colors"
              title="Messages"
            >
              <MessageCircle className="w-4.5 h-4.5 text-[#1C1E21]" />
            </button>

            {/* Notifications (desktop) */}
            <div className="relative hidden md:block" ref={notifRef}>
              <button
                onClick={() => setShowNotifs(!showNotifs)}
                className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors ${
                  showNotifs ? "bg-[#E7F3FF] text-[#1877F2]" : "bg-[#EFF1F5] hover:bg-[#E4E6EB] text-[#1C1E21]"
                }`}
                title="Notifications"
              >
                <Bell className="w-4.5 h-4.5" />
                {unreadNotifCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-[18px] h-[18px] rounded-full bg-[#E41E3F] text-white text-[10px] font-bold flex items-center justify-center ring-2 ring-white">
                    {unreadNotifCount}
                  </span>
                )}
              </button>

              {/* Notifications dropdown */}
              {showNotifs && (
                <div className="absolute right-0 top-12 w-[380px] bg-white rounded-xl shadow-xl border border-gray-200/80 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                    <h3 className="text-[17px] font-bold text-[#1C1E21]">Notifications</h3>
                    <button
                      onClick={() => markAllNotificationsRead()}
                      className="text-[13px] text-[#1877F2] hover:underline font-medium"
                    >
                      Mark all as read
                    </button>
                  </div>
                  <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
                    {notifications.length === 0 ? (
                      <div className="py-12 text-center">
                        <Bell className="w-10 h-10 text-[#BCC0C4] mx-auto mb-2" />
                        <p className="text-[#65676B] text-sm">No notifications yet</p>
                      </div>
                    ) : (
                      notifications.map((notif) => (
                        <button
                          key={notif.id}
                          onClick={() => {
                            markNotificationRead(notif.id);
                            setShowNotifs(false);
                          }}
                          className={`w-full flex items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-[#F2F3F5] ${
                            !notif.is_read ? "bg-[#E7F3FF]/50" : ""
                          }`}
                        >
                          <div className="relative shrink-0">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#1B2A4A] to-[#4ECDC4] flex items-center justify-center text-white text-sm font-bold">
                              {notif.actor?.display_name?.[0] || "?"}
                            </div>
                            <span className="absolute -bottom-1 -right-1 text-sm">{notifIcon(notif.type)}</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[13px] text-[#1C1E21] leading-snug">
                              <span className="font-semibold">{notif.actor?.display_name}</span>{" "}
                              {notif.content}
                            </p>
                            <p className={`text-[12px] mt-0.5 ${!notif.is_read ? "text-[#1877F2] font-medium" : "text-[#65676B]"}`}>
                              {timeAgo(notif.created_at)}
                            </p>
                          </div>
                          {!notif.is_read && (
                            <div className="w-2.5 h-2.5 rounded-full bg-[#1877F2] shrink-0 mt-2" />
                          )}
                        </button>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* User Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="hidden md:flex items-center gap-1.5 pl-1 pr-2 py-1 rounded-full hover:bg-[#EFF1F5] transition-colors">
                  <UserAvatar user={user} size="sm" />
                  <ChevronDown className="w-3.5 h-3.5 text-[#65676B]" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-[280px] bg-white border-gray-200/80 shadow-xl rounded-xl p-1.5">
                <DropdownMenuItem
                  onClick={() => navigate("/profile")}
                  className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-[#F2F3F5] cursor-pointer"
                >
                  <UserAvatar user={user} size="md" />
                  <div>
                    <p className="font-semibold text-[#1C1E21] text-[14px]">{user?.display_name}</p>
                    <p className="text-[#65676B] text-[11px]">View your profile</p>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-gray-100 my-1" />
                <DropdownMenuItem
                  onClick={() => navigate("/home")}
                  className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-[#F2F3F5] cursor-pointer text-[#1C1E21]"
                >
                  <div className="w-8 h-8 rounded-full bg-[#EFF1F5] flex items-center justify-center">
                    <Zap className="w-4 h-4 text-[#4ECDC4]" />
                  </div>
                  <span className="text-[14px]">Switch Mode</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-[#F2F3F5] cursor-pointer text-[#1C1E21]"
                >
                  <div className="w-8 h-8 rounded-full bg-[#EFF1F5] flex items-center justify-center">
                    <Settings className="w-4 h-4" />
                  </div>
                  <span className="text-[14px]">Settings & Privacy</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-gray-100 my-1" />
                <DropdownMenuItem
                  onClick={handleSignOut}
                  className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-[#F2F3F5] cursor-pointer text-[#1C1E21]"
                >
                  <div className="w-8 h-8 rounded-full bg-[#EFF1F5] flex items-center justify-center">
                    <LogOut className="w-4 h-4" />
                  </div>
                  <span className="text-[14px]">Sign Out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {/* ─── MOBILE BOTTOM TAB BAR ─── */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-t border-gray-200/80 safe-area-bottom">
        <div className="flex items-center justify-around h-14 px-1">
          {mobileBottomTabs.map(({ icon: Icon, label, path, badge }) => {
            const isActive = path !== "__menu__" && location === path;
            return (
              <button
                key={label}
                onClick={() => {
                  if (path === "__menu__") {
                    setShowMobileMenu(true);
                  } else {
                    navigate(path);
                  }
                }}
                className={`relative flex flex-col items-center justify-center gap-0.5 flex-1 h-full transition-colors ${
                  isActive ? "text-[#1877F2]" : "text-[#65676B]"
                }`}
              >
                <div className="relative">
                  <Icon className="w-5 h-5" strokeWidth={isActive ? 2.5 : 1.8} />
                  {badge && badge > 0 && (
                    <span className="absolute -top-1.5 -right-2.5 bg-[#E41E3F] text-white text-[9px] font-bold min-w-[16px] h-4 flex items-center justify-center rounded-full px-1">
                      {badge > 99 ? "99+" : badge}
                    </span>
                  )}
                </div>
                <span className={`text-[10px] font-medium ${isActive ? "text-[#1877F2]" : "text-[#65676B]"}`}>
                  {label}
                </span>
                {isActive && (
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full bg-[#1877F2]" />
                )}
              </button>
            );
          })}
        </div>
      </nav>

      {/* ─── MOBILE MENU SHEET ─── */}
      <Sheet open={showMobileMenu} onOpenChange={setShowMobileMenu}>
        <SheetContent side="bottom" className="bg-white rounded-t-2xl px-0 pb-8">
          <SheetHeader className="px-5 pb-3 border-b border-gray-100">
            <SheetTitle className="text-[17px] font-bold text-[#1C1E21]">Menu</SheetTitle>
          </SheetHeader>
          <div className="py-2">
            {/* Profile row */}
            <button
              onClick={() => { setShowMobileMenu(false); navigate("/profile"); }}
              className="w-full flex items-center gap-3 px-5 py-3 hover:bg-[#F2F3F5] transition-colors"
            >
              <UserAvatar user={user} size="md" />
              <div className="text-left">
                <p className="font-semibold text-[15px] text-[#1C1E21]">{user?.display_name || "User"}</p>
                <p className="text-[12px] text-[#65676B]">View your profile</p>
              </div>
            </button>

            <div className="h-px bg-gray-100 my-2" />

            {/* Switch to Chat */}
            <button
              onClick={() => { setShowMobileMenu(false); navigate("/chat"); }}
              className="w-full flex items-center gap-3 px-5 py-3 hover:bg-[#F2F3F5] transition-colors"
            >
              <div className="w-9 h-9 rounded-full bg-[#EFF1F5] flex items-center justify-center">
                <MessageCircle className="w-4.5 h-4.5 text-[#1C1E21]" />
              </div>
              <span className="text-[15px] text-[#1C1E21]">Switch to Chat</span>
            </button>

            {/* Switch Mode */}
            <button
              onClick={() => { setShowMobileMenu(false); navigate("/home"); }}
              className="w-full flex items-center gap-3 px-5 py-3 hover:bg-[#F2F3F5] transition-colors"
            >
              <div className="w-9 h-9 rounded-full bg-[#EFF1F5] flex items-center justify-center">
                <Zap className="w-4.5 h-4.5 text-[#4ECDC4]" />
              </div>
              <span className="text-[15px] text-[#1C1E21]">Switch Mode</span>
            </button>

            {/* Settings */}
            <button
              onClick={() => { setShowMobileMenu(false); }}
              className="w-full flex items-center gap-3 px-5 py-3 hover:bg-[#F2F3F5] transition-colors"
            >
              <div className="w-9 h-9 rounded-full bg-[#EFF1F5] flex items-center justify-center">
                <Settings className="w-4.5 h-4.5 text-[#1C1E21]" />
              </div>
              <span className="text-[15px] text-[#1C1E21]">Settings & Privacy</span>
            </button>

            <div className="h-px bg-gray-100 my-2" />

            {/* Sign Out */}
            <button
              onClick={() => { setShowMobileMenu(false); handleSignOut(); }}
              className="w-full flex items-center gap-3 px-5 py-3 hover:bg-[#F2F3F5] transition-colors"
            >
              <div className="w-9 h-9 rounded-full bg-[#EFF1F5] flex items-center justify-center">
                <LogOut className="w-4.5 h-4.5 text-[#E41E3F]" />
              </div>
              <span className="text-[15px] text-[#E41E3F]">Sign Out</span>
            </button>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
