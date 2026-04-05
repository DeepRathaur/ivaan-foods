"use client";

import { BrandLogo } from "@/components/BrandLogo";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const SPLASH_MS = 2200;

export function SplashClient() {
  const router = useRouter();
  const { status } = useSession();
  const [done, setDone] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setDone(true), SPLASH_MS);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (!done || status === "loading") return;
    if (status === "authenticated") {
      router.replace("/dashboard");
    } else {
      router.replace("/login");
    }
  }, [done, status, router]);

  return (
    <div className="flex min-h-full flex-1 flex-col items-center justify-center bg-black px-6">
      <div className="text-center">
        <div className="mx-auto mb-8 flex justify-center">
          <BrandLogo size={200} priority />
        </div>
        <h1 className="text-3xl font-semibold tracking-tight text-amber-50">Ivaan Foods</h1>
        <p className="mt-2 text-sm text-amber-200/80">Freshly cooked food</p>
      </div>
      <p className="mt-14 text-xs font-medium uppercase tracking-widest text-amber-400/80 animate-pulse">
        Loading
      </p>
    </div>
  );
}
