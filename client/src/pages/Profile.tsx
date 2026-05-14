/*
 * Profile Page — Nexus Networks Social Network
 * ─────────────────────────────────────────
 * Facebook-style user profile with responsive layout
 * Mobile: Single column, stacked sections
 * Desktop: Two columns (intro left, posts right)
 */

import { useAuth } from "@/contexts/AuthContext";
import { useSocial } from "@/contexts/SocialContext";
import { SocialNavbar } from "@/components/social/SocialNavbar";
import { PostCard } from "@/components/social/PostCard";
import UserAvatar from "@/components/UserAvatar";
import { Camera, Edit3, MapPin, Briefcase, Calendar, Users, MessageCircle } from "lucide-react";

const COVER_BG = "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200&q=80";

export default function Profile() {
  const { user } = useAuth();
  const { posts } = useSocial();

  const userPosts = posts.filter((p) => p.user_id === user?.id);

  return (
    <div className="min-h-screen bg-[#F0F2F5]">
      <SocialNavbar />

      <div className="pt-14 pb-20 lg:pb-4">
        {/* Cover Photo */}
        <div className="max-w-[940px] mx-auto px-0 sm:px-4">
          <div className="relative h-[200px] sm:h-[300px] lg:h-[350px] sm:rounded-b-xl overflow-hidden">
            <img src={COVER_BG} alt="" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
            <button className="absolute bottom-3 right-3 sm:bottom-4 sm:right-4 flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg bg-white/90 hover:bg-white text-[#1C1E21] text-[13px] sm:text-sm font-bold transition-colors shadow-sm">
              <Camera className="w-4 h-4" />
              <span className="hidden sm:inline">Edit cover photo</span>
            </button>
          </div>

          {/* Profile Info */}
          <div className="relative px-4 sm:px-8 pb-4 bg-white shadow-sm sm:rounded-b-xl">
            <div className="flex flex-col sm:flex-row sm:items-end gap-3 sm:gap-5 -mt-10 sm:-mt-8">
              {/* Avatar */}
              <div className="relative self-center sm:self-auto">
                <div className="w-[120px] h-[120px] sm:w-[168px] sm:h-[168px] rounded-full border-4 border-white overflow-hidden bg-white shadow-lg">
                  {user?.avatar_url ? (
                    <img src={user.avatar_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-[#1B2A4A] to-[#4ECDC4] flex items-center justify-center text-white text-4xl sm:text-5xl font-bold">
                      {user?.display_name?.[0] || "?"}
                    </div>
                  )}
                </div>
                <button className="absolute bottom-1 right-1 sm:bottom-2 sm:right-2 w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-[#E4E6EB] hover:bg-[#D8DADF] flex items-center justify-center transition-colors shadow-sm">
                  <Camera className="w-4 h-4 text-[#1C1E21]" />
                </button>
              </div>

              {/* Name & Stats */}
              <div className="flex-1 text-center sm:text-left pb-2 sm:pb-4">
                <h1 className="text-[24px] sm:text-[32px] font-bold text-[#1C1E21] leading-tight">
                  {user?.display_name || "User"}
                </h1>
                <p className="text-[#65676B] text-[14px] sm:text-[15px] mt-0.5">
                  @{user?.username || "user"} · 142 friends
                </p>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-center sm:justify-end gap-2 pb-2 sm:pb-4">
                <button className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#1877F2] text-white text-[14px] font-bold hover:bg-[#166FE5] transition-colors shadow-sm">
                  <Edit3 className="w-4 h-4" />
                  Edit profile
                </button>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex items-center gap-0 sm:gap-1 mt-4 border-t border-gray-200 pt-1 overflow-x-auto scrollbar-hide">
              {["Posts", "About", "Friends", "Photos", "Videos"].map((tab, i) => (
                <button
                  key={tab}
                  className={`px-3 sm:px-4 py-3 text-[14px] sm:text-[15px] font-bold rounded-lg transition-colors whitespace-nowrap ${
                    i === 0
                      ? "text-[#1877F2] border-b-[3px] border-[#1877F2] rounded-b-none"
                      : "text-[#65676B] hover:bg-[#F0F2F5]"
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Profile Content */}
        <div className="max-w-[940px] mx-auto mt-4 flex flex-col lg:flex-row gap-4 px-3 sm:px-4">
          {/* Left: Intro */}
          <div className="w-full lg:w-[360px] shrink-0 space-y-4">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
              <h2 className="text-[18px] sm:text-[20px] font-bold text-[#1C1E21] mb-3">Intro</h2>
              <p className="text-[#1C1E21] text-[15px] text-center mb-4">
                {user?.status_text || "Building something amazing 🚀"}
              </p>
              <div className="space-y-3 text-[15px] text-[#1C1E21]">
                <div className="flex items-center gap-3">
                  <Briefcase className="w-5 h-5 text-[#65676B] shrink-0" />
                  <span>Software Engineer</span>
                </div>
                <div className="flex items-center gap-3">
                  <MapPin className="w-5 h-5 text-[#65676B] shrink-0" />
                  <span>San Francisco, CA</span>
                </div>
                <div className="flex items-center gap-3">
                  <Calendar className="w-5 h-5 text-[#65676B] shrink-0" />
                  <span>Joined {new Date(user?.created_at || Date.now()).toLocaleDateString("en-US", { month: "long", year: "numeric" })}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Users className="w-5 h-5 text-[#65676B] shrink-0" />
                  <span>142 friends</span>
                </div>
              </div>
              <button className="w-full mt-4 py-2.5 rounded-lg bg-[#E4E6EB] hover:bg-[#D8DADF] text-[#1C1E21] text-[15px] font-bold transition-colors">
                Edit details
              </button>
            </div>

            {/* Photos */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-[18px] sm:text-[20px] font-bold text-[#1C1E21]">Photos</h2>
                <button className="text-[#1877F2] text-[14px] font-medium hover:underline">See all</button>
              </div>
              <div className="grid grid-cols-3 gap-1.5 rounded-lg overflow-hidden">
                {[
                  "https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=200&q=80",
                  "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=200&q=80",
                  "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=200&q=80",
                  "https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=200&q=80",
                  "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=200&q=80",
                  "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=200&q=80",
                ].map((url, i) => (
                  <img
                    key={i}
                    src={url}
                    alt=""
                    className="w-full h-[90px] sm:h-[100px] object-cover rounded-md hover:brightness-90 transition-all cursor-pointer"
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Right: Posts */}
          <div className="flex-1 space-y-4">
            {userPosts.length > 0 ? (
              userPosts.map((post) => <PostCard key={post.id} post={post} />)
            ) : (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center">
                <MessageCircle className="w-12 h-12 text-[#65676B] mx-auto mb-3" />
                <h3 className="text-[#1C1E21] text-lg font-bold mb-1">No posts yet</h3>
                <p className="text-[#65676B] text-[14px]">Share your first thought with the world!</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
