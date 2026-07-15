import type { BillingStatementStatus, InvoiceStatus } from "./types";

export const INVOICE_STATUS: {
  key: InvoiceStatus;
  label: string;
  color: string;
}[] = [
  { key: "DRAFT", label: "Draft", color: "#6b7280" },
  { key: "ISSUED", label: "Issued", color: "#3b82f6" },
  { key: "ACCEPTED", label: "Accepted", color: "#06b6d4" },
  { key: "REJECTED", label: "Rejected", color: "#ef4444" },
  { key: "CANCELLED", label: "Cancelled", color: "#6b7280" },
  { key: "PAYMENTSCHEDULED", label: "Payment scheduled", color: "#a855f7" },
  { key: "PAYMENTSENT", label: "Payment sent", color: "#e57cd8" },
  { key: "PAYMENTISSUE", label: "Payment issue", color: "#f97316" },
  { key: "PAYMENTRECEIVED", label: "Payment received", color: "#22c55e" },
  { key: "PAYMENTCLOSED", label: "Closed", color: "#22c55e" },
];

export const STATEMENT_STATUS: {
  key: BillingStatementStatus;
  label: string;
  color: string;
}[] = [
  { key: "DRAFT", label: "Draft", color: "#6b7280" },
  { key: "ISSUED", label: "Issued", color: "#3b82f6" },
  { key: "ACCEPTED", label: "Accepted", color: "#06b6d4" },
  { key: "REJECTED", label: "Rejected", color: "#ef4444" },
  { key: "PAID", label: "Paid", color: "#22c55e" },
];

export function statusMeta<T extends { key: string; color: string; label: string }>(
  list: T[],
  key: string,
): { color: string; label: string } {
  return list.find((s) => s.key === key) ?? { color: "#6b7280", label: key };
}

export function formatAmount(value: number, currency = ""): string {
  const n = new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 }).format(
    value,
  );
  return currency ? `${n} ${currency}` : n;
}

export const CURRENCIES = ["USD", "EUR", "USDS", "USDC", "DAI"];
