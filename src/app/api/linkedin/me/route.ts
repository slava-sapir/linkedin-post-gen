// src/app/api/linkedin/me/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { Account, User } from "@prisma/client";

interface LinkedInProfile {
  id: string;
  localizedFirstName: string;
  localizedLastName: string;
}

function decodeIdToken(idToken: string): null | {
  sub?: string;
  given_name?: string;
  family_name?: string;
} {
  try {
    const [, payload] = idToken.split(".");
    const json = JSON.parse(Buffer.from(payload, "base64").toString("utf8"));
    return json;
  } catch {
    return null;
  }
}

export async function GET(): Promise<NextResponse> {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }

  const user: (User & { accounts: Account[] }) | null = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: { accounts: true },
  });

  if (!user) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }

  const liAccount: Account | undefined = user.accounts.find(
    (a: Account) => a.provider === "linkedin"
  );

  if (!liAccount?.access_token) {
    return NextResponse.json({ authenticated: false }, { status: 200 });
  }

  // ✅ If token has expired, treat as unauthenticated (UI will show Login)
  const now = Math.floor(Date.now() / 1000);
  if (liAccount.expires_at && liAccount.expires_at < now) {
    return NextResponse.json(
      { authenticated: false, reason: "token_expired" },
      { status: 401 }
    );
  }

  // ✅ Fast path: decode OIDC id_token (no LinkedIn API call needed)
  if (liAccount.id_token) {
    const payload = decodeIdToken(liAccount.id_token);
    if (payload?.sub) {
      const profile: LinkedInProfile = {
        id: payload.sub,
        localizedFirstName: payload.given_name ?? "",
        localizedLastName: payload.family_name ?? "",
      };
      return NextResponse.json({ authenticated: true, profile });
    }
  }

  // 🔁 Fallback: call v2/me (requires r_liteprofile)
  try {
    const resp = await fetch("https://api.linkedin.com/v2/me", {
      headers: { Authorization: `Bearer ${liAccount.access_token}` },
    });

    if (!resp.ok) {
      // Don’t crash UI — just say not authenticated so button shows Login
      // (Common if scopes are missing)
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    const me = (await resp.json()) as { id: string; localizedFirstName?: string; localizedLastName?: string };
    const profile: LinkedInProfile = {
      id: me.id,
      localizedFirstName: me.localizedFirstName ?? "",
      localizedLastName: me.localizedLastName ?? "",
    };
    return NextResponse.json({ authenticated: true, profile });
  } catch (e) {
    // Network or other error — don’t block UI
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }
}
