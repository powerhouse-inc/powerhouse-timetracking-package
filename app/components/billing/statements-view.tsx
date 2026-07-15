"use client";

import { useState } from "react";
import { createBillingStatement, statementApi } from "@/lib/api";
import {
  CURRENCIES,
  STATEMENT_STATUS,
  formatAmount,
  statusMeta,
  trackedLines,
} from "@/lib/billing";
import {
  useBillingStatements,
  useRefresh,
  useTimesheets,
  useWorkspace,
} from "@/lib/hooks";
import { toast } from "@/lib/toast";
import type {
  BillingStatementDoc,
  BillingStatementStatus,
  BillingUnit,
} from "@/lib/types";
import { EmptyState, PageHeader } from "@/components/ui";

const UNITS: BillingUnit[] = ["HOUR", "DAY", "MINUTE", "UNIT"];

export function StatementsView() {
  const { data: statements, isLoading } = useBillingStatements();
  const { data: workspace } = useWorkspace();
  const refresh = useRefresh();
  const [openId, setOpenId] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [contributor, setContributor] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [busy, setBusy] = useState(false);

  const list = statements ?? [];
  const open = openId ? list.find((s) => s.id === openId) ?? null : null;
  const memberNames = (workspace?.members ?? []).map((m) => m.name);

  const create = async () => {
    if (!contributor.trim() || busy) return;
    setBusy(true);
    const id = await createBillingStatement({
      contributor: contributor.trim(),
      currency,
    });
    refresh();
    setContributor("");
    setAdding(false);
    setBusy(false);
    setOpenId(id);
  };

  return (
    <>
      <PageHeader
        title="Billing Statements"
        subtitle={`${list.length} statements`}
        action={
          <button className="tt-btn-primary" onClick={() => setAdding((v) => !v)}>
            + New statement
          </button>
        }
      />

      {adding && (
        <div className="tt-card mb-5 flex flex-wrap items-center gap-2 p-3">
          <input
            className="tt-input flex-1"
            placeholder="Contributor"
            autoFocus
            list="statement-members"
            value={contributor}
            onChange={(e) => setContributor(e.target.value)}
          />
          <datalist id="statement-members">
            {memberNames.map((m) => (
              <option key={m} value={m} />
            ))}
          </datalist>
          <select
            className="tt-input"
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
          >
            {CURRENCIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <button className="tt-btn-primary" onClick={create} disabled={busy}>
            Create
          </button>
          <button className="tt-btn-ghost" onClick={() => setAdding(false)}>
            Cancel
          </button>
        </div>
      )}

      {isLoading ? (
        <EmptyState>Loading…</EmptyState>
      ) : list.length === 0 && !adding ? (
        <EmptyState>No billing statements yet.</EmptyState>
      ) : (
        <div className="tt-card overflow-hidden">
          <div className="grid grid-cols-[1fr_120px_120px_140px] gap-3 border-b border-ink-600/60 px-5 py-2.5 text-[11px] uppercase tracking-wider text-mist-400">
            <span>Contributor</span>
            <span>Cash</span>
            <span>POWT</span>
            <span>Status</span>
          </div>
          {list.map((st) => {
            const meta = statusMeta(STATEMENT_STATUS, st.status);
            return (
              <button
                key={st.id}
                onClick={() => setOpenId(st.id)}
                className="grid w-full grid-cols-[1fr_120px_120px_140px] items-center gap-3 border-b border-ink-600/40 px-5 py-3 text-left text-sm last:border-0 hover:bg-ink-700/40"
              >
                <span className="truncate font-medium text-mist-100">
                  {st.contributor ?? "—"}
                </span>
                <span className="text-mist-200">
                  {formatAmount(st.totalCash, st.currency)}
                </span>
                <span className="text-mist-200">{formatAmount(st.totalPowt)} PWT</span>
                <span
                  className="tt-chip w-fit"
                  style={{ background: `${meta.color}22`, color: meta.color }}
                >
                  {meta.label}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {open && (
        <StatementDetail
          statement={open}
          onClose={() => setOpenId(null)}
          onChange={refresh}
        />
      )}
    </>
  );
}

function StatementDetail({
  statement,
  onClose,
  onChange,
}: {
  statement: BillingStatementDoc;
  onClose: () => void;
  onChange: () => void;
}) {
  const { data: workspace } = useWorkspace();
  const { data: timesheets } = useTimesheets();
  const run = async (p: Promise<void>) => {
    await p;
    onChange();
  };
  const [desc, setDesc] = useState("");
  const [qty, setQty] = useState("1");
  const [unit, setUnit] = useState<BillingUnit>("HOUR");
  const [cash, setCash] = useState("");
  const [pwt, setPwt] = useState("");

  const prefill = async () => {
    const member = (workspace?.members ?? []).find(
      (m) => m.name.toLowerCase() === (statement.contributor ?? "").toLowerCase(),
    );
    const sheets = (timesheets ?? []).filter(
      (s) => member?.address && s.ownerAddress === member.address,
    );
    const lines = trackedLines(sheets, workspace?.projects ?? []);
    if (lines.length === 0) {
      toast("No tracked hours found for this contributor.", "info");
      return;
    }
    for (const l of lines) {
      await statementApi.addLineItem(statement.id, {
        description: l.description,
        quantity: l.hours,
        unit: "HOUR",
        unitPriceCash: l.rate,
        unitPricePwt: 0,
      });
    }
    onChange();
    toast(`Added ${lines.length} line item(s) from tracked hours.`, "success");
  };

  const addItem = async () => {
    if (!desc.trim()) return;
    await statementApi.addLineItem(statement.id, {
      description: desc.trim(),
      quantity: Number(qty) || 1,
      unit,
      unitPriceCash: Number(cash) || 0,
      unitPricePwt: Number(pwt) || 0,
    });
    setDesc("");
    setCash("");
    setPwt("");
    setQty("1");
    onChange();
  };

  return (
    <div className="fixed inset-0 z-40 flex justify-end">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="tt-card relative z-10 flex h-full w-full max-w-lg flex-col overflow-y-auto rounded-none border-l border-ink-600/70">
        <div className="flex items-start justify-between border-b border-ink-600/60 p-5">
          <div>
            <div className="text-lg font-bold text-mist-100">
              {statement.contributor ?? "Statement"}
            </div>
            <div className="text-xs text-mist-400">
              {formatAmount(statement.totalCash, statement.currency)} ·{" "}
              {formatAmount(statement.totalPowt)} PWT
            </div>
          </div>
          <button className="text-mist-400 hover:text-mist-100" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="flex flex-col gap-4 p-5">
          <div>
            <label className="tt-label">Status</label>
            <select
              className="tt-input w-full"
              value={statement.status}
              onChange={(e) =>
                run(
                  statementApi.setStatus(
                    statement.id,
                    e.target.value as BillingStatementStatus,
                  ),
                )
              }
            >
              {STATEMENT_STATUS.map((s) => (
                <option key={s.key} value={s.key}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <div className="mb-1 flex items-center gap-3">
              <label className="tt-label mb-0">Line items</label>
              <button
                className="text-xs text-magenta hover:underline"
                onClick={prefill}
                title="Add a line item per project this contributor tracked hours on"
              >
                ↧ Prefill from tracked hours
              </button>
            </div>
            <div className="tt-card divide-y divide-ink-600/40">
              {statement.lineItems.length === 0 && (
                <div className="px-4 py-3 text-sm text-mist-400">No items.</div>
              )}
              {statement.lineItems.map((li) => (
                <div
                  key={li.id}
                  className="flex items-center justify-between gap-2 px-4 py-2 text-sm"
                >
                  <span className="min-w-0 flex-1 truncate text-mist-200">
                    {li.description}
                  </span>
                  <span className="text-mist-400">
                    {li.quantity} {li.unit.toLowerCase()}
                  </span>
                  <span className="w-28 text-right text-mist-200">
                    {formatAmount(li.totalPriceCash)} /{" "}
                    {formatAmount(li.totalPricePwt)}p
                  </span>
                  <button
                    className="text-mist-400 hover:text-red-400"
                    onClick={() =>
                      run(statementApi.deleteLineItem(statement.id, li.id))
                    }
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <input
                className="tt-input flex-1"
                placeholder="Description"
                value={desc}
                onChange={(e) => setDesc(e.target.value)}
              />
              <input
                className="tt-input w-14"
                placeholder="Qty"
                type="number"
                value={qty}
                onChange={(e) => setQty(e.target.value)}
              />
              <select
                className="tt-input"
                value={unit}
                onChange={(e) => setUnit(e.target.value as BillingUnit)}
              >
                {UNITS.map((u) => (
                  <option key={u} value={u}>
                    {u.toLowerCase()}
                  </option>
                ))}
              </select>
              <input
                className="tt-input w-20"
                placeholder="Cash"
                type="number"
                value={cash}
                onChange={(e) => setCash(e.target.value)}
              />
              <input
                className="tt-input w-20"
                placeholder="PWT"
                type="number"
                value={pwt}
                onChange={(e) => setPwt(e.target.value)}
              />
              <button className="tt-btn-primary" onClick={addItem}>
                Add
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
