/*
 * Login Page — Nexus Chat
 * ───────────────────────
 * Midnight Command: Dark login with constellation hero background
 * Electric indigo accents, sharp geometry, Geist typography
 */

import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, MessageSquare, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";

const HERO_BG = "https://d2xsxph8kpxj0f.cloudfront.net/310519663435216308/2fgaxJv4JtYGP66iKhZqNw/hero-bg-BF6yurV8zch3Uu2PUvWA7t.webp";

export default function Login() {
  const [, navigate] = useLocation();
  const { signIn, signInWithGoogle, isDemo, user, isLoading: authLoading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Redirect to chat if user is already authenticated
  useEffect(() => {
    if (user && !authLoading) {
      navigate("/chat");
    }
  }, [user, authLoading, navigate]);

  // Show loading while checking auth state
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0D1117]">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await signIn(email, password);
      navigate("/chat");
    } catch (error: any) {
      toast.error(error.message || "Failed to sign in");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    try {
      await signInWithGoogle();
      if (isDemo) navigate("/chat");
    } catch (error: any) {
      toast.error(error.message || "Failed to sign in with Google");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    setIsLoading(true);
    try {
      await signIn("demo@nexuschat.app", "demo");
      navigate("/chat");
    } catch (error: any) {
      toast.error(error.message || "Failed to start demo");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left panel — Hero */}
      <div className="hidden lg:flex lg:w-[55%] relative overflow-hidden">
        <img
          src={HERO_BG}
          alt="Nexus Chat"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0D1117]/80 to-transparent" />
        <div className="relative z-10 flex flex-col justify-end p-12 pb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-indigo-600 flex items-center justify-center">
                <MessageSquare className="w-5 h-5 text-white" />
              </div>
              <span className="text-white/90 font-semibold text-lg tracking-tight font-[Geist]">
                Nexus Chat
              </span>
            </div>
            <h1 className="text-4xl font-bold text-white mb-3 font-[Geist] leading-tight">
              Connect. Collaborate.<br />Communicate.
            </h1>
            <p className="text-white/60 text-base max-w-md font-[Geist]">
              A modern messaging platform built for teams who value speed,
              security, and seamless collaboration.
            </p>
          </motion.div>
        </div>
      </div>

      {/* Right panel — Login form */}
      <div className="flex-1 flex items-center justify-center bg-[#0D1117] px-6">
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="w-full max-w-sm"
        >
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div className="w-9 h-9 rounded-lg bg-indigo-600 flex items-center justify-center">
              <MessageSquare className="w-4 h-4 text-white" />
            </div>
            <span className="text-white font-semibold font-[Geist]">Nexus Chat</span>
          </div>

          <h2 className="text-2xl font-bold text-white mb-1 font-[Geist]">Welcome back</h2>
          <p className="text-[#8B949E] text-sm mb-8 font-[Geist]">
            Sign in to continue to your workspace
          </p>

          {/* Google Sign In */}
          <Button
            onClick={handleGoogleSignIn}
            disabled={isLoading}
            variant="outline"
            className="w-full mb-4 h-11 bg-[#161B22] border-[#30363D] text-white hover:bg-[#1C2128] hover:border-[#6366F1]/50 transition-all font-[Geist]"
          >
            <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continue with Google
          </Button>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[#30363D]" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-[#0D1117] px-3 text-[#8B949E] font-[Geist]">or continue with email</span>
            </div>
          </div>

          {/* Email form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="email" className="text-[#C9D1D9] text-xs font-medium font-[Geist]">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                className="mt-1.5 h-10 bg-[#161B22] border-[#30363D] text-white placeholder:text-[#484F58] focus:border-[#6366F1] focus:ring-[#6366F1]/20 font-[Geist]"
                required
              />
            </div>
            <div>
              <Label htmlFor="password" className="text-[#C9D1D9] text-xs font-medium font-[Geist]">
                Password
              </Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="mt-1.5 h-10 bg-[#161B22] border-[#30363D] text-white placeholder:text-[#484F58] focus:border-[#6366F1] focus:ring-[#6366F1]/20 font-[Geist]"
                required
              />
            </div>
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-10 bg-[#6366F1] hover:bg-[#5558E6] text-white font-medium transition-all font-[Geist]"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  Sign In <ArrowRight className="w-4 h-4 ml-1" />
                </>
              )}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-[#8B949E] font-[Geist]">
            Don't have an account?{" "}
            <button
              onClick={() => navigate("/register")}
              className="text-[#6366F1] hover:text-[#818CF8] transition-colors font-medium"
            >
              Create one
            </button>
          </p>

          {/* Demo mode */}
          <div className="mt-4 pt-4 border-t border-[#30363D]">
            <Button
              onClick={handleDemoLogin}
              disabled={isLoading}
              variant="ghost"
              className="w-full text-[#8B949E] hover:text-white hover:bg-[#161B22] text-xs font-[Geist]"
            >
              Try Demo Mode — No account needed
            </Button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
