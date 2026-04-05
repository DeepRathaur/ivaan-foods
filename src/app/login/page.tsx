import { LoginForm } from "@/components/LoginForm";
import { BrandLogo } from "@/components/BrandLogo";
import { auth } from "@/auth";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function LoginPage() {
  const session = await auth();
  if (session?.user) redirect("/dashboard");

  return (
    <div className="flex min-h-full flex-1 flex-col items-center justify-center bg-black px-4 py-12">
      <Link
        href="/"
        className="mb-8 text-sm text-amber-300/90 hover:text-amber-200 hover:underline"
      >
        Back to splash
      </Link>
      <div className="w-full max-w-md rounded-2xl border border-stone-800 bg-stone-950 p-8 shadow-xl">
        <div className="mb-6 flex flex-col items-center text-center">
          <BrandLogo size={120} className="mb-4 ring-amber-500/30" />
          <h1 className="text-2xl font-semibold text-amber-50">Ivaan Foods</h1>
          <p className="mt-1 text-sm text-stone-400">Sign in to continue</p>
        </div>
        <LoginForm variant="dark" />
        <p className="mt-6 text-center text-xs text-stone-500">
          Admin: deepak@gmail.com / admin@123
          <br />
          <span className="text-stone-600">
            Also: admin@ivaanfoods.local / admin123 · cashier@ivaanfoods.local / cashier123
          </span>
        </p>
      </div>
    </div>
  );
}
