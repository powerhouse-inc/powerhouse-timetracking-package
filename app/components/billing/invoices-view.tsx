"use client";

import { useState } from "react";
import { createInvoice, invoiceApi } from "@/lib/api";
import {
  CURRENCIES,
  INVOICE_STATUS,
  formatAmount,
  statusMeta,
  trackedLines,
} from "@/lib/billing";
import {
  useInvoices,
  useRefresh,
  useTimesheets,
  useWorkspace,
} from "@/lib/hooks";
import { toast } from "@/lib/toast";
import type { InvoiceDoc, InvoiceStatus } from "@/lib/types";
import { EmptyState, PageHeader } from "@/components/ui";

export function InvoicesView() {
  const { data: invoices, isLoading } = useInvoices();
  const { data: workspace } = useWorkspace();
  const refresh = useRefresh();
  const [openId, setOpenId] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);

  const list = invoices ?? [];
  const open = openId ? list.find((i) => i.id === openId) ?? null : null;
  const clientNames = (workspace?.clients ?? []).map((c) => c.name);

  const total = list
    .filter((i) => !["CANCELLED", "REJECTED"].includes(i.status))
    .reduce((s, i) => s + i.totalPriceTaxIncl, 0);

  return (
    <>
      <PageHeader
        title="Invoices"
        subtitle={`${list.length} invoices · ${formatAmount(total)} outstanding+`}
        action={
          <button className="tt-btn-primary" onClick={() => setAdding((v) => !v)}>
            + New invoice
          </button>
        }
      />

      {adding && (
        <CreateInvoice
          clientNames={clientNames}
          workspaceName={workspace?.name ?? ""}
          onCancel={() => setAdding(false)}
          onCreate={async (input) => {
            const id = await createInvoice(input);
            refresh();
            setAdding(false);
            setOpenId(id);
          }}
        />
      )}

      {isLoading ? (
        <EmptyState>Loading…</EmptyState>
      ) : list.length === 0 && !adding ? (
        <EmptyState>No invoices yet.</EmptyState>
      ) : (
        <div className="tt-card overflow-hidden">
          <div className="grid grid-cols-[120px_1fr_1fr_120px_140px] gap-3 border-b border-ink-600/60 px-5 py-2.5 text-[11px] uppercase tracking-wider text-mist-400">
            <span>Invoice #</span>
            <span>Issuer</span>
            <span>Payer</span>
            <span>Total</span>
            <span>Status</span>
          </div>
          {list.map((inv) => {
            const meta = statusMeta(INVOICE_STATUS, inv.status);
            const today = new Date().toISOString().slice(0, 10);
            const overdue =
              !!inv.dateDue &&
              inv.dateDue < today &&
              !["PAYMENTRECEIVED", "PAYMENTCLOSED", "CANCELLED", "REJECTED"].includes(
                inv.status,
              );
            return (
              <button
                key={inv.id}
                onClick={() => setOpenId(inv.id)}
                className="grid w-full grid-cols-[120px_1fr_1fr_120px_140px] items-center gap-3 border-b border-ink-600/40 px-5 py-3 text-left text-sm last:border-0 hover:bg-ink-700/40"
              >
                <span className="font-medium text-mist-100">
                  {inv.invoiceNo || "—"}
                </span>
                <span className="truncate text-mist-300">
                  {inv.issuerName ?? "—"}
                </span>
                <span className="truncate text-mist-300">
                  {inv.payerName ?? "—"}
                </span>
                <span className="text-mist-200">
                  {formatAmount(inv.totalPriceTaxIncl, inv.currency)}
                </span>
                <span className="flex items-center gap-1.5">
                  <span
                    className="tt-chip w-fit"
                    style={{ background: `${meta.color}22`, color: meta.color }}
                  >
                    {meta.label}
                  </span>
                  {overdue && (
                    <span className="tt-chip bg-red-500/15 text-red-300">
                      Overdue
                    </span>
                  )}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {open && (
        <InvoiceDetail
          invoice={open}
          onClose={() => setOpenId(null)}
          onChange={refresh}
        />
      )}
    </>
  );
}

function CreateInvoice({
  clientNames,
  workspaceName,
  onCreate,
  onCancel,
}: {
  clientNames: string[];
  workspaceName: string;
  onCreate: (input: Parameters<typeof createInvoice>[0]) => Promise<void>;
  onCancel: () => void;
}) {
  const [invoiceNo, setInvoiceNo] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [issuerName, setIssuerName] = useState(workspaceName);
  const [payerName, setPayerName] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!invoiceNo.trim() || busy) return;
    setBusy(true);
    await onCreate({
      invoiceNo: invoiceNo.trim(),
      currency,
      issuerName: issuerName.trim(),
      payerName: payerName.trim(),
    });
    setBusy(false);
  };

  return (
    <div className="tt-card mb-5 flex flex-wrap items-center gap-2 p-3">
      <input
        className="tt-input w-32"
        placeholder="Invoice #"
        autoFocus
        value={invoiceNo}
        onChange={(e) => setInvoiceNo(e.target.value)}
      />
      <input
        className="tt-input flex-1"
        placeholder="Issuer"
        value={issuerName}
        onChange={(e) => setIssuerName(e.target.value)}
      />
      <input
        className="tt-input flex-1"
        placeholder="Payer"
        list="invoice-clients"
        value={payerName}
        onChange={(e) => setPayerName(e.target.value)}
      />
      <datalist id="invoice-clients">
        {clientNames.map((c) => (
          <option key={c} value={c} />
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
      <button className="tt-btn-primary" onClick={submit} disabled={busy}>
        Create
      </button>
      <button className="tt-btn-ghost" onClick={onCancel}>
        Cancel
      </button>
    </div>
  );
}

function InvoiceDetail({
  invoice,
  onClose,
  onChange,
}: {
  invoice: InvoiceDoc;
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
  const [price, setPrice] = useState("");
  const [tax, setTax] = useState("0");
  const [payRef, setPayRef] = useState("");

  const prefill = async () => {
    const client = (workspace?.clients ?? []).find(
      (c) => c.name.toLowerCase() === (invoice.payerName ?? "").toLowerCase(),
    );
    const projects = (workspace?.projects ?? []).filter((p) =>
      client ? p.clientId === client.localId : false,
    );
    const lines = trackedLines(timesheets ?? [], projects);
    if (lines.length === 0) {
      toast(
        "No tracked hours found for this payer's workspace projects.",
        "info",
      );
      return;
    }
    for (const l of lines) {
      await invoiceApi.addLineItem(invoice.id, {
        description: `${l.description} (tracked hours)`,
        quantity: l.hours,
        unitPriceTaxExcl: l.rate,
        taxPercent: 0,
        currency: invoice.currency,
      });
    }
    onChange();
    toast(`Added ${lines.length} line item(s) from tracked hours.`, "success");
  };

  const addItem = async () => {
    if (!desc.trim() || price.trim() === "") return;
    await invoiceApi.addLineItem(invoice.id, {
      description: desc.trim(),
      quantity: Number(qty) || 1,
      unitPriceTaxExcl: Number(price) || 0,
      taxPercent: Number(tax) || 0,
      currency: invoice.currency,
    });
    setDesc("");
    setPrice("");
    setQty("1");
    setTax("0");
    onChange();
  };

  return (
    <div className="fixed inset-0 z-40 flex justify-end">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="tt-card relative z-10 flex h-full w-full max-w-lg flex-col overflow-y-auto rounded-none border-l border-ink-600/70">
        <div className="flex items-start justify-between border-b border-ink-600/60 p-5">
          <div>
            <input
              className="bg-transparent text-lg font-bold text-mist-100 outline-none"
              defaultValue={invoice.invoiceNo}
              onBlur={(e) =>
                e.target.value.trim() !== invoice.invoiceNo &&
                run(invoiceApi.editInvoice(invoice.id, { invoiceNo: e.target.value.trim() }))
              }
            />
            <div className="text-xs text-mist-400">
              {invoice.issuerName} → {invoice.payerName}
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
              value={invoice.status}
              onChange={(e) =>
                run(invoiceApi.setStatus(invoice.id, e.target.value as InvoiceStatus))
              }
            >
              {INVOICE_STATUS.map((s) => (
                <option key={s.key} value={s.key}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <label className="tt-label mb-0">Line items</label>
                <button
                  className="text-xs text-magenta hover:underline"
                  onClick={prefill}
                  title="Add a line item per workspace project the payer has tracked hours on"
                >
                  ↧ Prefill from tracked hours
                </button>
              </div>
              <span className="text-sm font-semibold text-mist-100">
                {formatAmount(invoice.totalPriceTaxIncl, invoice.currency)}
              </span>
            </div>
            <div className="tt-card divide-y divide-ink-600/40">
              {invoice.lineItems.length === 0 && (
                <div className="px-4 py-3 text-sm text-mist-400">No items.</div>
              )}
              {invoice.lineItems.map((li) => (
                <div
                  key={li.id}
                  className="flex items-center justify-between gap-2 px-4 py-2 text-sm"
                >
                  <span className="min-w-0 flex-1 truncate text-mist-200">
                    {li.description}
                  </span>
                  <span className="text-mist-400">
                    {li.quantity} × {formatAmount(li.unitPriceTaxExcl)}
                  </span>
                  <span className="w-24 text-right text-mist-200">
                    {formatAmount(li.totalPriceTaxIncl)}
                  </span>
                  <button
                    className="text-mist-400 hover:text-red-400"
                    onClick={() => run(invoiceApi.deleteLineItem(invoice.id, li.id))}
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
                className="tt-input w-16"
                placeholder="Qty"
                type="number"
                value={qty}
                onChange={(e) => setQty(e.target.value)}
              />
              <input
                className="tt-input w-24"
                placeholder="Price"
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
              />
              <input
                className="tt-input w-16"
                placeholder="Tax%"
                type="number"
                value={tax}
                onChange={(e) => setTax(e.target.value)}
              />
              <button className="tt-btn-primary" onClick={addItem}>
                Add
              </button>
            </div>
          </div>

          <div>
            <label className="tt-label">Payments</label>
            <div className="tt-card divide-y divide-ink-600/40">
              {invoice.payments.length === 0 && (
                <div className="px-4 py-3 text-sm text-mist-400">
                  No payments recorded.
                </div>
              )}
              {invoice.payments.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between px-4 py-2 text-sm"
                >
                  <span className="text-mist-200">
                    {p.confirmed ? "✓ Confirmed" : "Pending"}
                    {p.txnRef ? ` · ${p.txnRef}` : ""}
                  </span>
                  <span className="text-xs text-mist-400">
                    {p.paymentDate
                      ? new Date(p.paymentDate).toLocaleDateString()
                      : ""}
                  </span>
                </div>
              ))}
            </div>
            <div className="mt-2 flex items-center gap-2">
              <input
                className="tt-input flex-1"
                placeholder="Transaction reference"
                value={payRef}
                onChange={(e) => setPayRef(e.target.value)}
              />
              <button
                className="tt-btn-primary"
                onClick={() => {
                  run(invoiceApi.recordPayment(invoice.id, payRef.trim()));
                  setPayRef("");
                }}
              >
                Record payment
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="tt-label">Issued</label>
              <input
                className="tt-input w-full"
                type="date"
                defaultValue={invoice.dateIssued ?? ""}
                onBlur={(e) =>
                  run(invoiceApi.editInvoice(invoice.id, { dateIssued: e.target.value }))
                }
              />
            </div>
            <div>
              <label className="tt-label">Due</label>
              <input
                className="tt-input w-full"
                type="date"
                defaultValue={invoice.dateDue ?? ""}
                onBlur={(e) =>
                  run(invoiceApi.editInvoice(invoice.id, { dateDue: e.target.value }))
                }
              />
            </div>
          </div>

          <div>
            <label className="tt-label">Notes</label>
            <textarea
              className="tt-input min-h-16 w-full resize-y"
              defaultValue={invoice.notes ?? ""}
              onBlur={(e) =>
                run(invoiceApi.editInvoice(invoice.id, { notes: e.target.value }))
              }
            />
          </div>
        </div>
      </div>
    </div>
  );
}
