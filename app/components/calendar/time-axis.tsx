"use client";

import { HOUR_HEIGHT } from "@/lib/calendar/time"

interface TimeAxisProps {
  height: number;
}

/** Vertical time axis on the left side of the calendar grid. */
export function TimeAxis({ height }: TimeAxisProps) {
  const hours = Math.ceil(height / HOUR_HEIGHT);
  const ticks = Array.from({ length: hours }, (_, i) => i);

  return (
    <div
      className="relative flex-none border-r border-ink-600/40"
      style={{ width: 56, height }}
    >
      {ticks.map((h) => {
        const y = h * HOUR_HEIGHT;
        const label = `${String(h).padStart(2, "0")}:00`;
        return (
          <div
            key={h}
            className="absolute right-2 text-[10px] font-medium text-mist-500 tabular-nums"
            style={{ top: y - 6 }}
          >
            {label}
          </div>
        );
      })}
    </div>
  );
}
