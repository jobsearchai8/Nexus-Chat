/*
 * PostCard — Social Feed Post
 * ────────────────────────────
 * Facebook-style post card with likes, comments, shares
 */

import { useState } from "react";
import { useSocial } from "@/contexts/SocialContext";
import { useAuth } from "@/contexts/AuthContext";
import UserAvatar from "@/components/UserAvatar";
import type { Post } from "@/lib/socialTypes";
import {
  ThumbsUp,
  MessageCircle,
  Share2,
  MoreHorizontal,
  Globe,
  Users,
  Lock,
  Send,
  Heart,
  Trash2,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

function timeAgo(dateStr: string): string {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (seconds < 60) return "Just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d`;
  return new Date(dateStr).toLocaleDateString();
}

const privacyIcons = {
  public: Globe,
  friends: Users,
  private: Lock,
};

export function PostCard({ post }: { post: Post }) {
  const { user } = useAuth();
  const { likePost, commentOnPost, sharePost, deletePost, likeComment } = useSocial();
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [imageExpanded, setImageExpanded] = useState(false);

  const PrivacyIcon = privacyIcons[post.privacy];
  const isOwner = user?.id === post.user_id;

  const handleComment = () => {
    if (!commentText.trim()) return;
    commentOnPost(post.id, commentText.trim());
    setCommentText("");
  };

  return (
    <article className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      {/* Post Header */}
      <div className="px-4 pt-4 pb-2 flex items-start justify-between">
        <div className="flex items-center gap-3">
          <UserAvatar user={post.user} size="md" />
          <div>
            <h3 className="font-semibold text-[#1C1E21] text-[15px] leading-tight">
              {post.user?.display_name || "Unknown User"}
            </h3>
            <div className="flex items-center gap-1 text-[#65676B] text-xs">
              <span>{timeAgo(post.created_at)}</span>
              <span>·</span>
              <PrivacyIcon className="w-3 h-3" />
            </div>
          </div>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="w-8 h-8 rounded-full hover:bg-[#F0F2F5] flex items-center justify-center transition-colors">
              <MoreHorizontal className="w-5 h-5 text-[#65676B]" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="bg-white border-gray-200 shadow-lg rounded-lg">
            {isOwner && (
              <DropdownMenuItem
                onClick={() => deletePost(post.id)}
                className="text-red-600 hover:bg-red-50 cursor-pointer"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete post
              </DropdownMenuItem>
            )}
            <DropdownMenuItem className="cursor-pointer text-[#1C1E21] hover:bg-[#F0F2F5]">
              Save post
            </DropdownMenuItem>
            <DropdownMenuItem className="cursor-pointer text-[#1C1E21] hover:bg-[#F0F2F5]">
              Hide post
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Post Content */}
      <div className="px-4 pb-3">
        <p className="text-[#1C1E21] text-[15px] leading-relaxed whitespace-pre-wrap">
          {post.content}
        </p>
      </div>

      {/* Post Media */}
      {post.media.length > 0 && (
        <div
          className={`${
            post.media.length === 1
              ? ""
              : "grid grid-cols-2 gap-0.5"
          }`}
        >
          {post.media.map((media, idx) => (
            <button
              key={media.id}
              onClick={() => setImageExpanded(!imageExpanded)}
              className={`relative overflow-hidden ${
                post.media.length === 1 ? "w-full" : ""
              } ${
                post.media.length === 3 && idx === 0 ? "row-span-2" : ""
              }`}
            >
              <img
                src={media.url}
                alt=""
                className={`w-full object-cover ${
                  post.media.length === 1
                    ? "max-h-[500px]"
                    : "h-[250px]"
                } hover:brightness-95 transition-all`}
              />
            </button>
          ))}
        </div>
      )}

      {/* Engagement Stats */}
      {(post.likes_count > 0 || post.comments_count > 0 || post.shares_count > 0) && (
        <div className="px-4 py-2.5 flex items-center justify-between text-[#65676B] text-[13px]">
          <div className="flex items-center gap-1">
            {post.likes_count > 0 && (
              <>
                <div className="flex -space-x-1">
                  <span className="w-[18px] h-[18px] rounded-full bg-[#1877F2] flex items-center justify-center">
                    <ThumbsUp className="w-2.5 h-2.5 text-white" />
                  </span>
                  <span className="w-[18px] h-[18px] rounded-full bg-[#F33E58] flex items-center justify-center">
                    <Heart className="w-2.5 h-2.5 text-white" />
                  </span>
                </div>
                <span className="ml-1">{post.likes_count}</span>
              </>
            )}
          </div>
          <div className="flex items-center gap-3">
            {post.comments_count > 0 && (
              <button
                onClick={() => setShowComments(!showComments)}
                className="hover:underline"
              >
                {post.comments_count} comment{post.comments_count !== 1 ? "s" : ""}
              </button>
            )}
            {post.shares_count > 0 && (
              <span>{post.shares_count} share{post.shares_count !== 1 ? "s" : ""}</span>
            )}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="px-4 border-t border-gray-100">
        <div className="flex items-center">
          <button
            onClick={() => likePost(post.id)}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg hover:bg-[#F0F2F5] transition-colors text-[15px] font-medium ${
              post.is_liked ? "text-[#1877F2]" : "text-[#65676B]"
            }`}
          >
            <ThumbsUp
              className={`w-5 h-5 ${post.is_liked ? "fill-[#1877F2]" : ""}`}
            />
            <span>Like</span>
          </button>
          <button
            onClick={() => setShowComments(!showComments)}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg hover:bg-[#F0F2F5] transition-colors text-[15px] font-medium text-[#65676B]"
          >
            <MessageCircle className="w-5 h-5" />
            <span>Comment</span>
          </button>
          <button
            onClick={() => sharePost(post.id)}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg hover:bg-[#F0F2F5] transition-colors text-[15px] font-medium ${
              post.is_shared ? "text-[#4ECDC4]" : "text-[#65676B]"
            }`}
          >
            <Share2 className="w-5 h-5" />
            <span>Share</span>
          </button>
        </div>
      </div>

      {/* Comments Section */}
      {showComments && (
        <div className="px-4 pb-4 border-t border-gray-100">
          {/* Existing Comments */}
          {(post.comments || []).map((comment) => (
            <div key={comment.id} className="flex gap-2 mt-3">
              <UserAvatar user={comment.user} size="xs" />
              <div className="flex-1">
                <div className="bg-[#F0F2F5] rounded-2xl px-3 py-2">
                  <span className="font-semibold text-[13px] text-[#1C1E21]">
                    {comment.user?.display_name}
                  </span>
                  <p className="text-[13px] text-[#1C1E21]">{comment.content}</p>
                </div>
                <div className="flex items-center gap-3 mt-1 px-2 text-xs text-[#65676B]">
                  <span>{timeAgo(comment.created_at)}</span>
                  <button
                    onClick={() => likeComment(post.id, comment.id)}
                    className={`font-semibold hover:underline ${
                      comment.is_liked ? "text-[#1877F2]" : ""
                    }`}
                  >
                    Like{comment.likes_count > 0 ? ` · ${comment.likes_count}` : ""}
                  </button>
                  <button className="font-semibold hover:underline">Reply</button>
                </div>
              </div>
            </div>
          ))}

          {/* Comment Input */}
          <div className="flex gap-2 mt-3">
            <UserAvatar user={user} size="xs" />
            <div className="flex-1 flex items-center bg-[#F0F2F5] rounded-full px-4">
              <input
                type="text"
                placeholder="Write a comment..."
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleComment()}
                className="flex-1 bg-transparent text-[13px] text-[#1C1E21] placeholder:text-[#65676B] py-2 focus:outline-none"
              />
              <button
                onClick={handleComment}
                disabled={!commentText.trim()}
                className="text-[#1877F2] disabled:text-[#BCC0C4] transition-colors"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </article>
  );
}
