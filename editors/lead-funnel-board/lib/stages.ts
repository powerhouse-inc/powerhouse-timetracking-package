import type {
  LeadPriority,
  LeadSource,
  LeadStage,
} from "document-models/lead-funnel";

export interface StageConfig {
  id: LeadStage;
  label: string;
  accent: string;
}

/** Fixed Salesforce-style pipeline. Column order === array order. */
export const STAGES: StageConfig[] = [
  { id: "NEW", label: "New", accent: "#6366f1" },
  { id: "CONTACTED", label: "Contacted", accent: "#0ea5e9" },
  { id: "QUALIFIED", label: "Qualified", accent: "#14b8a6" },
  { id: "PROPOSAL", label: "Proposal", accent: "#f59e0b" },
  { id: "NEGOTIATION", label: "Negotiation", accent: "#f97316" },
  { id: "WON", label: "Won", accent: "#22c55e" },
  { id: "LOST", label: "Lost", accent: "#ef4444" },
];

export const SOURCES: LeadSource[] = [
  "WEBSITE",
  "REFERRAL",
  "COLD_OUTREACH",
  "EVENT",
  "SOCIAL",
  "OTHER",
];

export const PRIORITIES: LeadPriority[] = ["LOW", "MEDIUM", "HIGH"];

export const PRIORITY_ACCENT: Record<LeadPriority, string> = {
  LOW: "#94a3b8",
  MEDIUM: "#f59e0b",
  HIGH: "#ef4444",
};

export const ACTIVITY_TYPES = ["CALL", "EMAIL", "MEETING", "NOTE"] as const;

export function labelize(value: string): string {
  return value
    .toLowerCase()
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}
