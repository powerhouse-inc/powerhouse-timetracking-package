"use client";

import type { RawEntry } from "@/lib/api";
import {
  durationSeconds,
  formatDurationShort,
  formatTimeOfDay,
  localDayKey,
} from "@/lib/time";
import type { WorkspaceProject } from "@/lib/types";

export interface EntryPatch {
  description?: string;
  projectId?: string | null;
  billable?: boolean;
}

export function EntryList({
  entries,
  projects,
  onUpdate,
  onDelete,
}: {
  entries: RawEntry[];
  projects: WorkspaceProject[];
  onUpdate: (id: string, patch: EntryPatch) => void;
  onDelete: (id: string) => void;
}) {
  const projectById = new Map(projects.map((p) => [p.localId, p]));
  const sorted = [...entries].sort((a, b) => b.start.localeCompare(a.start));
  const days = new Map<string, RawEntry[]>();
  for (const e of sorted) {
    const key = localDayKey(new Date(e.start));
    (days.get(key) ?? days.set(key, []).get(key)!).push(e);
  }

  if (entries.length === 0) {
    return (
      <div className="tt-card mt-4 px-6 py-14 text-center text-mist-400">
        No entries yet. Start the timer above to log your first one.
      </div>
    );
  }

  return (
    <div className="mt-4 space-y-5">
      {[...days.entries()].map(([day, dayEntries]) => {
        const total = dayEntries.reduce(
          (s, e) => s + durationSeconds(e.start, e.end),
          0,
        );
        const heading = new Date(`${day}T00:00:00`).toLocaleDateString([], {
          weekday: "long",
          month: "short",
          day: "numeric",
        });
        return (
          <section key={day} className="tt-card overflow-hidden">
            <header className="flex items-center justify-between border-b border-ink-600/60 px-4 py-2.5 text-sm">
              <span className="font-semibold text-mist-200">{heading}</span>
              <span className="font-mono tabular-nums text-mist-400">
                {formatDurationShort(total)}
              </span>
            </header>
            {dayEntries.map((e) => {
              const project = e.projectId
                ? projectById.get(e.projectId)
                : undefined;
              return (
                <div
                  key={e.id}
                  className="group flex items-center gap-3 px-4 py-2.5 transition hover:bg-ink-700/40"
                >
                  <span
                    className="size-2.5 flex-none rounded-full"
                    style={{ background: project?.color ?? "#6b7280" }}
                  />
                  <input
                    className="min-w-0 flex-1 bg-transparent text-sm text-mist-100 outline-none focus:text-white"
                    defaultValue={e.description}
                    onBlur={(ev) => {
                      const v = ev.target.value.trim();
                      if (v && v !== e.description)
                        onUpdate(e.id, { description: v });
                    }}
                  />
                  <select
                    className="rounded-md bg-transparent px-1.5 py-1 text-xs text-mist-400 outline-none hover:text-mist-200"
                    value={e.projectId ?? ""}
                    onChange={(ev) =>
                      onUpdate(e.id, { projectId: ev.target.value || null })
                    }
                  >
                    <option value="">No project</option>
                    {projects.map((p) => (
                      <option key={p.localId} value={p.localId}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                  <button
                    className={`grid size-6 place-items-center rounded-full text-xs font-bold ${
                      e.billable
                        ? "text-emerald-300"
                        : "text-mist-500 hover:text-mist-300"
                    }`}
                    onClick={() => onUpdate(e.id, { billable: !e.billable })}
                    title="Billable"
                  >
                    $
                  </button>
                  <span className="font-mono text-xs tabular-nums text-mist-400">
                    {formatTimeOfDay(e.start)}–{formatTimeOfDay(e.end)}
                  </span>
                  <span className="w-16 text-right font-mono text-sm tabular-nums text-mist-200">
                    {formatDurationShort(durationSeconds(e.start, e.end))}
                  </span>
                  <button
                    className="text-mist-500 opacity-0 transition group-hover:opacity-100 hover:text-red-400"
                    onClick={() => onDelete(e.id)}
                    title="Delete"
                  >
                    ✕
                  </button>
                </div>
              );
            })}
          </section>
        );
      })}
    </div>
  );
}
