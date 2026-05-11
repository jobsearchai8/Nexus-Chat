/*
 * VideoCallModal — Nexus Chat
 * ───────────────────────────
 * Midnight Command: Voice/Video call interface with WebRTC
 */

import { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useChat } from "@/contexts/ChatContext";
import UserAvatar from "./UserAvatar";
import { Button } from "@/components/ui/button";
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  Phone,
  PhoneOff,
  Monitor,
  Users,
  Maximize2,
  Minimize2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

const VIDEO_CALL_BG = "https://d2xsxph8kpxj0f.cloudfront.net/310519663435216308/2fgaxJv4JtYGP66iKhZqNw/video-call-bg-Zuxs6KkFm6UE6DasmLH36o.webp";

interface VideoCallModalProps {
  isOpen: boolean;
  callType: "voice" | "video";
  onClose: () => void;
}

export default function VideoCallModal({
  isOpen,
  callType,
  onClose,
}: VideoCallModalProps) {
  const { user } = useAuth();
  const { currentChannel, users } = useChat();
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOn, setIsVideoOn] = useState(callType === "video");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [callStatus, setCallStatus] = useState<"connecting" | "ringing" | "active" | "ended">("connecting");
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const localStreamRef = useRef<MediaStream | null>(null);

  // Simulate call connection
  useEffect(() => {
    if (!isOpen) return;

    setCallStatus("connecting");
    setCallDuration(0);

    const connectTimer = setTimeout(() => {
      setCallStatus("ringing");
    }, 1000);

    const activeTimer = setTimeout(() => {
      setCallStatus("active");
    }, 3000);

    return () => {
      clearTimeout(connectTimer);
      clearTimeout(activeTimer);
    };
  }, [isOpen]);

  // Call duration timer
  useEffect(() => {
    if (callStatus !== "active") return;

    const interval = setInterval(() => {
      setCallDuration((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [callStatus]);

  // Get local media stream
  useEffect(() => {
    if (!isOpen || !isVideoOn) return;

    const getMedia = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: isVideoOn,
          audio: !isMuted,
        });
        localStreamRef.current = stream;
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }
      } catch (error) {
        console.error("Failed to get media:", error);
      }
    };

    getMedia();

    return () => {
      localStreamRef.current?.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
    };
  }, [isOpen, isVideoOn]);

  const toggleMute = useCallback(() => {
    setIsMuted((prev) => {
      const newMuted = !prev;
      localStreamRef.current?.getAudioTracks().forEach((track) => {
        track.enabled = !newMuted;
      });
      return newMuted;
    });
  }, []);

  const toggleVideo = useCallback(() => {
    setIsVideoOn((prev) => {
      const newVideoOn = !prev;
      localStreamRef.current?.getVideoTracks().forEach((track) => {
        track.enabled = newVideoOn;
      });
      return newVideoOn;
    });
  }, []);

  const handleEndCall = useCallback(() => {
    localStreamRef.current?.getTracks().forEach((track) => track.stop());
    localStreamRef.current = null;
    setCallStatus("ended");
    setTimeout(onClose, 500);
  }, [onClose]);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  if (!isOpen) return null;

  // Get simulated participants
  const participants = users.filter((u) => u.id !== user?.id).slice(0, 3);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className={cn(
            "bg-surface-0 rounded-xl border border-border overflow-hidden flex flex-col",
            isFullscreen ? "w-full h-full" : "w-full max-w-3xl h-[500px]"
          )}
        >
          {/* Call header */}
          <div className="h-12 px-4 flex items-center justify-between border-b border-border shrink-0">
            <div className="flex items-center gap-2">
              <div
                className={cn(
                  "w-2 h-2 rounded-full",
                  callStatus === "active"
                    ? "bg-neon-green animate-pulse"
                    : callStatus === "ended"
                    ? "bg-red-500"
                    : "bg-yellow-500 animate-pulse"
                )}
              />
              <span className="text-sm font-medium">
                {callType === "video" ? "Video" : "Voice"} Call
              </span>
              <span className="text-xs text-muted-foreground">
                — {currentChannel?.name}
              </span>
            </div>
            <div className="flex items-center gap-2">
              {callStatus === "active" && (
                <span className="text-xs font-mono text-muted-foreground">
                  {formatDuration(callDuration)}
                </span>
              )}
              <button
                onClick={() => setIsFullscreen(!isFullscreen)}
                className="p-1.5 rounded hover:bg-surface-2 text-muted-foreground"
              >
                {isFullscreen ? (
                  <Minimize2 className="w-4 h-4" />
                ) : (
                  <Maximize2 className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          {/* Call area */}
          <div
            className="flex-1 relative flex items-center justify-center"
            style={{
              backgroundImage: `url(${VIDEO_CALL_BG})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          >
            <div className="absolute inset-0 bg-surface-0/60" />

            {callStatus === "connecting" || callStatus === "ringing" ? (
              <div className="relative z-10 text-center">
                <div className="flex justify-center mb-4">
                  {callType === "video" ? (
                    <div className="w-20 h-20 rounded-full bg-indigo/20 border-2 border-indigo/40 flex items-center justify-center animate-pulse">
                      <Video className="w-8 h-8 text-indigo" />
                    </div>
                  ) : (
                    <div className="w-20 h-20 rounded-full bg-neon-green/20 border-2 border-neon-green/40 flex items-center justify-center animate-pulse">
                      <Phone className="w-8 h-8 text-neon-green" />
                    </div>
                  )}
                </div>
                <p className="text-lg font-semibold">
                  {callStatus === "connecting" ? "Connecting..." : "Ringing..."}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  {currentChannel?.name}
                </p>
              </div>
            ) : callStatus === "active" ? (
              <div className="relative z-10 flex flex-wrap items-center justify-center gap-4 p-6">
                {/* Remote participants */}
                {participants.map((participant) => (
                  <div
                    key={participant.id}
                    className="w-48 h-36 rounded-lg bg-surface-1 border border-border flex flex-col items-center justify-center gap-2"
                  >
                    <UserAvatar user={participant} size="lg" />
                    <span className="text-sm font-medium">
                      {participant.display_name}
                    </span>
                    <span className="text-[10px] text-muted-foreground font-mono">
                      Connected
                    </span>
                  </div>
                ))}

                {/* Local video/avatar */}
                <div className="absolute bottom-4 right-4 w-32 h-24 rounded-lg bg-surface-1 border border-border overflow-hidden">
                  {isVideoOn ? (
                    <video
                      ref={localVideoRef}
                      autoPlay
                      muted
                      playsInline
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <UserAvatar user={user} size="md" />
                    </div>
                  )}
                  <div className="absolute bottom-1 left-1 text-[10px] font-mono text-white bg-black/50 px-1 rounded">
                    You
                  </div>
                </div>
              </div>
            ) : null}
          </div>

          {/* Call controls */}
          <div className="h-16 px-6 flex items-center justify-center gap-3 border-t border-border shrink-0 bg-surface-0">
            <button
              onClick={toggleMute}
              className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center transition-colors",
                isMuted
                  ? "bg-red-500/20 text-red-400 hover:bg-red-500/30"
                  : "bg-surface-2 text-foreground hover:bg-surface-3"
              )}
            >
              {isMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </button>

            <button
              onClick={toggleVideo}
              className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center transition-colors",
                !isVideoOn
                  ? "bg-red-500/20 text-red-400 hover:bg-red-500/30"
                  : "bg-surface-2 text-foreground hover:bg-surface-3"
              )}
            >
              {isVideoOn ? (
                <Video className="w-4 h-4" />
              ) : (
                <VideoOff className="w-4 h-4" />
              )}
            </button>

            <button
              className="w-10 h-10 rounded-full bg-surface-2 text-foreground hover:bg-surface-3 flex items-center justify-center transition-colors"
              title="Share screen (coming soon)"
            >
              <Monitor className="w-4 h-4" />
            </button>

            <button
              onClick={handleEndCall}
              className="w-12 h-10 rounded-full bg-red-500 hover:bg-red-600 text-white flex items-center justify-center transition-colors"
            >
              <PhoneOff className="w-4 h-4" />
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
