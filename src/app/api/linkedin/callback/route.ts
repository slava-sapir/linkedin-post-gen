// src/app/api/linkedin/callback/route.ts
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { cookies } from "next/headers";

function abs(url: string, req: Request) {
  const origin = new URL(req.url).origin;
  return new URL(url, origin);
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");

  const cookieStore = await cookies();
  const savedState = cookieStore.get("li_oauth_state")?.value;

  // Absolute redirect + clear stale state
  if (!code || !state || state !== savedState) {
    const resp = NextResponse.redirect(abs("/?li=error_state", req));
    resp.cookies.set("li_oauth_state", "", { path: "/", maxAge: 0 });
    return resp;
  }

  // Exchange code -> token
  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    redirect_uri: process.env.LINKEDIN_REDIRECT_URI || "",
    client_id: process.env.LINKEDIN_CLIENT_ID || "",
    client_secret: process.env.LINKEDIN_CLIENT_SECRET || "",
  });

  const tokenRes = await fetch("https://www.linkedin.com/oauth/v2/accessToken", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });

  if (!tokenRes.ok) {
    const resp = NextResponse.redirect(abs("/?li=error_token", req));
    resp.cookies.set("li_oauth_state", "", { path: "/", maxAge: 0 });
    return resp;
  }

  const tokenJson = await tokenRes.json();
  const accessToken = tokenJson.access_token as string;
  const expiresIn = (tokenJson.expires_in as number) || 3600; // seconds

  // OIDC: get user info → 'sub' is the member ID
  const userinfoRes = await fetch("https://api.linkedin.com/v2/userinfo", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!userinfoRes.ok) {
    const resp = NextResponse.redirect(abs("/?li=error_me", req));
    resp.cookies.set("li_oauth_state", "", { path: "/", maxAge: 0 });
    return resp;
  }

  const userinfo = await userinfoRes.json();
  const personId = userinfo.sub as string; // OIDC subject (member id)
  const authorUrn = `urn:li:person:${personId}`;

  // Store tokens in httpOnly cookies (demo only; use DB/session for prod)
  const resp = NextResponse.redirect(abs("/?li=ok", req));
  resp.cookies.set("li_access_token", accessToken, {
    httpOnly: true,
    sameSite: "lax",
    secure: false, // true in production
    path: "/",
    maxAge: Math.max(60, expiresIn - 60),
  });
  resp.cookies.set("li_author_urn", authorUrn, {
    httpOnly: true,
    sameSite: "lax",
    secure: false,
    path: "/",
    maxAge: Math.max(60, expiresIn - 60),
  });

  // Clear one-time state cookie
  resp.cookies.set("li_oauth_state", "", { path: "/", maxAge: 0 });
  return resp;
}
