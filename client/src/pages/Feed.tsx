/*
 * Feed Page — Nexus Networks Social Network
 * ──────────────────────────────────────
 * Facebook-style news feed with proper three-column layout
 * Desktop: Left nav (280px) + Center feed (max 680px) + Right sidebar (320px)
 * Mobile: Single column, no sidebars, bottom tab bar from SocialNavbar
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
  Bookmark,
  Calendar,
  Film,
  ShoppingBag,
  TrendingUp,
  Newspaper,
  Sparkles,
} from "lucide-react";

/* ─── Top Local News Widget ─── */
function TopLocalNews() {
  const news = [
    { title: "City approves $2B tech campus expansion", source: "TechDaily", time: "30m ago" },
    { title: "New AI regulation framework announced", source: "PolicyWatch", time: "1h ago" },
    { title: "Startup funding hits record high in Q2", source: "VentureBeat", time: "3h ago" },
  ];

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-base font-bold text-[#1C1E21] flex items-center gap-2">
          <Newspaper className="w-4.5 h-4.5 text-[#E41E3F]" />
          Top Local News
        </h3>
        <button className="text-[13px] text-[#1877F2] hover:underline font-medium">More</button>
      </div>
      <div className="space-y-2.5">
        {news.map((item, i) => (
          <button key={i} className="w-full text-left p-2.5 rounded-lg hover:bg-[#F2F3F5] transition-colors group">
            <p className="text-[14px] font-medium text-[#1C1E21] group-hover:text-[#1877F2] transition-colors leading-snug">{item.title}</p>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-[12px] text-[#65676B]">{item.source}</span>
              <span className="text-[12px] text-[#65676B]">·</span>
              <span className="text-[12px] text-[#65676B]">{item.time}</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

export default function Feed() {
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const { posts } = useSocial();

  const navItems = [
    { icon: Home, label: "News Feed", active: true },
    { icon: Users, label: "Friends", active: false, onClick: () => navigate("/friends") },
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
      <div className="max-w-[1440px] mx-auto flex pt-14">
        {/* ─── Left Sidebar — Navigation (desktop only) ─── */}
        <aside className="hidden lg:block w-[280px] shrink-0 sticky top-14 h-[calc(100vh-56px)] overflow-y-auto py-3 px-2 custom-scrollbar">
          {/* User profile link */}
          <button
            onClick={() => navigate("/profile")}
            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg hover:bg-black/5 transition-colors text-left mb-1"
          >
            <UserAvatar user={user} size="md" />
            <span className="font-semibold text-[#1C1E21] text-[15px] truncate">
              {user?.display_name || "User"}
            </span>
          </button>

          {/* Nav items */}
          <nav className="space-y-0.5 mt-1">
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
                <Icon className={`w-6 h-6 ${active ? "text-[#1877F2]" : "text-[#65676B]"}`} />
                <span className="text-[15px]">{label}</span>
              </button>
            ))}
          </nav>

          {/* Divider */}
          <div className="border-t border-gray-200 my-4 mx-3" />

          {/* Shortcuts */}
          <div className="px-3">
            <h3 className="text-[#65676B] text-[13px] font-semibold uppercase tracking-wider mb-2">
              Your shortcuts
            </h3>
            <button
              onClick={() => navigate("/chat")}
              className="flex items-center gap-3 w-full py-2.5 rounded-lg hover:bg-black/5 transition-colors text-left"
            >
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-[#1B2A4A] to-[#2D4A7A] flex items-center justify-center shadow-sm">
                <MessageCircle className="w-4.5 h-4.5 text-white" />
              </div>
              <span className="text-[15px] text-[#1C1E21]">Chat Workspace</span>
            </button>
          </div>

          {/* Footer */}
          <div className="px-3 mt-8 text-[12px] text-[#65676B] space-y-1 leading-relaxed">
            <p>Privacy · Terms · Advertising · Cookies</p>
            <p>Nexus Networks © 2026</p>
          </div>
        </aside>

        {/* ─── Center Feed ─── */}
        <main className="flex-1 min-w-0 max-w-[680px] mx-auto px-3 sm:px-4 py-4 pb-20 lg:pb-4 space-y-4">
          {/* Stories */}
          <StoriesBar />

          {/* Post Composer */}
          <PostComposer />

          {/* Top Posts label */}
          <div className="flex items-center gap-2 pt-1">
            <Sparkles className="w-4 h-4 text-[#F7B928]" />
            <span className="text-[13px] font-semibold text-[#65676B] uppercase tracking-wide">Top Posts</span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>

          {/* Feed Posts */}
          <div className="space-y-4">
            {posts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        </main>

        {/* ─── Right Sidebar — Contacts, Jobs, News (desktop only) ─── */}
        <aside className="hidden xl:block w-[320px] shrink-0 sticky top-14 h-[calc(100vh-56px)] overflow-y-auto py-3 px-3 custom-scrollbar space-y-4">
          {/* Friend Suggestions */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <FriendSuggestions />
          </div>

          {/* Top Local News */}
          <TopLocalNews />

          {/* Trending */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <TrendingTopics />
          </div>

          {/* Online Contacts */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <h3 className="text-[14px] font-bold text-[#1C1E21] mb-3">Contacts</h3>
            <div className="space-y-1">
              {[
                { name: "Alice Chen", online: true },
                { name: "Bob Martinez", online: true },
                { name: "Carol Williams", online: false },
                { name: "Dave Wilson", online: true },
              ].map((contact) => (
                <button
                  key={contact.name}
                  className="flex items-center gap-3 w-full px-2 py-2 rounded-lg hover:bg-[#F2F3F5] transition-colors text-left"
                >
                  <div className="relative">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#1B2A4A] to-[#4ECDC4] flex items-center justify-center text-white text-xs font-bold">
                      {contact.name[0]}
                    </div>
                    {contact.online && (
                      <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-[#31A24C] border-2 border-white" />
                    )}
                  </div>
                  <span className="text-[14px] text-[#1C1E21] font-medium">{contact.name}</span>
                </button>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
