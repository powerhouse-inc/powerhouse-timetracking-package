import type { RawEntry, RawRunning } from "@/lib/api";
import type { WorkspaceProject } from "@/lib/types";
import type { EntryBlockAction } from "./calendar-block"

/* ------------------------------------------------------------------ */
/*  Shared types for calendar components                               */
/* ------------------------------------------------------------------ */

export interface CalendarDragState {
  type: "move" | "resize" | "create";
  entryId?: string;
  startDate: Date;
  startPixel: number;
  endPixel?: number;
  dragHandle?: "top" | "bottom";
  /** View context (week, day, or month) — needed so page handler can resolve the correct date */
  view?: "week" | "day" | "month";
  /** Index of the clicked day within the week (0=Mon … 6=Sun); null for day view */
  dayIndex?: number | null;
  /** Click position relative to the scroll container for popover anchoring */
  clickTop?: number;
  clickLeft?: number;
}

export interface CalendarViewProps {
  entries: RawEntry[];
  running: RawRunning | null;
  projects: WorkspaceProject[];
  currentDate: Date;
  dragState: CalendarDragState | null;
  now: number;
  onDragStart: (state: CalendarDragState) => void;
  onDragEnd: () => void;
  onBlockAction: (action: EntryBlockAction) => void;
  onClick: (action: EntryBlockAction) => void;
  onCreateEntry: (data: {
    description: string;
    projectId: string | null;
    billable: boolean;
    start: string;
    end: string;
  }) => Promise<void>;
  onEditEntry: (id: string, data: {
    description?: string;
    projectId?: string | null;
    billable?: boolean;
  }) => Promise<void>;
  onDeleteEntry: (id: string) => Promise<void>;
  onMoveEntry: (id: string, newStart: string, newEnd: string) => Promise<void>;
  onResizeEntry: (id: string, newStart: string, newEnd: string) => Promise<void>;
}
