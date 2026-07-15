import type { TimesheetDoc } from "./api";
import type {
  BillingStatementStatus,
  InvoiceStatus,
  WorkspaceProject,
} from "./types";

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

export interface TrackedLine {
  description: string;
  hours: number;
  rate: number;
}

/**
 * Aggregate tracked hours per project into billable line items. The caller
 * decides which timesheets (e.g. one contributor's) and which projects
 * (e.g. one client's) to include.
 */
export function trackedLines(
  timesheets: TimesheetDoc[],
  projects: WorkspaceProject[],
): TrackedLine[] {
  const included = new Set(projects.map((p) => p.localId));
  const byId = new Map<string, number>();
  for (const s of timesheets) {
    for (const e of s.entries) {
      if (!e.projectId || !included.has(e.projectId)) continue;
      const h =
        (new Date(e.end).getTime() - new Date(e.start).getTime()) / 3_600_000;
      if (!Number.isFinite(h) || h <= 0) continue;
      byId.set(e.projectId, (byId.get(e.projectId) ?? 0) + h);
    }
  }
  return projects
    .filter((p) => (byId.get(p.localId) ?? 0) > 0)
    .map((p) => ({
      description: p.name,
      hours: Math.round((byId.get(p.localId) ?? 0) * 100) / 100,
      rate: p.hourlyRate ?? 0,
    }));
}
