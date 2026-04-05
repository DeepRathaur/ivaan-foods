import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: DefaultSession["user"] & {
      id: string;
      role: "ADMIN" | "CASHIER";
    };
  }

  interface User {
    role: "ADMIN" | "CASHIER";
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role?: "ADMIN" | "CASHIER";
  }
}
