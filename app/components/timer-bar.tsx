"use client";

import { useEffect, useState } from "react";
import type { RawRunning } from "@/lib/api";
import { durationSeconds, formatClock } from "@/lib/time";
import type { WorkspaceProject } from "@/lib/types";

export interface StartValues {
  description: string;
  projectId: string | null;
  billable: boolean;
}

export function TimerBar({
  running,
  projects,
  onStart,
  onStop,
  onDiscard,
  busy,
}: {
  running: RawRunning | null;
  projects: WorkspaceProject[];
  onStart: (v: StartValues) => void;
  onStop: () => void;
  onDiscard: () => void;
  busy: boolean;
}) {
  const [description, setDescription] = useState("");
  const [projectId, setProjectId] = useState("");
  const [billable, setBillable] = useState(true);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [running]);

  const elapsed = running
    ? durationSeconds(running.start, new Date(now).toISOString())
    : 0;
  const activeProject = running
    ? projects.find((p) => p.localId === running.projectId)
    : projects.find((p) => p.localId === projectId);

  const start = () =>
    onStart({
      description: description.trim() || "(no description)",
      projectId: projectId || null,
      billable,
    });

  return (
    <div className="tt-card flex items-center gap-3 px-4 py-3">
      <input
        className="flex-1 bg-transparent text-[15px] text-mist-100 outline-none placeholder:text-mist-400"
        placeholder="What are you working on?"
        value={running ? running.description : description}
        disabled={!!running || busy}
        onChange={(e) => setDescription(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !running) start();
        }}
      />

      <div className="flex items-center gap-1.5 text-sm">
        {activeProject && (
          <span
            className="size-2.5 rounded-full"
            style={{ background: activeProject.color }}
          />
        )}
        <select
          className="rounded-md border border-ink-600 bg-ink-700/70 px-2 py-1.5 text-sm text-mist-200 outline-none"
          value={running ? (running.projectId ?? "") : projectId}
          disabled={!!running || busy}
          onChange={(e) => setProjectId(e.target.value)}
        >
          <option value="">No project</option>
          {projects.map((p) => (
            <option key={p.localId} value={p.localId}>
              {p.name}
            </option>
          ))}
        </select>
      </div>

      <button
        className={`grid size-8 place-items-center rounded-full border text-sm font-bold transition ${
          (running ? running.billable : billable)
            ? "border-emerald-400 bg-emerald-400/15 text-emerald-300"
            : "border-ink-600 text-mist-400 hover:text-mist-200"
        }`}
        disabled={!!running || busy}
        onClick={() => setBillable((b) => !b)}
        title="Billable"
      >
        $
      </button>

      <span className="min-w-[92px] text-right font-mono text-lg tabular-nums text-mist-100">
        {formatClock(elapsed)}
      </span>

      {running ? (
        <div className="flex items-center gap-2">
          <button
            className="tt-btn bg-red-500 text-white hover:bg-red-400"
            onClick={onStop}
            disabled={busy}
          >
            Stop
          </button>
          <button
            className="text-mist-400 hover:text-red-400"
            onClick={onDiscard}
            disabled={busy}
            title="Discard"
          >
            ✕
          </button>
        </div>
      ) : (
        <button
          className="tt-btn-primary relative"
          onClick={start}
          disabled={busy}
        >
          <span className="absolute inset-0 rounded-lg animate-pulse-ring" />
          Start
        </button>
      )}
    </div>
  );
}
