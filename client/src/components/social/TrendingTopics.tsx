/*
 * TrendingTopics — Right Sidebar Widget
 * ──────────────────────────────────────
 * Shows trending topics and hashtags
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
    <div className="mt-6">
      <h3 className="text-[#65676B] text-sm font-semibold mb-3 flex items-center gap-2">
        <TrendingUp className="w-4 h-4" />
        Trending Now
      </h3>
      <div className="space-y-2.5">
        {topics.map((topic) => (
          <button
            key={topic.tag}
            className="w-full text-left px-2 py-1.5 rounded-lg hover:bg-black/5 transition-colors"
          >
            <p className="text-[14px] font-semibold text-[#1877F2]">{topic.tag}</p>
            <p className="text-[12px] text-[#65676B]">{topic.posts}</p>
          </button>
        ))}
      </div>
    </div>
  );
}
