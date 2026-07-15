import type {
  AccountType,
  ExpenseReportStatus,
  KycAmlStatus,
} from "./types";

/**
 * `Amount_Currency` is serialized inconsistently across the reactor: sometimes
 * as a plain number, sometimes as a numeric string, and sometimes as an object
 * like `{ unit: "USDS", value: "1200.5" }`. This formatter accepts any of those
 * shapes (plus null/undefined) and renders a human-readable amount.
 */
export function formatAmountCurrency(v: unknown): string {
  const fmt = (n: number, unit?: string): string => {
    if (!Number.isFinite(n)) return unit ? `— ${unit}` : "—";
    const s = new Intl.NumberFormat("en-US", {
      maximumFractionDigits: 4,
    }).format(n);
    return unit ? `${s} ${unit}` : s;
  };

  if (v == null) return "—";
  if (typeof v === "number") return fmt(v);
  if (typeof v === "string") {
    const n = Number(v);
    return Number.isNaN(n) ? v : fmt(n);
  }
  if (typeof v === "object") {
    const obj = v as { unit?: unknown; value?: unknown };
    const unit = typeof obj.unit === "string" ? obj.unit : undefined;
    const raw = obj.value;
    const n =
      typeof raw === "number"
        ? raw
        : typeof raw === "string"
          ? Number(raw)
          : NaN;
    return fmt(n, unit);
  }
  return "—";
}

/** Best-effort numeric extraction from an `Amount_Currency` value (for sums). */
export function amountToNumber(v: unknown): number {
  if (typeof v === "number") return Number.isFinite(v) ? v : 0;
  if (typeof v === "string") {
    const n = Number(v);
    return Number.isNaN(n) ? 0 : n;
  }
  if (v && typeof v === "object") {
    const raw = (v as { value?: unknown }).value;
    if (typeof raw === "number") return Number.isFinite(raw) ? raw : 0;
    if (typeof raw === "string") {
      const n = Number(raw);
      return Number.isNaN(n) ? 0 : n;
    }
  }
  return 0;
}

/** Unit label from an `Amount_Currency` value, when present. */
export function amountUnit(v: unknown): string | null {
  if (v && typeof v === "object") {
    const unit = (v as { unit?: unknown }).unit;
    if (typeof unit === "string" && unit) return unit;
  }
  return null;
}

export const ACCOUNT_TYPE_META: Record<
  AccountType,
  { label: string; color: string }
> = {
  Source: { label: "Source", color: "#22c55e" },
  Internal: { label: "Internal", color: "#3b82f6" },
  Destination: { label: "Destination", color: "#e57cd8" },
  External: { label: "External", color: "#f97316" },
};

export function accountTypeMeta(type: string | null): {
  label: string;
  color: string;
} {
  if (type && type in ACCOUNT_TYPE_META) {
    return ACCOUNT_TYPE_META[type as AccountType];
  }
  return { label: type ?? "—", color: "#6b7280" };
}

export const KYC_META: Record<KycAmlStatus, { label: string; color: string }> =
  {
    PASSED: { label: "Passed", color: "#22c55e" },
    PENDING: { label: "Pending", color: "#f59e0b" },
    FAILED: { label: "Failed", color: "#ef4444" },
  };

export function kycMeta(status: string | null): {
  label: string;
  color: string;
} {
  if (status && status in KYC_META) return KYC_META[status as KycAmlStatus];
  return { label: status ?? "Unknown", color: "#6b7280" };
}

export const EXPENSE_STATUS_META: Record<
  ExpenseReportStatus,
  { label: string; color: string }
> = {
  DRAFT: { label: "Draft", color: "#6b7280" },
  REVIEW: { label: "Review", color: "#3b82f6" },
  FINAL: { label: "Final", color: "#22c55e" },
};

export function expenseStatusMeta(status: string): {
  label: string;
  color: string;
} {
  if (status in EXPENSE_STATUS_META) {
    return EXPENSE_STATUS_META[status as ExpenseReportStatus];
  }
  return { label: status, color: "#6b7280" };
}
