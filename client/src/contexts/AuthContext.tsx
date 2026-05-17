/**
 * Auth Context — Nexus Networks
 * ─────────────────────────
 * Handles authentication state with Supabase or demo mode.
 * Uses Supabase OAuth redirect flow for Google login (most reliable).
 */

import { createContext, useContext, useState, useEffect, useCallback, useRef, type ReactNode } from "react";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { mockCurrentUser } from "@/lib/mockData";
import type { User } from "@/lib/types";

const DEMO_SESSION_KEY = "nexus_demo_user";

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isDemo: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, username: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  updateProfile: (data: Partial<User>) => Promise<void>;
  renderGoogleButton: (element: HTMLElement) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const isDemo = !isSupabaseConfigured;
  const mountedRef = useRef(true);

  // Persist demo user to sessionStorage whenever it changes
  useEffect(() => {
    if (isDemo) {
      if (user) {
        sessionStorage.setItem(DEMO_SESSION_KEY, JSON.stringify(user));
      } else {
        sessionStorage.removeItem(DEMO_SESSION_KEY);
      }
    }
  }, [user, isDemo]);

  // Auth state listener
  useEffect(() => {
    mountedRef.current = true;

    if (isDemo) {
      try {
        const stored = sessionStorage.getItem(DEMO_SESSION_KEY);
        if (stored) {
          const parsed = JSON.parse(stored) as User;
          setUser(parsed);
        }
      } catch {
        // Ignore parse errors
      }
      setIsLoading(false);
      return;
    }

    // Helper to build user from session when profile isn't ready yet
    const buildUserFromSession = (sessionUser: any): User => ({
      id: sessionUser.id,
      email: sessionUser.email || "",
      username: sessionUser.user_metadata?.name || sessionUser.email?.split("@")[0] || "user",
      display_name: sessionUser.user_metadata?.full_name || sessionUser.user_metadata?.name || sessionUser.email?.split("@")[0] || "User",
      avatar_url: sessionUser.user_metadata?.avatar_url || sessionUser.user_metadata?.picture || "",
      status: "online",
      created_at: sessionUser.created_at,
    } as User);

    // Helper to fetch profile or fallback to session data
    const fetchUserProfile = async (sessionUser: any): Promise<User | null> => {
      try {
        const { data: profile } = await supabase!
          .from("profiles")
          .select("*")
          .eq("id", sessionUser.id)
          .single();

        if (profile) {
          return profile as User;
        }
      } catch (e) {
        // Profile may not exist yet — use session data
        console.log("Profile not found, using session data");
      }
      return buildUserFromSession(sessionUser);
    };

    // Check for existing session first
    supabase!.auth.getSession().then(async ({ data: { session } }) => {
      if (!mountedRef.current) return;

      if (session?.user) {
        const userProfile = await fetchUserProfile(session.user);
        if (mountedRef.current && userProfile) {
          setUser(userProfile);
        }
      }
      if (mountedRef.current) {
        setIsLoading(false);
      }
    });

    // Set up the auth state change listener
    const { data: { subscription } } = supabase!.auth.onAuthStateChange(
      async (event, session) => {
        if (!mountedRef.current) return;

        if ((event === "SIGNED_IN" || event === "TOKEN_REFRESHED") && session?.user) {
          const userProfile = await fetchUserProfile(session.user);
          if (mountedRef.current && userProfile) {
            setUser(userProfile);
            setIsLoading(false);
          }
        } else if (event === "SIGNED_OUT") {
          if (mountedRef.current) {
            setUser(null);
            setIsLoading(false);
          }
        }
      }
    );

    return () => {
      mountedRef.current = false;
      subscription.unsubscribe();
    };
  }, [isDemo]);

  const signIn = useCallback(async (email: string, _password: string) => {
    if (isDemo) {
      setUser({ ...mockCurrentUser, email });
      return;
    }

    const { error } = await supabase!.auth.signInWithPassword({
      email,
      password: _password,
    });
    if (error) throw error;
  }, [isDemo]);

  const signUp = useCallback(async (email: string, password: string, username: string) => {
    if (isDemo) {
      setUser({ ...mockCurrentUser, email, username, display_name: username });
      return;
    }

    const { error } = await supabase!.auth.signUp({
      email,
      password,
      options: {
        data: { username, display_name: username },
      },
    });
    if (error) throw error;
  }, [isDemo]);

  // Google sign-in using Supabase OAuth redirect flow
  // This is the most reliable method — redirects through Supabase to Google and back
  const signInWithGoogle = useCallback(async () => {
    if (isDemo) {
      setUser(mockCurrentUser);
      return;
    }

    const { error } = await supabase!.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: window.location.origin + "/home",
      },
    });

    if (error) {
      console.error("[Auth] signInWithOAuth error:", error);
      throw error;
    }
  }, [isDemo]);

  // Render Google Sign-In button — now just a styled button that triggers OAuth redirect
  const renderGoogleButton = useCallback((_element: HTMLElement) => {
    // No-op: we use our own styled button that calls signInWithGoogle
  }, []);

  const signOut = useCallback(async () => {
    if (isDemo) {
      setUser(null);
      sessionStorage.removeItem(DEMO_SESSION_KEY);
      return;
    }

    try {
      await supabase!.auth.signOut();
    } catch (e) {
      console.error("[Auth] Sign out error:", e);
    }

    // Always clear local state regardless of Supabase response
    setUser(null);
  }, [isDemo]);

  const updateProfile = useCallback(async (data: Partial<User>) => {
    if (!user) return;

    if (isDemo) {
      setUser((prev) => prev ? { ...prev, ...data } : null);
      return;
    }

    const { error } = await supabase!
      .from("profiles")
      .update(data)
      .eq("id", user.id);
    if (error) throw error;
    setUser((prev) => prev ? { ...prev, ...data } : null);
  }, [user, isDemo]);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isDemo,
        signIn,
        signUp,
        signInWithGoogle,
        signOut,
        updateProfile,
        renderGoogleButton,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
