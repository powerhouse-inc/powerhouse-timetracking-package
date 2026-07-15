"use client";

import { formatDurationShort } from "@/lib/time";

export function BarChart({
  data,
}: {
  data: { label: string; seconds: number; billable: number }[];
}) {
  const max = Math.max(1, ...data.map((d) => d.seconds));
  return (
    // h-44 row; columns stretch (no items-end) so the bar track below has a
    // definite height for its percentage-height bar to resolve against.
    <div className="flex h-44 gap-2">
      {data.map((d, i) => {
        const h = (d.seconds / max) * 100;
        const bh = (d.billable / max) * 100;
        return (
          <div key={i} className="flex flex-1 flex-col items-center gap-2">
            {/* flex-1 gives the track a definite height inside the column */}
            <div className="relative flex w-full max-w-9 flex-1 items-end justify-center">
              <div
                className="w-full rounded-t-md bg-ink-600 transition-all"
                style={{ height: `${h}%` }}
                title={formatDurationShort(d.seconds)}
              >
                <div
                  className="w-full rounded-t-md bg-gradient-to-t from-magenta-deep to-magenta"
                  style={{ height: `${h ? (bh / h) * 100 : 0}%` }}
                />
              </div>
            </div>
            <span className="text-[11px] text-mist-400">{d.label}</span>
          </div>
        );
      })}
    </div>
  );
}

export function Donut({
  data,
  total,
}: {
  data: { label: string; seconds: number; color: string }[];
  total: number;
}) {
  const r = 52;
  const c = 2 * Math.PI * r;
  let offset = 0;
  const safeTotal = total || 1;
  return (
    <div className="flex items-center gap-6">
      <svg width="140" height="140" viewBox="0 0 140 140" className="-rotate-90">
        <circle cx="70" cy="70" r={r} fill="none" stroke="#2d2d38" strokeWidth="16" />
        {data.map((d, i) => {
          const frac = d.seconds / safeTotal;
          const dash = frac * c;
          const seg = (
            <circle
              key={i}
              cx="70"
              cy="70"
              r={r}
              fill="none"
              stroke={d.color}
              strokeWidth="16"
              strokeDasharray={`${dash} ${c - dash}`}
              strokeDashoffset={-offset}
            />
          );
          offset += dash;
          return seg;
        })}
      </svg>
      <div className="space-y-1.5">
        {data.slice(0, 6).map((d, i) => (
          <div key={i} className="flex items-center gap-2 text-sm">
            <span
              className="size-2.5 rounded-full"
              style={{ background: d.color }}
            />
            <span className="text-mist-300">{d.label}</span>
            <span className="ml-auto font-mono text-xs tabular-nums text-mist-400">
              {Math.round((d.seconds / safeTotal) * 100)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
