/*
 * Menu Tab — Nexus Networks
 * ─────────────────────────
 * Messenger-style menu with profile, settings, and options
 */

import { useAuth } from "@/contexts/AuthContext";
import UserAvatar from "./UserAvatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Moon,
  Sun,
  Bell,
  Lock,
  HelpCircle,
  LogOut,
  ChevronRight,
  User,
  Palette,
  Shield,
  MessageCircle,
  Globe,
  Info,
} from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";
import { toast } from "sonner";

export default function MenuTab() {
  const { user, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const handleSignOut = async () => {
    await signOut();
    window.location.href = "/login";
  };

  const menuSections = [
    {
      title: "Account",
      items: [
        {
          icon: User,
          label: "Profile",
          description: "Edit your profile info",
          color: "text-blue-500",
          bgColor: "bg-blue-50 dark:bg-blue-500/10",
          action: () => toast("Profile settings coming soon"),
        },
        {
          icon: Lock,
          label: "Privacy & Security",
          description: "Manage your privacy settings",
          color: "text-green-500",
          bgColor: "bg-green-50 dark:bg-green-500/10",
          action: () => toast("Privacy settings coming soon"),
        },
      ],
    },
    {
      title: "Preferences",
      items: [
        {
          icon: theme === "dark" ? Sun : Moon,
          label: "Dark Mode",
          description: theme === "dark" ? "Switch to light mode" : "Switch to dark mode",
          color: "text-purple-500",
          bgColor: "bg-purple-50 dark:bg-purple-500/10",
          action: () => toggleTheme?.(),
          toggle: true,
          toggleValue: theme === "dark",
        },
        {
          icon: Bell,
          label: "Notifications",
          description: "Manage notification preferences",
          color: "text-orange-500",
          bgColor: "bg-orange-50 dark:bg-orange-500/10",
          action: () => toast("Notification settings coming soon"),
        },
        {
          icon: Palette,
          label: "Chat Themes",
          description: "Customize chat appearance",
          color: "text-pink-500",
          bgColor: "bg-pink-50 dark:bg-pink-500/10",
          action: () => toast("Chat themes coming soon"),
        },
        {
          icon: Globe,
          label: "Language",
          description: "English (US)",
          color: "text-cyan-500",
          bgColor: "bg-cyan-50 dark:bg-cyan-500/10",
          action: () => toast("Language settings coming soon"),
        },
      ],
    },
    {
      title: "Support",
      items: [
        {
          icon: HelpCircle,
          label: "Help Center",
          description: "Get help and support",
          color: "text-gray-500",
          bgColor: "bg-gray-100 dark:bg-gray-500/10",
          action: () => toast("Help center coming soon"),
        },
        {
          icon: Shield,
          label: "Terms & Policies",
          description: "View legal information",
          color: "text-gray-500",
          bgColor: "bg-gray-100 dark:bg-gray-500/10",
          action: () => toast("Terms & Policies coming soon"),
        },
        {
          icon: Info,
          label: "About",
          description: "Nexus Networks v2.0",
          color: "text-gray-500",
          bgColor: "bg-gray-100 dark:bg-gray-500/10",
          action: () => toast("Nexus Networks v2.0 — Built with ❤️"),
        },
      ],
    },
  ];

  return (
    <div className="h-full flex flex-col bg-white dark:bg-[#0D1117]">
      {/* Header */}
      <div className="px-4 pt-4 pb-2 shrink-0">
        <h1 className="text-[26px] font-bold text-gray-900 dark:text-[#E6EDF3] mb-4">Menu</h1>

        {/* Profile card */}
        <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-[#161B22] mb-2">
          <UserAvatar user={user} size="lg" showStatus />
          <div className="flex-1 min-w-0">
            <p className="text-[16px] font-semibold text-gray-900 dark:text-[#E6EDF3] truncate">
              {user?.display_name || "User"}
            </p>
            <p className="text-[13px] text-gray-500 dark:text-[#8B949E] truncate">
              {user?.email || "user@example.com"}
            </p>
          </div>
          <ChevronRight className="w-5 h-5 text-gray-400 dark:text-[#484F58]" />
        </div>
      </div>

      {/* Menu items */}
      <ScrollArea className="flex-1">
        <div className="px-4 py-2 space-y-6">
          {menuSections.map((section) => (
            <div key={section.title}>
              <p className="text-[12px] font-semibold text-gray-400 dark:text-[#484F58] uppercase tracking-wider mb-2 px-1">
                {section.title}
              </p>
              <div className="space-y-1">
                {section.items.map((item) => (
                  <button
                    key={item.label}
                    onClick={item.action}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-gray-50 dark:hover:bg-[#161B22] transition-colors text-left"
                  >
                    <div className={`w-9 h-9 rounded-full ${item.bgColor} flex items-center justify-center shrink-0`}>
                      <item.icon className={`w-4.5 h-4.5 ${item.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[15px] font-medium text-gray-900 dark:text-[#E6EDF3]">
                        {item.label}
                      </p>
                      <p className="text-[12px] text-gray-500 dark:text-[#8B949E]">
                        {item.description}
                      </p>
                    </div>
                    {item.toggle ? (
                      <div className={`w-10 h-6 rounded-full transition-colors ${item.toggleValue ? "bg-blue-500" : "bg-gray-300 dark:bg-[#30363D]"} relative`}>
                        <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform ${item.toggleValue ? "translate-x-5" : "translate-x-1"}`} />
                      </div>
                    ) : (
                      <ChevronRight className="w-4 h-4 text-gray-400 dark:text-[#484F58]" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          ))}

          {/* Sign out button */}
          <button
            onClick={handleSignOut}
            className="w-full flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors text-left"
          >
            <div className="w-9 h-9 rounded-full bg-red-50 dark:bg-red-500/10 flex items-center justify-center shrink-0">
              <LogOut className="w-4.5 h-4.5 text-red-500" />
            </div>
            <p className="text-[15px] font-medium text-red-500">Sign Out</p>
          </button>

          <div className="pb-4" />
        </div>
      </ScrollArea>
    </div>
  );
}
