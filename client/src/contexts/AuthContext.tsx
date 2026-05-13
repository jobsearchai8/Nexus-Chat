/*
 * Auth Context — Nexus Networks
 * ─────────────────────────
 * Handles authentication state with Supabase or demo mode
 * Uses Google Identity Services (GIS) + signInWithIdToken
 * to avoid showing .supabase.co on the Google consent screen.
 * The GIS prompt() shows a FedCM popup directly on the site.
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
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [googleLoading, setGoogleLoading] = useState(false);
  const isDemo = !isSupabaseConfigured;
  const mountedRef = useRef(true);
  const gisInitializedRef = useRef(false);
  const resolveGoogleRef = useRef<((value: void) => void) | null>(null);
  const rejectGoogleRef = useRef<((reason: any) => void) | null>(null);

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

  // Initialize Google Identity Services once the script loads
  useEffect(() => {
    if (isDemo || gisInitializedRef.current) return;

    const initGIS = () => {
      if (typeof google === "undefined" || !google?.accounts?.id) return false;

      google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: async (response: any) => {
          // response.credential contains the Google ID token
          if (!response.credential) {
            console.error("No credential in Google response");
            if (rejectGoogleRef.current) {
              rejectGoogleRef.current(new Error("No credential received from Google"));
              rejectGoogleRef.current = null;
              resolveGoogleRef.current = null;
            }
            return;
          }

          try {
            const { error } = await supabase!.auth.signInWithIdToken({
              provider: "google",
              token: response.credential,
            });

            if (error) {
              console.error("Supabase signInWithIdToken error:", error);
              if (rejectGoogleRef.current) {
                rejectGoogleRef.current(error);
              }
            } else {
              if (resolveGoogleRef.current) {
                resolveGoogleRef.current();
              }
            }
          } catch (err) {
            console.error("Error during Google sign-in:", err);
            if (rejectGoogleRef.current) {
              rejectGoogleRef.current(err);
            }
          } finally {
            resolveGoogleRef.current = null;
            rejectGoogleRef.current = null;
            setGoogleLoading(false);
          }
        },
        use_fedcm_for_prompt: true,
        context: "signin",
        ux_mode: "popup",
        itp_support: true,
        auto_select: false,
      });

      gisInitializedRef.current = true;
      return true;
    };

    // Try to initialize immediately (script might already be loaded)
    if (initGIS()) return;

    // Otherwise wait for the script to load
    const interval = setInterval(() => {
      if (initGIS()) {
        clearInterval(interval);
      }
    }, 200);

    return () => clearInterval(interval);
  }, [isDemo]);

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

    // Set up the auth state change listener
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
          // No existing session — user is not logged in
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

    // Check for existing session
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
        // Safety timeout — ensure loading stops
        setTimeout(() => {
          if (mountedRef.current) {
            setIsLoading(false);
          }
        }, 5000);
      }
    };

    checkSession();

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

  const signInWithGoogle = useCallback(async () => {
    if (isDemo) {
      setUser(mockCurrentUser);
      return;
    }

    // Use Google Identity Services prompt() to show the Google account picker
    // This opens as a popup/FedCM dialog directly on the site — no redirect to supabase.co
    if (!gisInitializedRef.current) {
      // Fallback: if GIS didn't load, use Supabase OAuth redirect
      const { error } = await supabase!.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/home`,
        },
      });
      if (error) throw error;
      return;
    }

    setGoogleLoading(true);

    return new Promise<void>((resolve, reject) => {
      resolveGoogleRef.current = resolve;
      rejectGoogleRef.current = reject;

      // Show the Google account picker popup
      google.accounts.id.prompt((notification: any) => {
        // notification.getMomentType() returns the moment type
        // If the prompt is dismissed or skipped, we need to handle it
        if (notification.isNotDisplayed()) {
          console.log("Google prompt not displayed, reason:", notification.getNotDisplayedReason());
          // Fallback to Supabase OAuth redirect if prompt can't display
          setGoogleLoading(false);
          resolveGoogleRef.current = null;
          rejectGoogleRef.current = null;
          
          supabase!.auth.signInWithOAuth({
            provider: "google",
            options: {
              redirectTo: `${window.location.origin}/home`,
            },
          }).then(({ error }) => {
            if (error) reject(error);
            else resolve();
          });
        } else if (notification.isSkippedMoment()) {
          console.log("Google prompt skipped, reason:", notification.getSkippedReason());
          setGoogleLoading(false);
          resolveGoogleRef.current = null;
          rejectGoogleRef.current = null;
          resolve();
        } else if (notification.isDismissedMoment()) {
          console.log("Google prompt dismissed, reason:", notification.getDismissedReason());
          setGoogleLoading(false);
          resolveGoogleRef.current = null;
          rejectGoogleRef.current = null;
          resolve();
        }
      });

      // Safety timeout — if nothing happens after 30 seconds, stop loading
      setTimeout(() => {
        if (resolveGoogleRef.current) {
          setGoogleLoading(false);
          resolveGoogleRef.current = null;
          rejectGoogleRef.current = null;
          resolve();
        }
      }, 30000);
    });
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
