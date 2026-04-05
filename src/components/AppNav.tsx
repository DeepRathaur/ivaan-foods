"use client";

import {
  IconHome,
  IconMenu,
  IconPos,
  IconProfile,
  IconReports,
} from "@/components/dashboard/NavIcons";
import { signOut, useSession } from "next-auth/react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  { href: "/dashboard", label: "Home", Icon: IconHome },
  { href: "/pos", label: "POS", Icon: IconPos },
  { href: "/menu", label: "Menu", Icon: IconMenu, adminOnly: true },
  { href: "/reports", label: "Reports", Icon: IconReports, adminOnly: true },
  { href: "/profile", label: "Profile", Icon: IconProfile },
] as const;

export function AppNav() {
  const pathname = usePathname();
  const { data } = useSession();
  const isAdmin = data?.user?.role === "ADMIN";

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 border-t border-[#e8dfd0] bg-white/95 pb-[env(safe-area-inset-bottom,0px)] shadow-[0_-6px_28px_rgba(74,55,40,0.07)] backdrop-blur-md dark:border-stone-800 dark:bg-stone-950/95 md:rounded-t-2xl md:border-x md:border-t md:shadow-xl"
      aria-label="Main navigation"
    >
      <div className="mx-auto flex max-w-lg items-stretch justify-between gap-0 px-1 pt-2 md:max-w-5xl md:justify-center md:gap-8 md:px-8">
        {items
          .filter((l) => !("adminOnly" in l && l.adminOnly) || isAdmin)
          .map((l) => {
            const active =
              l.href === "/dashboard"
                ? pathname === "/dashboard" || pathname === "/dashboard/"
                : pathname === l.href || pathname.startsWith(`${l.href}/`);
            const Icon = l.Icon;
            return (
              <Link
                key={l.href}
                href={l.href}
                className="group flex min-w-0 flex-1 flex-col items-center gap-1 rounded-xl px-2 py-2 transition md:flex-none md:px-4"
              >
                <span
                  className={`flex h-11 w-11 items-center justify-center rounded-xl transition ${
                    active
                      ? "bg-gradient-to-br from-amber-500 via-amber-600 to-amber-800 text-white shadow-md shadow-amber-900/25"
                      : "text-neutral-800 group-hover:bg-stone-100 group-hover:text-black dark:text-stone-400 dark:group-hover:bg-stone-800 dark:group-hover:text-white"
                  }`}
                >
                  <Icon className="h-6 w-6" />
                </span>
                <span className="max-w-full truncate text-[10px] font-semibold uppercase tracking-wide text-black group-hover:text-black dark:text-stone-100 dark:group-hover:text-stone-100">
                  {l.label}
                </span>
              </Link>
            );
          })}
      </div>
    </nav>
  );
}

export function SignOutButton({ className }: { className?: string }) {
  return (
    <button type="button" onClick={() => signOut({ callbackUrl: "/" })} className={className}>
      Sign out
    </button>
  );
}
