/**
 * Vercel Serverless Function: /api/auth/google/callback
 * 
 * Handles Google OAuth callback:
 * 1. Receives authorization code from Google
 * 2. Exchanges code for tokens using PKCE
 * 3. Uses the id_token to sign in with Supabase
 * 4. Sets Supabase session cookies
 * 5. Redirects to /home
 */
import type { VercelRequest, VercelResponse } from "@vercel/node";

// All secrets come from Vercel environment variables — never hardcode
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || "";
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || "";
const SUPABASE_URL = process.env.SUPABASE_URL || "";
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || "";

function parseCookies(cookieHeader: string | undefined): Record<string, string> {
  const cookies: Record<string, string> = {};
  if (!cookieHeader) return cookies;
  cookieHeader.split(";").forEach((cookie) => {
    const [name, ...rest] = cookie.trim().split("=");
    if (name) cookies[name] = rest.join("=");
  });
  return cookies;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Validate that required env vars are set
  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET || !SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.error("[Google OAuth] Missing required environment variables");
    return res.redirect(302, "/login?error=server_config");
  }

  const { code, state, error: oauthError } = req.query;

  if (oauthError) {
    console.error("[Google OAuth] Error from Google:", oauthError);
    return res.redirect(302, "/login?error=google_denied");
  }

  if (!code || typeof code !== "string") {
    return res.redirect(302, "/login?error=missing_code");
  }

  // Verify state (CSRF protection)
  const cookies = parseCookies(req.headers.cookie);
  const savedState = cookies.google_oauth_state;
  const codeVerifier = cookies.google_oauth_verifier;

  if (!savedState || savedState !== state) {
    console.error("[Google OAuth] State mismatch");
    return res.redirect(302, "/login?error=state_mismatch");
  }

  if (!codeVerifier) {
    console.error("[Google OAuth] Missing code verifier");
    return res.redirect(302, "/login?error=missing_verifier");
  }

  const origin = `${req.headers["x-forwarded-proto"] || "https"}://${req.headers.host}`;
  const redirectUri = `${origin}/api/auth/google/callback`;

  try {
    // Step 1: Exchange authorization code for tokens with Google
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code: code,
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
        code_verifier: codeVerifier,
      }),
    });

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.text();
      console.error("[Google OAuth] Token exchange failed:", errorData);
      return res.redirect(302, "/login?error=token_exchange_failed");
    }

    const tokens = await tokenResponse.json();
    const idToken = tokens.id_token;

    if (!idToken) {
      console.error("[Google OAuth] No id_token in response");
      return res.redirect(302, "/login?error=no_id_token");
    }

    // Step 2: Use the id_token to sign in with Supabase
    const supabaseResponse = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=id_token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "apikey": SUPABASE_ANON_KEY,
      },
      body: JSON.stringify({
        provider: "google",
        id_token: idToken,
      }),
    });

    if (!supabaseResponse.ok) {
      const errorData = await supabaseResponse.text();
      console.error("[Google OAuth] Supabase signInWithIdToken failed:", errorData);
      return res.redirect(302, "/login?error=supabase_auth_failed");
    }

    const supabaseSession = await supabaseResponse.json();

    // Step 3: Set Supabase session data in cookies so the frontend can pick it up
    const sessionData = JSON.stringify({
      access_token: supabaseSession.access_token,
      refresh_token: supabaseSession.refresh_token,
      expires_in: supabaseSession.expires_in,
      expires_at: supabaseSession.expires_at,
      token_type: supabaseSession.token_type,
      user: supabaseSession.user,
    });

    // Encode session data for safe cookie transport
    const encodedSession = Buffer.from(sessionData).toString("base64");

    // Clear OAuth cookies and set session cookie
    res.setHeader("Set-Cookie", [
      `google_oauth_verifier=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`,
      `google_oauth_state=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`,
      `supabase_session=${encodedSession}; Path=/; Secure; SameSite=Lax; Max-Age=60`,
    ]);

    // Redirect to home page — the frontend will pick up the session from the cookie
    res.redirect(302, "/home?auth=success");
  } catch (error) {
    console.error("[Google OAuth] Callback error:", error);
    return res.redirect(302, "/login?error=callback_failed");
  }
}
