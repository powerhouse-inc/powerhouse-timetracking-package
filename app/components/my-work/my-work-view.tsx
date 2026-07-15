"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth";
import { formatAmount } from "@/lib/billing";
import { DELIVERABLE_STATUS, statusColor } from "@/lib/delivery";
import {
  useBillingStatements,
  useLeadFunnel,
  useMyTimesheet,
  useScopesOfWork,
} from "@/lib/hooks";
import { EmptyState, PageHeader } from "@/components/ui";

function hoursLast7(entries: { start: string; end: string }[]): number {
  const cutoff = Date.now() - 7 * 86_400_000;
  let t = 0;
  for (const e of entries) {
    const s = new Date(e.start).getTime();
    if (s < cutoff) continue;
    const h = (new Date(e.end).getTime() - s) / 3_600_000;
    if (Number.isFinite(h) && h > 0) t += h;
  }
  return t;
}

export function MyWorkView() {
  const { user } = useAuth();
  const me = (user?.name ?? "").toLowerCase();
  const { data: funnel } = useLeadFunnel();
  const { data: scopes } = useScopesOfWork();
  const { data: statements } = useBillingStatements();
  const { timesheet } = useMyTimesheet(user?.address);

  const myLeads = useMemo(
    () =>
      (funnel?.leads ?? []).filter(
        (l) =>
          (l.owner ?? "").toLowerCase() === me &&
          !["WON", "LOST"].includes(l.stage),
      ),
    [funnel, me],
  );

  const myDeliverables = useMemo(
    () =>
      (scopes ?? []).flatMap((s) =>
        s.deliverables
          .filter((d) => (d.owner ?? "").toLowerCase() === me)
          .map((d) => ({ ...d, sowTitle: s.title })),
      ),
    [scopes, me],
  );

  const myStatement = useMemo(
    () =>
      (statements ?? []).find(
        (s) => (s.contributor ?? "").toLowerCase() === me,
      ),
    [statements, me],
  );

  const myHours = hoursLast7(timesheet?.entries ?? []);

  if (!user) return <EmptyState>Sign in to see your work.</EmptyState>;

  return (
    <>
      <PageHeader
        title="My Work"
        subtitle={`Everything assigned to ${user.name}.`}
      />

      <div className="mb-6 grid grid-cols-3 gap-3">
        <div className="tt-card p-4">
          <div className="text-[11px] uppercase tracking-wider text-mist-400">
            Tracked (7 days)
          </div>
          <div className="mt-1 text-2xl font-extrabold text-mist-100">
            {myHours.toFixed(1)}h
          </div>
        </div>
        <div className="tt-card p-4">
          <div className="text-[11px] uppercase tracking-wider text-mist-400">
            My open deals
          </div>
          <div className="mt-1 text-2xl font-extrabold text-mist-100">
            {myLeads.length}
          </div>
        </div>
        <div className="tt-card p-4">
          <div className="text-[11px] uppercase tracking-wider text-mist-400">
            My deliverables
          </div>
          <div className="mt-1 text-2xl font-extrabold text-mist-100">
            {myDeliverables.length}
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <section className="tt-card overflow-hidden">
          <div className="flex items-center justify-between border-b border-ink-600/60 px-5 py-3">
            <span className="text-sm font-semibold text-mist-200">
              My deliverables
            </span>
            <Link href="/delivery" className="text-xs text-magenta hover:underline">
              Delivery →
            </Link>
          </div>
          <div className="divide-y divide-ink-600/40">
            {myDeliverables.length === 0 ? (
              <div className="px-5 py-6 text-sm text-mist-400">
                Nothing assigned to you yet. Owners are set on the Delivery page.
              </div>
            ) : (
              myDeliverables.map((d) => (
                <div
                  key={d.id}
                  className="flex items-center justify-between gap-3 px-5 py-2.5 text-sm"
                >
                  <div className="min-w-0">
                    <div className="truncate text-mist-100">{d.title}</div>
                    <div className="truncate text-xs text-mist-400">
                      {d.sowTitle}
                    </div>
                  </div>
                  <span
                    className="tt-chip w-fit"
                    style={{
                      background: `${statusColor(DELIVERABLE_STATUS, d.status)}22`,
                      color: statusColor(DELIVERABLE_STATUS, d.status),
                    }}
                  >
                    {DELIVERABLE_STATUS.find((s) => s.key === d.status)?.label ??
                      d.status}
                  </span>
                </div>
              ))
            )}
          </div>
        </section>

        <section className="flex flex-col gap-4">
          <div className="tt-card overflow-hidden">
            <div className="flex items-center justify-between border-b border-ink-600/60 px-5 py-3">
              <span className="text-sm font-semibold text-mist-200">
                My billing statement
              </span>
              <Link
                href="/statements"
                className="text-xs text-magenta hover:underline"
              >
                Statements →
              </Link>
            </div>
            {myStatement ? (
              <div className="px-5 py-4 text-sm">
                <div className="text-mist-100">
                  {formatAmount(myStatement.totalCash, myStatement.currency)} ·{" "}
                  {formatAmount(myStatement.totalPowt)} PWT
                </div>
                <div className="mt-1 text-xs text-mist-400">
                  {myStatement.lineItems.length} line items · {myStatement.status}
                </div>
              </div>
            ) : (
              <div className="px-5 py-4 text-sm text-mist-400">
                No statement yet. Create one on the Statements page and prefill
                it from your tracked hours.
              </div>
            )}
          </div>

          <div className="tt-card overflow-hidden">
            <div className="flex items-center justify-between border-b border-ink-600/60 px-5 py-3">
              <span className="text-sm font-semibold text-mist-200">
                My open deals
              </span>
              <Link href="/sales" className="text-xs text-magenta hover:underline">
                Pipeline →
              </Link>
            </div>
            <div className="divide-y divide-ink-600/40">
              {myLeads.length === 0 ? (
                <div className="px-5 py-6 text-sm text-mist-400">
                  No open leads assigned to you.
                </div>
              ) : (
                myLeads.map((l) => (
                  <div
                    key={l.id}
                    className="flex items-center justify-between gap-3 px-5 py-2.5 text-sm"
                  >
                    <span className="truncate text-mist-100">{l.name}</span>
                    <span className="text-mist-300">
                      {formatAmount(l.estimatedValue ?? 0)}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
