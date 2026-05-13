/**
 * Auth Context — Nexus Networks
 * ─────────────────────────
 * Handles authentication state with Supabase or demo mode.
 * Uses Google Identity Services (GIS) google.accounts.id.renderButton
 * to show Google's native sign-in button. When clicked, Google opens
 * its own popup, authenticates the user, and returns an id_token.
 * We pass that id_token to Supabase's signInWithIdToken — no redirect
 * to supabase.co at any point.
 */

import { createContext, useContext, useState, useEffect, useCallback, useRef, type ReactNode } from "react";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { mockCurrentUser } from "@/lib/mockData";
import type { User } from "@/lib/types";

const DEMO_SESSION_KEY = "nexus_demo_user";
const GOOGLE_CLIENT_ID = "255852212484-k5userbqmr03lb5kn2r4vlosgt54bsn4.apps.googleusercontent.com";

// Declare the google global from GIS script
declare const google: {
  accounts: {
    id: {
      initialize: (config: any) => void;
      renderButton: (element: HTMLElement, config: any) => void;
      prompt: (callback?: (notification: any) => void) => void;
      cancel: () => void;
    };
  };
};

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
  const gisInitializedRef = useRef(false);
  const pendingButtonRef = useRef<HTMLElement | null>(null);

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

  // Initialize Google Identity Services
  useEffect(() => {
    if (isDemo || gisInitializedRef.current) return;

    const initGIS = () => {
      if (typeof google === "undefined" || !google?.accounts?.id) return false;

      google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: async (response: { credential: string; select_by: string }) => {
          try {
            // response.credential is the JWT id_token from Google
            const { data, error } = await supabase!.auth.signInWithIdToken({
              provider: "google",
              token: response.credential,
            });

            if (error) {
              console.error("Supabase signInWithIdToken error:", error);
            }
            // The onAuthStateChange listener will handle setting the user
          } catch (err) {
            console.error("Error during Google sign-in:", err);
          }
        },
        auto_select: false,
        cancel_on_tap_outside: true,
        itp_support: true,
      });

      gisInitializedRef.current = true;

      // If there's a pending button element, render the Google button now
      if (pendingButtonRef.current) {
        google.accounts.id.renderButton(pendingButtonRef.current, {
          type: "standard",
          theme: "outline",
          size: "large",
          text: "continue_with",
          shape: "rectangular",
          logo_alignment: "left",
          width: pendingButtonRef.current.offsetWidth || 400,
        });
        pendingButtonRef.current = null;
      }

      return true;
    };

    // Try to initialize immediately
    if (initGIS()) return;

    // Otherwise wait for the script to load
    const interval = setInterval(() => {
      if (initGIS()) {
        clearInterval(interval);
      }
    }, 200);

    return () => clearInterval(interval);
  }, [isDemo]);

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
        // Profile may not exist yet
      }
      return buildUserFromSession(sessionUser);
    };

    // Set up the auth state change listener
    const { data: { subscription } } = supabase!.auth.onAuthStateChange(
      async (event, session) => {
        if (!mountedRef.current) return;

        if ((event === "SIGNED_IN" || event === "INITIAL_SESSION") && session?.user) {
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
          if (mountedRef.current) {
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

    // Safety timeout — if auth state hasn't resolved in 5 seconds, stop loading
    const safetyTimeout = setTimeout(() => {
      if (mountedRef.current && isLoading) {
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

  // signInWithGoogle is now a no-op for non-demo mode because
  // Google's renderButton handles the entire flow. The callback
  // in google.accounts.id.initialize handles the token exchange.
  const signInWithGoogle = useCallback(async () => {
    if (isDemo) {
      setUser(mockCurrentUser);
      return;
    }
    // For non-demo: the Google rendered button handles everything.
    // This function exists for API compatibility.
  }, [isDemo]);

  // Function to render Google's native sign-in button into a DOM element
  const renderGoogleButton = useCallback((element: HTMLElement) => {
    if (isDemo) return;

    if (gisInitializedRef.current && typeof google !== "undefined") {
      google.accounts.id.renderButton(element, {
        type: "standard",
        theme: "outline",
        size: "large",
        text: "continue_with",
        shape: "rectangular",
        logo_alignment: "left",
        width: element.offsetWidth || 400,
      });
    } else {
      // GIS not ready yet — save the element reference so we can render later
      pendingButtonRef.current = element;
    }
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
