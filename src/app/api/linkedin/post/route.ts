// src/app/api/linkedin/post/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { Account, User } from "@prisma/client";

type PostBody = { text?: string };

export async function POST(req: Request): Promise<NextResponse> {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // parse body
    const { text }: PostBody = await req.json().catch(() => ({} as PostBody));
    const postText = (text || "").trim();
    if (!postText) {
      return NextResponse.json({ error: "Missing text" }, { status: 400 });
    }
    if (postText.length > 3000) {
      return NextResponse.json({ error: "Text exceeds LinkedIn limit (~3,000 chars)" }, { status: 400 });
    }

    // find user + linkedin account
    const user: (User & { accounts: Account[] }) | null = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { accounts: true },
    });
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const liAccount: Account | undefined = user.accounts.find(
      (a: Account) => a.provider === "linkedin"
    );

    if (!liAccount?.access_token) {
      return NextResponse.json({ error: "No LinkedIn account connected" }, { status: 400 });
    }

    // quick expiry check
    const now = Math.floor(Date.now() / 1000);
    if (liAccount.expires_at && liAccount.expires_at < now) {
      return NextResponse.json({ error: "LinkedIn token expired — please sign in again" }, { status: 401 });
    }

    // author URN: prefer providerAccountId from NextAuth Account
    const personId = liAccount.providerAccountId;
    if (!personId) {
      return NextResponse.json({ error: "Missing LinkedIn person id" }, { status: 400 });
    }
    const authorUrn = `urn:li:person:${personId}`;

    // UGC post payload
    const payload = {
      author: authorUrn,
      lifecycleState: "PUBLISHED",
      specificContent: {
        "com.linkedin.ugc.ShareContent": {
          shareCommentary: { text: postText },
          shareMediaCategory: "NONE",
        },
      },
      visibility: { "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC" },
    };

    const resp = await fetch("https://api.linkedin.com/v2/ugcPosts", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${liAccount.access_token}`,
        "Content-Type": "application/json",
        "X-Restli-Protocol-Version": "2.0.0",
      },
      body: JSON.stringify(payload),
    });

    if (!resp.ok) {
      let errBody: unknown = null;
      try {
        errBody = await resp.json();
      } catch {
        // ignore
      }
      return NextResponse.json(
        {
          error: "LinkedIn post failed",
          status: resp.status,
          details: errBody ?? (await resp.text().catch(() => "")),
        },
        { status: 500 }
      );
    }

    const data = await resp.json().catch(() => ({}));
    return NextResponse.json({ ok: true, data });
  } catch (e: unknown) {
    // unexpected error
    const msg = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
