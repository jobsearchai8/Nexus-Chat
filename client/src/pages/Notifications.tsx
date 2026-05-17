/*
 * Notifications Page — Nexus Networks
 * ────────────────────────────────────
 * Full-page notifications view, accessible from mobile bottom tab
 * Facebook-style notification list with read/unread states
 */

import { useState } from "react";
import { useLocation } from "wouter";
import { useSocial } from "@/contexts/SocialContext";
import { SocialNavbar } from "@/components/social/SocialNavbar";
import UserAvatar from "@/components/UserAvatar";
import {
  Bell,
  Check,
  CheckCheck,
  Trash2,
  Heart,
  MessageCircle,
  UserPlus,
  Share2,
  AtSign,
  Mail,
} from "lucide-react";
import { cn } from "@/lib/utils";

type FilterTab = "all" | "unread";

export default function NotificationsPage() {
  const [, navigate] = useLocation();
  const {
    notifications,
    unreadNotifCount,
    markNotificationRead,
    markAllNotificationsRead,
    deleteNotification,
  } = useSocial();
  const [filter, setFilter] = useState<FilterTab>("all");

  const filteredNotifications =
    filter === "unread"
      ? notifications.filter((n) => !n.is_read)
      : notifications;

  const timeAgo = (dateStr: string) => {
    const seconds = Math.floor(
      (Date.now() - new Date(dateStr).getTime()) / 1000
    );
    if (seconds < 60) return "Just now";
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    return `${Math.floor(days / 7)}w ago`;
  };

  const notifIcon = (type: string) => {
    switch (type) {
      case "like":
        return (
          <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center">
            <Heart className="w-4 h-4 text-red-500" />
          </div>
        );
      case "comment":
        return (
          <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
            <MessageCircle className="w-4 h-4 text-green-600" />
          </div>
        );
      case "friend_request":
        return (
          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
            <UserPlus className="w-4 h-4 text-blue-600" />
          </div>
        );
      case "share":
        return (
          <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
            <Share2 className="w-4 h-4 text-purple-600" />
          </div>
        );
      case "mention":
        return (
          <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center">
            <AtSign className="w-4 h-4 text-orange-600" />
          </div>
        );
      case "message":
        return (
          <div className="w-8 h-8 rounded-full bg-cyan-100 flex items-center justify-center">
            <Mail className="w-4 h-4 text-cyan-600" />
          </div>
        );
      default:
        return (
          <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
            <Bell className="w-4 h-4 text-gray-500" />
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-[#F0F2F5]">
      <SocialNavbar />

      <div className="pt-14 pb-20 lg:pb-4">
        <div className="max-w-[680px] mx-auto px-0 sm:px-4 py-0 sm:py-4">
          {/* Header */}
          <div className="bg-white sm:rounded-t-xl border-b border-gray-100 px-4 py-3 flex items-center justify-between">
            <div>
              <h1 className="text-[20px] font-bold text-[#1C1E21]">
                Notifications
              </h1>
              {unreadNotifCount > 0 && (
                <p className="text-[13px] text-[#65676B]">
                  {unreadNotifCount} unread notification
                  {unreadNotifCount !== 1 ? "s" : ""}
                </p>
              )}
            </div>
            {unreadNotifCount > 0 && (
              <button
                onClick={markAllNotificationsRead}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[13px] font-medium text-[#1877F2] hover:bg-[#E7F3FF] transition-colors"
              >
                <CheckCheck className="w-4 h-4" />
                <span className="hidden sm:inline">Mark all read</span>
              </button>
            )}
          </div>

          {/* Filter tabs */}
          <div className="bg-white border-b border-gray-100 px-4 py-2 flex gap-2">
            {(["all", "unread"] as FilterTab[]).map((tab) => (
              <button
                key={tab}
                onClick={() => setFilter(tab)}
                className={cn(
                  "px-4 py-1.5 rounded-full text-[13px] font-medium transition-colors capitalize",
                  filter === tab
                    ? "bg-[#E7F3FF] text-[#1877F2]"
                    : "bg-[#EFF1F5] text-[#65676B] hover:bg-[#E4E6EB]"
                )}
              >
                {tab}
                {tab === "unread" && unreadNotifCount > 0 && (
                  <span className="ml-1.5 bg-[#E41E3F] text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                    {unreadNotifCount}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Notification list */}
          <div className="bg-white sm:rounded-b-xl shadow-sm">
            {filteredNotifications.length === 0 ? (
              <div className="py-16 text-center">
                <div className="w-16 h-16 rounded-full bg-[#EFF1F5] flex items-center justify-center mx-auto mb-4">
                  <Bell className="w-8 h-8 text-[#BCC0C4]" />
                </div>
                <p className="text-[17px] font-semibold text-[#1C1E21] mb-1">
                  {filter === "unread"
                    ? "All caught up!"
                    : "No notifications yet"}
                </p>
                <p className="text-[13px] text-[#65676B]">
                  {filter === "unread"
                    ? "You've read all your notifications"
                    : "When someone interacts with you, you'll see it here"}
                </p>
              </div>
            ) : (
              <div>
                {/* Today section */}
                {filteredNotifications.some((n) => {
                  const diff = Date.now() - new Date(n.created_at).getTime();
                  return diff < 24 * 60 * 60 * 1000;
                }) && (
                  <>
                    <div className="px-4 pt-3 pb-1">
                      <h3 className="text-[14px] font-semibold text-[#1C1E21]">
                        New
                      </h3>
                    </div>
                    {filteredNotifications
                      .filter((n) => {
                        const diff =
                          Date.now() - new Date(n.created_at).getTime();
                        return diff < 24 * 60 * 60 * 1000;
                      })
                      .map((notif) => (
                        <NotificationItem
                          key={notif.id}
                          notif={notif}
                          onRead={markNotificationRead}
                          onDelete={deleteNotification}
                          timeAgo={timeAgo}
                          notifIcon={notifIcon}
                        />
                      ))}
                  </>
                )}

                {/* Earlier section */}
                {filteredNotifications.some((n) => {
                  const diff = Date.now() - new Date(n.created_at).getTime();
                  return diff >= 24 * 60 * 60 * 1000;
                }) && (
                  <>
                    <div className="px-4 pt-3 pb-1 border-t border-gray-50">
                      <h3 className="text-[14px] font-semibold text-[#1C1E21]">
                        Earlier
                      </h3>
                    </div>
                    {filteredNotifications
                      .filter((n) => {
                        const diff =
                          Date.now() - new Date(n.created_at).getTime();
                        return diff >= 24 * 60 * 60 * 1000;
                      })
                      .map((notif) => (
                        <NotificationItem
                          key={notif.id}
                          notif={notif}
                          onRead={markNotificationRead}
                          onDelete={deleteNotification}
                          timeAgo={timeAgo}
                          notifIcon={notifIcon}
                        />
                      ))}
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Notification Item Component ─── */
function NotificationItem({
  notif,
  onRead,
  onDelete,
  timeAgo,
  notifIcon,
}: {
  notif: any;
  onRead: (id: string) => void;
  onDelete: (id: string) => void;
  timeAgo: (d: string) => string;
  notifIcon: (type: string) => React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "flex items-start gap-3 px-4 py-3 transition-colors hover:bg-[#F2F3F5] group",
        !notif.is_read && "bg-[#E7F3FF]/40"
      )}
    >
      {/* Clickable area */}
      <button
        onClick={() => onRead(notif.id)}
        className="flex items-start gap-3 flex-1 min-w-0 text-left"
      >
        {/* Actor avatar */}
        <div className="relative shrink-0">
          {notif.actor ? (
            <UserAvatar user={notif.actor} size="md" />
          ) : (
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#1B2A4A] to-[#4ECDC4] flex items-center justify-center text-white text-sm font-bold">
              ?
            </div>
          )}
          {/* Type icon overlay */}
          <div className="absolute -bottom-1 -right-1">
            {notifIcon(notif.type)}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <p className="text-[14px] text-[#1C1E21] leading-snug">
            <span className="font-semibold">
              {notif.actor?.display_name || "Someone"}
            </span>{" "}
            {notif.content}
          </p>
          <p
            className={cn(
              "text-[12px] mt-0.5",
              !notif.is_read
                ? "text-[#1877F2] font-medium"
                : "text-[#65676B]"
            )}
          >
            {timeAgo(notif.created_at)}
          </p>
        </div>
      </button>

      {/* Actions */}
      <div className="flex items-center gap-1 shrink-0 mt-1">
        {/* Unread indicator */}
        {!notif.is_read && (
          <div className="w-3 h-3 rounded-full bg-[#1877F2]" />
        )}
        {/* Delete button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete(notif.id);
          }}
          className="w-8 h-8 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 hover:bg-[#E4E6EB] transition-all"
          title="Remove notification"
        >
          <Trash2 className="w-3.5 h-3.5 text-[#65676B]" />
        </button>
      </div>
    </div>
  );
}
