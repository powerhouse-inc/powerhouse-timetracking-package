import type { LeadPriority, LeadSource, LeadStage } from "./types";

export interface StageMeta {
  key: LeadStage;
  label: string;
  color: string;
}

/** Pipeline columns in flow order; color accents each stage. */
export const STAGES: StageMeta[] = [
  { key: "NEW", label: "New", color: "#6366f1" },
  { key: "CONTACTED", label: "Contacted", color: "#3b82f6" },
  { key: "QUALIFIED", label: "Qualified", color: "#06b6d4" },
  { key: "PROPOSAL", label: "Proposal", color: "#a855f7" },
  { key: "NEGOTIATION", label: "Negotiation", color: "#e57cd8" },
  { key: "WON", label: "Won", color: "#22c55e" },
  { key: "LOST", label: "Lost", color: "#6b7280" },
];

export const SOURCES: { key: LeadSource; label: string }[] = [
  { key: "WEBSITE", label: "Website" },
  { key: "REFERRAL", label: "Referral" },
  { key: "COLD_OUTREACH", label: "Cold outreach" },
  { key: "EVENT", label: "Event" },
  { key: "SOCIAL", label: "Social" },
  { key: "OTHER", label: "Other" },
];

export const PRIORITIES: { key: LeadPriority; label: string; color: string }[] = [
  { key: "LOW", label: "Low", color: "#6b7280" },
  { key: "MEDIUM", label: "Medium", color: "#eab308" },
  { key: "HIGH", label: "High", color: "#ef4444" },
];

export function priorityColor(p: LeadPriority): string {
  return PRIORITIES.find((x) => x.key === p)?.color ?? "#6b7280";
}

export function formatMoney(value: number | null | undefined): string {
  if (value == null) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}
