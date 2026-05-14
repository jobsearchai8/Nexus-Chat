/*
 * StoriesBar — Horizontal Stories Strip
 * ──────────────────────────────────────
 * Facebook/Instagram-style stories with proper sizing
 * Mobile: Full-width scroll, larger cards
 * Desktop: Contained within feed column
 */

import { useSocial } from "@/contexts/SocialContext";
import { useAuth } from "@/contexts/AuthContext";
import { Plus } from "lucide-react";

export function StoriesBar() {
  const { user } = useAuth();
  const { stories } = useSocial();

  return (
    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide -mx-3 sm:-mx-4 px-3 sm:px-4">
      {/* Create Story */}
      <button className="shrink-0 w-[120px] sm:w-[130px] h-[200px] sm:h-[220px] rounded-xl overflow-hidden relative group border border-gray-200 bg-white shadow-sm hover:shadow-md transition-shadow">
        <div className="h-[130px] sm:h-[145px] bg-gradient-to-br from-[#1B2A4A] to-[#4ECDC4] relative">
          {user?.avatar_url ? (
            <img src={user.avatar_url} alt="" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-white text-3xl font-bold">
              {user?.display_name?.[0] || "?"}
            </div>
          )}
        </div>
        <div className="absolute left-1/2 -translate-x-1/2 top-[118px] sm:top-[133px] w-10 h-10 rounded-full bg-[#1877F2] border-4 border-white flex items-center justify-center shadow-md">
          <Plus className="w-5 h-5 text-white" />
        </div>
        <div className="pt-6 pb-2 text-center">
          <span className="text-[12px] font-bold text-[#1C1E21]">Create story</span>
        </div>
      </button>

      {/* User Stories */}
      {stories.filter((s) => s.user_id !== user?.id).map((story) => (
        <button
          key={story.id}
          className="shrink-0 w-[120px] sm:w-[130px] h-[200px] sm:h-[220px] rounded-xl overflow-hidden relative group shadow-sm hover:shadow-md transition-shadow"
        >
          <img
            src={story.media_url}
            alt=""
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
          {/* User avatar ring */}
          <div className="absolute top-3 left-3">
            <div className="w-10 h-10 rounded-full border-[3px] border-[#1877F2] p-0.5 shadow-md">
              <div className="w-full h-full rounded-full bg-gradient-to-br from-[#1B2A4A] to-[#4ECDC4] flex items-center justify-center text-white text-[11px] font-bold">
                {story.user?.display_name?.[0] || "?"}
              </div>
            </div>
          </div>
          {/* Name */}
          <div className="absolute bottom-3 left-3 right-3">
            <span className="text-white text-[12px] font-bold leading-tight line-clamp-2 drop-shadow-md">
              {story.user?.display_name || "User"}
            </span>
          </div>
        </button>
      ))}
    </div>
  );
}
