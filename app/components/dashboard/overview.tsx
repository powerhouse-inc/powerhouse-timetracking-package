"use client";

import { useMemo, type ReactNode } from "react";
import Link from "next/link";
import { formatAmount } from "@/lib/billing";
import { fmtDate, plural } from "@/lib/format";
import {
  useBillingStatements,
  useInvoices,
  useLeadFunnel,
  useScopesOfWork,
  useTimesheets,
  useWorkspace,
} from "@/lib/hooks";
import { PageHeader } from "@/components/ui";
import type { InvoiceStatus } from "@/lib/types";

const OPEN_INVOICE: InvoiceStatus[] = [
  "ISSUED",
  "ACCEPTED",
  "PAYMENTSCHEDULED",
  "PAYMENTSENT",
  "PAYMENTISSUE",
];
const PAID_INVOICE: InvoiceStatus[] = ["PAYMENTRECEIVED", "PAYMENTCLOSED"];

function hoursInLastDays(
  timesheets: { entries: { start: string; end: string }[] }[],
  days: number,
): number {
  const cutoff = Date.now() - days * 86_400_000;
  let total = 0;
  for (const s of timesheets) {
    for (const e of s.entries) {
      const start = new Date(e.start).getTime();
      if (start < cutoff) continue;
      const h = (new Date(e.end).getTime() - start) / 3_600_000;
      if (Number.isFinite(h) && h > 0) total += h;
    }
  }
  return total;
}

export function Overview() {
  const { data: workspace } = useWorkspace();
  const { data: funnel } = useLeadFunnel();
  const { data: scopes } = useScopesOfWork();
  const { data: invoices } = useInvoices();
  const { data: statements } = useBillingStatements();
  const { data: timesheets } = useTimesheets();

  const stats = useMemo(() => {
    const leads = funnel?.leads ?? [];
    const openPipeline = leads
      .filter((l) => !["WON", "LOST"].includes(l.stage))
      .reduce((s, l) => s + (l.estimatedValue ?? 0), 0);
    const wonValue = leads
      .filter((l) => l.stage === "WON")
      .reduce((s, l) => s + (l.estimatedValue ?? 0), 0);

    const inv = invoices ?? [];
    const outstanding = inv
      .filter((i) => OPEN_INVOICE.includes(i.status))
      .reduce((s, i) => s + i.totalPriceTaxIncl, 0);
    const paid = inv
      .filter((i) => PAID_INVOICE.includes(i.status))
      .reduce((s, i) => s + i.totalPriceTaxIncl, 0);
    const today = new Date().toISOString().slice(0, 10);
    const overdue = inv.filter(
      (i) =>
        OPEN_INVOICE.includes(i.status) && i.dateDue && i.dateDue < today,
    );

    const deliverables = (scopes ?? []).flatMap((s) => s.deliverables);
    const activeDeliverables = deliverables.filter(
      (d) => d.status === "IN_PROGRESS" || d.status === "TODO",
    ).length;

    const hours7 = hoursInLastDays(timesheets ?? [], 7);

    return {
      openPipeline,
      wonValue,
      leadCount: leads.length,
      outstanding,
      paid,
      overdue,
      invoiceCount: inv.length,
      statementCount: (statements ?? []).length,
      activeDeliverables,
      deliverableCount: deliverables.length,
      hours7,
      members: (workspace?.members ?? []).filter((m) => m.status === "ACTIVE")
        .length,
    };
  }, [funnel, invoices, scopes, statements, timesheets, workspace]);

  const topLeads = useMemo(
    () =>
      [...(funnel?.leads ?? [])]
        .filter((l) => !["WON", "LOST"].includes(l.stage))
        .sort((a, b) => (b.estimatedValue ?? 0) - (a.estimatedValue ?? 0))
        .slice(0, 5),
    [funnel],
  );

  return (
    <>
      <PageHeader
        title={`Operations${workspace?.name ? ` · ${workspace.name}` : ""}`}
        subtitle="Everything at a glance — sales, delivery, billing and time."
      />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat
          label="Open pipeline"
          value={formatAmount(stats.openPipeline)}
          sub={plural(stats.leadCount, "lead")}
          href="/sales"
          accent="#e57cd8"
        />
        <Stat
          label="Won (deal value)"
          value={formatAmount(stats.wonValue)}
          sub="closed-won"
          href="/sales"
          accent="#22c55e"
        />
        <Stat
          label="Outstanding invoices"
          value={formatAmount(stats.outstanding)}
          sub={
            stats.overdue.length > 0
              ? `${stats.overdue.length} overdue`
              : `${stats.invoiceCount} total`
          }
          href="/invoices"
          accent={stats.overdue.length > 0 ? "#ef4444" : "#3b82f6"}
        />
        <Stat
          label="Collected"
          value={formatAmount(stats.paid)}
          sub="paid invoices"
          href="/invoices"
          accent="#22c55e"
        />
        <Stat
          label="Tracked (7 days)"
          value={`${stats.hours7.toFixed(1)}h`}
          sub={`${stats.members} active members`}
          href="/reports"
          accent="#a855f7"
        />
        <Stat
          label="Active deliverables"
          value={`${stats.activeDeliverables}`}
          sub={`${stats.deliverableCount} total`}
          href="/delivery"
          accent="#06b6d4"
        />
        <Stat
          label="Billing statements"
          value={`${stats.statementCount}`}
          sub="contributor charges"
          href="/statements"
          accent="#eab308"
        />
        <Stat
          label="Clients"
          value={`${(workspace?.clients ?? []).filter((c) => c.status === "ACTIVE").length}`}
          sub={`${(workspace?.projects ?? []).filter((p) => p.status === "ACTIVE").length} projects`}
          href="/projects"
          accent="#6366f1"
        />
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <Panel title="Top open deals" href="/sales">
          {topLeads.length === 0 ? (
            <Empty>No open leads.</Empty>
          ) : (
            topLeads.map((l) => (
              <Row
                key={l.id}
                left={l.name}
                sub={l.company ?? l.stage}
                right={formatAmount(l.estimatedValue ?? 0)}
              />
            ))
          )}
        </Panel>
        <Panel title="Needs attention · overdue invoices" href="/invoices">
          {stats.overdue.length === 0 ? (
            <Empty>No overdue invoices. 🎉</Empty>
          ) : (
            stats.overdue.slice(0, 5).map((i) => (
              <Row
                key={i.id}
                left={i.invoiceNo || "—"}
                sub={`${i.payerName ?? ""} · due ${fmtDate(i.dateDue)}`}
                right={formatAmount(i.totalPriceTaxIncl, i.currency)}
                danger
              />
            ))
          )}
        </Panel>
      </div>
    </>
  );
}

function Stat({
  label,
  value,
  sub,
  href,
  accent,
}: {
  label: string;
  value: string;
  sub: string;
  href: string;
  accent: string;
}) {
  return (
    <Link
      href={href}
      className="tt-card group p-4 transition hover:border-ink-500"
    >
      <div className="flex items-center gap-2">
        <span
          className="size-2 rounded-full"
          style={{ background: accent }}
        />
        <span className="text-[11px] uppercase tracking-wider text-mist-400">
          {label}
        </span>
      </div>
      <div className="mt-2 text-2xl font-extrabold tabular-nums text-mist-100">
        {value}
      </div>
      <div className="text-xs text-mist-400">{sub}</div>
    </Link>
  );
}

function Panel({
  title,
  href,
  children,
}: {
  title: string;
  href: string;
  children: ReactNode;
}) {
  return (
    <div className="tt-card overflow-hidden">
      <div className="flex items-center justify-between border-b border-ink-600/60 px-5 py-3">
        <span className="text-sm font-semibold text-mist-200">{title}</span>
        <Link href={href} className="text-xs text-magenta hover:underline">
          View all →
        </Link>
      </div>
      <div className="divide-y divide-ink-600/40">{children}</div>
    </div>
  );
}

function Row({
  left,
  sub,
  right,
  danger,
}: {
  left: string;
  sub: string;
  right: string;
  danger?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-3 px-5 py-2.5 text-sm">
      <div className="min-w-0">
        <div className="truncate font-medium text-mist-100">{left}</div>
        <div className="truncate text-xs text-mist-400">{sub}</div>
      </div>
      <span className={`tabular-nums ${danger ? "text-red-400" : "text-mist-200"}`}>
        {right}
      </span>
    </div>
  );
}

function Empty({ children }: { children: ReactNode }) {
  return <div className="px-5 py-6 text-sm text-mist-400">{children}</div>;
}
