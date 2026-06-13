"use client";

import { timeToY } from "@/lib/calendar/time.js";

interface NowIndicatorProps {
  nowMs: number;
}

/** Pulsing red line marking the current time position. */
export function NowIndicator({ nowMs }: NowIndicatorProps) {
  const iso = new Date(nowMs).toISOString();
  const y = timeToY(iso);
  const timeLabel = new Date(nowMs).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div
      className="pointer-events-none absolute inset-x-0 z-20"
      style={{ top: y }}
    >
      <div className="flex items-center">
        {/* Live clock badge */}
        <div className="mr-2 flex-none rounded bg-magenta/90 px-1.5 py-px text-[10px] font-bold text-ink-950">
          {timeLabel}
        </div>
        {/* Pulsing line */}
        <div className="relative h-0.5 flex-1">
          <div
            className="absolute inset-0 bg-red-400/80"
            style={{
              animation: "pulse-line 2s ease-in-out infinite",
            }}
          />
        </div>
      </div>
    </div>
  );
}
