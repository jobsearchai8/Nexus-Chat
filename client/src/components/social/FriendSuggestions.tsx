/*
 * FriendSuggestions — Right Sidebar Widget
 * ─────────────────────────────────────────
 * Shows friend requests and people you may know
 * Properly sized for readability
 */

import { useSocial } from "@/contexts/SocialContext";
import { UserPlus, Check, X } from "lucide-react";
import { toast } from "sonner";

export function FriendSuggestions() {
  const {
    friendRequests,
    suggestedFriends,
    acceptFriendRequest,
    rejectFriendRequest,
    sendFriendRequest,
  } = useSocial();

  const pendingRequests = friendRequests.filter((fr) => fr.status === "pending");

  return (
    <div>
      {/* Friend Requests */}
      {pendingRequests.length > 0 && (
        <div className="mb-5">
          <h3 className="text-[14px] font-bold text-[#1C1E21] mb-3 flex items-center gap-2">
            Friend Requests
            <span className="text-[12px] font-bold text-white bg-[#E41E3F] rounded-full w-5 h-5 flex items-center justify-center">
              {pendingRequests.length}
            </span>
          </h3>
          <div className="space-y-3">
            {pendingRequests.map((req) => (
              <div key={req.id} className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-full bg-gradient-to-br from-[#1B2A4A] to-[#FF6B6B] flex items-center justify-center text-white text-sm font-bold shrink-0">
                  {req.from_user?.display_name?.[0] || "?"}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[14px] font-bold text-[#1C1E21] truncate">
                    {req.from_user?.display_name}
                  </p>
                  <div className="flex gap-2 mt-1.5">
                    <button
                      onClick={() => {
                        acceptFriendRequest(req.id);
                        toast.success("Friend request accepted!");
                      }}
                      className="px-4 py-1.5 rounded-md bg-[#1877F2] text-white text-[13px] font-bold hover:bg-[#166FE5] transition-colors"
                    >
                      Confirm
                    </button>
                    <button
                      onClick={() => rejectFriendRequest(req.id)}
                      className="px-4 py-1.5 rounded-md bg-[#E4E6EB] text-[#1C1E21] text-[13px] font-bold hover:bg-[#D8DADF] transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* People You May Know */}
      {suggestedFriends.length > 0 && (
        <div>
          <h3 className="text-[14px] font-bold text-[#1C1E21] mb-3">People you may know</h3>
          <div className="space-y-2.5">
            {suggestedFriends.map((friend) => (
              <div key={friend.id} className="flex items-center gap-3 p-1.5 rounded-lg hover:bg-[#F2F3F5] transition-colors">
                <div className="w-11 h-11 rounded-full bg-gradient-to-br from-[#4ECDC4] to-[#1B2A4A] flex items-center justify-center text-white text-sm font-bold shrink-0">
                  {friend.display_name[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[14px] font-bold text-[#1C1E21] truncate">
                    {friend.display_name}
                  </p>
                  <p className="text-[12px] text-[#65676B] truncate">{friend.status_text}</p>
                </div>
                <button
                  onClick={() => {
                    sendFriendRequest(friend.id);
                    toast.success("Friend request sent!");
                  }}
                  className="w-9 h-9 rounded-full bg-[#E7F3FF] hover:bg-[#D2E6FF] flex items-center justify-center transition-colors shrink-0"
                >
                  <UserPlus className="w-4.5 h-4.5 text-[#1877F2]" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
