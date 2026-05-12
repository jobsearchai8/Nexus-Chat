/*
 * Feed Page — Nexus Chat Social Network
 * ──────────────────────────────────────
 * Facebook-style news feed with three-column layout
 * Left sidebar: navigation, Right sidebar: contacts/suggestions
 * Center: stories + post composer + feed
 */

import { useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { useSocial } from "@/contexts/SocialContext";
import UserAvatar from "@/components/UserAvatar";
import { PostCard } from "@/components/social/PostCard";
import { PostComposer } from "@/components/social/PostComposer";
import { StoriesBar } from "@/components/social/StoriesBar";
import { SocialNavbar } from "@/components/social/SocialNavbar";
import { FriendSuggestions } from "@/components/social/FriendSuggestions";
import { TrendingTopics } from "@/components/social/TrendingTopics";
import {
  Home,
  Users,
  MessageCircle,
  Bell,
  Bookmark,
  Calendar,
  Film,
  ShoppingBag,
  Settings,
  TrendingUp,
} from "lucide-react";

export default function Feed() {
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const { posts } = useSocial();

  const navItems = [
    { icon: Home, label: "News Feed", active: true },
    { icon: Users, label: "Friends", active: false },
    { icon: MessageCircle, label: "Messages", onClick: () => navigate("/chat") },
    { icon: Film, label: "Watch", active: false },
    { icon: ShoppingBag, label: "Marketplace", active: false },
    { icon: Calendar, label: "Events", active: false },
    { icon: Bookmark, label: "Saved", active: false },
    { icon: TrendingUp, label: "Trending", active: false },
  ];

  return (
    <div className="min-h-screen bg-[#F0F2F5]">
      {/* Top Navbar */}
      <SocialNavbar />

      {/* Three-column layout */}
      <div className="max-w-[1440px] mx-auto flex gap-0 pt-[60px]">
        {/* Left Sidebar — Navigation */}
        <aside className="hidden lg:block w-[280px] shrink-0 sticky top-[60px] h-[calc(100vh-60px)] overflow-y-auto py-4 px-2 custom-scrollbar">
          {/* User profile link */}
          <button
            onClick={() => navigate("/profile")}
            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg hover:bg-black/5 transition-colors text-left mb-1"
          >
            <UserAvatar user={user} size="sm" />
            <span className="font-semibold text-[#1C1E21] text-[15px] truncate">
              {user?.display_name || "User"}
            </span>
          </button>

          {/* Nav items */}
          <nav className="space-y-0.5">
            {navItems.map(({ icon: Icon, label, active, onClick }) => (
              <button
                key={label}
                onClick={onClick || (() => {})}
                className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-lg transition-colors text-left ${
                  active
                    ? "bg-[#E7F3FF] text-[#1877F2] font-semibold"
                    : "text-[#1C1E21] hover:bg-black/5"
                }`}
              >
                <Icon className={`w-5 h-5 ${active ? "text-[#1877F2]" : "text-[#65676B]"}`} />
                <span className="text-[15px]">{label}</span>
              </button>
            ))}
          </nav>

          {/* Divider */}
          <div className="border-t border-gray-200 my-3 mx-3" />

          {/* Shortcuts */}
          <div className="px-3">
            <h3 className="text-[#65676B] text-xs font-semibold uppercase tracking-wider mb-2">
              Your shortcuts
            </h3>
            <button
              onClick={() => navigate("/chat")}
              className="flex items-center gap-3 w-full py-2 rounded-lg hover:bg-black/5 transition-colors text-left"
            >
              <div className="w-8 h-8 rounded-lg bg-[#1B2A4A] flex items-center justify-center">
                <MessageCircle className="w-4 h-4 text-white" />
              </div>
              <span className="text-[14px] text-[#1C1E21]">Chat Workspace</span>
            </button>
          </div>

          {/* Footer */}
          <div className="px-3 mt-6 text-xs text-[#65676B] space-y-1">
            <p>Privacy · Terms · Advertising · Cookies</p>
            <p>Nexus Chat © 2026</p>
          </div>
        </aside>

        {/* Center Feed */}
        <main className="flex-1 max-w-[680px] mx-auto px-4 py-4 space-y-4">
          {/* Stories */}
          <StoriesBar />

          {/* Post Composer */}
          <PostComposer />

          {/* Feed Posts */}
          <div className="space-y-4">
            {posts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        </main>

        {/* Right Sidebar — Contacts & Suggestions */}
        <aside className="hidden xl:block w-[320px] shrink-0 sticky top-[60px] h-[calc(100vh-60px)] overflow-y-auto py-4 px-4 custom-scrollbar">
          {/* Friend Suggestions */}
          <FriendSuggestions />

          {/* Trending */}
          <TrendingTopics />

          {/* Online Contacts */}
          <div className="mt-6">
            <h3 className="text-[#65676B] text-sm font-semibold mb-3">Contacts</h3>
            <div className="space-y-1">
              {[
                { name: "Alice Chen", online: true },
                { name: "Bob Martinez", online: true },
                { name: "Carol Williams", online: false },
                { name: "Dave Wilson", online: true },
              ].map((contact) => (
                <button
                  key={contact.name}
                  className="flex items-center gap-3 w-full px-2 py-2 rounded-lg hover:bg-black/5 transition-colors text-left"
                >
                  <div className="relative">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#1B2A4A] to-[#4ECDC4] flex items-center justify-center text-white text-xs font-bold">
                      {contact.name[0]}
                    </div>
                    {contact.online && (
                      <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-[#31A24C] border-2 border-[#F0F2F5]" />
                    )}
                  </div>
                  <span className="text-[14px] text-[#1C1E21]">{contact.name}</span>
                </button>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
