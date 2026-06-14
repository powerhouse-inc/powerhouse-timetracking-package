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
  getWeekRange,
  dayAbbrev,
  dayIsToday,
} from "@/lib/calendar/time"
import type { CalendarViewProps } from "./types"

export function WeekView({
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
  const weekDays = getWeekRange(currentDate);

  const totalHours = 24;
  const gridHeight = totalHours * HOUR_HEIGHT;
  const scrollRef = useRef<HTMLDivElement>(null);

  // Scroll to 7 AM on mount
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = 7 * HOUR_HEIGHT;
    }
  }, []);

  // Click on blank slot to create a time entry
  const handleGridClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>, dayIndex: number) => {
      const el = e.currentTarget;
      const rect = el.getBoundingClientRect();
      const y = e.clientY - rect.top + el.scrollTop;
      const x = e.clientX - rect.left;

      if ((e.target as HTMLElement).closest(".tt-cal-block")) return;

      const dayDate = weekDays[dayIndex];
      const snappedY = Math.round(y / (SNAP_MINUTES / 60 * HOUR_HEIGHT)) * (SNAP_MINUTES / 60 * HOUR_HEIGHT);
      const startISO = yToTime(snappedY, dayDate);
      const endISO = yToTime(snappedY + HOUR_HEIGHT / 2, dayDate); // 30-min default

      onDragStart({
        type: "create",
        startDate: new Date(startISO),
        startPixel: snappedY,
        endPixel: snappedY + HOUR_HEIGHT / 2,
        view: "week",
        dayIndex,
        clickTop: y,
        clickLeft: x,
      });
    },
    [weekDays, onDragStart],
  );

  return (
    <div className="relative w-full">
      {/* Grid: header + scrollable day columns */}
      <div
        ref={scrollRef}
        className="relative flex flex-col h-[calc(100vh-8rem)]"
        style={{ overflowY: "auto" }}
      >
        {/* Header: day names (sticky inside scroll container) */}
        <div
          className="sticky top-0 z-20 flex flex-none border-b border-ink-600/60 bg-ink-800"
          style={{ height: 36 }}
        >
          <div className="flex-none border-r border-ink-600/40" style={{ width: 56 }} />
          {weekDays.map((d, i) => {
            const today = dayIsToday(d);
            return (
              <div
                key={i}
                className={`flex-1 text-center text-xs font-semibold ${
                  today ? "text-magenta" : "text-mist-400"
                }`}
              >
                <div>{dayAbbrev(d)}</div>
                <div className={`mt-0.5 inline-block rounded-full text-[11px] ${
                  today ? "bg-magenta/20" : ""
                }`}>
                  {d.getDate()}
                </div>
              </div>
            );
          })}
        </div>

        {/* Day columns grid */}
        <div className="relative flex" style={{ height: gridHeight }}>
          {/* Time axis */}
          <TimeAxis height={gridHeight} />

          {/* 7 day columns */}
          {weekDays.map((dayDate, dayIndex) => {
          const dk = localDayKey(dayDate.toISOString());
          const today = dayIsToday(dayDate);
          const dayEntries = entries.filter(
            (e) => localDayKey(e.start) === dk,
          );

          return (
            <div
              key={dayIndex}
              className={`relative flex-1 border-r border-ink-600/20 ${
                today ? "bg-magenta/[0.02]" : ""
              }`}
              style={{
                height: gridHeight,
                borderColor: today ? "rgba(229,124,216,0.15)" : undefined,
              }}
              onClick={(e) => {
                if ((e.target as HTMLElement).closest(".tt-cal-block")) return;
                handleGridClick(e, dayIndex);
              }}
            >
              {/* Hour gridlines */}
              {Array.from({ length: totalHours }, (_, h) => (
                <div
                  key={h}
                  className="absolute inset-x-0 border-b border-ink-600/15"
                  style={{ top: h * HOUR_HEIGHT }}
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

              {/* Time entries for this day */}
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

              {/* Running timer if on this day */}
              {running &&
                localDayKey(running.start) === dk && (
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

              {/* Now indicator for today */}
              {today && <NowIndicator nowMs={now} />}
            </div>
          );
        })}
        </div>
      </div>
    </div>
  );
}
