"use client";

import { useMemo, useState } from "react";
import { BarChart, Donut } from "@/components/charts";
import { PageHeader } from "@/components/ui";
import { useAuth } from "@/lib/auth";
import { useMyRole, useTimesheets, useWorkspace } from "@/lib/hooks";
import {
  addDays,
  dayLabel,
  durationSeconds,
  formatDurationShort,
  formatHours,
  startOfWeek,
} from "@/lib/time";

type Scope = "mine" | "team";
const MANAGERIAL = ["ADMIN", "MANAGER", "BILLING"];

export default function ReportsPage() {
  const { user } = useAuth();
  const role = useMyRole(user?.address);
  const canSeeTeam = role ? MANAGERIAL.includes(role) : false;
  const [scope, setScope] = useState<Scope>("mine");
  const { data: sheets } = useTimesheets();
  const { data: workspace } = useWorkspace();

  const projects = workspace?.projects ?? [];
  const projectMeta = (id: string | null) => {
    const p = projects.find((x) => x.localId === id);
    return { name: p?.name ?? "No project", color: p?.color ?? "#6b7280" };
  };

  const entries = useMemo(() => {
    const all = (sheets ?? []).flatMap((s) =>
      s.entries.map((e) => ({ ...e, owner: s.ownerAddress })),
    );
    if (scope === "team" && canSeeTeam) return all;
    return all.filter((e) => e.owner === user?.address);
  }, [sheets, scope, canSeeTeam, user?.address]);

  const totalSeconds = entries.reduce(
    (s, e) => s + durationSeconds(e.start, e.end),
    0,
  );
  const billableSeconds = entries.reduce(
    (s, e) => (e.billable ? s + durationSeconds(e.start, e.end) : s),
    0,
  );

  const week = startOfWeek();
  const byDay = Array.from({ length: 7 }, (_, i) => {
    const day = addDays(week, i);
    const next = addDays(day, 1);
    const within = entries.filter(
      (e) =>
        new Date(e.start) >= day && new Date(e.start) < next,
    );
    return {
      label: dayLabel(day).weekday,
      seconds: within.reduce((s, e) => s + durationSeconds(e.start, e.end), 0),
      billable: within.reduce(
        (s, e) => (e.billable ? s + durationSeconds(e.start, e.end) : s),
        0,
      ),
    };
  });
  const activeDays = byDay.filter((d) => d.seconds > 0).length;

  const byProject = useMemo(() => {
    const map = new Map<string, number>();
    for (const e of entries) {
      const key = e.projectId ?? "__none__";
      map.set(key, (map.get(key) ?? 0) + durationSeconds(e.start, e.end));
    }
    return [...map.entries()]
      .map(([id, seconds]) => {
        const meta = projectMeta(id === "__none__" ? null : id);
        return { id, seconds, ...meta };
      })
      .sort((a, b) => b.seconds - a.seconds);
  }, [entries, projects]);

  return (
    <>
      <PageHeader
        title="Reports"
        subtitle="Where your time goes."
        action={
          canSeeTeam ? (
            <div className="flex rounded-lg border border-ink-600 p-0.5 text-sm">
              {(["mine", "team"] as Scope[]).map((s) => (
                <button
                  key={s}
                  className={`rounded-md px-3 py-1 font-medium transition ${
                    scope === s
                      ? "bg-ink-700 text-mist-100"
                      : "text-mist-400 hover:text-mist-200"
                  }`}
                  onClick={() => setScope(s)}
                >
                  {s === "mine" ? "My time" : "Team"}
                </button>
              ))}
            </div>
          ) : undefined
        }
      />

      <div className="grid grid-cols-3 gap-4">
        <Stat label="Total" value={formatHours(totalSeconds)} />
        <Stat
          label="Billable"
          value={formatHours(billableSeconds)}
          hint={`${totalSeconds ? Math.round((billableSeconds / totalSeconds) * 100) : 0}%`}
        />
        <Stat
          label="Avg / active day"
          value={formatHours(activeDays ? totalSeconds / activeDays : 0)}
        />
      </div>

      <div className="mt-4 grid grid-cols-5 gap-4">
        <div className="tt-card col-span-3 p-5">
          <div className="mb-4 text-sm font-semibold text-mist-200">
            This week
          </div>
          <BarChart data={byDay} />
        </div>
        <div className="tt-card col-span-2 p-5">
          <div className="mb-4 text-sm font-semibold text-mist-200">
            By project
          </div>
          <Donut
            data={byProject.map((p) => ({
              label: p.name,
              seconds: p.seconds,
              color: p.color,
            }))}
            total={totalSeconds}
          />
        </div>
      </div>

      <div className="tt-card mt-4 overflow-hidden">
        <div className="border-b border-ink-600/60 px-5 py-3 text-sm font-semibold text-mist-200">
          Breakdown
        </div>
        {byProject.length === 0 && (
          <div className="px-5 py-10 text-center text-mist-400">
            No time tracked in this scope yet.
          </div>
        )}
        {byProject.map((p) => (
          <div
            key={p.id}
            className="flex items-center gap-3 border-b border-ink-600/40 px-5 py-3 last:border-0"
          >
            <span
              className="size-2.5 rounded-full"
              style={{ background: p.color }}
            />
            <span className="flex-1 text-sm text-mist-200">{p.name}</span>
            <span className="font-mono text-xs tabular-nums text-mist-400">
              {totalSeconds ? Math.round((p.seconds / totalSeconds) * 100) : 0}%
            </span>
            <span className="w-20 text-right font-mono text-sm tabular-nums text-mist-100">
              {formatDurationShort(p.seconds)}
            </span>
          </div>
        ))}
      </div>
    </>
  );
}

function Stat({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="tt-card p-5">
      <div className="text-[11px] uppercase tracking-wider text-mist-400">
        {label}
      </div>
      <div className="mt-1 flex items-baseline gap-2">
        <span className="font-mono text-3xl font-bold tabular-nums text-mist-100">
          {value}
        </span>
        {hint && <span className="text-sm text-magenta">{hint}</span>}
      </div>
    </div>
  );
}
