/*
 * Friends Page — Nexus Networks
 * ─────────────────────────────
 * Facebook-style Friends page with:
 * - Friend Requests (pending incoming)
 * - People You May Know (suggestions)
 * - Search People (discover users across the network)
 * - My Friends list
 */

import { useState, useMemo } from "react";
import { useSocial } from "@/contexts/SocialContext";
import { useChat } from "@/contexts/ChatContext";
import { useAuth } from "@/contexts/AuthContext";
import { SocialNavbar } from "@/components/social/SocialNavbar";
import { ScrollArea } from "@/components/ui/scroll-area";
import UserAvatar from "@/components/UserAvatar";
import { Search, UserPlus, UserCheck, UserX, Users, MessageCircle, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { useLocation } from "wouter";
import { cn } from "@/lib/utils";
import type { User } from "@/lib/types";

type FriendsTab = "requests" | "suggestions" | "search" | "all";

export default function Friends() {
  const {
    friendRequests,
    suggestedFriends,
    acceptFriendRequest,
    rejectFriendRequest,
    sendFriendRequest,
  } = useSocial();
  const { users } = useChat();
  const { user: currentUser } = useAuth();
  const [, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState<FriendsTab>("requests");
  const [searchQuery, setSearchQuery] = useState("");

  const pendingRequests = friendRequests.filter((fr) => fr.status === "pending");
  const acceptedRequests = friendRequests.filter((fr) => fr.status === "accepted");

  // Combine all known users for search (chat users + suggested friends)
  const allPeople = useMemo(() => {
    const peopleMap = new Map<string, User>();
    users.forEach((u) => {
      if (u.id !== currentUser?.id) peopleMap.set(u.id, u);
    });
    suggestedFriends.forEach((u) => {
      if (u.id !== currentUser?.id) peopleMap.set(u.id, u);
    });
    return Array.from(peopleMap.values());
  }, [users, suggestedFriends, currentUser]);

  // Search results
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase();
    return allPeople.filter(
      (u) =>
        u.display_name.toLowerCase().includes(q) ||
        u.username.toLowerCase().includes(q) ||
        (u.email && u.email.toLowerCase().includes(q))
    );
  }, [searchQuery, allPeople]);

  // "My Friends" — accepted friend requests + chat users (simulated friends list)
  const myFriends = useMemo(() => {
    const friendIds = new Set(
      acceptedRequests.map((fr) => fr.from_user_id)
    );
    // In demo mode, treat chat users as existing friends
    return users.filter(
      (u) => u.id !== currentUser?.id && (friendIds.has(u.id) || true)
    );
  }, [users, acceptedRequests, currentUser]);

  const tabs: { id: FriendsTab; label: string; count?: number }[] = [
    { id: "requests", label: "Requests", count: pendingRequests.length },
    { id: "suggestions", label: "Suggestions", count: suggestedFriends.length },
    { id: "search", label: "Search" },
    { id: "all", label: "All Friends", count: myFriends.length },
  ];

  const renderPersonCard = (person: User, actions: React.ReactNode) => (
    <div
      key={person.id}
      className="bg-white rounded-xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-md transition-shadow"
    >
      {/* Card header with gradient */}
      <div className="h-16 bg-gradient-to-r from-blue-500 to-purple-500 relative">
        <div className="absolute -bottom-8 left-4">
          <div className="w-16 h-16 rounded-full border-3 border-white overflow-hidden bg-white">
            <UserAvatar user={person} size="lg" />
          </div>
        </div>
      </div>

      {/* Card body */}
      <div className="pt-10 px-4 pb-4">
        <h3 className="text-[15px] font-bold text-[#1C1E21] truncate">
          {person.display_name}
        </h3>
        <p className="text-[13px] text-[#65676B] truncate mt-0.5">
          @{person.username}
        </p>
        {person.status_text && (
          <p className="text-[12px] text-[#65676B] truncate mt-1">
            {person.status_text}
          </p>
        )}

        {/* Status indicator */}
        <div className="flex items-center gap-1.5 mt-2">
          <span
            className={cn(
              "w-2 h-2 rounded-full",
              person.status === "online"
                ? "bg-green-500"
                : person.status === "away"
                ? "bg-yellow-500"
                : "bg-gray-400"
            )}
          />
          <span className="text-[11px] text-[#65676B] capitalize">
            {person.status === "online" ? "Active now" : person.status}
          </span>
        </div>

        {/* Actions */}
        <div className="mt-3 flex flex-col gap-2">{actions}</div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F0F2F5]">
      <SocialNavbar />

      <div className="max-w-4xl mx-auto px-4 pt-4 pb-24 md:pb-8">
        {/* Page Header */}
        <div className="flex items-center gap-3 mb-4">
          <button
            onClick={() => navigate("/feed")}
            className="md:hidden w-9 h-9 rounded-full bg-white flex items-center justify-center shadow-sm"
          >
            <ArrowLeft className="w-5 h-5 text-[#1C1E21]" />
          </button>
          <h1 className="text-[24px] font-bold text-[#1C1E21]">Friends</h1>
        </div>

        {/* Search Bar */}
        <div className="relative mb-4">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-[#65676B]" />
          <input
            type="text"
            placeholder="Search people by name, username, or email..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              if (e.target.value.trim()) setActiveTab("search");
            }}
            className="w-full h-11 pl-11 pr-4 bg-white rounded-full text-[15px] text-[#1C1E21] placeholder:text-[#65676B] border border-gray-200 outline-none focus:border-[#1877F2] focus:ring-2 focus:ring-[#1877F2]/10 transition-all shadow-sm"
          />
        </div>

        {/* Tab Bar */}
        <div className="flex gap-1 mb-4 overflow-x-auto scrollbar-hide bg-white rounded-xl p-1 shadow-sm">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                if (tab.id !== "search") setSearchQuery("");
              }}
              className={cn(
                "flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-[14px] font-semibold whitespace-nowrap transition-colors",
                activeTab === tab.id
                  ? "bg-[#E7F3FF] text-[#1877F2]"
                  : "text-[#65676B] hover:bg-[#F2F3F5]"
              )}
            >
              {tab.label}
              {tab.count !== undefined && tab.count > 0 && (
                <span
                  className={cn(
                    "text-[11px] font-bold rounded-full w-5 h-5 flex items-center justify-center",
                    activeTab === tab.id
                      ? "bg-[#1877F2] text-white"
                      : "bg-[#E4E6EB] text-[#65676B]"
                  )}
                >
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === "requests" && (
          <div>
            {pendingRequests.length === 0 ? (
              <div className="bg-white rounded-xl p-8 text-center shadow-sm">
                <div className="w-16 h-16 rounded-full bg-[#F0F2F5] flex items-center justify-center mx-auto mb-4">
                  <UserCheck className="w-7 h-7 text-[#65676B]" />
                </div>
                <h3 className="text-[17px] font-bold text-[#1C1E21] mb-1">
                  No pending requests
                </h3>
                <p className="text-[14px] text-[#65676B]">
                  When someone sends you a friend request, it will appear here.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {pendingRequests.map((req) =>
                  req.from_user
                    ? renderPersonCard(req.from_user, (
                        <>
                          <button
                            onClick={() => {
                              acceptFriendRequest(req.id);
                              toast.success(`You and ${req.from_user?.display_name} are now friends!`);
                            }}
                            className="w-full py-2 rounded-lg bg-[#1877F2] text-white text-[13px] font-bold hover:bg-[#166FE5] transition-colors"
                          >
                            Confirm
                          </button>
                          <button
                            onClick={() => {
                              rejectFriendRequest(req.id);
                              toast("Request removed");
                            }}
                            className="w-full py-2 rounded-lg bg-[#E4E6EB] text-[#1C1E21] text-[13px] font-bold hover:bg-[#D8DADF] transition-colors"
                          >
                            Delete
                          </button>
                        </>
                      ))
                    : null
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === "suggestions" && (
          <div>
            {suggestedFriends.length === 0 ? (
              <div className="bg-white rounded-xl p-8 text-center shadow-sm">
                <div className="w-16 h-16 rounded-full bg-[#F0F2F5] flex items-center justify-center mx-auto mb-4">
                  <Users className="w-7 h-7 text-[#65676B]" />
                </div>
                <h3 className="text-[17px] font-bold text-[#1C1E21] mb-1">
                  No suggestions right now
                </h3>
                <p className="text-[14px] text-[#65676B]">
                  We'll suggest people you may know as more users join.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {suggestedFriends.map((person) =>
                  renderPersonCard(person, (
                    <button
                      onClick={() => {
                        sendFriendRequest(person.id);
                        toast.success(`Friend request sent to ${person.display_name}!`);
                      }}
                      className="w-full py-2 rounded-lg bg-[#1877F2] text-white text-[13px] font-bold hover:bg-[#166FE5] transition-colors flex items-center justify-center gap-1.5"
                    >
                      <UserPlus className="w-4 h-4" />
                      Add Friend
                    </button>
                  ))
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === "search" && (
          <div>
            {!searchQuery.trim() ? (
              <div className="bg-white rounded-xl p-8 text-center shadow-sm">
                <div className="w-16 h-16 rounded-full bg-[#F0F2F5] flex items-center justify-center mx-auto mb-4">
                  <Search className="w-7 h-7 text-[#65676B]" />
                </div>
                <h3 className="text-[17px] font-bold text-[#1C1E21] mb-1">
                  Search for people
                </h3>
                <p className="text-[14px] text-[#65676B]">
                  Type a name, username, or email to find people on Nexus Networks.
                </p>
              </div>
            ) : searchResults.length === 0 ? (
              <div className="bg-white rounded-xl p-8 text-center shadow-sm">
                <div className="w-16 h-16 rounded-full bg-[#F0F2F5] flex items-center justify-center mx-auto mb-4">
                  <UserX className="w-7 h-7 text-[#65676B]" />
                </div>
                <h3 className="text-[17px] font-bold text-[#1C1E21] mb-1">
                  No results for "{searchQuery}"
                </h3>
                <p className="text-[14px] text-[#65676B]">
                  Try searching with a different name or username.
                </p>
              </div>
            ) : (
              <div>
                <p className="text-[14px] text-[#65676B] mb-3">
                  {searchResults.length} result{searchResults.length !== 1 ? "s" : ""} for "{searchQuery}"
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {searchResults.map((person) =>
                    renderPersonCard(person, (
                      <>
                        <button
                          onClick={() => {
                            sendFriendRequest(person.id);
                            toast.success(`Friend request sent to ${person.display_name}!`);
                          }}
                          className="w-full py-2 rounded-lg bg-[#1877F2] text-white text-[13px] font-bold hover:bg-[#166FE5] transition-colors flex items-center justify-center gap-1.5"
                        >
                          <UserPlus className="w-4 h-4" />
                          Add Friend
                        </button>
                        <button
                          onClick={() => navigate("/chat")}
                          className="w-full py-2 rounded-lg bg-[#E4E6EB] text-[#1C1E21] text-[13px] font-bold hover:bg-[#D8DADF] transition-colors flex items-center justify-center gap-1.5"
                        >
                          <MessageCircle className="w-4 h-4" />
                          Message
                        </button>
                      </>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === "all" && (
          <div>
            {myFriends.length === 0 ? (
              <div className="bg-white rounded-xl p-8 text-center shadow-sm">
                <div className="w-16 h-16 rounded-full bg-[#F0F2F5] flex items-center justify-center mx-auto mb-4">
                  <Users className="w-7 h-7 text-[#65676B]" />
                </div>
                <h3 className="text-[17px] font-bold text-[#1C1E21] mb-1">
                  No friends yet
                </h3>
                <p className="text-[14px] text-[#65676B]">
                  Start connecting with people by sending friend requests!
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {myFriends.map((person) =>
                  renderPersonCard(person, (
                    <button
                      onClick={() => navigate("/chat")}
                      className="w-full py-2 rounded-lg bg-[#E4E6EB] text-[#1C1E21] text-[13px] font-bold hover:bg-[#D8DADF] transition-colors flex items-center justify-center gap-1.5"
                    >
                      <MessageCircle className="w-4 h-4" />
                      Message
                    </button>
                  ))
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
