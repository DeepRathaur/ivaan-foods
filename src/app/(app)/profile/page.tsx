import { auth } from "@/auth";
import { SignOutButton } from "@/components/AppNav";
import Image from "next/image";
import Link from "next/link";

export default async function ProfilePage() {
  const session = await auth();
  const user = session?.user;

  return (
    <div className="mx-auto max-w-md space-y-6">
      <Link
        href="/dashboard"
        className="inline-flex text-sm font-medium text-amber-800 hover:underline dark:text-amber-400"
      >
        ← Back to home
      </Link>
      <div className="rounded-2xl border border-[#ebe3d6] bg-white p-6 shadow-sm dark:border-stone-700 dark:bg-stone-900">
        <div className="flex flex-col items-center text-center">
          <div className="relative h-20 w-20 overflow-hidden rounded-full ring-2 ring-amber-400/40">
            <Image src="/brand/ivaan-logo.png" alt="Ivaan Foods" fill className="object-cover" sizes="80px" />
          </div>
          <h1 className="mt-4 text-xl font-bold text-[#4a3728] dark:text-stone-100">Profile</h1>
          <p className="mt-1 text-sm text-stone-600 dark:text-stone-400">{user?.name ?? "—"}</p>
          <p className="text-sm text-stone-500 dark:text-stone-500">{user?.email}</p>
          <span className="mt-3 rounded-full bg-[#4a3728] px-3 py-1 text-xs font-bold uppercase tracking-wide text-white dark:bg-amber-800">
            {user?.role ?? "—"}
          </span>
        </div>
        <SignOutButton className="mt-8 w-full rounded-xl border border-stone-200 py-3 text-sm font-semibold text-stone-700 transition hover:bg-stone-50 dark:border-stone-600 dark:text-stone-200 dark:hover:bg-stone-800" />
      </div>
    </div>
  );
}
