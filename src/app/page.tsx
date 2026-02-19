"use client";

import { useRouter } from "next/navigation";
import useAuth from "../hooks/useAuth";

export default function Home() {
  const router = useRouter();
  const { user, loading } = useAuth();

  if(!loading && user) {
   router.push("/dashboard");
  } else {
    router.push("/auth/login");
  }

  
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      {loading ? "Loading..." : "Redirecting..."}
    </div>
  );
}
