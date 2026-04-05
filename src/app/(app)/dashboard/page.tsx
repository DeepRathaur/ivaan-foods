import { auth } from "@/auth";
import {
  IconBox,
  IconCashRegister,
  IconChevronRight,
  IconMenu,
  IconReports,
  IconUsers,
} from "@/components/dashboard/NavIcons";
import Image from "next/image";
import Link from "next/link";

function firstNameFromSession(name: string | null | undefined, email: string | null | undefined) {
  const raw = (name ?? email?.split("@")[0] ?? "there").trim();
  const space = raw.indexOf(" ");
  return space > 0 ? raw.slice(0, space) : raw;
}

function initials(name: string | null | undefined, email: string | null | undefined) {
  const raw = (name ?? email ?? "?").trim();
  if (raw.includes(" ")) {
    const parts = raw.split(/\s+/).filter(Boolean);
    return (parts[0]![0]! + (parts[1]?.[0] ?? "")).toUpperCase();
  }
  return raw.slice(0, 2).toUpperCase();
}

export default async function DashboardPage() {
  const session = await auth();
  const first = firstNameFromSession(session?.user?.name, session?.user?.email);
  const isAdmin = session?.user?.role === "ADMIN";
  const role = session?.user?.role ?? "CASHIER";

  return (
    <div className="space-y-6 pb-4">
      <header className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3">
          <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-full ring-2 ring-amber-400/35">
            <Image src="/brand/ivaan-logo.png" alt="Ivaan Foods" fill className="object-cover" sizes="44px" />
          </div>
          <span
            className="truncate text-lg font-semibold italic leading-tight text-[#4a3728] dark:text-amber-100/95"
            style={{ fontFamily: "var(--font-display), Georgia, serif" }}
          >
            Ivaan Foods
          </span>
        </div>
        <div className="flex shrink-0 flex-col items-center gap-1">
          <div
            className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-amber-200 to-amber-100 text-sm font-bold text-[#4a3728] shadow-inner ring-2 ring-white dark:from-amber-900 dark:to-amber-950 dark:text-amber-100 dark:ring-stone-800"
            aria-hidden
          >
            {initials(session?.user?.name, session?.user?.email)}
          </div>
          <span className="rounded-full bg-[#4a3728] px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-white dark:bg-amber-800">
            {role}
          </span>
        </div>
      </header>

      <div>
        <h1 className="text-[1.65rem] font-bold leading-tight tracking-tight text-[#4a3728] dark:text-stone-100">
          Welcome back,
          <br />
          <span className="bg-gradient-to-r from-amber-700 via-amber-600 to-amber-700 bg-clip-text text-transparent dark:from-amber-400 dark:via-amber-300 dark:to-amber-500">
            {first}
          </span>
        </h1>
        <p className="mt-2 max-w-md text-sm leading-relaxed text-[#7a6a5c] dark:text-stone-400">
          Your restaurant is buzzing. Here&apos;s your mission control for today.
        </p>
      </div>

      <Link
        href="/pos"
        className="group relative block overflow-hidden rounded-3xl bg-gradient-to-br from-amber-500 via-amber-600 to-amber-800 p-6 text-white shadow-xl shadow-amber-900/20 transition hover:shadow-2xl hover:shadow-amber-900/25"
      >
        <div className="absolute -right-6 -top-6 h-32 w-32 rounded-full bg-white/10 blur-2xl" aria-hidden />
        <div className="relative flex items-start gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm">
            <IconCashRegister className="h-8 w-8 text-white" />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-xl font-bold">Launch POS</h2>
            <p className="mt-1 text-sm leading-snug text-amber-50/95">
              Quick billing, split payments, and table management.
            </p>
            <span className="mt-4 inline-flex items-center gap-1 rounded-full bg-white/25 px-4 py-2 text-sm font-semibold backdrop-blur-sm transition group-hover:bg-white/35">
              Open terminal
              <IconChevronRight className="h-4 w-4" />
            </span>
          </div>
        </div>
      </Link>

      {isAdmin ? (
        <div className="grid grid-cols-2 gap-3">
          <Link
            href="/menu"
            className="rounded-2xl border border-[#ebe3d6] bg-[#f5efe6] p-4 shadow-sm transition hover:border-amber-300/60 hover:shadow-md dark:border-stone-700 dark:bg-stone-900 dark:hover:border-amber-800"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#c8f07e] text-[#4a3728] shadow-sm dark:bg-lime-900/50 dark:text-lime-200">
              <IconMenu className="h-5 w-5" />
            </div>
            <h3 className="mt-3 font-bold text-[#4a3728] dark:text-stone-100">Menu editor</h3>
            <p className="mt-1 text-xs leading-snug text-[#6b5344] dark:text-stone-400">
              Update items, prices &amp; seasonal specials.
            </p>
          </Link>
          <Link
            href="/reports"
            className="rounded-2xl border border-[#ebe3d6] bg-[#f5efe6] p-4 shadow-sm transition hover:border-amber-300/60 hover:shadow-md dark:border-stone-700 dark:bg-stone-900 dark:hover:border-amber-800"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#f4c4a8] text-[#4a3728] shadow-sm dark:bg-orange-950/60 dark:text-orange-200">
              <IconReports className="h-5 w-5" />
            </div>
            <h3 className="mt-3 font-bold text-[#4a3728] dark:text-stone-100">Reports</h3>
            <p className="mt-1 text-xs leading-snug text-[#6b5344] dark:text-stone-400">
              Daily sales, inventory, and staff analytics.
            </p>
          </Link>
        </div>
      ) : null}

      <div className="space-y-3">
        <div className="flex cursor-not-allowed items-center gap-4 rounded-2xl border border-[#ebe3d6] bg-white p-4 opacity-85 shadow-sm dark:border-stone-700 dark:bg-stone-900">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#ebe3d6] text-[#4a3728] dark:bg-stone-800 dark:text-stone-300">
            <IconUsers className="h-6 w-6" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="font-bold text-[#4a3728] dark:text-stone-100">Manage staff</h3>
            <p className="text-[10px] font-semibold uppercase tracking-wide text-stone-400">Coming soon</p>
          </div>
          <IconChevronRight className="h-5 w-5 shrink-0 text-stone-300 dark:text-stone-600" />
        </div>
        <div className="flex cursor-not-allowed items-center gap-4 rounded-2xl border border-[#ebe3d6] bg-white p-4 opacity-85 shadow-sm dark:border-stone-700 dark:bg-stone-900">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#ebe3d6] text-[#4a3728] dark:bg-stone-800 dark:text-stone-300">
            <IconBox className="h-6 w-6" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="font-bold text-[#4a3728] dark:text-stone-100">Stock inventory</h3>
            <p className="text-[10px] font-semibold uppercase tracking-wide text-stone-400">Coming soon</p>
          </div>
          <IconChevronRight className="h-5 w-5 shrink-0 text-stone-300 dark:text-stone-600" />
        </div>
      </div>

      <div className="relative overflow-hidden rounded-2xl border border-[#ebe3d6] bg-white p-5 shadow-sm dark:border-stone-700 dark:bg-stone-900">
        <span
          className="pointer-events-none absolute bottom-2 right-3 text-6xl font-serif leading-none text-stone-100 dark:text-stone-800"
          aria-hidden
        >
          &ldquo;
        </span>
        <blockquote
          className="relative text-base italic leading-relaxed text-[#5c4d42] dark:text-stone-300"
          style={{ fontFamily: "var(--font-display), Georgia, serif" }}
        >
          A recipe has no soul. You, as the cook, must bring soul to the recipe.
        </blockquote>
        <div className="relative mt-4 flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-emerald-500 shadow-sm shadow-emerald-600/40" aria-hidden />
          <span className="text-[10px] font-semibold uppercase tracking-wide text-stone-500 dark:text-stone-400">
            Kitchen status: online
          </span>
        </div>
      </div>
    </div>
  );
}
