"use client";

import { dismissToast, useToasts } from "@/lib/toast";

const STYLES: Record<string, string> = {
  error: "border-red-500/40 bg-red-500/15 text-red-200",
  success: "border-emerald-500/40 bg-emerald-500/15 text-emerald-200",
  info: "border-ink-500 bg-ink-800 text-mist-200",
};

export function Toaster() {
  const toasts = useToasts();
  if (toasts.length === 0) return null;
  return (
    <div className="pointer-events-none fixed bottom-5 right-5 z-[60] flex flex-col gap-2">
      {toasts.map((t) => (
        <button
          key={t.id}
          onClick={() => dismissToast(t.id)}
          className={`pointer-events-auto max-w-sm rounded-lg border px-4 py-2.5 text-left text-sm shadow-panel backdrop-blur-sm transition ${
            STYLES[t.kind] ?? STYLES.info
          }`}
        >
          {t.message}
        </button>
      ))}
    </div>
  );
}
