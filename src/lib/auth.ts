/* src/lib/auth.ts */
/* eslint-disable @typescript-eslint/no-explicit-any */

import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import type { NextAuthOptions } from "next-auth";

/**
 * Extend the next-auth Session type to include user.id (DB id)
 * so we can access it on the client/server easily.
 */
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
  }
}

/**
 * Small local type for the LinkedIn token response. Keep it open-ended.
 */
type LinkedInTokenResponse = {
  access_token?: string;
  refresh_token?: string | null;
  expires_in?: number;
  id_token?: string;
  token_type?: string;
  scope?: string;
  [k: string]: unknown;
};

/**
 * Custom LinkedIn provider config (OIDC + Share on LinkedIn)
 * This is a pragmatic provider object that works across NextAuth versions.
 */
const LinkedInOIDCProvider = {
  id: "linkedin",
  name: "LinkedIn (OIDC)",
  type: "oauth",
  // LinkedIn OIDC discovery
  wellKnown: "https://www.linkedin.com/oauth/.well-known/openid-configuration",
  clientId: process.env.LINKEDIN_CLIENT_ID,
  clientSecret: process.env.LINKEDIN_CLIENT_SECRET,
  authorization: {
    params: {
      // OIDC + profile + email + posting scope
      scope: "openid profile email w_member_social",
      response_type: "code",
    },
  },
  idToken: true,
  // Use both PKCE and state for security (NextAuth will provide code_verifier)
  checks: ["pkce", "state"],

  /**
   * Token endpoint config + custom request so we can format request exactly
   * how LinkedIn expects (x-www-form-urlencoded). We coerce values to strings
   * to avoid URLSearchParams / TypeScript issues.
   */
  token: {
    url: "https://www.linkedin.com/oauth/v2/accessToken",
    async request({
      params,
      provider,
    }: {
      params: Record<string, any>;
      provider: { clientId?: string; clientSecret?: string; token?: any };
    }): Promise<{ tokens: LinkedInTokenResponse }> {
      // coerce to string (or empty string) to satisfy URLSearchParams
      const code = typeof params.code === "string" ? params.code : String(params.code ?? "");
      const codeVerifier =
        typeof params.codeVerifier === "string" ? params.codeVerifier : String(params.codeVerifier ?? "");

      const body = new URLSearchParams();
      body.append("grant_type", "authorization_code");
      body.append("code", code);
      body.append("redirect_uri", `${process.env.NEXTAUTH_URL}/api/auth/callback/linkedin`);

      if (provider.clientId) body.append("client_id", provider.clientId);
      if (provider.clientSecret) body.append("client_secret", provider.clientSecret);

      // Only append code_verifier if we actually have a value
      if (codeVerifier) body.append("code_verifier", codeVerifier);

      // Resolve token URL (provider.token may be a string or object)
      const tokenConfig = provider.token;
      const tokenUrl = typeof tokenConfig === "string" ? tokenConfig : tokenConfig?.url;
      if (!tokenUrl) throw new Error("Missing token endpoint for LinkedIn provider");

      const res = await fetch(tokenUrl, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: body.toString(),
      });

      let tokens: LinkedInTokenResponse;
      try {
        tokens = (await res.json()) as LinkedInTokenResponse;
      } catch (err) {
        throw new Error("Failed to parse LinkedIn token response");
      }

      if (!res.ok) {
        // surface LinkedIn error text (if present) to help debugging
        const msg =
          (tokens && (tokens as any).error_description) ||
          (tokens && (tokens as any).error) ||
          `LinkedIn token exchange failed: ${res.status}`;
        throw new Error(String(msg));
      }

      // Return tokens in shape NextAuth expects from token endpoint request
      return { tokens };
    },
  },

  /**
   * Map the OIDC profile -> NextAuth user profile.
   * LinkedIn OIDC profile fields vary; handle common ones.
   */
  profile(profile: any) {
    // profile.sub is standard OIDC subject.
    const id = profile.sub ?? profile.id ?? profile.user_id ?? null;
    const given = profile.given_name ?? profile.localizedFirstName ?? null;
    const family = profile.family_name ?? profile.localizedLastName ?? null;
    const name = profile.name ?? ([given, family].filter(Boolean).join(" ") || null);
    const email = profile.email ?? profile.email_address ?? (Array.isArray(profile.emails) ? profile.emails[0] : null) ?? null;

    return {
      id,
      name,
      email,
      image: null,
    };
  },
};

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    // add our custom LinkedIn provider object (NextAuth accepts plain object providers)
    LinkedInOIDCProvider as any,
  ],
  // store sessions in DB so we can associate accounts / tokens
  session: {
    strategy: "database",
  },
  // make sure next-auth uses your secret (set in .env)
  secret: process.env.NEXTAUTH_SECRET,

  callbacks: {
    // attach DB user.id to the session object for easier server/client use
    async session({ session, user }) {
      if (session.user) {
        session.user.id = user.id;
      }
      return session;
    },
  },
};
