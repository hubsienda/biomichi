// lib/auth.ts
import NextAuth, { type NextAuthConfig } from "next-auth";
import Google from "next-auth/providers/google";

const allowedEmails = new Set(
  (process.env.ALLOWED_EMAILS || "")
    .split(",")
    .map(e => e.trim().toLowerCase())
    .filter(Boolean)
);

export const authConfig: NextAuthConfig = {
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          scope: [
            "openid",
            "email",
            "profile",
            "https://www.googleapis.com/auth/drive.readonly",
            "https://www.googleapis.com/auth/drive.metadata.readonly",
            "https://www.googleapis.com/auth/drive.activity.readonly"
          ].join(" ")
        }
      }
    })
  ],
  callbacks: {
    async signIn({ user }) {
      if (!allowedEmails.size) return true;
      const email = (user?.email || "").toLowerCase();
      return allowedEmails.has(email);
    },
    async jwt({ token, account }) {
      if (account) token.access_token = account.access_token;
      return token;
    },
    async session({ session, token }) {
      (session as any).access_token = token.access_token;
      return session;
    }
  },
  session: { strategy: "jwt" }
};

// 👇 Expose handlers.GET/POST directly (v5-style)
export const {
  handlers: { GET, POST },
  auth,
  signIn,
  signOut
} = NextAuth(authConfig);
