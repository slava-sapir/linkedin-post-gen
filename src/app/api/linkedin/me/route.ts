// src/app/api/linkedin/me/route.ts
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import type { Account, User } from "@prisma/client";

type OIDCUserInfo = {
  sub: string;
  name?: string;
  given_name?: string;
  family_name?: string;
  email?: string;
  picture?: string;
};

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

  const liAccount: Account | undefined = user.accounts.find(a => a.provider === "linkedin");
  if (!liAccount?.access_token) {
    return NextResponse.json({ authenticated: false }, { status: 200 });
  }

  const now = Math.floor(Date.now() / 1000);
  if (liAccount.expires_at && liAccount.expires_at < now) {
    return NextResponse.json({ authenticated: false, reason: "Token expired" }, { status: 401 });
  }

  try {
    // ✅ OIDC userinfo (works with `openid profile email`)
    const r = await fetch("https://api.linkedin.com/v2/userinfo", {
      headers: { Authorization: `Bearer ${liAccount.access_token}` },
    });

    if (!r.ok) {
      const err = await r.text();
      console.error("LinkedIn userinfo error:", err);
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    const ui = (await r.json()) as OIDCUserInfo;

    return NextResponse.json({
      authenticated: true,
      profile: {
        id: ui.sub,
        localizedFirstName: ui.given_name ?? ui.name ?? "",
        localizedLastName: ui.family_name ?? "",
      },
    });
  } catch (e) {
    console.error("LinkedIn OIDC userinfo error:", e);
    return NextResponse.json({ authenticated: false }, { status: 500 });
  }
}
