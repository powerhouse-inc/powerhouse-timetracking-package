"use client";

import { useCallback } from "react";
import type { RawEntry, RawRunning } from "@/lib/api";
import type { WorkspaceProject } from "@/lib/types";
import {
  HOUR_HEIGHT,
  SNAP_MINUTES,
  durationSeconds,
  formatDurationShort,
  formatTime24,
  timeToY,
} from "@/lib/calendar/time";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export type EntryBlockAction =
  | { type: "click"; entryId: string }
  | { type: "drag-start"; entryId: string; handle: "top" | "bottom" | "body" }
  | { type: "drag-move"; entryId: string; handle: "top" | "bottom"; delta: number }
  | { type: "drag-end"; entryId: string; handle: "top" | "bottom" | "body" };

interface CalendarBlockProps {
  entry: RawEntry;
  running: RawRunning | null;
  projects: WorkspaceProject[];
  dragState: { type: "move" | "resize" | "create"; entryId?: string; startDate: Date; startPixel: number; endPixel?: number; dragHandle?: "top" | "bottom"; } | null;
  onAction: (action: EntryBlockAction) => void;
  onClick: (action: EntryBlockAction) => void;
}

/* ------------------------------------------------------------------ */
/*  Calendar block (draggable time entry)                              */
/* ------------------------------------------------------------------ */

export function CalendarBlock({
  entry,
  running,
  projects,
  dragState,
  onAction,
  onClick,
}: CalendarBlockProps) {
  const project = entry.projectId
    ? projects.find((p) => p.localId === entry.projectId)
    : undefined;
  const color = project?.color ?? "#6b7280";
  const bgTint = rgba(color, 0.08);
  const borderColor = rgba(color, 0.3);

  // Is this the running entry?
  const isRunning = running?.id === entry.id;
  const effectiveEnd = isRunning ? new Date().toISOString() : entry.end;
  const startY = timeToY(entry.start);
  const endY = timeToY(effectiveEnd);
  const height = Math.max(24, endY - startY);

  // Is this block currently being dragged?
  const isDraggingThis = dragState?.entryId === entry.id;

  // Ghost offset (for drag preview)
  const ghostOffset = isDraggingThis ? dragState!.startPixel - startY : 0;

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (e.button !== 0) return;
      e.preventDefault();
      const el = e.currentTarget as HTMLElement;
      const handle = (el.dataset.handle || "body") as "top" | "bottom" | "body";
      onAction({ type: "drag-start", entryId: entry.id, handle });

      const startMouseY = e.clientY;

      const handleMove = (ev: MouseEvent) => {
        const deltaY = ev.clientY - startMouseY;
        const pixelDelta = Math.round(deltaY / (SNAP_MINUTES / 60 * HOUR_HEIGHT)) * (SNAP_MINUTES / 60 * HOUR_HEIGHT);
        if (handle === "top" || handle === "bottom") {
          onAction({ type: "drag-move", entryId: entry.id, handle, delta: pixelDelta });
        }
      };

      const handleUp = () => {
        onAction({ type: "drag-end", entryId: entry.id, handle });
        window.removeEventListener("mousemove", handleMove);
        window.removeEventListener("mouseup", handleUp);
      };

      window.addEventListener("mousemove", handleMove);
      window.addEventListener("mouseup", handleUp);
    },
    [entry.id, onAction],
  );

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      if (isDraggingThis) return;
      onClick({ type: "click", entryId: entry.id });
    },
    [isDraggingThis, onClick, entry.id],
  );

  const duration = durationSeconds(entry.start, effectiveEnd);
  const shortDur = formatDurationShort(duration);
  const startTime = formatTime24(entry.start);
  const endTime = formatTime24(effectiveEnd);

  return (
    <div
      className={`tt-cal-block absolute left-1 right-1 cursor-grab rounded-r-md border-l-[4px] transition-shadow ${
        isDraggingThis ? "z-30 shadow-lg" : "z-10"
      }`}
      style={{
        top: startY + ghostOffset,
        height,
        backgroundColor: isRunning ? rgba(color, 0.15) : bgTint,
        borderColor: isRunning ? rgba(color, 0.5) : borderColor,
        opacity: isDraggingThis ? 0.6 : 1,
        boxShadow: isRunning
          ? `0 0 12px ${rgba(color, 0.3)}`
          : "none",
      }}
      onMouseDown={handleMouseDown}
      onClick={handleClick}
    >
      {/* Content */}
      {height > 28 && (
        <div className="flex items-center gap-1 px-2 py-1">
          {isRunning && (
            <span className="size-1.5 flex-none animate-pulse rounded-full bg-magenta" />
          )}
          <span className="truncate text-[11px] font-medium text-mist-100">
            {entry.description}
          </span>
        </div>
      )}

      {/* Duration label at bottom if enough height */}
      {height > 48 && (
        <div className="absolute bottom-0 inset-x-0 px-2 pb-1">
          <span className="text-[10px] font-mono tabular-nums text-mist-400">
            {startTime}–{endTime} · {shortDur}
          </span>
        </div>
      )}

      {/* Resize handles */}
      <div
        className="absolute inset-x-0 top-0 h-2 cursor-n-resize"
        data-handle="top"
        title="Drag to resize top"
      />
      <div
        className="absolute inset-x-0 bottom-0 h-2 cursor-s-resize"
        data-handle="bottom"
        title="Drag to resize bottom"
      />
    </div>
  );
}

function rgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}
