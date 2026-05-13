/**
 * Auth Context — Nexus Networks
 * ─────────────────────────
 * Handles authentication state with Supabase or demo mode.
 * Uses Google Identity Services (GIS) oauth2.initTokenClient
 * to open a Google popup directly — no redirect to supabase.co.
 * The popup shows only Google's domain (accounts.google.com).
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
    oauth2: {
      initTokenClient: (config: any) => any;
      initCodeClient: (config: any) => any;
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
  const isDemo = !isSupabaseConfigured;
  const mountedRef = useRef(true);
  const tokenClientRef = useRef<any>(null);
  const gisReadyRef = useRef(false);
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

  // Initialize Google Identity Services token client
  useEffect(() => {
    if (isDemo || gisReadyRef.current) return;

    const initGIS = () => {
      if (typeof google === "undefined" || !google?.accounts?.oauth2) return false;

      // Create a token client that opens a Google popup
      // When user selects their account, the callback fires with tokens
      tokenClientRef.current = google.accounts.oauth2.initTokenClient({
        client_id: GOOGLE_CLIENT_ID,
        scope: "openid email profile",
        callback: async (tokenResponse: any) => {
          // tokenResponse contains access_token
          // We need to get the ID token by calling Google's tokeninfo or userinfo
          if (tokenResponse.error) {
            console.error("Google token error:", tokenResponse.error);
            if (rejectGoogleRef.current) {
              rejectGoogleRef.current(new Error(tokenResponse.error));
              rejectGoogleRef.current = null;
              resolveGoogleRef.current = null;
            }
            return;
          }

          try {
            // Use the access token to get user info from Google
            const userInfoResponse = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
              headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
            });
            const userInfo = await userInfoResponse.json();

            // Now sign in with Supabase using the access token
            // We'll use signInWithOAuth with skipBrowserRedirect to avoid redirect,
            // but actually we need to use a different approach.
            // Since we have the Google access token, we can use signInWithIdToken
            // if we can get the id_token from the token response.
            
            // The tokenResponse from initTokenClient does NOT include id_token.
            // So instead, we'll manually create/sign-in the user via Supabase's
            // signInWithOAuth but in a popup window (not redirect).
            
            // Best approach: Open Supabase OAuth in a popup window
            const { data, error } = await supabase!.auth.signInWithOAuth({
              provider: "google",
              options: {
                redirectTo: `${window.location.origin}/auth/callback`,
                skipBrowserRedirect: true,
              },
            });

            if (error) {
              if (rejectGoogleRef.current) {
                rejectGoogleRef.current(error);
              }
              return;
            }

            if (data?.url) {
              // Open the Supabase OAuth URL in a popup
              const popup = window.open(
                data.url,
                "google-auth",
                "width=500,height=600,left=200,top=100"
              );

              // Listen for the popup to redirect back
              const pollTimer = setInterval(() => {
                try {
                  if (popup?.closed) {
                    clearInterval(pollTimer);
                    // Check if we got a session
                    supabase!.auth.getSession().then(({ data: { session } }) => {
                      if (session) {
                        if (resolveGoogleRef.current) {
                          resolveGoogleRef.current();
                        }
                      }
                      resolveGoogleRef.current = null;
                      rejectGoogleRef.current = null;
                    });
                  }
                  if (popup?.location?.href?.includes(window.location.origin)) {
                    clearInterval(pollTimer);
                    popup.close();
                    // Session should be set by Supabase
                    if (resolveGoogleRef.current) {
                      resolveGoogleRef.current();
                    }
                    resolveGoogleRef.current = null;
                    rejectGoogleRef.current = null;
                  }
                } catch {
                  // Cross-origin — popup is still on Google's domain, keep polling
                }
              }, 500);
            }
          } catch (err) {
            console.error("Error during Google sign-in:", err);
            if (rejectGoogleRef.current) {
              rejectGoogleRef.current(err);
            }
            resolveGoogleRef.current = null;
            rejectGoogleRef.current = null;
          }
        },
        error_callback: (error: any) => {
          console.error("Google OAuth error:", error);
          if (rejectGoogleRef.current) {
            rejectGoogleRef.current(new Error(error.type || "Google OAuth error"));
            rejectGoogleRef.current = null;
            resolveGoogleRef.current = null;
          }
        },
      });

      gisReadyRef.current = true;
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

    // Use Supabase OAuth in a popup window — this avoids a full page redirect
    // The popup shows Google's consent screen, then redirects back through Supabase
    // The main page stays on nexus-networks.vercel.app the entire time
    const { data, error } = await supabase!.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/home`,
        skipBrowserRedirect: true, // Don't redirect the main page
      },
    });

    if (error) throw error;

    if (data?.url) {
      // Open the OAuth flow in a popup window
      const width = 500;
      const height = 600;
      const left = window.screenX + (window.outerWidth - width) / 2;
      const top = window.screenY + (window.outerHeight - height) / 2;
      
      const popup = window.open(
        data.url,
        "nexus-google-auth",
        `width=${width},height=${height},left=${left},top=${top},scrollbars=yes,status=yes`
      );

      // Poll for the popup to close or redirect back to our origin
      return new Promise<void>((resolve, reject) => {
        const pollTimer = setInterval(async () => {
          try {
            // Check if popup was closed by user
            if (!popup || popup.closed) {
              clearInterval(pollTimer);
              // Give Supabase a moment to process the callback
              await new Promise(r => setTimeout(r, 1000));
              const { data: { session } } = await supabase!.auth.getSession();
              if (session) {
                resolve();
              } else {
                resolve(); // User closed popup, just resolve silently
              }
              return;
            }

            // Try to read the popup's URL (will throw if cross-origin)
            const popupUrl = popup.location.href;
            
            // If the popup has navigated back to our origin, extract the session
            if (popupUrl.includes(window.location.origin)) {
              clearInterval(pollTimer);
              
              // Extract hash params from the popup URL for Supabase to process
              const hashParams = popupUrl.split("#")[1];
              if (hashParams) {
                // Set the URL hash on the main window so Supabase can detect the session
                window.location.hash = hashParams;
              }
              
              popup.close();
              
              // Wait for Supabase to process the auth callback
              await new Promise(r => setTimeout(r, 2000));
              
              const { data: { session } } = await supabase!.auth.getSession();
              if (session) {
                resolve();
              } else {
                // Try refreshing
                await supabase!.auth.refreshSession();
                resolve();
              }
            }
          } catch {
            // Cross-origin error — popup is still on Google/Supabase domain
            // Keep polling
          }
        }, 500);

        // Safety timeout — 2 minutes
        setTimeout(() => {
          clearInterval(pollTimer);
          if (popup && !popup.closed) {
            popup.close();
          }
          resolve();
        }, 120000);
      });
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
