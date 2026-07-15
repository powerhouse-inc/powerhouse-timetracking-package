"use client";

import { useMemo, useState } from "react";
import { sowApi } from "@/lib/api";
import {
  DELIVERABLE_STATUS,
  SOW_STATUS,
  computeProjectHours,
  statusColor,
} from "@/lib/delivery";
import { useRefresh, useTimesheets, useWorkspace } from "@/lib/hooks";
import type { DeliverableStatus, ScopeOfWorkDoc, SowStatus } from "@/lib/types";

export function SowDetail({ sow }: { sow: ScopeOfWorkDoc }) {
  const { data: workspace } = useWorkspace();
  const { data: timesheets } = useTimesheets();
  const refresh = useRefresh();

  const hours = useMemo(
    () =>
      computeProjectHours(sow, workspace?.projects ?? [], timesheets ?? []),
    [sow, workspace, timesheets],
  );

  const run = async (p: Promise<void>) => {
    await p;
    refresh();
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="tt-card p-5">
        <div className="flex items-center justify-between gap-3">
          <input
            className="min-w-0 flex-1 bg-transparent text-xl font-bold text-mist-100 outline-none"
            defaultValue={sow.title}
            onBlur={(e) => {
              const v = e.target.value.trim();
              if (v && v !== sow.title) run(sowApi.editScopeOfWork(sow.id, { title: v }));
            }}
          />
        </div>
        <textarea
          className="mt-1 w-full resize-none bg-transparent text-sm text-mist-400 outline-none"
          defaultValue={sow.description}
          rows={2}
          onBlur={(e) => {
            const v = e.target.value.trim();
            if (v !== sow.description)
              run(sowApi.editScopeOfWork(sow.id, { description: v }));
          }}
        />
        <div className="mt-3 flex flex-wrap gap-1.5">
          {SOW_STATUS.map((s) => (
            <button
              key={s.key}
              className={`tt-chip border ${
                sow.status === s.key
                  ? "border-transparent text-ink-950"
                  : "border-ink-600 text-mist-300 hover:text-mist-100"
              }`}
              style={sow.status === s.key ? { background: s.color } : undefined}
              onClick={() =>
                run(sowApi.editScopeOfWork(sow.id, { status: s.key as SowStatus }))
              }
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Flagship: budgeted vs tracked hours */}
      <section>
        <h2 className="mb-2 text-sm font-semibold text-mist-200">
          Hours — budgeted vs tracked
        </h2>
        {hours.length === 0 ? (
          <div className="tt-card px-5 py-6 text-sm text-mist-400">
            Add a project and anchor deliverables in hours to see budget vs
            actuals. Tracked hours come from timesheets on the matching
            workspace project.
          </div>
        ) : (
          <div className="tt-card divide-y divide-ink-600/40">
            {hours.map((h) => {
              const over = h.trackedHours > h.budgetedHours && h.budgetedHours > 0;
              const pct =
                h.budgetedHours > 0
                  ? Math.min(100, (h.trackedHours / h.budgetedHours) * 100)
                  : 0;
              return (
                <div key={h.projectId} className="px-5 py-3">
                  <div className="mb-1.5 flex items-center justify-between text-sm">
                    <span className="font-medium text-mist-100">{h.title}</span>
                    <span className={over ? "text-red-400" : "text-mist-300"}>
                      {h.trackedHours.toFixed(1)}h /{" "}
                      {h.budgetedHours.toFixed(0)}h budgeted
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-ink-700">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${h.budgetedHours > 0 ? pct : 0}%`,
                        background: over ? "#ef4444" : "#e57cd8",
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Deliverables */}
      <section>
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-mist-200">
            Deliverables ({sow.deliverables.length})
          </h2>
          <AddDeliverable
            onAdd={(input) => run(sowApi.addDeliverable(sow.id, input))}
          />
        </div>
        <div className="tt-card divide-y divide-ink-600/40">
          {sow.deliverables.length === 0 && (
            <div className="px-5 py-6 text-sm text-mist-400">
              No deliverables yet.
            </div>
          )}
          {sow.deliverables.map((d) => (
            <div key={d.id} className="px-5 py-3">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium text-mist-100">
                    {d.code ? `${d.code} · ` : ""}
                    {d.title}
                  </div>
                </div>
                <select
                  className="tt-input py-1 text-xs"
                  value={d.status}
                  onChange={(e) =>
                    run(
                      sowApi.editDeliverable(sow.id, d.id, {
                        status: e.target.value as DeliverableStatus,
                      }),
                    )
                  }
                  style={{ color: statusColor(DELIVERABLE_STATUS, d.status) }}
                >
                  {DELIVERABLE_STATUS.map((s) => (
                    <option key={s.key} value={s.key}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="mt-2 flex items-center gap-3">
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-ink-700">
                  <div
                    className="h-full rounded-full bg-magenta transition-all"
                    style={{ width: `${d.progressPercent ?? 0}%` }}
                  />
                </div>
                <input
                  className="w-16 bg-transparent text-right text-xs text-mist-300 outline-none"
                  type="number"
                  min={0}
                  max={100}
                  defaultValue={d.progressPercent ?? 0}
                  onBlur={(e) =>
                    run(
                      sowApi.setDeliverableProgress(
                        sow.id,
                        d.id,
                        Math.max(0, Math.min(100, Number(e.target.value) || 0)),
                      ),
                    )
                  }
                />
                <span className="text-xs text-mist-400">%</span>
                <HoursField
                  projects={sow.projects}
                  anchor={d.budgetAnchor}
                  onSet={(project, quantity) =>
                    run(
                      sowApi.setDeliverableHours(sow.id, d.id, {
                        project,
                        quantity,
                        unitCost: d.budgetAnchor?.unitCost ?? 0,
                      }),
                    )
                  }
                />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Projects */}
      <section>
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-mist-200">
            Projects ({sow.projects.length})
          </h2>
          <AddProject onAdd={(input) => run(sowApi.addProject(sow.id, input))} />
        </div>
        <div className="tt-card divide-y divide-ink-600/40">
          {sow.projects.length === 0 && (
            <div className="px-5 py-6 text-sm text-mist-400">
              No projects yet.
            </div>
          )}
          {sow.projects.map((p) => (
            <div
              key={p.id}
              className="flex items-center justify-between px-5 py-3 text-sm"
            >
              <span className="text-mist-100">
                <span className="text-mist-400">{p.code}</span> · {p.title}
              </span>
              <span className="text-mist-400">
                {p.budget != null ? `${p.budget} ${p.currency ?? ""}` : "—"}
              </span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function HoursField({
  projects,
  anchor,
  onSet,
}: {
  projects: { id: string; title: string }[];
  anchor: ScopeOfWorkDoc["deliverables"][number]["budgetAnchor"];
  onSet: (project: string | null, quantity: number) => void;
}) {
  const isHours = anchor?.unit === "Hours";
  return (
    <span className="flex items-center gap-1">
      <input
        className="w-16 bg-transparent text-right text-xs text-mist-300 outline-none"
        type="number"
        min={0}
        placeholder="hrs"
        defaultValue={isHours ? anchor.quantity : ""}
        onBlur={(e) => {
          const q = Number(e.target.value) || 0;
          if (q > 0) onSet(anchor?.project ?? projects[0]?.id ?? null, q);
        }}
        title="Budgeted hours"
      />
      <span className="text-xs text-mist-400">h budget</span>
    </span>
  );
}

function AddDeliverable({
  onAdd,
}: {
  onAdd: (input: { title: string; code: string; description: string }) => void;
}) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [code, setCode] = useState("");
  if (!open)
    return (
      <button className="tt-btn-ghost py-1 text-xs" onClick={() => setOpen(true)}>
        + Deliverable
      </button>
    );
  const submit = () => {
    if (!title.trim()) return;
    onAdd({ title: title.trim(), code: code.trim(), description: "" });
    setTitle("");
    setCode("");
    setOpen(false);
  };
  return (
    <span className="flex items-center gap-2">
      <input
        className="tt-input py-1 text-xs"
        placeholder="Code"
        value={code}
        onChange={(e) => setCode(e.target.value)}
      />
      <input
        className="tt-input py-1 text-xs"
        placeholder="Title"
        autoFocus
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && submit()}
      />
      <button className="tt-btn-primary py-1 text-xs" onClick={submit}>
        Add
      </button>
    </span>
  );
}

function AddProject({
  onAdd,
}: {
  onAdd: (input: { code: string; title: string }) => void;
}) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [code, setCode] = useState("");
  if (!open)
    return (
      <button className="tt-btn-ghost py-1 text-xs" onClick={() => setOpen(true)}>
        + Project
      </button>
    );
  const submit = () => {
    if (!title.trim() || !code.trim()) return;
    onAdd({ title: title.trim(), code: code.trim() });
    setTitle("");
    setCode("");
    setOpen(false);
  };
  return (
    <span className="flex items-center gap-2">
      <input
        className="tt-input py-1 text-xs"
        placeholder="Code"
        value={code}
        onChange={(e) => setCode(e.target.value)}
      />
      <input
        className="tt-input py-1 text-xs"
        placeholder="Title"
        autoFocus
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && submit()}
      />
      <button className="tt-btn-primary py-1 text-xs" onClick={submit}>
        Add
      </button>
    </span>
  );
}
