/*
 * PostComposer — Create New Post
 * ───────────────────────────────
 * Facebook-style post creation with proper sizing
 * - Larger touch targets on mobile
 * - Proper font sizes
 * - Better expanded state
 */

import { useState, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useSocial } from "@/contexts/SocialContext";
import UserAvatar from "@/components/UserAvatar";
import { Image, Video, Smile, X } from "lucide-react";
import { toast } from "sonner";

export function PostComposer() {
  const { user } = useAuth();
  const { createPost } = useSocial();
  const [isExpanded, setIsExpanded] = useState(false);
  const [content, setContent] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handlePost = () => {
    if (!content.trim()) return;
    createPost(content.trim());
    setContent("");
    setIsExpanded(false);
    toast.success("Post published!");
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      {/* Main composer area */}
      <div className="px-4 pt-4 pb-3 flex gap-3">
        <UserAvatar user={user} size="md" />
        <div className="flex-1">
          {isExpanded ? (
            <textarea
              ref={textareaRef}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={`What's on your mind, ${user?.display_name?.split(" ")[0] || "friend"}?`}
              className="w-full bg-transparent text-[#1C1E21] text-[15px] placeholder:text-[#65676B] resize-none focus:outline-none min-h-[120px] leading-relaxed"
              autoFocus
            />
          ) : (
            <button
              onClick={() => setIsExpanded(true)}
              className="w-full h-11 px-4 rounded-full bg-[#F0F2F5] hover:bg-[#E4E6EB] text-left text-[#65676B] text-[15px] transition-colors flex items-center"
            >
              What's on your mind, {user?.display_name?.split(" ")[0] || "friend"}?
            </button>
          )}
        </div>
      </div>

      {/* Expanded actions */}
      {isExpanded && (
        <div className="px-4 pb-3 flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-1">
            <button className="flex items-center gap-1.5 px-3 py-2 rounded-lg hover:bg-[#F0F2F5] text-[13px] text-[#65676B] transition-colors font-medium">
              <Image className="w-5 h-5 text-[#45BD62]" />
              <span className="hidden sm:inline">Photo</span>
            </button>
            <button className="flex items-center gap-1.5 px-3 py-2 rounded-lg hover:bg-[#F0F2F5] text-[13px] text-[#65676B] transition-colors font-medium">
              <Video className="w-5 h-5 text-[#E42645]" />
              <span className="hidden sm:inline">Video</span>
            </button>
            <button className="flex items-center gap-1.5 px-3 py-2 rounded-lg hover:bg-[#F0F2F5] text-[13px] text-[#65676B] transition-colors font-medium">
              <Smile className="w-5 h-5 text-[#F7B928]" />
              <span className="hidden sm:inline">Feeling</span>
            </button>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setIsExpanded(false);
                setContent("");
              }}
              className="px-4 py-2 rounded-lg text-[14px] text-[#65676B] hover:bg-[#F0F2F5] transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              onClick={handlePost}
              disabled={!content.trim()}
              className="px-6 py-2 rounded-lg bg-[#1877F2] text-white text-[14px] font-bold disabled:opacity-40 hover:bg-[#166FE5] transition-colors shadow-sm"
            >
              Post
            </button>
          </div>
        </div>
      )}

      {/* Bottom action bar (collapsed state) */}
      {!isExpanded && (
        <>
          <div className="border-t border-gray-100 mx-4" />
          <div className="flex items-center px-2 py-1.5">
            <button
              onClick={() => setIsExpanded(true)}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg hover:bg-[#F0F2F5] transition-colors text-[14px] font-semibold text-[#65676B]"
            >
              <Video className="w-5 h-5 text-[#E42645]" />
              <span className="text-[13px] sm:text-[14px]">Live video</span>
            </button>
            <button
              onClick={() => setIsExpanded(true)}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg hover:bg-[#F0F2F5] transition-colors text-[14px] font-semibold text-[#65676B]"
            >
              <Image className="w-5 h-5 text-[#45BD62]" />
              <span className="text-[13px] sm:text-[14px]">Photo/video</span>
            </button>
            <button
              onClick={() => setIsExpanded(true)}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg hover:bg-[#F0F2F5] transition-colors text-[14px] font-semibold text-[#65676B]"
            >
              <Smile className="w-5 h-5 text-[#F7B928]" />
              <span className="text-[13px] sm:text-[14px]">Feeling</span>
            </button>
          </div>
        </>
      )}
    </div>
  );
}
