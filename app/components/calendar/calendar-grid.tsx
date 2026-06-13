"use client";

import { useCallback, useEffect, useState } from "react";
import type { RawEntry, RawRunning } from "@/lib/api";
import type { WorkspaceProject } from "@/lib/types";
import type { EntryBlockAction } from "./calendar-block.js";
import { CalendarNav } from "./calendar-nav.js";
import { DayView } from "./day-view.js";
import { MonthView } from "./month-view.js";
import { WeekView } from "./week-view.js";
import { addDays } from "@/lib/calendar/time.js";
import type { CalendarDragState, CalendarViewProps } from "./types.js";

export type ViewType = "day" | "week" | "month";

// Re-export for consumers
export type { CalendarDragState } from "./types.js";

/* ------------------------------------------------------------------ */
/*  Main calendar grid (view switching + drag state)                   */
/* ------------------------------------------------------------------ */

interface CalendarGridProps {
  entries: RawEntry[];
  running: RawRunning | null;
  projects: WorkspaceProject[];
  onMoveEntry: (id: string, newStart: string, newEnd: string) => Promise<void>;
  onResizeEntry: (id: string, newStart: string, newEnd: string) => Promise<void>;
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
}

/** The main calendar grid component that handles view switching and drag state. */
export function CalendarGrid({
  entries,
  running,
  projects,
  onMoveEntry,
  onResizeEntry,
  onCreateEntry,
  onEditEntry,
  onDeleteEntry,
}: CalendarGridProps) {
  const [view, setView] = useState<ViewType>("week");
  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [dragState, setDragState] = useState<CalendarDragState | null>(null);

  // "Now" ticker
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  // Navigation
  const navigate = useCallback(
    (dir: -1 | 0 | 1) => {
      setCurrentDate((d) => {
        if (view === "day") return addDays(d, dir);
        if (view === "week") return addDays(d, dir * 7);
        return new Date(d.getFullYear(), d.getMonth() + dir, 1);
      });
    },
    [view],
  );

  const handleToday = useCallback(() => setCurrentDate(new Date()), []);
  const handlePrev = useCallback(() => navigate(-1), [navigate]);
  const handleNext = useCallback(() => navigate(1), [navigate]);
  const handleDateChange = useCallback((d: Date) => setCurrentDate(d), []);

  // Drag handlers
  const handleDragStart = useCallback((state: CalendarDragState) => setDragState(state), []);
  const handleDragEnd = useCallback(() => setDragState(null), []);

  // Block action handler: clicks open edit popover
  const handleBlockAction = (_action: EntryBlockAction) => {
    // Click → handled by parent page's onClick handler
  };

  const viewProps: CalendarViewProps = {
    entries,
    running,
    projects,
    currentDate,
    dragState,
    now,
    onDragStart: handleDragStart,
    onDragEnd: handleDragEnd,
    onBlockAction: handleBlockAction,
    onClick: handleBlockAction,
    onCreateEntry,
    onEditEntry,
    onDeleteEntry,
    onMoveEntry,
    onResizeEntry,
  };

  return (
    <div className="flex flex-col gap-4">
      <CalendarNav
        currentDate={currentDate}
        view={view}
        onToday={handleToday}
        onPrev={handlePrev}
        onNext={handleNext}
        onDateChange={handleDateChange}
        onViewChange={setView}
      />

      <div className="tt-card overflow-hidden">
        {view === "day" && <DayView {...viewProps} />}
        {view === "week" && <WeekView {...viewProps} />}
        {view === "month" && <MonthView {...viewProps} />}
      </div>
    </div>
  );
}
