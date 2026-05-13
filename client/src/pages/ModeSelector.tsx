/*
 * Mode Selector — Nexus Networks
 * ───────────────────────────
 * Post-login landing page where users choose between Chat and Social modes
 * Design: Neo-Corporate Social — Deep indigo, coral accents, Plus Jakarta Sans
 */

import { useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { MessageSquare, Users, ArrowRight, Zap, Globe, Shield } from "lucide-react";
import { motion } from "framer-motion";

const HERO_BG = "https://d2xsxph8kpxj0f.cloudfront.net/310519663435216308/2fgaxJv4JtYGP66iKhZqNw/nexus-hero-banner-PiGowhhyYB6CXWmjnt9xJB.webp";
const CHAT_ICON = "https://d2xsxph8kpxj0f.cloudfront.net/310519663435216308/2fgaxJv4JtYGP66iKhZqNw/nexus-chat-mode-icon-3X8Cs6b7FK2gyjBcbgEqpE.webp";
const SOCIAL_ICON = "https://d2xsxph8kpxj0f.cloudfront.net/310519663435216308/2fgaxJv4JtYGP66iKhZqNw/nexus-social-mode-icon-ELeS8eGKAtA52SGXMQ7kqt.webp";

export default function ModeSelector() {
  const [, navigate] = useLocation();
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-[#F0F2F5] relative overflow-hidden">
      {/* Background hero image with overlay */}
      <div className="absolute inset-0 h-[340px]">
        <img src={HERO_BG} alt="" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-b from-[#1B2A4A]/85 via-[#1B2A4A]/70 to-[#F0F2F5]" />
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-4xl mx-auto px-4 pt-12 pb-16">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center">
              <Zap className="w-6 h-6 text-[#4ECDC4]" />
            </div>
            <h1 className="text-3xl font-bold text-white tracking-tight" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              Nexus Networks
            </h1>
          </div>
          <p className="text-white/80 text-lg max-w-md mx-auto">
            Welcome back{user?.display_name ? `, ${user.display_name}` : ""}! Choose how you want to connect today.
          </p>
        </motion.div>

        {/* Mode Cards */}
        <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
          {/* Chat Mode Card */}
          <motion.button
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            whileHover={{ y: -4, boxShadow: "0 20px 40px rgba(27,42,74,0.15)" }}
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate("/chat")}
            className="bg-white rounded-2xl p-8 text-left shadow-lg shadow-black/5 border border-gray-100 group cursor-pointer transition-all duration-300 hover:border-[#4ECDC4]/30"
          >
            <div className="w-20 h-20 rounded-2xl overflow-hidden mb-6 bg-[#F0F7FF]">
              <img src={CHAT_ICON} alt="Chat" className="w-full h-full object-cover" />
            </div>
            <h2 className="text-xl font-bold text-[#1C1E21] mb-2 flex items-center gap-2" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              Chats
              <ArrowRight className="w-5 h-5 text-[#4ECDC4] opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300" />
            </h2>
            <p className="text-[#65676B] text-sm leading-relaxed mb-6">
              Real-time messaging like Slack or Messenger. Create channels, send direct messages, make voice & video calls, and share files instantly.
            </p>
            <div className="flex flex-wrap gap-2">
              {["Channels", "DMs", "Voice Calls", "File Sharing"].map((tag) => (
                <span
                  key={tag}
                  className="px-3 py-1 rounded-full bg-[#E7F3FF] text-[#1877F2] text-xs font-medium"
                >
                  {tag}
                </span>
              ))}
            </div>
          </motion.button>

          {/* Social Network Card */}
          <motion.button
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.35 }}
            whileHover={{ y: -4, boxShadow: "0 20px 40px rgba(27,42,74,0.15)" }}
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate("/feed")}
            className="bg-white rounded-2xl p-8 text-left shadow-lg shadow-black/5 border border-gray-100 group cursor-pointer transition-all duration-300 hover:border-[#FF6B6B]/30"
          >
            <div className="w-20 h-20 rounded-2xl overflow-hidden mb-6 bg-[#FFF0F0]">
              <img src={SOCIAL_ICON} alt="Social" className="w-full h-full object-cover" />
            </div>
            <h2 className="text-xl font-bold text-[#1C1E21] mb-2 flex items-center gap-2" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              Social Network
              <ArrowRight className="w-5 h-5 text-[#FF6B6B] opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300" />
            </h2>
            <p className="text-[#65676B] text-sm leading-relaxed mb-6">
              Share your thoughts, photos, and videos with your network. Like, comment, and connect with others — just like Facebook.
            </p>
            <div className="flex flex-wrap gap-2">
              {["News Feed", "Posts", "Photos", "Connections"].map((tag) => (
                <span
                  key={tag}
                  className="px-3 py-1 rounded-full bg-[#FFF0F0] text-[#FF6B6B] text-xs font-medium"
                >
                  {tag}
                </span>
              ))}
            </div>
          </motion.button>
        </div>

        {/* Bottom features */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="flex justify-center gap-8 mt-12 text-sm text-[#65676B]"
        >
          <span className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-[#4ECDC4]" />
            End-to-end encrypted
          </span>
          <span className="flex items-center gap-2">
            <Globe className="w-4 h-4 text-[#FF6B6B]" />
            Connect globally
          </span>
          <span className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-[#1B2A4A]" />
            Real-time sync
          </span>
        </motion.div>
      </div>
    </div>
  );
}
