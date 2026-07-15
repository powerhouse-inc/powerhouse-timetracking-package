"use client";

import { useState } from "react";
import { Dot, EmptyState, PageHeader, StatusBadge } from "@/components/ui";
import { workspaceApi } from "@/lib/api";
import { useRefresh, useWorkspace } from "@/lib/hooks";

const COLORS = [
  "#e57cd8",
  "#a855f7",
  "#6366f1",
  "#3b82f6",
  "#22c55e",
  "#eab308",
  "#f97316",
  "#ef4444",
];

export default function ProjectsPage() {
  const { data: workspace } = useWorkspace();
  const refresh = useRefresh();
  const [name, setName] = useState("");
  const [clientId, setClientId] = useState("");
  const [color, setColor] = useState(COLORS[0]);

  const wsId = workspace?.id ?? null;
  const projects = workspace?.projects ?? [];
  const clients = (workspace?.clients ?? []).filter(
    (c) => c.status === "ACTIVE",
  );

  const add = async () => {
    if (!wsId || !name.trim()) return;
    await workspaceApi.addProject(wsId, {
      name: name.trim(),
      clientId: clientId || null,
      color,
      billable: true,
    });
    setName("");
    setClientId("");
    refresh();
  };

  const update = async (id: string, patch: Parameters<typeof workspaceApi.updateProject>[2]) => {
    if (!wsId) return;
    await workspaceApi.updateProject(wsId, id, patch);
    refresh();
  };

  const archive = async (id: string) => {
    if (!wsId) return;
    await workspaceApi.archiveProject(wsId, id);
    refresh();
  };

  return (
    <>
      <PageHeader title="Projects" subtitle="Organize work by project and client." />

      <div className="tt-card mb-5 flex flex-wrap items-center gap-2 p-3">
        <input
          className="tt-input flex-1"
          placeholder="New project name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && add()}
        />
        <select
          className="tt-input"
          value={clientId}
          onChange={(e) => setClientId(e.target.value)}
        >
          <option value="">No client</option>
          {clients.map((c) => (
            <option key={c.localId} value={c.localId}>
              {c.name}
            </option>
          ))}
        </select>
        <div className="flex gap-1.5">
          {COLORS.map((c) => (
            <button
              key={c}
              className={`size-6 rounded-full border-2 transition ${
                c === color ? "border-mist-100" : "border-transparent"
              }`}
              style={{ background: c }}
              onClick={() => setColor(c)}
              aria-label={c}
            />
          ))}
        </div>
        <button className="tt-btn-primary" onClick={add}>
          Add project
        </button>
      </div>

      {projects.length === 0 ? (
        <EmptyState>No projects yet. Add one above.</EmptyState>
      ) : (
        <div className="tt-card overflow-hidden">
          <div className="grid grid-cols-[1fr_160px_90px_110px_100px_60px] gap-3 border-b border-ink-600/60 px-5 py-2.5 text-[11px] uppercase tracking-wider text-mist-400">
            <span>Project</span>
            <span>Client</span>
            <span>Rate/h</span>
            <span>Billable</span>
            <span>Status</span>
            <span />
          </div>
          {projects.map((p) => (
            <div
              key={p.localId}
              className={`grid grid-cols-[1fr_160px_90px_110px_100px_60px] items-center gap-3 border-b border-ink-600/40 px-5 py-2.5 last:border-0 ${
                p.status === "ARCHIVED" ? "opacity-50" : ""
              }`}
            >
              <span className="flex items-center gap-2.5">
                <Dot color={p.color} />
                <input
                  className="min-w-0 flex-1 bg-transparent text-sm text-mist-100 outline-none"
                  defaultValue={p.name}
                  onBlur={(e) => {
                    const v = e.target.value.trim();
                    if (v && v !== p.name) update(p.localId, { name: v });
                  }}
                />
              </span>
              <select
                className="bg-transparent text-sm text-mist-300 outline-none"
                value={p.clientId ?? ""}
                onChange={(e) =>
                  update(p.localId, { clientId: e.target.value || null })
                }
              >
                <option value="">No client</option>
                {(workspace?.clients ?? []).map((c) => (
                  <option key={c.localId} value={c.localId}>
                    {c.name}
                  </option>
                ))}
              </select>
              <input
                className="w-full bg-transparent text-sm text-mist-200 outline-none"
                type="number"
                min={0}
                placeholder="—"
                defaultValue={p.hourlyRate ?? ""}
                onBlur={(e) => {
                  const v = e.target.value.trim();
                  const rate = v === "" ? 0 : Number(v);
                  if (rate !== (p.hourlyRate ?? 0))
                    update(p.localId, { hourlyRate: rate });
                }}
              />
              <button
                className={`tt-chip w-fit ${
                  p.billable
                    ? "bg-emerald-400/15 text-emerald-300"
                    : "bg-ink-600 text-mist-400"
                }`}
                onClick={() => update(p.localId, { billable: !p.billable })}
              >
                {p.billable ? "Billable" : "Non-billable"}
              </button>
              <StatusBadge status={p.status} />
              {p.status === "ACTIVE" && (
                <button
                  className="text-xs text-mist-400 hover:text-red-400"
                  onClick={() => archive(p.localId)}
                >
                  Archive
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </>
  );
}
