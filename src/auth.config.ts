import type { NextAuthConfig } from "next-auth";

/**
 * Edge-safe auth config (no DB, no bcrypt). Used by middleware only.
 * Full providers live in `auth.ts`.
 */
export default {
  trustHost: true,
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
