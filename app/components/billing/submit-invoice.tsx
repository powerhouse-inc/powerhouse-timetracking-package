"use client";

import { useMemo, useRef, useState } from "react";
import {
  parseInvoiceDocFile,
  submitInvoice,
  type NewInvoiceLine,
} from "@/lib/api";
import { CURRENCIES, INVOICE_STATUS, formatAmount, statusMeta } from "@/lib/billing";
import { useAuth } from "@/lib/auth";
import { useInvoices, useRefresh, useWorkspace } from "@/lib/hooks";
import { toast } from "@/lib/toast";
import { EmptyState, PageHeader } from "@/components/ui";

interface DraftLine {
  description: string;
  quantity: string;
  price: string;
  tax: string;
}

const emptyLine: DraftLine = { description: "", quantity: "1", price: "", tax: "0" };

export function SubmitInvoice() {
  const { user } = useAuth();
  const { data: workspace } = useWorkspace();
  const { data: invoices } = useInvoices();
  const refresh = useRefresh();
  const fileRef = useRef<HTMLInputElement>(null);

  const orgName = workspace?.name ?? "Powerhouse";
  const me = user?.name ?? "";

  const [invoiceNo, setInvoiceNo] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [notes, setNotes] = useState("");
  const [lines, setLines] = useState<DraftLine[]>([{ ...emptyLine }]);
  const [busy, setBusy] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const total = useMemo(
    () =>
      lines.reduce(
        (s, l) =>
          s + (Number(l.price) || 0) * (Number(l.quantity) || 0) * (1 + (Number(l.tax) || 0) / 100),
        0,
      ),
    [lines],
  );

  const mine = useMemo(
    () =>
      (invoices ?? []).filter(
        (i) => (i.issuerName ?? "").toLowerCase() === me.toLowerCase(),
      ),
    [invoices, me],
  );

  const setLine = (i: number, patch: Partial<DraftLine>) =>
    setLines((ls) => ls.map((l, j) => (j === i ? { ...l, ...patch } : l)));

  const submit = async () => {
    if (!invoiceNo.trim() || busy) return;
    const valid = lines.filter((l) => l.description.trim() && Number(l.price) > 0);
    if (valid.length === 0) {
      toast("Add at least one line item with a description and price.", "info");
      return;
    }
    setBusy(true);
    try {
      await submitInvoice({
        invoiceNo: invoiceNo.trim(),
        currency,
        issuerName: me,
        issuerAddress: user?.address ?? null,
        payerName: orgName,
        notes: notes.trim() || undefined,
        lines: valid.map<NewInvoiceLine>((l) => ({
          description: l.description.trim(),
          quantity: Number(l.quantity) || 1,
          unitPriceTaxExcl: Number(l.price) || 0,
          taxPercent: Number(l.tax) || 0,
        })),
      });
      toast(`Invoice ${invoiceNo} submitted to ${orgName}.`, "success");
      setInvoiceNo("");
      setNotes("");
      setLines([{ ...emptyLine }]);
      refresh();
    } finally {
      setBusy(false);
    }
  };

  const importFile = async (file: File) => {
    setBusy(true);
    try {
      const text = await file.text();
      const parsed = parseInvoiceDocFile(text);
      const id = await submitInvoice({
        invoiceNo: parsed.invoiceNo || file.name.replace(/\.[^.]+$/, ""),
        currency: parsed.currency,
        issuerName: parsed.issuerName || me,
        issuerAddress: user?.address ?? null,
        payerName: parsed.payerName || orgName,
        notes: parsed.notes || undefined,
        lines: parsed.lines.length
          ? parsed.lines
          : [{ description: "Imported invoice", quantity: 1, unitPriceTaxExcl: 0, taxPercent: 0 }],
      });
      toast(`Imported invoice from ${file.name}.`, "success");
      refresh();
      return id;
    } catch {
      toast(
        "Couldn't read that file as a Powerhouse invoice document (JSON). Use the form instead.",
        "error",
      );
    } finally {
      setBusy(false);
    }
  };

  if (!user) return <EmptyState>Sign in to submit an invoice.</EmptyState>;

  return (
    <>
      <PageHeader
        title="Submit Invoice"
        subtitle={`Bill ${orgName} for your work — fill the form or drop in a Powerhouse invoice document.`}
      />

      <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
        {/* Create form */}
        <div className="tt-card p-4 sm:p-5">
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <input
              className="tt-input w-40"
              placeholder="Invoice #"
              value={invoiceNo}
              onChange={(e) => setInvoiceNo(e.target.value)}
            />
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
            <span className="text-sm text-mist-400">
              from <span className="text-mist-200">{me}</span> to{" "}
              <span className="text-mist-200">{orgName}</span>
            </span>
          </div>

          <label className="tt-label">Line items</label>
          <div className="flex flex-col gap-2">
            {lines.map((l, i) => (
              <div key={i} className="flex flex-wrap items-center gap-2">
                <input
                  className="tt-input min-w-0 flex-1"
                  placeholder="Description"
                  value={l.description}
                  onChange={(e) => setLine(i, { description: e.target.value })}
                />
                <input
                  className="tt-input w-16"
                  type="number"
                  placeholder="Qty"
                  value={l.quantity}
                  onChange={(e) => setLine(i, { quantity: e.target.value })}
                />
                <input
                  className="tt-input w-24"
                  type="number"
                  placeholder="Price"
                  value={l.price}
                  onChange={(e) => setLine(i, { price: e.target.value })}
                />
                <input
                  className="tt-input w-16"
                  type="number"
                  placeholder="Tax%"
                  value={l.tax}
                  onChange={(e) => setLine(i, { tax: e.target.value })}
                />
                <button
                  className="text-mist-400 hover:text-red-400"
                  onClick={() =>
                    setLines((ls) => (ls.length > 1 ? ls.filter((_, j) => j !== i) : ls))
                  }
                  aria-label="Remove line"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
          <button
            className="mt-2 text-xs text-magenta hover:underline"
            onClick={() => setLines((ls) => [...ls, { ...emptyLine }])}
          >
            + Add line
          </button>

          <textarea
            className="tt-input mt-4 min-h-16 w-full resize-y"
            placeholder="Notes (optional)"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />

          <div className="mt-4 flex items-center justify-between">
            <span className="text-sm text-mist-400">
              Total{" "}
              <span className="tabular-nums font-semibold text-mist-100">
                {formatAmount(total, currency)}
              </span>
            </span>
            <button className="tt-btn-primary" onClick={submit} disabled={busy}>
              {busy ? "Submitting…" : "Submit invoice"}
            </button>
          </div>
        </div>

        {/* File drop */}
        <div
          className={`tt-card flex flex-col items-center justify-center gap-3 p-6 text-center transition ${
            dragOver ? "border-magenta/70" : ""
          }`}
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            const f = e.dataTransfer.files?.[0];
            if (f) void importFile(f);
          }}
        >
          <div className="text-3xl text-mist-500">⬡</div>
          <div className="text-sm font-medium text-mist-200">
            Drop a Powerhouse invoice document
          </div>
          <div className="text-xs text-mist-400">
            Exported invoice (.json). We&apos;ll import it and submit it for you.
          </div>
          <button
            className="tt-btn-ghost"
            onClick={() => fileRef.current?.click()}
            disabled={busy}
          >
            Choose file
          </button>
          <input
            ref={fileRef}
            type="file"
            accept=".json,application/json"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void importFile(f);
              e.target.value = "";
            }}
          />
        </div>
      </div>

      {/* My submitted invoices */}
      <h2 className="mb-2 mt-8 text-sm font-semibold text-mist-200">
        My submitted invoices
      </h2>
      {mine.length === 0 ? (
        <EmptyState>You haven&apos;t submitted any invoices yet.</EmptyState>
      ) : (
        <div className="tt-card divide-y divide-ink-600/40">
          {mine.map((i) => {
            const meta = statusMeta(INVOICE_STATUS, i.status);
            return (
              <div
                key={i.id}
                className="flex flex-wrap items-center justify-between gap-2 px-5 py-3 text-sm"
              >
                <span className="font-medium text-mist-100">
                  {i.invoiceNo || "—"}
                </span>
                <span className="flex items-center gap-3">
                  <span className="tabular-nums text-mist-200">
                    {formatAmount(i.totalPriceTaxIncl, i.currency)}
                  </span>
                  <span
                    className="tt-chip w-fit"
                    style={{ background: `${meta.color}22`, color: meta.color }}
                  >
                    {meta.label}
                  </span>
                </span>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
