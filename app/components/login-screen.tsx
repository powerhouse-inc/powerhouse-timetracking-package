"use client";

import { useAuth } from "@/lib/auth";

export function LoginScreen() {
  const { startRenown, renownConfigured, error } = useAuth();

  return (
    <div className="relative z-10 flex min-h-screen items-center justify-center p-6">
      <div className="tt-card w-full max-w-md animate-fade-up p-8">
        <div className="mb-6 flex items-center gap-3">
          <span className="grid size-10 place-items-center rounded-xl bg-magenta text-lg text-ink-950 shadow-glow">
            ⬡
          </span>
          <div>
            <div className="text-lg font-extrabold tracking-tight">
              Powerhouse Operations
            </div>
            <div className="text-xs text-mist-400">
              Sales, delivery &amp; billing on your own reactor
            </div>
          </div>
        </div>

        <button
          className="tt-btn-primary w-full"
          onClick={startRenown}
          disabled={!renownConfigured}
        >
          Sign in with Renown
        </button>

        {error && (
          <p className="mt-3 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-center text-xs text-red-300">
            {error}
          </p>
        )}

        {!renownConfigured && (
          <p className="mt-2 text-center text-xs text-mist-400">
            Set <code className="text-mist-300">NEXT_PUBLIC_RENOWN_URL</code> to
            enable sign-in.
          </p>
        )}

        <p className="mt-6 text-center text-xs text-mist-500">
          Access is limited to workspace members.
        </p>
      </div>
    </div>
  );
}
