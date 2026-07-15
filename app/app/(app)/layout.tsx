"use client";

import type { ReactNode } from "react";
import { LoginScreen } from "@/components/login-screen";
import { Sidebar } from "@/components/sidebar";
import { useAuth } from "@/lib/auth";

export default function AppLayout({ children }: { children: ReactNode }) {
  const { user, ready } = useAuth();

  if (!ready) {
    return (
      <div className="relative z-10 grid min-h-screen place-items-center text-mist-400">
        Loading…
      </div>
    );
  }

  if (!user) return <LoginScreen />;

  return (
    <div className="relative z-10 flex min-h-screen">
      <Sidebar />
      <main className="flex-1 overflow-x-hidden px-8 py-7">
        <div className="mx-auto max-w-7xl animate-fade-up">{children}</div>
      </main>
    </div>
  );
}
