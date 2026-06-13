import type { RawEntry, RawRunning } from "@/lib/api";
import type { WorkspaceProject } from "@/lib/types";
import type { EntryBlockAction } from "./calendar-block.js";

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
