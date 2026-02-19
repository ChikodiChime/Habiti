"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function HabitsPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/dashboard");
  }, [router]);

  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <span className="text-sm text-slate-400">Redirecting…</span>
    </div>
  );
}
