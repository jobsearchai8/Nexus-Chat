/*
 * UserAvatar — Nexus Chat
 * ───────────────────────
 * Displays user avatar with online status indicator
 */

import type { User } from "@/lib/types";
import { cn } from "@/lib/utils";

interface UserAvatarProps {
  user?: User | null;
  size?: "xs" | "sm" | "md" | "lg";
  showStatus?: boolean;
  className?: string;
}

const sizeMap = {
  xs: "w-6 h-6 text-[10px]",
  sm: "w-7 h-7 text-xs",
  md: "w-9 h-9 text-sm",
  lg: "w-12 h-12 text-base",
};

const statusDotSize = {
  xs: "w-1.5 h-1.5 -bottom-0 -right-0",
  sm: "w-2 h-2 -bottom-0 -right-0",
  md: "w-2.5 h-2.5 -bottom-0.5 -right-0.5",
  lg: "w-3 h-3 -bottom-0.5 -right-0.5",
};

const statusColors: Record<string, string> = {
  online: "bg-neon-green",
  away: "bg-yellow-500",
  dnd: "bg-red-500",
  offline: "bg-[#484F58]",
};

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function getAvatarColor(name: string): string {
  const colors = [
    "bg-indigo/80",
    "bg-cyan-accent/80",
    "bg-neon-green/80",
    "bg-amber-500/80",
    "bg-rose-500/80",
    "bg-violet-500/80",
    "bg-teal-500/80",
    "bg-orange-500/80",
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

export default function UserAvatar({
  user,
  size = "md",
  showStatus = false,
  className,
}: UserAvatarProps) {
  const displayName = user?.display_name || user?.username || "?";
  const status = user?.status || "offline";

  return (
    <div className={cn("relative shrink-0", className)}>
      {user?.avatar_url ? (
        <img
          src={user.avatar_url}
          alt={displayName}
          className={cn(
            "rounded-full object-cover",
            sizeMap[size]
          )}
        />
      ) : (
        <div
          className={cn(
            "rounded-full flex items-center justify-center font-semibold text-white",
            sizeMap[size],
            getAvatarColor(displayName)
          )}
        >
          {getInitials(displayName)}
        </div>
      )}
      {showStatus && (
        <span
          className={cn(
            "absolute rounded-full border-2 border-surface-0",
            statusDotSize[size],
            statusColors[status]
          )}
        />
      )}
    </div>
  );
}
