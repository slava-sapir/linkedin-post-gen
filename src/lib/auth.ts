// src/lib/auth.ts
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import { NextAuthOptions, Session } from "next-auth";
import LinkedInProvider from "next-auth/providers/linkedin";

// Extend the Session type to include 'id' on user
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

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    LinkedInProvider({
      clientId: process.env.LINKEDIN_CLIENT_ID!,
      clientSecret: process.env.LINKEDIN_CLIENT_SECRET!,
       authorization: {
        url: "https://www.linkedin.com/oauth/v2/authorization",
        params: {
          scope: "r_liteprofile r_emailaddress w_member_social",
          prompt: "consent",
        },
      },
    }),
  ],
  session: { strategy: "database" }, // store sessions in DB
  callbacks: {
    async session({ session, user }) {
      if (session.user) {
        session.user.id = user.id; // attach id for later usage
      }
      return session;
    },
  },
};
