import NextAuth, { type NextAuthOptions } from "next-auth";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { prisma } from "@/lib/prisma";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    {
    id: "linkedin",
    name: "LinkedIn (OIDC)",
    type: "oauth",
    wellKnown: "https://www.linkedin.com/oauth/.well-known/openid-configuration",
    clientId: process.env.LINKEDIN_CLIENT_ID!,
    clientSecret: process.env.LINKEDIN_CLIENT_SECRET!,
    authorization: {
      params: {
        scope: "openid profile email w_member_social",
      },
    },
    idToken: true,
    checks: ["pkce", "state"],
    token: {
      url: "https://www.linkedin.com/oauth/v2/accessToken",
      async request(context) {
        // NextAuth helper automatically injects client_id + client_secret
        const response = await fetch("https://www.linkedin.com/oauth/v2/accessToken", {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({
            grant_type: "authorization_code",
            code: context.params.code as string,
            client_id: process.env.LINKEDIN_CLIENT_ID!,
            client_secret: process.env.LINKEDIN_CLIENT_SECRET!,
            redirect_uri: `${process.env.NEXTAUTH_URL}/api/auth/callback/linkedin`,
          }),
        });

        const tokens = await response.json();
        if (!response.ok) throw new Error(tokens.error_description || "Token exchange failed");
        return { tokens };
      },
    },
    profile(profile) {
      return {
        id: profile.sub,
        name:
          profile.name ||
          `${profile.given_name ?? ""} ${profile.family_name ?? ""}`.trim(),
        email: profile.email,
      };
    },
    },
  ],
  session: {
    strategy: "database",
  },
  secret: process.env.NEXTAUTH_SECRET,
  callbacks: {
    async session({ session, user }) {
      if (session.user) {
        session.user.id = user.id; // attach DB id
      }
      return session;
    },
  },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
