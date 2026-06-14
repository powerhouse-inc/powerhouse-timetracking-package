"use client";

import { useCallback, useEffect, useRef } from "react";
import type { RawEntry, RawRunning } from "@/lib/api";
import type { WorkspaceProject } from "@/lib/types";
import type { EntryBlockAction } from "./calendar-block"
import { CalendarBlock } from "./calendar-block"
import { NowIndicator } from "./now-indicator"
import { TimeAxis } from "./time-axis"
import {
  HOUR_HEIGHT,
  SNAP_MINUTES,
  localDayKey,
  yToTime,
} from "@/lib/calendar/time"
import type { CalendarViewProps } from "./types"

export function DayView({
  entries,
  running,
  projects,
  currentDate,
  dragState,
  now,
  onDragStart,
  onDragEnd,
  onBlockAction,
  onClick,
}: CalendarViewProps) {
  const dayKey = localDayKey(currentDate.toISOString());
  const dayEntries = entries.filter((e) => localDayKey(e.start) === dayKey);
  const isToday = currentDate.toDateString() === new Date().toDateString();

  const totalHours = 24;
  const gridHeight = totalHours * HOUR_HEIGHT;
  const scrollRef = useRef<HTMLDivElement>(null);

  // Scroll to 7 AM on mount
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = 7 * HOUR_HEIGHT;
    }
  }, []);

  // Click on blank slot to create
  const handleGridClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const el = e.currentTarget;
      const rect = el.getBoundingClientRect();
      const y = e.clientY - rect.top + el.scrollTop;

      // Only trigger if clicking on the grid area (not on a block)
      if ((e.target as HTMLElement).closest(".tt-cal-block")) return;

      const snappedY = Math.round(y / (SNAP_MINUTES / 60 * HOUR_HEIGHT)) * (SNAP_MINUTES / 60 * HOUR_HEIGHT);
      const startISO = yToTime(snappedY, currentDate);
      const endISO = yToTime(snappedY + HOUR_HEIGHT / 2, currentDate); // 30-min default

      onDragStart({
        type: "create",
        startDate: new Date(startISO),
        startPixel: snappedY,
        endPixel: snappedY + HOUR_HEIGHT / 2,
      });
    },
    [currentDate, onDragStart],
  );

  return (
    <div className="relative w-full">
      <div
        ref={scrollRef}
        className="relative flex flex-col h-[calc(100vh-8rem)]"
        style={{ overflowY: "auto" }}
      >
        {/* Header: day name (sticky inside scroll container) */}
        <div
          className="sticky top-0 z-20 flex items-center border-b border-ink-600/60 px-4 py-2 bg-ink-800"
          style={{ height: 36 }}
        >
          <div className="flex-1 text-xs font-semibold">
            {currentDate.toLocaleDateString([], {
              weekday: "long",
              month: "long",
              day: "numeric",
            })}
            {isToday && (
              <span className="ml-2 rounded-full bg-magenta/20 px-2 py-px text-[10px] font-bold text-magenta">
                Today
              </span>
            )}
          </div>
        </div>

        {/* Day grid */}
        <div className="relative w-full" style={{ height: gridHeight }} onClick={handleGridClick}>
          {/* Hour gridlines */}
          {Array.from({ length: totalHours }, (_, i) => (
            <div
              key={i}
              className="absolute inset-x-0 border-b border-ink-600/20"
              style={{ top: i * HOUR_HEIGHT }}
            />
          ))}

          {/* Half-hour dashed lines */}
          {Array.from({ length: totalHours * 2 }, (_, i) => {
            if (i % 2 === 0) return null;
            return (
              <div
                key={i}
                className="absolute inset-x-0 border-b border-dashed border-ink-600/10"
                style={{ top: i * HOUR_HEIGHT / 2 }}
              />
            );
          })}

          {/* Time axis */}
          <TimeAxis height={gridHeight} />

          {/* Time entries */}
          {dayEntries.map((e) => (
            <CalendarBlock
              key={e.id}
              entry={e}
              running={running}
              projects={projects}
              dragState={dragState}
              onAction={onBlockAction}
              onClick={onClick}
            />
          ))}

          {/* Running timer entry (if on different day) */}
          {running &&
            localDayKey(running.start) !== dayKey && (
              <CalendarBlock
                key={`run-${running.id}`}
                entry={{
                  id: running.id,
                  description: running.description || "(no description)",
                  projectId: running.projectId,
                  start: running.start,
                  end: new Date().toISOString(),
                  billable: running.billable,
                  tags: [],
                }}
                running={running}
                projects={projects}
                dragState={dragState}
                onAction={onBlockAction}
                onClick={onClick}
              />
            )}

          {/* Now indicator */}
          {isToday && <NowIndicator nowMs={now} />}
        </div>
      </div>
    </div>
  );
}
