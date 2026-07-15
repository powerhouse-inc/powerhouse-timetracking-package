"use client";

import { useState } from "react";
import { ensureWorkspace, workspaceApi } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useWorkspace } from "@/lib/hooks";
import { Avatar } from "./ui";

export function LoginScreen() {
  const { startRenown, renownConfigured, signIn } = useAuth();
  const { data: workspace } = useWorkspace();
  const [busy, setBusy] = useState(false);
  const [name, setName] = useState("");

  const members = (workspace?.members ?? []).filter(
    (m) => m.status !== "ARCHIVED",
  );

  const quickStart = async () => {
    setBusy(true);
    try {
      const display = name.trim() || "Workspace Admin";
      const wsId = await ensureWorkspace("Powerhouse");
      const address = `local:${display.toLowerCase().replace(/\s+/g, "-")}`;
      await workspaceApi.addMember(wsId, { name: display, address, role: "ADMIN" });
      signIn({ address, name: display, did: null });
    } finally {
      setBusy(false);
    }
  };

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
        {!renownConfigured && (
          <p className="mt-2 text-center text-xs text-mist-400">
            Set <code className="text-mist-300">NEXT_PUBLIC_RENOWN_URL</code> to
            enable Renown. Use a workspace identity below for local development.
          </p>
        )}

        {members.length > 0 && (
          <>
            <Divider label="or continue as" />
            <div className="flex flex-col gap-2">
              {members.map((m) => (
                <button
                  key={m.localId}
                  className="flex items-center gap-3 rounded-lg border border-ink-600 px-3 py-2 text-left transition hover:border-ink-500"
                  onClick={() =>
                    signIn({
                      address: m.address ?? `local:${m.localId}`,
                      name: m.name,
                      did: m.did,
                    })
                  }
                >
                  <Avatar seed={m.name} />
                  <span className="flex-1 text-sm font-medium">{m.name}</span>
                  <span className="text-xs text-mist-400">{m.role}</span>
                </button>
              ))}
            </div>
          </>
        )}

        {members.length === 0 && (
          <>
            <Divider label="or start fresh" />
            <div className="flex gap-2">
              <input
                className="tt-input flex-1"
                placeholder="Your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
              <button
                className="tt-btn-ghost"
                onClick={quickStart}
                disabled={busy}
              >
                {busy ? "Creating…" : "Create workspace"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function Divider({ label }: { label: string }) {
  return (
    <div className="my-5 flex items-center gap-3 text-xs uppercase tracking-wider text-mist-400">
      <span className="h-px flex-1 bg-ink-600" />
      {label}
      <span className="h-px flex-1 bg-ink-600" />
    </div>
  );
}
