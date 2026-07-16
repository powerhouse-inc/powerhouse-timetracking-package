"use client";

import { useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { LoginScreen } from "@/components/login-screen";
import { Sidebar } from "@/components/sidebar";
import { useAuth } from "@/lib/auth";

// Horizontal "canvas" views use the full screen width on ultrawide monitors;
// everything else keeps a readable cap so text and dashboards don't stretch.
const FULL_BLEED = ["/sales", "/calendar"];

export default function AppLayout({ children }: { children: ReactNode }) {
  const { user, ready } = useAuth();
  const [navOpen, setNavOpen] = useState(false);
  const pathname = usePathname();
  const fullBleed = FULL_BLEED.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );

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
      <Sidebar open={navOpen} onClose={() => setNavOpen(false)} />

      {/* Mobile drawer backdrop */}
      {navOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 md:hidden"
          onClick={() => setNavOpen(false)}
          aria-hidden
        />
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Mobile top bar */}
        <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-ink-600/60 bg-ink-900/80 px-4 py-3 backdrop-blur-sm md:hidden">
          <button
            className="grid size-9 place-items-center rounded-lg border border-ink-600 text-mist-200"
            onClick={() => setNavOpen(true)}
            aria-label="Open menu"
          >
            ☰
          </button>
          <span className="flex items-center gap-2">
            <span className="grid size-7 place-items-center rounded-lg bg-magenta text-sm text-ink-950 shadow-glow">
              ⬡
            </span>
            <span className="text-sm font-extrabold tracking-tight">
              Powerhouse{" "}
              <span className="font-semibold uppercase tracking-[0.14em] text-magenta">
                Ops
              </span>
            </span>
          </span>
        </header>

        <main className="flex-1 overflow-x-hidden px-4 py-5 md:px-8 md:py-7">
          <div
            className={`mx-auto w-full animate-fade-up ${
              fullBleed ? "" : "max-w-[112rem]"
            }`}
          >
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
