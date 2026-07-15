"use client";

import { useState } from "react";
import { INVOICE_STATUS, formatAmount, statusMeta } from "@/lib/billing";
import { markInvoicePaidAsStatement } from "@/lib/api";
import {
  accountTypeMeta,
  amountUnit,
  expenseStatusMeta,
  formatAmountCurrency,
  kycMeta,
} from "@/lib/finance";
import {
  useAccountTransactions,
  useAccounts,
  useExpenseReports,
  useInvoices,
  useRefresh,
  useSnapshotReports,
} from "@/lib/hooks";
import type {
  AccountEntry,
  AccountTransactionsDoc,
  ExpenseReportDoc,
  InvoiceDoc,
  SnapshotReportDoc,
} from "@/lib/types";
import { toast } from "@/lib/toast";
import { EmptyState, PageHeader } from "@/components/ui";

type Tab = "invoices" | "accounts" | "transactions" | "expense" | "snapshot";

const TABS: { key: Tab; label: string }[] = [
  { key: "invoices", label: "Invoices" },
  { key: "accounts", label: "Accounts" },
  { key: "transactions", label: "Transactions" },
  { key: "expense", label: "Expense Reports" },
  { key: "snapshot", label: "Snapshot Reports" },
];

export function FinanceView() {
  const [tab, setTab] = useState<Tab>("invoices");

  return (
    <>
      <PageHeader
        title="Finance"
        subtitle="Contributor invoices, accounts, transactions and financial reports"
      />

      <div className="mb-6 flex flex-wrap gap-1 border-b border-ink-600/60">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`-mb-px border-b-2 px-4 py-2 text-sm font-medium transition ${
              tab === t.key
                ? "border-magenta text-mist-100"
                : "border-transparent text-mist-400 hover:text-mist-200"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "invoices" && <InvoicesTab />}
      {tab === "accounts" && <AccountsTab />}
      {tab === "transactions" && <TransactionsTab />}
      {tab === "expense" && <ExpenseReportsTab />}
      {tab === "snapshot" && <SnapshotReportsTab />}
    </>
  );
}

function shortAddress(addr: string | null): string {
  if (!addr) return "—";
  if (addr.length <= 14) return addr;
  return `${addr.slice(0, 8)}…${addr.slice(-6)}`;
}

function formatDate(v: string | null): string {
  if (!v) return "—";
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? v : d.toLocaleDateString();
}

function formatDateTime(v: string | null): string {
  if (!v) return "—";
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? v : d.toLocaleString();
}

function Chip({ label, color }: { label: string; color: string }) {
  return (
    <span
      className="tt-chip w-fit"
      style={{ background: `${color}22`, color }}
    >
      {label}
    </span>
  );
}

/* -------------------------------- invoices ------------------------------- */

// Invoices submitted by contributors are ISSUED or beyond (drafts never reach
// finance). "Paid" here means we've already recorded a billing statement.
const PAID_STATES = new Set(["PAYMENTRECEIVED", "PAYMENTCLOSED"]);

function InvoicesTab() {
  const { data, isLoading } = useInvoices();
  const refresh = useRefresh();
  const [busy, setBusy] = useState<string | null>(null);

  const list: InvoiceDoc[] = (data ?? []).filter((i) => i.status !== "DRAFT");

  const markPaid = async (invoice: InvoiceDoc) => {
    if (busy) return;
    setBusy(invoice.id);
    try {
      await markInvoicePaidAsStatement(invoice);
      toast(
        `Marked ${invoice.invoiceNo || "invoice"} paid — billing statement created.`,
        "success",
      );
      refresh();
    } catch {
      toast("Couldn't mark the invoice paid. Try again.", "error");
    } finally {
      setBusy(null);
    }
  };

  if (isLoading) return <EmptyState>Loading…</EmptyState>;
  if (list.length === 0)
    return <EmptyState>No invoices submitted by contributors yet.</EmptyState>;

  return (
    <div className="tt-card overflow-x-auto">
      <div className="min-w-[820px]">
        <div className="grid min-w-[820px] grid-cols-[1fr_1.3fr_140px_140px_180px] gap-3 border-b border-ink-600/60 px-5 py-2.5 text-[11px] uppercase tracking-wider text-mist-400">
          <span>Invoice</span>
          <span>Contributor</span>
          <span>Amount</span>
          <span>Status</span>
          <span />
        </div>
        {list.map((inv) => {
          const meta = statusMeta(INVOICE_STATUS, inv.status);
          const paid = PAID_STATES.has(inv.status);
          return (
            <div
              key={inv.id}
              className="grid min-w-[820px] grid-cols-[1fr_1.3fr_140px_140px_180px] items-center gap-3 border-b border-ink-600/40 px-5 py-3 text-sm last:border-0"
            >
              <span className="truncate font-medium text-mist-100">
                {inv.invoiceNo || "—"}
              </span>
              <span className="truncate text-mist-300">
                {inv.issuerName || "—"}
              </span>
              <span className="tabular-nums text-mist-200">
                {formatAmount(inv.totalPriceTaxIncl, inv.currency)}
              </span>
              <Chip label={meta.label} color={meta.color} />
              <span className="flex justify-end">
                {paid ? (
                  <span className="text-xs text-emerald-300">
                    ✓ Statement created
                  </span>
                ) : (
                  <button
                    className="tt-btn-primary py-1 text-xs"
                    onClick={() => markPaid(inv)}
                    disabled={busy === inv.id}
                  >
                    {busy === inv.id ? "Working…" : "Mark paid → statement"}
                  </button>
                )}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* -------------------------------- accounts ------------------------------- */

function AccountsTab() {
  const { data, isLoading } = useAccounts();
  const list: AccountEntry[] = data ?? [];

  if (isLoading) return <EmptyState>Loading…</EmptyState>;
  if (list.length === 0) return <EmptyState>No accounts registered.</EmptyState>;

  return (
    <div className="tt-card overflow-x-auto">
      <div className="min-w-[880px]">
        <div className="grid min-w-[820px] grid-cols-[1.4fr_1.3fr_120px_120px_1fr_1.4fr] gap-3 border-b border-ink-600/60 px-5 py-2.5 text-[11px] uppercase tracking-wider text-mist-400">
          <span>Name</span>
          <span>Address</span>
          <span>Type</span>
          <span>KYC / AML</span>
          <span>Chain</span>
          <span>Owners</span>
        </div>
        {list.map((a) => {
          const type = accountTypeMeta(a.type);
          const kyc = a.kycAmlStatus ? kycMeta(a.kycAmlStatus) : null;
          return (
            <div
              key={a.id}
              className="grid min-w-[820px] grid-cols-[1.4fr_1.3fr_120px_120px_1fr_1.4fr] items-center gap-3 border-b border-ink-600/40 px-5 py-3 text-sm last:border-0"
            >
              <span className="truncate font-medium text-mist-100">
                {a.name || "—"}
              </span>
              <span
                className="truncate font-mono text-xs text-mist-300"
                title={a.account}
              >
                {shortAddress(a.account)}
              </span>
              <Chip label={type.label} color={type.color} />
              <span>
                {kyc ? <Chip label={kyc.label} color={kyc.color} /> : (
                  <span className="text-mist-500">—</span>
                )}
              </span>
              <span className="truncate text-mist-300">
                {a.chain.length > 0 ? a.chain.join(", ") : "—"}
              </span>
              <span className="truncate text-mist-300" title={a.owners.join(", ")}>
                {a.owners.length > 0 ? a.owners.join(", ") : "—"}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ------------------------------ transactions ----------------------------- */

function TransactionsTab() {
  const { data, isLoading } = useAccountTransactions();
  const list: AccountTransactionsDoc[] = data ?? [];

  if (isLoading) return <EmptyState>Loading…</EmptyState>;
  if (list.length === 0)
    return <EmptyState>No account transaction documents.</EmptyState>;

  return (
    <div className="flex flex-col gap-6">
      {list.map((doc) => (
        <TransactionsCard key={doc.id} doc={doc} />
      ))}
    </div>
  );
}

function TransactionsCard({ doc }: { doc: AccountTransactionsDoc }) {
  const type = accountTypeMeta(doc.account.type);
  return (
    <div className="tt-card overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-ink-600/60 px-5 py-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="truncate font-semibold text-mist-100">
              {doc.account.name || doc.name}
            </span>
            <Chip label={type.label} color={type.color} />
          </div>
          <div className="mt-0.5 font-mono text-xs text-mist-400">
            {shortAddress(doc.account.account)}
          </div>
        </div>
        <span className="text-xs text-mist-400">
          {doc.transactions.length} transaction
          {doc.transactions.length === 1 ? "" : "s"}
        </span>
      </div>

      {doc.transactions.length === 0 ? (
        <div className="px-5 py-6 text-sm text-mist-400">No transactions.</div>
      ) : (
        <div className="overflow-x-auto">
          <div className="min-w-[860px]">
            <div className="grid min-w-[760px] grid-cols-[110px_1.3fr_1fr_1.6fr_120px] gap-3 border-b border-ink-600/60 px-5 py-2.5 text-[11px] uppercase tracking-wider text-mist-400">
              <span>Direction</span>
              <span>Counterparty</span>
              <span>Amount</span>
              <span>Datetime</span>
              <span>Tx hash</span>
            </div>
            {doc.transactions.map((t) => (
              <div
                key={t.id}
                className="grid min-w-[760px] grid-cols-[110px_1.3fr_1fr_1.6fr_120px] items-center gap-3 border-b border-ink-600/40 px-5 py-3 text-sm last:border-0"
              >
                <Chip
                  label={t.direction === "INFLOW" ? "Inflow" : "Outflow"}
                  color={t.direction === "INFLOW" ? "#22c55e" : "#f97316"}
                />
                <span
                  className="truncate font-mono text-xs text-mist-300"
                  title={t.counterParty ?? ""}
                >
                  {shortAddress(t.counterParty)}
                </span>
                <span className="text-mist-200">
                  {formatAmountCurrency(t.amount)}
                  {t.token && !amountUnit(t.amount) ? ` ${t.token}` : ""}
                </span>
                <span className="text-mist-300">
                  {formatDateTime(t.datetime)}
                </span>
                <span
                  className="truncate font-mono text-xs text-mist-400"
                  title={t.txHash}
                >
                  {t.txHash ? shortAddress(t.txHash) : "—"}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ----------------------------- expense reports --------------------------- */

function ExpenseReportsTab() {
  const { data, isLoading } = useExpenseReports();
  const list: ExpenseReportDoc[] = data ?? [];

  if (isLoading) return <EmptyState>Loading…</EmptyState>;
  if (list.length === 0)
    return <EmptyState>No expense reports yet.</EmptyState>;

  return (
    <div className="tt-card overflow-x-auto">
      <div className="min-w-[820px]">
        <div className="grid min-w-[680px] grid-cols-[1.4fr_1.4fr_90px_140px_140px] gap-3 border-b border-ink-600/60 px-5 py-2.5 text-[11px] uppercase tracking-wider text-mist-400">
          <span>Report</span>
          <span>Period</span>
          <span>Wallets</span>
          <span>Budget</span>
          <span>Actuals</span>
        </div>
        {list.map((r) => {
          const meta = expenseStatusMeta(r.status);
          return (
            <div
              key={r.id}
              className="grid min-w-[680px] grid-cols-[1.4fr_1.4fr_90px_140px_140px] items-center gap-3 border-b border-ink-600/40 px-5 py-3 text-sm last:border-0"
            >
              <span className="flex items-center gap-2 min-w-0">
                <span className="truncate font-medium text-mist-100">
                  {r.name}
                </span>
                <Chip label={meta.label} color={meta.color} />
              </span>
              <span className="text-mist-300">
                {formatDate(r.periodStart)} – {formatDate(r.periodEnd)}
              </span>
              <span className="text-mist-200">{r.walletCount}</span>
              <span className="text-mist-200">{formatAmount(r.totalBudget)}</span>
              <span className="text-mist-200">
                {formatAmount(r.totalActuals)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ---------------------------- snapshot reports --------------------------- */

function SnapshotReportsTab() {
  const { data, isLoading } = useSnapshotReports();
  const list: SnapshotReportDoc[] = data ?? [];

  if (isLoading) return <EmptyState>Loading…</EmptyState>;
  if (list.length === 0)
    return <EmptyState>No snapshot reports yet.</EmptyState>;

  return (
    <div className="tt-card overflow-x-auto">
      <div className="min-w-[820px]">
        <div className="grid min-w-[720px] grid-cols-[1.6fr_1.4fr_110px_140px_140px] gap-3 border-b border-ink-600/60 px-5 py-2.5 text-[11px] uppercase tracking-wider text-mist-400">
          <span>Report</span>
          <span>Period</span>
          <span>Accounts</span>
          <span>Net inflow</span>
          <span>Net outflow</span>
        </div>
        {list.map((r) => (
          <div
            key={r.id}
            className="grid min-w-[720px] grid-cols-[1.6fr_1.4fr_110px_140px_140px] items-center gap-3 border-b border-ink-600/40 px-5 py-3 text-sm last:border-0"
          >
            <span className="truncate font-medium text-mist-100">
              {r.reportName || r.name}
            </span>
            <span className="text-mist-300">
              {formatDate(r.periodStart)} – {formatDate(r.periodEnd)}
            </span>
            <span className="text-mist-200">{r.accountCount}</span>
            <span className="text-emerald-300">
              {formatAmount(r.netInflow)}
            </span>
            <span className="text-orange-300">
              {formatAmount(r.netOutflow)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
