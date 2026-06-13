"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { PageHeader } from "@/components/ui"
import { ensureTimesheet, timesheetApi } from "@/lib/api"
import { useAuth } from "@/lib/auth"
import { useMyTimesheet, useRefresh, useWorkspace } from "@/lib/hooks"
import {
  durationSeconds,
  formatDurationShort,
  startOfWeek,
} from "@/lib/calendar/time"
import { CalendarGrid } from "@/components/calendar/calendar-grid"
import type { CalendarDragState } from "@/components/calendar/types"
import { CreatePopover } from "@/components/calendar/create-popover"
import { EditPopover } from "@/components/calendar/edit-popover"
import type { EntryBlockAction } from "@/components/calendar/calendar-block"
import {
  HOUR_HEIGHT,
  SNAP_MINUTES,
  timeToY,
  yToTime,
} from "@/lib/calendar/time"

/* ------------------------------------------------------------------ */
/*  Calendar page                                                      */
/* ------------------------------------------------------------------ */

export default function CalendarPage() {
  const { user } = useAuth();
  const { data: workspace } = useWorkspace();
  const { timesheet } = useMyTimesheet(user?.address);
  const refresh = useRefresh();
  const [busy, setBusy] = useState(false);
  const ensuring = useRef(false);

  useEffect(() => {
    if (!user || timesheet || ensuring.current) return;
    ensuring.current = true;
    void ensureTimesheet(user.address, user.name)
      .then(refresh)
      .finally(() => {
        ensuring.current = false;
      });
  }, [user, timesheet, refresh]);

  const projects = (workspace?.projects ?? []).filter(
    (p: { status: string }) => p.status === "ACTIVE",
  );
  const docId = timesheet?.id ?? null;

  const run = async (fn: () => Promise<void>) => {
    if (!docId) return;
    setBusy(true);
    try {
      await fn();
      refresh();
    } finally {
      setBusy(false);
    }
  };

  const weekStart = startOfWeek().toISOString();
  const weekSeconds = (timesheet?.entries ?? [])
    .filter((e: { start: string }) => e.start >= weekStart)
    .reduce((s: number, e: { start: string; end: string }) => s + durationSeconds(e.start, e.end), 0);

  const entries = timesheet?.entries ?? [];
  const running = timesheet?.running ?? null;

  // Drag state (for block movement/resizing + slot creation)
  const [dragState, setDragState] = useState<CalendarDragState | null>(null);

  // "Now" ticker
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  // Cancel popovers on Escape
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setCreatePopover(null);
        setEditPopover(null);
        setDragState(null);
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, []);

  // Popover states
  const [createPopover, setCreatePopover] = useState<{
    startDate: Date;
    endDate: Date;
  } | null>(null);
  const [editPopover, setEditPopover] = useState<{ entryId: string } | null>(null);

  // Process drag end: dispatch mutation
  const [pendingDragEnd, setPendingDragEnd] = useState<{
    entryId: string;
    handle: "top" | "bottom" | "body";
    startY: number;
    endY?: number;
    startDate: Date;
  } | null>(null);

  // Merge running timer into entries list for display
  const allEntries = useMemo(() => {
    const result = [...entries];
    if (running) {
      result.push({
        id: running.id,
        description: running.description || "(no description)",
        projectId: running.projectId,
        start: running.start,
        end: new Date().toISOString(),
        billable: running.billable,
        tags: [],
      });
    }
    return result;
  }, [entries, running]);

  // Drag handlers
  const handleDragStart = useCallback((state: CalendarDragState) => {
    setDragState(state);
    if (state.type === "create") {
      const startISO = yToTime(state.startPixel, new Date());
      const endISO = state.endPixel
        ? yToTime(state.endPixel, new Date())
        : yToTime(state.startPixel + HOUR_HEIGHT / 2, new Date());
      setCreatePopover({
        startDate: new Date(startISO),
        endDate: new Date(endISO),
      });
    }
  }, []);

  const handleDragEnd = useCallback(() => {
    if (pendingDragEnd) {
      const { entryId, handle, startY, endY, startDate } = pendingDragEnd;
      if (handle === "body") {
        // Move: recalculate start time from final pixel
        // (pixel delta was already tracked in drag state)
      }
      setPendingDragEnd(null);
    }
    setDragState(null);
  }, [pendingDragEnd]);

  const handleMoveEntry = useCallback(
    async (id: string, newStart: string, newEnd: string) => {
      await run(() => timesheetApi.updateEntry(docId!, id, { start: newStart, end: newEnd }));
    },
    [docId, run],
  );

  const handleResizeEntry = useCallback(
    async (id: string, newStart: string, newEnd: string) => {
      await run(() => timesheetApi.updateEntry(docId!, id, { start: newStart, end: newEnd }));
    },
    [docId, run],
  );

  // Create entry
  const handleCreateEntry = useCallback(
    async (data: {
      description: string;
      projectId: string | null;
      billable: boolean;
      start: string;
      end: string;
    }) => {
      await run(() =>
        timesheetApi.addEntry(docId!, {
          ...data,
          start: data.start,
          end: data.end,
        }),
      );
      setCreatePopover(null);
    },
    [docId, run],
  );

  // Edit entry
  const handleEditEntry = useCallback(
    async (id: string, data: { description?: string; projectId?: string | null; billable?: boolean }) => {
      await run(() => timesheetApi.updateEntry(docId!, id, data));
      setEditPopover(null);
    },
    [docId, run],
  );

  // Delete entry
  const handleDeleteEntry = useCallback(
    async (id: string) => {
      await run(() => timesheetApi.deleteEntry(docId!, id));
    },
    [docId, run],
  );

  // Block action handler
  const handleBlockAction = useCallback(
    (action: EntryBlockAction) => {
      if (action.type === "click") {
        setEditPopover({ entryId: action.entryId });
        return;
      }
      if (action.type === "drag-start") {
        // Record start position for pending commit
        setDragState({
          type: action.handle === "body" ? "move" : "resize",
          entryId: action.entryId,
          startDate: new Date(),
          startPixel: 0,
        });
      }
    },
    [],
  );

  const viewProps = {
    entries: allEntries,
    running,
    projects,
    currentDate: new Date(),
    dragState: dragState,
    now,
    onDragStart: handleDragStart,
    onDragEnd: handleDragEnd,
    onBlockAction: handleBlockAction,
    onClick: handleBlockAction,
    onCreateEntry: handleCreateEntry,
    onEditEntry: handleEditEntry,
    onDeleteEntry: handleDeleteEntry,
    onMoveEntry: handleMoveEntry,
    onResizeEntry: handleResizeEntry,
  };

  // Loading state
  if (!docId || busy) {
    return (
      <>
        <PageHeader
          title="Calendar"
          subtitle="Your time entries, visualized."
          action={
            <div className="tt-card px-4 py-2 text-right">
              <div className="text-[11px] uppercase tracking-wider text-mist-400">
                This week
              </div>
              <div className="font-mono text-lg tabular-nums text-mist-100">
                {formatDurationShort(weekSeconds)}
              </div>
            </div>
          }
        />
        <div className="flex items-center justify-center py-20 text-mist-400">
          {busy ? "Loading…" : "Initializing…"}
        </div>
      </>
    );
  }

  // Find the entry being edited
  const editingEntry = editPopover
    ? allEntries.find((e) => e.id === editPopover.entryId)
    : null;

  return (
    <>
      <PageHeader
        title="Calendar"
        subtitle="Track what you're working on, visually."
        action={
          <div className="tt-card px-4 py-2 text-right">
            <div className="text-[11px] uppercase tracking-wider text-mist-400">
              This week
            </div>
            <div className="font-mono text-lg tabular-nums text-mist-100">
              {formatDurationShort(weekSeconds)}
            </div>
          </div>
        }
      />

      <CalendarGrid
        entries={allEntries}
        running={running}
        projects={projects}
        onMoveEntry={handleMoveEntry}
        onResizeEntry={handleResizeEntry}
        onCreateEntry={handleCreateEntry}
        onEditEntry={handleEditEntry}
        onDeleteEntry={handleDeleteEntry}
      />

      {/* Create popover */}
      {createPopover && (
        <div
          className="fixed inset-0 z-30"
          onClick={() => setCreatePopover(null)}
        >
          <div
            className="fixed bottom-6 right-6 z-40"
            onClick={(e) => e.stopPropagation()}
          >
            <CreatePopover
              position={{ top: 0, left: 0 }}
              startDate={createPopover.startDate}
              endDate={createPopover.endDate}
              projects={projects}
              onSubmit={handleCreateEntry}
              onCancel={() => setCreatePopover(null)}
            />
          </div>
        </div>
      )}

      {/* Edit popover */}
      {editPopover && editingEntry && (
        <div
          className="fixed inset-0 z-30"
          onClick={() => setEditPopover(null)}
        >
          <div
            className="fixed bottom-6 right-6 z-40"
            onClick={(e) => e.stopPropagation()}
          >
            <EditPopover
              position={{ top: 0, left: 0 }}
              entry={editingEntry}
              running={!!running}
              projects={projects}
              onSubmit={(data) => handleEditEntry(editingEntry.id, data)}
              onDelete={() => handleDeleteEntry(editingEntry.id)}
              onCancel={() => setEditPopover(null)}
            />
          </div>
        </div>
      )}
    </>
  );
}
