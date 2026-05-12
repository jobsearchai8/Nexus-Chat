/*
 * Social Navbar — Facebook-style top navigation
 * ──────────────────────────────────────────────
 * Logo + search | center tabs | user actions
 */

import { useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { useSocial } from "@/contexts/SocialContext";
import UserAvatar from "@/components/UserAvatar";
import {
  Home,
  Users,
  Film,
  ShoppingBag,
  Bell,
  MessageCircle,
  Search,
  Menu,
  LogOut,
  Settings,
  User,
  Zap,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function SocialNavbar() {
  const [, navigate] = useLocation();
  const { user, signOut } = useAuth();
  const { unreadNotifCount } = useSocial();
  const [searchQuery, setSearchQuery] = useState("");

  const handleSignOut = async () => {
    await signOut();
    navigate("/login");
  };

  const centerTabs = [
    { icon: Home, label: "Home", path: "/feed", active: true },
    { icon: Users, label: "Friends", path: "/friends", active: false },
    { icon: Film, label: "Watch", path: "/feed", active: false },
    { icon: ShoppingBag, label: "Marketplace", path: "/feed", active: false },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-50 h-[56px] bg-white shadow-sm border-b border-gray-200">
      <div className="h-full max-w-[1440px] mx-auto flex items-center justify-between px-4">
        {/* Left: Logo + Search */}
        <div className="flex items-center gap-2 w-[280px]">
          <button
            onClick={() => navigate("/home")}
            className="flex items-center gap-2 shrink-0"
          >
            <div className="w-10 h-10 rounded-full bg-[#1B2A4A] flex items-center justify-center">
              <Zap className="w-5 h-5 text-[#4ECDC4]" />
            </div>
          </button>
          <div className="relative flex-1 max-w-[240px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#65676B]" />
            <input
              type="text"
              placeholder="Search Nexus"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-10 pl-10 pr-4 rounded-full bg-[#F0F2F5] text-[14px] text-[#1C1E21] placeholder:text-[#65676B] focus:outline-none focus:ring-2 focus:ring-[#1877F2]/20 focus:bg-white transition-colors"
            />
          </div>
        </div>

        {/* Center: Tab Navigation */}
        <nav className="hidden md:flex items-center gap-2 flex-1 justify-center max-w-[500px]">
          {centerTabs.map(({ icon: Icon, label, path, active }) => (
            <button
              key={label}
              onClick={() => navigate(path)}
              className={`relative flex items-center justify-center h-[56px] px-8 transition-colors ${
                active
                  ? "text-[#1877F2] border-b-[3px] border-[#1877F2]"
                  : "text-[#65676B] hover:bg-[#F0F2F5] rounded-lg"
              }`}
              title={label}
            >
              <Icon className="w-6 h-6" />
            </button>
          ))}
        </nav>

        {/* Right: User Actions */}
        <div className="flex items-center gap-1 w-[280px] justify-end">
          {/* Switch to Chat */}
          <button
            onClick={() => navigate("/chat")}
            className="relative w-10 h-10 rounded-full bg-[#E4E6EB] hover:bg-[#D8DADF] flex items-center justify-center transition-colors"
            title="Messages"
          >
            <MessageCircle className="w-5 h-5 text-[#1C1E21]" />
          </button>

          {/* Notifications */}
          <button
            className="relative w-10 h-10 rounded-full bg-[#E4E6EB] hover:bg-[#D8DADF] flex items-center justify-center transition-colors"
            title="Notifications"
          >
            <Bell className="w-5 h-5 text-[#1C1E21]" />
            {unreadNotifCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-5 h-5 rounded-full bg-[#E41E3F] text-white text-[11px] font-bold flex items-center justify-center">
                {unreadNotifCount}
              </span>
            )}
          </button>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="w-10 h-10 rounded-full overflow-hidden hover:ring-2 hover:ring-[#1877F2]/20 transition-all">
                <UserAvatar user={user} size="sm" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[300px] bg-white border-gray-200 shadow-xl rounded-xl p-2">
              <DropdownMenuItem
                onClick={() => navigate("/profile")}
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-[#F0F2F5] cursor-pointer"
              >
                <UserAvatar user={user} size="sm" />
                <div>
                  <p className="font-semibold text-[#1C1E21] text-[15px]">{user?.display_name}</p>
                  <p className="text-[#65676B] text-xs">See your profile</p>
                </div>
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-gray-200" />
              <DropdownMenuItem
                onClick={() => navigate("/home")}
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-[#F0F2F5] cursor-pointer text-[#1C1E21]"
              >
                <div className="w-9 h-9 rounded-full bg-[#E4E6EB] flex items-center justify-center">
                  <Menu className="w-5 h-5" />
                </div>
                <span className="text-[15px]">Switch Mode</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-[#F0F2F5] cursor-pointer text-[#1C1E21]"
              >
                <div className="w-9 h-9 rounded-full bg-[#E4E6EB] flex items-center justify-center">
                  <Settings className="w-5 h-5" />
                </div>
                <span className="text-[15px]">Settings & Privacy</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={handleSignOut}
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-[#F0F2F5] cursor-pointer text-[#1C1E21]"
              >
                <div className="w-9 h-9 rounded-full bg-[#E4E6EB] flex items-center justify-center">
                  <LogOut className="w-5 h-5" />
                </div>
                <span className="text-[15px]">Log Out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
