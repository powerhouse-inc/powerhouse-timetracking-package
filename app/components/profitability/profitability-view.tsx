"use client";

import { useMemo, useState } from "react";
import { formatAmount } from "@/lib/billing";
import { computeProfitability } from "@/lib/profitability";
import { useInvoices, useTimesheets, useWorkspace } from "@/lib/hooks";
import { EmptyState, PageHeader } from "@/components/ui";

export function ProfitabilityView() {
  const { data: workspace } = useWorkspace();
  const { data: timesheets } = useTimesheets();
  const { data: invoices } = useInvoices();
  const [expanded, setExpanded] = useState<string | null>(null);

  const { clients, totals } = useMemo(
    () =>
      computeProfitability(
        workspace?.clients.filter((c) => c.status === "ACTIVE") ?? [],
        workspace?.projects ?? [],
        timesheets ?? [],
        invoices ?? [],
      ),
    [workspace, timesheets, invoices],
  );

  const rows = clients.filter(
    (c) => c.trackedValue > 0 || c.invoiced > 0,
  );

  return (
    <>
      <PageHeader
        title="Profitability"
        subtitle="Tracked value (billable hours × rate) vs. invoiced, by client. Unbilled = work-in-progress to bill."
      />

      <div className="mb-5 grid grid-cols-3 gap-3">
        <Tile label="Tracked value" value={formatAmount(totals.trackedValue)} accent="#a855f7" />
        <Tile label="Invoiced" value={formatAmount(totals.invoiced)} accent="#22c55e" />
        <Tile label="Unbilled (WIP)" value={formatAmount(totals.unbilled)} accent="#e57cd8" />
      </div>

      {rows.length === 0 ? (
        <EmptyState>
          No billable activity yet. Track billable time against client projects
          and it will show here.
        </EmptyState>
      ) : (
        <div className="tt-card overflow-hidden">
          <div className="grid grid-cols-[1fr_140px_140px_140px] gap-3 border-b border-ink-600/60 px-5 py-2.5 text-[11px] uppercase tracking-wider text-mist-400">
            <span>Client</span>
            <span className="text-right">Tracked value</span>
            <span className="text-right">Invoiced</span>
            <span className="text-right">Unbilled</span>
          </div>
          {rows.map((c) => (
            <div key={c.clientId}>
              <button
                onClick={() =>
                  setExpanded((cur) => (cur === c.clientId ? null : c.clientId))
                }
                className="grid w-full grid-cols-[1fr_140px_140px_140px] items-center gap-3 border-b border-ink-600/40 px-5 py-3 text-left text-sm hover:bg-ink-700/40"
              >
                <span className="flex items-center gap-2 font-medium text-mist-100">
                  <span className="text-mist-500">
                    {expanded === c.clientId ? "▾" : "▸"}
                  </span>
                  {c.name}
                </span>
                <span className="text-right text-mist-200">
                  {formatAmount(c.trackedValue)}
                </span>
                <span className="text-right text-mist-200">
                  {formatAmount(c.invoiced)}
                </span>
                <span
                  className={`text-right ${c.unbilled > 0 ? "text-magenta" : "text-mist-400"}`}
                >
                  {formatAmount(c.unbilled)}
                </span>
              </button>
              {expanded === c.clientId &&
                c.projects.map((p) => (
                  <div
                    key={p.projectId}
                    className="grid grid-cols-[1fr_140px_140px_140px] items-center gap-3 border-b border-ink-600/30 bg-ink-900/40 px-5 py-2 pl-10 text-xs text-mist-400"
                  >
                    <span className="truncate">
                      {p.name} · {p.billableHours.toFixed(1)}h billable @{" "}
                      {formatAmount(p.rate)}
                    </span>
                    <span className="text-right">
                      {formatAmount(p.trackedValue)}
                    </span>
                    <span className="text-right">—</span>
                    <span className="text-right">—</span>
                  </div>
                ))}
            </div>
          ))}
        </div>
      )}
    </>
  );
}

function Tile({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent: string;
}) {
  return (
    <div className="tt-card p-4">
      <div className="flex items-center gap-2">
        <span className="size-2 rounded-full" style={{ background: accent }} />
        <span className="text-[11px] uppercase tracking-wider text-mist-400">
          {label}
        </span>
      </div>
      <div className="mt-2 text-2xl font-extrabold text-mist-100">{value}</div>
    </div>
  );
}
