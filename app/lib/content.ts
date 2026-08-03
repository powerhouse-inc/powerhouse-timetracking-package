import type {
  ContentChannel,
  ContentDoc,
  ContentFormat,
  ContentStage,
} from "./types";

export interface StageMeta {
  key: ContentStage;
  label: string;
  color: string;
}

/** Pipeline columns in flow order; color accents each stage. */
export const CONTENT_STAGES: StageMeta[] = [
  { key: "IDEA", label: "Idea", color: "#6366f1" },
  { key: "DRAFTING", label: "Drafting", color: "#3b82f6" },
  { key: "REVIEW", label: "Review", color: "#06b6d4" },
  { key: "SCHEDULED", label: "Scheduled", color: "#a855f7" },
  { key: "PUBLISHED", label: "Published", color: "#22c55e" },
  { key: "REPURPOSE", label: "Repurpose", color: "#e57cd8" },
];

export const CONTENT_FORMATS: { key: ContentFormat; label: string }[] = [
  { key: "POST", label: "Post" },
  { key: "ARTICLE", label: "Article" },
  { key: "VIDEO", label: "Video" },
  { key: "ONE_PAGER", label: "One-pager" },
  { key: "DM_SCRIPT", label: "DM script" },
  { key: "LEAD_MAGNET", label: "Lead magnet" },
  { key: "OTHER", label: "Other" },
];

export const CONTENT_CHANNELS: { key: ContentChannel; label: string }[] = [
  { key: "LINKEDIN", label: "LinkedIn" },
  { key: "REDDIT", label: "Reddit" },
  { key: "DISCORD", label: "Discord" },
  { key: "TELEGRAM", label: "Telegram" },
  { key: "FACEBOOK_GROUP", label: "Facebook group" },
  { key: "FORUM", label: "Forum" },
  { key: "DIRECTORY", label: "Directory" },
  { key: "EMAIL", label: "Email" },
  { key: "WEB", label: "Web" },
  { key: "OTHER", label: "Other" },
];

/**
 * The stage machine, mirrored from the reducer. PUBLISHED is intentionally
 * absent as a target here — it is reachable only via the dedicated publish
 * action (which also captures the published URL + date).
 */
const TRANSITIONS: Record<ContentStage, ContentStage[]> = {
  IDEA: ["DRAFTING"],
  DRAFTING: ["REVIEW"],
  REVIEW: ["SCHEDULED", "DRAFTING"],
  SCHEDULED: [],
  PUBLISHED: ["REPURPOSE"],
  REPURPOSE: ["IDEA", "DRAFTING"],
};

/** Allowed next stages via advanceStage (excludes the publish transition). */
export function nextStages(from: ContentStage): ContentStage[] {
  return TRANSITIONS[from];
}

/** Whether a scheduled item can be published. */
export function canPublish(item: ContentDoc): boolean {
  return item.status === "ACTIVE" && item.currentStage === "SCHEDULED";
}

export function stageMeta(stage: ContentStage): StageMeta {
  return CONTENT_STAGES.find((s) => s.key === stage) ?? CONTENT_STAGES[0];
}

export function formatLabel(format: ContentFormat): string {
  return CONTENT_FORMATS.find((f) => f.key === format)?.label ?? format;
}

export function channelLabel(channel: ContentChannel): string {
  return CONTENT_CHANNELS.find((c) => c.key === channel)?.label ?? channel;
}

/** A short calendar date from an ISO datetime, for compact display. */
export function shortDate(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/**
 * A `<input type="date">` value (YYYY-MM-DD) for an ISO datetime, and the
 * inverse: a date-only string back to an ISO datetime the model accepts (the
 * Date scalar validates as a full ISO datetime).
 */
export function toDateInput(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString().slice(0, 10);
}

export function fromDateInput(value: string): string | null {
  const v = value.trim();
  if (!v) return null;
  const d = new Date(`${v}T00:00:00.000Z`);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
}
