/*
 * StoriesBar — Horizontal Stories Strip
 * ──────────────────────────────────────
 * Facebook/Instagram-style stories at the top of the feed
 */

import { useSocial } from "@/contexts/SocialContext";
import { useAuth } from "@/contexts/AuthContext";
import { Plus } from "lucide-react";

export function StoriesBar() {
  const { user } = useAuth();
  const { stories } = useSocial();

  return (
    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
      {/* Create Story */}
      <button className="shrink-0 w-[112px] h-[200px] rounded-xl overflow-hidden relative group border border-gray-200 bg-white shadow-sm">
        <div className="h-[130px] bg-gradient-to-br from-[#1B2A4A] to-[#4ECDC4] relative">
          {user?.avatar_url ? (
            <img src={user.avatar_url} alt="" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-white text-2xl font-bold">
              {user?.display_name?.[0] || "?"}
            </div>
          )}
        </div>
        <div className="absolute left-1/2 -translate-x-1/2 top-[118px] w-9 h-9 rounded-full bg-[#1877F2] border-4 border-white flex items-center justify-center">
          <Plus className="w-5 h-5 text-white" />
        </div>
        <div className="pt-6 pb-2 text-center">
          <span className="text-[12px] font-semibold text-[#1C1E21]">Create story</span>
        </div>
      </button>

      {/* User Stories */}
      {stories.filter((s) => s.user_id !== user?.id).map((story) => (
        <button
          key={story.id}
          className="shrink-0 w-[112px] h-[200px] rounded-xl overflow-hidden relative group"
        >
          <img
            src={story.media_url}
            alt=""
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
          {/* User avatar ring */}
          <div className="absolute top-3 left-3">
            <div className="w-10 h-10 rounded-full border-[3px] border-[#1877F2] p-0.5">
              <div className="w-full h-full rounded-full bg-gradient-to-br from-[#1B2A4A] to-[#4ECDC4] flex items-center justify-center text-white text-xs font-bold">
                {story.user?.display_name?.[0] || "?"}
              </div>
            </div>
          </div>
          {/* Name */}
          <div className="absolute bottom-3 left-3 right-3">
            <span className="text-white text-[12px] font-semibold leading-tight line-clamp-2">
              {story.user?.display_name || "User"}
            </span>
          </div>
        </button>
      ))}
    </div>
  );
}
