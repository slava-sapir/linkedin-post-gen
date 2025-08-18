// src/app/api/linkedin/post/route.ts
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST(req: Request) {
  try {
    const { text } = await req.json();
    if (!text || typeof text !== "string") {
      return NextResponse.json({ error: "Missing 'text'." }, { status: 400 });
    }

    const cookieStore = await cookies();
    const token = cookieStore.get("li_access_token")?.value;
    const authorUrn = cookieStore.get("li_author_urn")?.value;

    if (!token || !authorUrn) {
      return NextResponse.json(
        { error: "Not authenticated with LinkedIn." },
        { status: 401 }
      );
    }

    // UGC text post payload
    const payload = {
      author: authorUrn,
      lifecycleState: "PUBLISHED",
      specificContent: {
        "com.linkedin.ugc.ShareContent": {
          shareCommentary: { text },
          shareMediaCategory: "NONE",
        },
      },
      visibility: { "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC" },
    };

    const res = await fetch("https://api.linkedin.com/v2/ugcPosts", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "X-Restli-Protocol-Version": "2.0.0",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const out = await res.json();
    if (!res.ok) {
      return NextResponse.json(
        { error: out?.message || "LinkedIn post failed", raw: out },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true, result: out });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Failed to post" }, { status: 500 });
  }
}
