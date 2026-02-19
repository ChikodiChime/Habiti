"use client";
import useAuth from "@/src/hooks/useAuth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { motion } from "framer-motion";
import { LogOut, Flame } from "lucide-react";
import { client } from "@/src/lib/client";

const PrivatePagesLayout = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push("/auth/login");
    }
  }, [loading, user, router]);

  const handleSignOut = async () => {
    await client.auth.signOut();
    router.push("/auth/login");
  };

  if (!loading && !user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-950 via-slate-950 to-black">
      <nav className="sticky top-0 z-50 border-b border-white/5 bg-slate-950/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
          <button
            type="button"
            onClick={() => router.push("/dashboard")}
            className="flex items-center gap-2 text-sm font-semibold text-slate-50 transition hover:text-orange-400"
          >
            <Flame className="h-4 w-4 text-orange-500" />
            Habiti
          </button>
          <div className="flex items-center gap-3">
            {user && (
              <span className="hidden text-xs text-slate-500 sm:block">
                {user.email}
              </span>
            )}
            <motion.button
              type="button"
              onClick={handleSignOut}
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              className="inline-flex items-center gap-1.5 rounded-full bg-slate-900/60 px-3 py-1.5 text-xs font-medium text-slate-400 ring-1 ring-white/10 transition hover:text-slate-200 hover:ring-white/20"
            >
              <LogOut className="h-3.5 w-3.5" />
              Sign out
            </motion.button>
          </div>
        </div>
      </nav>
      {children}
    </div>
  );
};

export default PrivatePagesLayout;
