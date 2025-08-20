import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const state = crypto.randomUUID();

  const params = new URLSearchParams({
    response_type: "code",
    client_id: process.env.LINKEDIN_CLIENT_ID ?? "",
    redirect_uri: process.env.LINKEDIN_REDIRECT_URI ?? "",
    scope: "openid profile w_member_social",
    state,
  });

  const url = `https://www.linkedin.com/oauth/v2/authorization?${params.toString()}`;

  const res = NextResponse.redirect(url);
  res.cookies.set("li_oauth_state", state, { path: "/" });
  return res;
}
