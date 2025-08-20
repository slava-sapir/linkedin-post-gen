import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

function abs(path: string, req: NextRequest) {
  const proto = req.headers.get("x-forwarded-proto") ?? "http";
  const host = req.headers.get("host");
  return `${proto}://${host}${path}`;
}

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const cookieStore = await cookies();
  const savedState = cookieStore.get("li_oauth_state")?.value;

  if (!code || !state || state !== savedState) {
    return NextResponse.redirect(abs("/?li=error_state", req));
  }

  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    redirect_uri: process.env.LINKEDIN_REDIRECT_URI ?? "",
    client_id: process.env.LINKEDIN_CLIENT_ID ?? "",
    client_secret: process.env.LINKEDIN_CLIENT_SECRET ?? "",
  });

  const tokenRes = await fetch("https://www.linkedin.com/oauth/v2/accessToken", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });

  if (!tokenRes.ok) {
    return NextResponse.redirect(abs("/?li=error_token", req));
  }

  const tokenData: { access_token: string } = await tokenRes.json();
  const accessToken = tokenData.access_token;

  // Fetch user info via OpenID Connect
  const userinfoRes = await fetch("https://api.linkedin.com/v2/userinfo", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!userinfoRes.ok) {
    return NextResponse.redirect(abs("/?li=error_me", req));
  }

  const userinfo: { sub: string } = await userinfoRes.json();
  const personId = userinfo.sub;
  const authorUrn = `urn:li:person:${personId}`;

  const res = NextResponse.redirect(abs("/", req));
  res.cookies.set("li_access_token", accessToken, { path: "/" });
  res.cookies.set("li_author_urn", authorUrn, { path: "/" });
  res.cookies.set("li_oauth_state", "", { path: "/", maxAge: 0 });
  return res;
}
