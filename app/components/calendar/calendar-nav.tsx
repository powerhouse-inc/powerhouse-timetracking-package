"use client";

import { useState } from "react";
import type { ViewType } from "./calendar-grid";
import {
  addDays,
  dayAbbrev,
  dayIsToday,
  dayShort,
  formatPeriodTitle,
  getMonthGrid,
  startOfWeek,
} from "@/lib/calendar/time";

/* ------------------------------------------------------------------ */
/*  Calendar navigation bar                                            */
/* ------------------------------------------------------------------ */

export type { ViewType } from "./calendar-grid";

interface CalendarNavProps {
  currentDate: Date;
  view: ViewType;
  onToday: () => void;
  onPrev: () => void;
  onNext: () => void;
  onDateChange: (date: Date) => void;
  onViewChange: (view: ViewType) => void;
}

export function CalendarNav({
  currentDate,
  view,
  onToday,
  onPrev,
  onNext,
  onDateChange,
  onViewChange,
}: CalendarNavProps) {
  const [showMini, setShowMini] = useState(false);

  return (
    <div className="flex items-center gap-2">
      {/* Today button */}
      <button
        className="tt-btn tt-btn-ghost text-xs"
        onClick={onToday}
      >
        Today
      </button>

      {/* Navigation arrows */}
      <div className="flex items-center gap-0.5">
        <button
          className="grid size-7 place-items-center rounded-md text-mist-300 transition hover:bg-ink-700 hover:text-mist-100"
          onClick={onPrev}
          title="Previous"
        >
          ‹
        </button>
        <button
          className="grid size-7 place-items-center rounded-md text-mist-300 transition hover:bg-ink-700 hover:text-mist-100"
          onClick={onNext}
          title="Next"
        >
          ›
        </button>
      </div>

      {/* Period title */}
      <button
        className="cursor-pointer rounded-md px-2 py-1 text-left text-sm font-semibold text-mist-100 transition hover:bg-ink-700"
        onClick={() => setShowMini((v) => !v)}
      >
        {formatPeriodTitle(currentDate, view)}
      </button>

      {/* Mini-calendar popup */}
      {showMini && (
        <MiniCalendar
          currentDate={currentDate}
          onSelect={(d) => {
            onDateChange(d);
            setShowMini(false);
          }}
          onClose={() => setShowMini(false)}
        />
      )}

      {/* View toggle */}
      <div className="ml-auto flex items-center rounded-lg border border-ink-600 bg-ink-800/80 p-0.5">
        {(["day", "week", "month"] as ViewType[]).map((v) => (
          <button
            key={v}
            className={`rounded-md px-3 py-1 text-xs font-medium transition ${
              view === v
                ? "bg-magenta text-ink-950 shadow-glow"
                : "text-mist-400 hover:text-mist-100"
            }`}
            onClick={() => onViewChange(v)}
          >
            {v[0].toUpperCase() + v.slice(1)}
          </button>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Mini-calendar popup                                               */
/* ------------------------------------------------------------------ */

interface MiniCalendarProps {
  currentDate: Date;
  onSelect: (date: Date) => void;
  onClose: () => void;
}

function MiniCalendar({ currentDate, onSelect, onClose }: MiniCalendarProps) {
  const [monthCursor, setMonthCursor] = useState(() => new Date(currentDate));

  const days = getMonthGrid(monthCursor);
  const gridDays = days.slice(0, 35); // 5 weeks for mini cal
  const monthLabel = monthCursor.toLocaleDateString([], { month: "long", year: "numeric" });

  return (
    <div className="absolute right-0 top-12 z-50">
      <div
        className="tt-card flex flex-col gap-2 p-3"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Month nav */}
        <div className="flex items-center justify-between">
          <button
            className="grid size-6 place-items-center rounded text-mist-400 hover:text-mist-100"
            onClick={() => setMonthCursor((d) => new Date(d.getFullYear(), d.getMonth() - 1, 1))}
          >
            ‹
          </button>
          <span className="text-xs font-semibold text-mist-200">{monthLabel}</span>
          <button
            className="grid size-6 place-items-center rounded text-mist-400 hover:text-mist-100"
            onClick={() => setMonthCursor((d) => new Date(d.getFullYear(), d.getMonth() + 1, 1))}
          >
            ›
          </button>
        </div>

        {/* Day headers */}
        <div className="grid grid-cols-7 gap-0.5 text-center">
          {["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"].map((d) => (
            <span key={d} className="text-[10px] font-medium text-mist-400">
              {d}
            </span>
          ))}
        </div>

        {/* Day cells */}
        <div className="grid grid-cols-7 gap-0.5">
          {gridDays.map((d, i) => {
            const isTodayCell = dayIsToday(d);
            const isCurrentMonth = d.getMonth() === monthCursor.getMonth();
            const isSelected = d.toDateString() === currentDate.toDateString();
            return (
              <button
                key={i}
                className={`grid size-7 place-items-center rounded text-xs transition ${
                  !isCurrentMonth
                    ? "text-mist-600"
                    : isTodayCell
                      ? "text-magenta"
                      : isSelected
                        ? "bg-magenta text-ink-950 font-bold"
                        : "text-mist-200 hover:bg-ink-600"
                }`}
                onClick={() => onSelect(new Date(d.getFullYear(), d.getMonth(), d.getDate()))}
              >
                {d.getDate()}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
