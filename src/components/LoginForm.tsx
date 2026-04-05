"use client";

import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";

type LoginFormProps = { variant?: "light" | "dark" };

export function LoginForm({ variant = "light" }: LoginFormProps) {
  const router = useRouter();
  const dark = variant === "dark";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setPending(true);
    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
      callbackUrl: "/dashboard",
    });
    setPending(false);
    if (res?.error) {
      setError(
        "Invalid email or password — or no users exist yet on this server. If you just deployed, run db:seed once against your production DATABASE_URL (see DEPLOY.md).",
      );
      return;
    }
    router.replace("/dashboard");
    router.refresh();
  }

  const labelCls = dark ? "text-stone-300" : "text-stone-700 dark:text-stone-300";
  const inputCls = dark
    ? "border-stone-600 bg-stone-900 text-stone-100 placeholder:text-stone-500"
    : "border-stone-200 bg-white text-stone-900 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-100";

  return (
    <form onSubmit={onSubmit} className="mx-auto flex w-full max-w-sm flex-col gap-4">
      <label className={`block text-sm font-medium ${labelCls}`}>
        Email
        <input
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={`mt-1 w-full rounded-lg border px-3 py-2 outline-none ring-amber-500/40 focus:ring-2 ${inputCls}`}
        />
      </label>
      <label className={`block text-sm font-medium ${labelCls}`}>
        Password
        <input
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className={`mt-1 w-full rounded-lg border px-3 py-2 outline-none ring-amber-500/40 focus:ring-2 ${inputCls}`}
        />
      </label>
      {error ? (
        <p className={`text-sm ${dark ? "text-red-400" : "text-red-600 dark:text-red-400"}`}>{error}</p>
      ) : null}
      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-amber-600 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-amber-700 disabled:opacity-60"
      >
        {pending ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
