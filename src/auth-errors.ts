import { CredentialsSignin } from "next-auth";

/** Thrown from authorize() when Prisma/DB fails (distinct from wrong password). */
export class DatabaseSignInError extends CredentialsSignin {
  code = "database_unavailable";
}
