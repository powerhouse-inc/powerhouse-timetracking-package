"use client";

import { useCallback } from "react";
import type { RawEntry, RawRunning } from "@/lib/api";
import type { WorkspaceProject } from "@/lib/types";
import type { EntryBlockAction } from "./calendar-block"
import { CalendarBlock } from "./calendar-block"
import {
  getMonthGrid,
  dayAbbrev,
  dayIsToday,
  dayShort,
  localDayKey,
  durationSeconds,
  formatDurationShort,
  formatTime24,
} from "@/lib/calendar/time"
import type { CalendarViewProps } from "./types"

/* ------------------------------------------------------------------ */
/*  Month view                                                         */
/* ------------------------------------------------------------------ */

interface MonthViewProps extends CalendarViewProps {}

const MAX_DETAIL_ENTRIES = 3; // Show up to 3 detail lines, then collapse

export function MonthView({
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
  onCreateEntry,
  onEditEntry,
  onDeleteEntry,
  onMoveEntry,
  onResizeEntry,
}: MonthViewProps) {
  const gridDays = getMonthGrid(currentDate);
  const month = currentDate.getMonth();
  const year = currentDate.getFullYear();

  // Count entries per day
  const entryCountByDay = new Map<string, number>();
  for (const e of entries) {
    const key = localDayKey(e.start);
    entryCountByDay.set(key, (entryCountByDay.get(key) ?? 0) + 1);
  }

  return (
    <div className="flex flex-col">
      {/* Day headers */}
      <div className="flex border-b border-ink-600/60">
        {["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"].map((d) => (
          <div
            key={d}
            className="flex-1 py-2 text-center text-[11px] font-semibold text-mist-500 uppercase tracking-wider"
          >
            {d}
          </div>
        ))}
      </div>

      {/* 6-week grid */}
      {Array.from({ length: 6 }, (_, week) => (
        <div key={week} className="flex border-b border-ink-600/30 last:border-0">
          {gridDays.slice(week * 7, (week + 1) * 7).map((d, i) => {
            const dayKeyStr = localDayKey(d.toISOString());
            const isCurrentMonth = d.getMonth() === month;
            const today = dayIsToday(d);
            const dayEntries = entries
              .filter((e) => localDayKey(e.start) === dayKeyStr)
              .sort((a, b) => a.start.localeCompare(b.start));
            const count = entryCountByDay.get(dayKeyStr) ?? 0;

            // Determine how to show entries
            const showDetail = count > 0 && count <= MAX_DETAIL_ENTRIES;
            const showBars = count > MAX_DETAIL_ENTRIES;
            const extraCount = count - MAX_DETAIL_ENTRIES;

            return (
              <div
                key={i}
                className={`group flex flex-col border-r border-ink-600/20 p-0.5 ${
                  !isCurrentMonth ? "bg-ink-900/40" : ""
                } ${today ? "bg-magenta/[0.04]" : ""}`}
                style={{
                  flex: 1,
                  minHeight: 90,
                  borderColor: today ? "rgba(229,124,216,0.15)" : undefined,
                }}
                onClick={() => onBlockAction({
                  type: "click",
                  entryId: `__day__${dayKeyStr}`,
                })}
              >
                {/* Day number */}
                <div className="px-1.5 pt-1">
                  <span
                    className={`inline-block rounded-full text-[11px] font-medium ${
                      today
                        ? "bg-magenta/20 text-magenta"
                        : isCurrentMonth
                          ? "text-mist-300"
                          : "text-mist-600"
                    }`}
                  >
                    {d.getDate()}
                  </span>
                </div>

                {/* Entry detail lines (hybrid: show up to MAX_DETAIL_ENTRIES) */}
                {showDetail && (
                  <div className="flex flex-col gap-px px-1">
                    {dayEntries.slice(0, MAX_DETAIL_ENTRIES).map((e) => {
                      const project = e.projectId
                        ? projects.find((p) => p.localId === e.projectId)
                        : undefined;
                      const dotColor = project?.color ?? "#6b7280";
                      return (
                        <div
                          key={e.id}
                          className="tt-cal-block flex items-center gap-1 rounded px-1 py-px text-[10px] leading-tight text-mist-200 transition hover:bg-ink-600/60 cursor-pointer"
                          style={{ borderLeft: `2px solid ${dotColor}` }}
                          onClick={(ev) => {
                            ev.stopPropagation();
                            onClick({ type: "click", entryId: e.id });
                          }}
                        >
                          <span
                            className="size-1 flex-none rounded-full"
                            style={{ background: dotColor }}
                          />
                          <span className="truncate">
                            {formatTime24(e.start)} {e.description}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Condensed bars + "N more" (when > MAX_DETAIL_ENTRIES) */}
                {showBars && (
                  <div className="flex flex-col gap-px px-1">
                    {dayEntries.slice(0, MAX_DETAIL_ENTRIES).map((e) => {
                      const project = e.projectId
                        ? projects.find((p) => p.localId === e.projectId)
                        : undefined;
                      const dotColor = project?.color ?? "#6b7280";
                      return (
                        <div
                          key={e.id}
                          className="tt-cal-block h-3.5 cursor-pointer rounded-r"
                          style={{
                            backgroundColor: `rgba(${parseInt(dotColor.slice(1, 3), 16)},${parseInt(dotColor.slice(3, 5), 16)},${parseInt(dotColor.slice(5, 7), 16)},0.25)`,
                            borderLeft: `2px solid ${dotColor}`,
                          }}
                          onClick={(ev) => {
                            ev.stopPropagation();
                            onClick({ type: "click", entryId: e.id });
                          }}
                        />
                      );
                    })}
                    {extraCount > 0 && (
                      <div className="text-[9px] text-mist-500">
                        +{extraCount} more
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}
