/*
 * Notifications Tab — Nexus Networks
 * ───────────────────────────────────
 * Messenger-style notifications list
 */

import { useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Heart, MessageCircle, UserPlus, AtSign, Bell, Trash2, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import UserAvatar from "./UserAvatar";

interface Notification {
  id: string;
  type: "like" | "comment" | "mention" | "friend_request" | "message";
  title: string;
  body: string;
  avatar?: string;
  read: boolean;
  timestamp: string;
}

const mockNotifications: Notification[] = [
  {
    id: "n1",
    type: "friend_request",
    title: "Sarah Chen",
    body: "sent you a friend request",
    read: false,
    timestamp: new Date(Date.now() - 5 * 60000).toISOString(),
  },
  {
    id: "n2",
    type: "like",
    title: "Alex Rivera",
    body: "liked your post: \"Excited to share my new project...\"",
    read: false,
    timestamp: new Date(Date.now() - 15 * 60000).toISOString(),
  },
  {
    id: "n3",
    type: "comment",
    title: "Marcus Johnson",
    body: "commented on your photo: \"This looks amazing!\"",
    read: false,
    timestamp: new Date(Date.now() - 45 * 60000).toISOString(),
  },
  {
    id: "n4",
    type: "mention",
    title: "Team Design",
    body: "mentioned you in #general: \"@you check this out\"",
    read: true,
    timestamp: new Date(Date.now() - 2 * 3600000).toISOString(),
  },
  {
    id: "n5",
    type: "message",
    title: "Jordan Lee",
    body: "sent you a message: \"Hey, are you free tomorrow?\"",
    read: true,
    timestamp: new Date(Date.now() - 5 * 3600000).toISOString(),
  },
  {
    id: "n6",
    type: "like",
    title: "Emma Wilson",
    body: "and 3 others liked your comment",
    read: true,
    timestamp: new Date(Date.now() - 12 * 3600000).toISOString(),
  },
  {
    id: "n7",
    type: "friend_request",
    title: "David Kim",
    body: "accepted your friend request",
    read: true,
    timestamp: new Date(Date.now() - 24 * 3600000).toISOString(),
  },
  {
    id: "n8",
    type: "comment",
    title: "Lisa Park",
    body: "replied to your comment: \"I totally agree with you!\"",
    read: true,
    timestamp: new Date(Date.now() - 48 * 3600000).toISOString(),
  },
];

export default function NotificationsTab() {
  const [notifications, setNotifications] = useState<Notification[]>(mockNotifications);

  const getIcon = (type: Notification["type"]) => {
    switch (type) {
      case "like":
        return <Heart className="w-4 h-4 text-red-500" />;
      case "comment":
        return <MessageCircle className="w-4 h-4 text-blue-500" />;
      case "mention":
        return <AtSign className="w-4 h-4 text-purple-500" />;
      case "friend_request":
        return <UserPlus className="w-4 h-4 text-green-500" />;
      case "message":
        return <MessageCircle className="w-4 h-4 text-blue-500" />;
      default:
        return <Bell className="w-4 h-4 text-gray-500" />;
    }
  };

  const getTimeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "now";
    if (mins < 60) return `${mins}m`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h`;
    const days = Math.floor(hrs / 24);
    if (days < 7) return `${days}d`;
    return new Date(dateStr).toLocaleDateString([], { month: "short", day: "numeric" });
  };

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const deleteNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const markAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="h-full flex flex-col bg-white dark:bg-[#0D1117]">
      {/* Header */}
      <div className="px-4 pt-4 pb-2 shrink-0">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-[26px] font-bold text-gray-900 dark:text-[#E6EDF3]">Notifications</h1>
          {unreadCount > 0 && (
            <button
              onClick={markAllRead}
              className="text-[13px] text-blue-500 font-medium hover:text-blue-600 transition-colors flex items-center gap-1"
            >
              <Check className="w-3.5 h-3.5" />
              Mark all read
            </button>
          )}
        </div>
        {unreadCount > 0 && (
          <p className="text-[13px] text-gray-500 dark:text-[#8B949E]">
            You have {unreadCount} unread notification{unreadCount > 1 ? "s" : ""}
          </p>
        )}
      </div>

      {/* Notifications list */}
      <ScrollArea className="flex-1">
        <div className="px-2 py-1">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
              <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-[#161B22] flex items-center justify-center mb-4">
                <Bell className="w-8 h-8 text-gray-400 dark:text-[#484F58]" />
              </div>
              <p className="text-[15px] font-medium text-gray-700 dark:text-[#C9D1D9]">
                No notifications
              </p>
              <p className="text-[13px] text-gray-500 dark:text-[#8B949E] mt-1">
                You're all caught up!
              </p>
            </div>
          ) : (
            notifications.map((notification) => (
              <div
                key={notification.id}
                onClick={() => markAsRead(notification.id)}
                className={cn(
                  "flex items-start gap-3 px-3 py-3 rounded-xl transition-colors cursor-pointer group",
                  !notification.read
                    ? "bg-blue-50/50 dark:bg-blue-500/5"
                    : "hover:bg-gray-50 dark:hover:bg-[#161B22]"
                )}
              >
                {/* Icon */}
                <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-[#161B22] flex items-center justify-center shrink-0">
                  {getIcon(notification.type)}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <p className={cn(
                    "text-[14px] leading-snug",
                    !notification.read
                      ? "text-gray-900 dark:text-[#E6EDF3] font-medium"
                      : "text-gray-700 dark:text-[#C9D1D9]"
                  )}>
                    <span className="font-semibold">{notification.title}</span>{" "}
                    {notification.body}
                  </p>
                  <p className={cn(
                    "text-[12px] mt-0.5",
                    !notification.read ? "text-blue-500 font-medium" : "text-gray-400 dark:text-[#484F58]"
                  )}>
                    {getTimeAgo(notification.timestamp)}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 shrink-0">
                  {!notification.read && (
                    <div className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                  )}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteNotification(notification.id);
                    }}
                    className="w-7 h-7 rounded-full flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 opacity-0 group-hover:opacity-100 transition-all"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
