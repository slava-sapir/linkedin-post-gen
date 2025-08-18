// src/app/api/linkedin/auth/route.ts
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { cookies } from "next/headers";

function randState() {
  return Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2);
}

export async function GET() {
  const state = randState();

  const cookieStore = await cookies(); // await in your Next version
  cookieStore.set("li_oauth_state", state, {
    httpOnly: true,
    sameSite: "lax",
    secure: false, // set true in production
    path: "/",
    maxAge: 600, // 10 minutes
  });

  const params = new URLSearchParams({
    response_type: "code",
    client_id: process.env.LINKEDIN_CLIENT_ID || "",
    redirect_uri: process.env.LINKEDIN_REDIRECT_URI || "",
    // OIDC + Posting scopes:
    scope: "openid profile w_member_social",
    state,
    // Force fresh consent after scope/product changes:
    prompt: "consent",
  });

  return NextResponse.redirect(
    `https://www.linkedin.com/oauth/v2/authorization?${params.toString()}`
  );
}
