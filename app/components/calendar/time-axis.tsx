"use client";

import { HOUR_HEIGHT, formatTime24 } from "@/lib/calendar/time"

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
        const isTop = h === 0;
        const label = isTop ? "12 AM" : h < 12 ? `${h} AM` : h === 12 ? "12 PM" : `${h - 12} PM`;
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
