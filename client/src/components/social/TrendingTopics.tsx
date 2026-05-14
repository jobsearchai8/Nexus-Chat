/*
 * TrendingTopics — Right Sidebar Widget
 * ──────────────────────────────────────
 * Shows trending topics and hashtags with proper sizing
 */

import { TrendingUp } from "lucide-react";

const topics = [
  { tag: "#TechInnovation", posts: "2.4K posts", trending: true },
  { tag: "#RemoteWork", posts: "1.8K posts", trending: true },
  { tag: "#AIRevolution", posts: "3.1K posts", trending: true },
  { tag: "#WebDevelopment", posts: "956 posts", trending: false },
  { tag: "#StartupLife", posts: "1.2K posts", trending: false },
];

export function TrendingTopics() {
  return (
    <div>
      <h3 className="text-[14px] font-bold text-[#1C1E21] mb-3 flex items-center gap-2">
        <TrendingUp className="w-4.5 h-4.5 text-[#E41E3F]" />
        Trending Now
      </h3>
      <div className="space-y-1">
        {topics.map((topic) => (
          <button
            key={topic.tag}
            className="w-full text-left px-3 py-2.5 rounded-lg hover:bg-[#F2F3F5] transition-colors"
          >
            <p className="text-[14px] font-bold text-[#1877F2]">{topic.tag}</p>
            <p className="text-[12px] text-[#65676B] mt-0.5">{topic.posts}</p>
          </button>
        ))}
      </div>
    </div>
  );
}
