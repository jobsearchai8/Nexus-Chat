/**
 * Auth Context — Nexus Networks
 * ─────────────────────────
 * Handles authentication state with Supabase or demo mode.
 * Uses Google Identity Services (GIS) popup for Google login.
 * This shows "nexus-networks.vercel.app" in Google prompt (not supabase.co),
 * only one Google prompt, and is fast/efficient.
 */

import { createContext, useContext, useState, useEffect, useCallback, useRef, type ReactNode } from "react";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { mockCurrentUser } from "@/lib/mockData";
import type { User } from "@/lib/types";

const DEMO_SESSION_KEY = "nexus_demo_user";
const GOOGLE_CLIENT_ID = "255852212484-k5userbqmr03lb5kn2r4vlosgt54bsn4.apps.googleusercontent.com";

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

// Load Google Identity Services script
function loadGoogleScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (document.getElementById("google-gis-script")) {
      resolve();
      return;
    }
    // Check if already loaded
    if ((window as any).google?.accounts?.id) {
      resolve();
      return;
    }
    const script = document.createElement("script");
    script.id = "google-gis-script";
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load Google Identity Services"));
    document.head.appendChild(script);
  });
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const isDemo = !isSupabaseConfigured;
  const mountedRef = useRef(true);
  const googleInitializedRef = useRef(false);
  const credentialCallbackRef = useRef<((response: any) => void) | null>(null);

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

        if (event === "SIGNED_IN" && session?.user) {
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

  // Initialize Google Identity Services
  useEffect(() => {
    if (isDemo || googleInitializedRef.current) return;

    loadGoogleScript().then(() => {
      const goog = (window as any).google;
      if (!goog?.accounts?.id) return;

      goog.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: (response: any) => {
          if (credentialCallbackRef.current) {
            credentialCallbackRef.current(response);
          }
        },
        auto_select: false,
        cancel_on_tap_outside: true,
      });

      googleInitializedRef.current = true;
    }).catch(console.error);
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

  // Google sign-in using GIS popup + signInWithIdToken
  // This shows "nexus-networks.vercel.app" in Google prompt, not supabase.co
  // Only one Google prompt, fast and efficient
  const signInWithGoogle = useCallback(async () => {
    if (isDemo) {
      setUser(mockCurrentUser);
      return;
    }

    // Ensure Google script is loaded
    await loadGoogleScript();

    const goog = (window as any).google;
    if (!goog?.accounts?.id) {
      throw new Error("Google Identity Services not available");
    }

    // Re-initialize to ensure callback is fresh
    return new Promise<void>((resolve, reject) => {
      credentialCallbackRef.current = async (response: any) => {
        if (!response.credential) {
          reject(new Error("No credential received from Google"));
          return;
        }

        try {
          const { error } = await supabase!.auth.signInWithIdToken({
            provider: "google",
            token: response.credential,
          });

          if (error) {
            console.error("[Auth] signInWithIdToken error:", error);
            reject(error);
          } else {
            resolve();
          }
        } catch (e) {
          console.error("[Auth] Exception during signInWithIdToken:", e);
          reject(e);
        }
      };

      // Trigger Google One Tap / popup
      goog.accounts.id.prompt((notification: any) => {
        if (notification.isNotDisplayed()) {
          // If One Tap is blocked, fall back to OAuth popup
          console.log("[Auth] One Tap not displayed, reason:", notification.getNotDisplayedReason());
          const tokenClient = goog.accounts.oauth2.initTokenClient({
            client_id: GOOGLE_CLIENT_ID,
            scope: "openid email profile",
            callback: async (tokenResponse: any) => {
              if (tokenResponse.error) {
                reject(new Error(tokenResponse.error));
                return;
              }
              // Fallback: use signInWithOAuth redirect
              try {
                const { error } = await supabase!.auth.signInWithOAuth({
                  provider: "google",
                  options: {
                    redirectTo: window.location.origin + "/home",
                    skipBrowserRedirect: false,
                  },
                });
                if (error) reject(error);
                else resolve();
              } catch (e) {
                reject(e);
              }
            },
          });
          tokenClient.requestAccessToken();
        } else if (notification.isSkippedMoment()) {
          console.log("[Auth] One Tap skipped, reason:", notification.getSkippedReason());
        }
      });
    });
  }, [isDemo]);

  // Render Google Sign-In button (One Tap style)
  const renderGoogleButton = useCallback((element: HTMLElement) => {
    const goog = (window as any).google;
    if (isDemo || !goog?.accounts?.id) return;

    goog.accounts.id.renderButton(element, {
      type: "standard",
      theme: "outline",
      size: "large",
      text: "continue_with",
      shape: "rectangular",
      width: element.offsetWidth || 320,
    });
  }, [isDemo]);

  const signOut = useCallback(async () => {
    if (isDemo) {
      setUser(null);
      sessionStorage.removeItem(DEMO_SESSION_KEY);
      return;
    }

    try {
      // Sign out from Supabase
      await supabase!.auth.signOut();
    } catch (e) {
      console.error("[Auth] Sign out error:", e);
    }

    // Always clear local state regardless of Supabase response
    setUser(null);

    // Revoke Google session if available
    const goog = (window as any).google;
    if (goog?.accounts?.id) {
      goog.accounts.id.disableAutoSelect();
    }
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

// Use (window as any).google to avoid conflicts with Map.tsx google types
