// ---------------------------------------------------------------------------
// PrivaCheck – NextAuth v5 configuration
// ---------------------------------------------------------------------------

import NextAuth from "next-auth";
import GitHub from "next-auth/providers/github";

// Warn at startup if env vars are missing (but don't throw during build)
if (process.env.NODE_ENV !== "production" || process.env.NEXT_PHASE !== "phase-production-build") {
  if (!process.env.GITHUB_ID) {
    console.warn(
      "\x1b[33m[PrivaCheck]\x1b[0m Missing GITHUB_ID env var. GitHub OAuth will not work. See .env.local.example",
    );
  }
  if (!process.env.GITHUB_SECRET) {
    console.warn(
      "\x1b[33m[PrivaCheck]\x1b[0m Missing GITHUB_SECRET env var. GitHub OAuth will not work. See .env.local.example",
    );
  }
}

declare module "next-auth" {
  interface Session {
    accessToken?: string;
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    GitHub({
      clientId: process.env.GITHUB_ID ?? "",
      clientSecret: process.env.GITHUB_SECRET ?? "",
      authorization: {
        params: {
          scope: "read:user repo",
        },
      },
    }),
  ],
  callbacks: {
    async jwt({ token, account }) {
      // Persist the OAuth access_token on first sign-in
      if (account) {
        token.accessToken = account.access_token;
      }
      return token;
    },
    async session({ session, token }) {
      // Expose accessToken to the client-side session
      session.accessToken = token.accessToken as string | undefined;
      return session;
    },
  },
});
