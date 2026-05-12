/*
 * Auth Context -- Nexus Chat
 * -------------------------
 * Handles authentication state with Supabase or demo mode
 * Fixed: OAuth callback race condition -- waits for URL hash processing
 * Fixed: Demo mode session persistence via sessionStorage
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

  useEffect(() => {
    mountedRef.current = true;

    if (isDemo) {
      // In demo mode, check sessionStorage for an existing session
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
        // Profile may not exist yet
      }
      // Fallback: build from session metadata
      return buildUserFromSession(sessionUser);
    };

    // Set up the auth state change listener FIRST
    // This ensures we catch the SIGNED_IN event from OAuth callback
    const { data: { subscription } } = supabase!.auth.onAuthStateChange(
      async (event, session) => {
        if (!mountedRef.current) return;

        if ((event === "SIGNED_IN" || event === "INITIAL_SESSION") && session?.user) {
          // Small delay to allow the trigger to create the profile
          await new Promise((resolve) => setTimeout(resolve, 800));

          if (!mountedRef.current) return;

          const userProfile = await fetchUserProfile(session.user);
          if (mountedRef.current && userProfile) {
            setUser(userProfile);
          }
          if (mountedRef.current) {
            setIsLoading(false);
          }
        } else if (event === "INITIAL_SESSION" && !session) {
          // No existing session -- user is not logged in
          if (mountedRef.current) {
            setUser(null);
            setIsLoading(false);
          }
        } else if (event === "SIGNED_OUT") {
          if (mountedRef.current) {
            setUser(null);
            setIsLoading(false);
          }
        } else if (event === "TOKEN_REFRESHED" && session?.user) {
          if (!user && mountedRef.current) {
            const userProfile = await fetchUserProfile(session.user);
            if (mountedRef.current && userProfile) {
              setUser(userProfile);
            }
          }
        }
      }
    );

    // Check if there's a hash in the URL (OAuth callback)
    const hasAuthCallback = window.location.hash.includes("access_token") ||
      window.location.search.includes("code=");

    if (hasAuthCallback) {
      // Let onAuthStateChange handle it -- don't set isLoading to false prematurely
      // Set a timeout as a safety net in case the callback doesn't fire
      const timeout = setTimeout(() => {
        if (mountedRef.current && isLoading) {
          setIsLoading(false);
        }
      }, 10000); // 10 second safety timeout

      return () => {
        mountedRef.current = false;
        subscription.unsubscribe();
        clearTimeout(timeout);
      };
    }

    // No OAuth callback -- check for existing session normally
    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase!.auth.getSession();
        if (session?.user && mountedRef.current) {
          const userProfile = await fetchUserProfile(session.user);
          if (mountedRef.current && userProfile) {
            setUser(userProfile);
          }
        }
      } catch (error) {
        console.error("Session check failed:", error);
      } finally {
        if (mountedRef.current) {
          setIsLoading(false);
        }
      }
    };

    checkSession();

    // Safety net timeout -- if loading is still true after 5 seconds, force it to false
    const safetyTimeout = setTimeout(() => {
      if (mountedRef.current) {
        setIsLoading(false);
      }
    }, 5000);

    return () => {
      mountedRef.current = false;
      subscription.unsubscribe();
      clearTimeout(safetyTimeout);
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

  const signInWithGoogle = useCallback(async () => {
    if (isDemo) {
      setUser(mockCurrentUser);
      return;
    }

    const { error } = await supabase!.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/home`,
      },
    });
    if (error) throw error;
  }, [isDemo]);

  const signOut = useCallback(async () => {
    if (isDemo) {
      setUser(null);
      sessionStorage.removeItem(DEMO_SESSION_KEY);
      return;
    }

    const { error } = await supabase!.auth.signOut();
    if (error) throw error;
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
