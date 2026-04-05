import type { NextAuthConfig } from "next-auth";

/** Required in production; Auth.js returns "server configuration" error if empty. */
const secret = process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET;

if (process.env.NODE_ENV === "production" && !secret?.length) {
  console.warn(
    "[auth] AUTH_SECRET is missing. Set it in Vercel → Settings → Environment Variables (Production + Preview), then redeploy.",
  );
}

/**
 * Edge-safe auth config (no DB, no bcrypt). Used by middleware only.
 * Full providers live in `auth.ts`.
 */
export default {
  trustHost: true,
  secret,
  providers: [],
  session: { strategy: "jwt", maxAge: 30 * 24 * 60 * 60 },
  pages: { signIn: "/login" },
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.role = user.role;
        token.sub = user.id;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub!;
        session.user.role = (token.role as "ADMIN" | "CASHIER") ?? "CASHIER";
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
