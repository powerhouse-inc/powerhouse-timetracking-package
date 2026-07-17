import type { SurveyStatus } from "@/lib/types";

const STYLES: Record<SurveyStatus, string> = {
  DRAFT: "bg-ink-700 text-mist-300",
  OPEN: "bg-green-500/15 text-green-400",
  CLOSED: "bg-ink-700 text-mist-400",
};

const LABELS: Record<SurveyStatus, string> = {
  DRAFT: "Draft",
  OPEN: "Open",
  CLOSED: "Closed",
};

export function SurveyStatusPill({ status }: { status: SurveyStatus }) {
  return (
    <span
      className={`rounded-full px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${STYLES[status]}`}
    >
      {LABELS[status]}
    </span>
  );
}
