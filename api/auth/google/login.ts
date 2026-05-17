/**
 * Vercel Serverless Function: /api/auth/google/login
 * 
 * Initiates Google OAuth flow with PKCE.
 * Redirects user to Google's authorization endpoint.
 * Google prompt shows "to continue to nexus-networks.vercel.app"
 */
import type { VercelRequest, VercelResponse } from "@vercel/node";
import crypto from "crypto";

function base64URLEncode(buffer: Buffer): string {
  return buffer.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}

function sha256(str: string): Buffer {
  return crypto.createHash("sha256").update(str).digest();
}

export default function handler(req: VercelRequest, res: VercelResponse) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) {
    return res.status(500).json({ error: "GOOGLE_CLIENT_ID not configured" });
  }

  const origin = `${req.headers["x-forwarded-proto"] || "https"}://${req.headers.host}`;
  const redirectUri = `${origin}/api/auth/google/callback`;

  // Generate PKCE code verifier and challenge
  const codeVerifier = base64URLEncode(crypto.randomBytes(32));
  const codeChallenge = base64URLEncode(sha256(codeVerifier));

  // Generate state for CSRF protection
  const state = base64URLEncode(crypto.randomBytes(16));

  // Store code_verifier in a secure httpOnly cookie
  res.setHeader("Set-Cookie", [
    `google_oauth_verifier=${codeVerifier}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=600`,
    `google_oauth_state=${state}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=600`,
  ]);

  // Build Google authorization URL
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "openid email profile",
    access_type: "online",
    prompt: "select_account",
    state: state,
    code_challenge: codeChallenge,
    code_challenge_method: "S256",
  });

  const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;

  res.redirect(302, googleAuthUrl);
}
