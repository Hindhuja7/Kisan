"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getSession } from "@/lib/auth";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    if (getSession()) router.replace("/dashboard");
    else router.replace("/login");
  }, [router]);

  return (
    <div className="min-h-screen bg-[#060a09] flex items-center justify-center">
      <div className="text-emerald-400 text-lg animate-pulse">🌱 KisanMitra AI...</div>
    </div>
  );
}
