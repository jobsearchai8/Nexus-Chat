/**
 * Auth Context — Nexus Networks
 * ─────────────────────────
 * Handles authentication state with Supabase or demo mode.
 * Uses server-side OAuth flow for Google login.
 * Google prompt shows "to continue to nexus-networks.vercel.app" (not supabase.co).
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

/**
 * Check if there's a supabase_session cookie from the server-side OAuth callback.
 * If found, set it in the Supabase client and clear the cookie.
 */
async function restoreSessionFromCookie(): Promise<boolean> {
  try {
    // Check for supabase_session cookie
    const cookies = document.cookie.split(";").reduce((acc, cookie) => {
      const [name, ...rest] = cookie.trim().split("=");
      if (name) acc[name] = rest.join("=");
      return acc;
    }, {} as Record<string, string>);

    const encodedSession = cookies["supabase_session"];
    if (!encodedSession || !supabase) return false;

    // Decode the session
    const sessionData = JSON.parse(atob(encodedSession));

    if (sessionData.access_token && sessionData.refresh_token) {
      // Set the session in Supabase client
      const { error } = await supabase.auth.setSession({
        access_token: sessionData.access_token,
        refresh_token: sessionData.refresh_token,
      });

      // Clear the cookie regardless
      document.cookie = "supabase_session=; Path=/; Max-Age=0; Secure; SameSite=Lax";

      if (error) {
        console.error("[Auth] Failed to restore session from cookie:", error);
        return false;
      }

      console.log("[Auth] Session restored from server-side OAuth callback");
      return true;
    }
  } catch (e) {
    console.error("[Auth] Error restoring session from cookie:", e);
    // Clear the cookie on error
    document.cookie = "supabase_session=; Path=/; Max-Age=0; Secure; SameSite=Lax";
  }
  return false;
}

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

    // Initialize: check for server-side OAuth session cookie, then check existing session
    const initAuth = async () => {
      // First, try to restore session from server-side OAuth callback cookie
      await restoreSessionFromCookie();

      // Then check for existing session
      const { data: { session } } = await supabase!.auth.getSession();
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
    };

    initAuth();

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

  // Google sign-in — redirect to our server-side OAuth handler
  // This shows "to continue to nexus-networks.vercel.app" in Google prompt
  const signInWithGoogle = useCallback(async () => {
    if (isDemo) {
      setUser(mockCurrentUser);
      return;
    }

    // Redirect to our server-side Google OAuth handler
    window.location.href = "/api/auth/google/login";
  }, [isDemo]);

  // Render Google Sign-In button — no-op, we use our own styled button
  const renderGoogleButton = useCallback((_element: HTMLElement) => {
    // No-op
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
