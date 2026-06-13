/* ------------------------------------------------------------------ */
/*  Calendar-specific time utilities                                   */
/* ------------------------------------------------------------------ */

import type { RawEntry } from "@/lib/api";

/* ----- slot / pixel math ----- */

/** Pixel height per hour in the calendar grid. */
export const HOUR_HEIGHT = 64;
/** Snap created/moved blocks to nearest N-minute slot. */
export const SNAP_MINUTES = 15;

/** Convert a time string to pixel offset from midnight. */
export function timeToY(iso: string): number {
  const d = new Date(iso);
  return (d.getHours() * 60 + d.getMinutes()) / 60 * HOUR_HEIGHT;
}

/** Convert pixel offset back to ISO time (snap to nearest slot). */
export function yToTime(y: number, baseDate: Date): string {
  const totalMin = Math.round(Math.max(0, y) / HOUR_HEIGHT * 60 / SNAP_MINUTES) * SNAP_MINUTES;
  const d = new Date(baseDate);
  d.setHours(0, 0, 0, 0);
  d.setMinutes(d.getMinutes() + Math.min(totalMin, 24 * 60));
  return d.toISOString();
}

/** Convert hour:minute to pixel offset. */
export function hourMinuteToY(hour: number, minute: number): number {
  return (hour * 60 + minute) / 60 * HOUR_HEIGHT;
}

/** Convert pixel offset to hour:minute. */
export function yToHourMinute(y: number): { hour: number; minute: number } {
  const totalMin = Math.max(0, y) / HOUR_HEIGHT * 60;
  return { hour: Math.floor(totalMin / 60), minute: Math.round(totalMin % 60) };
}

/* ----- week / month range helpers ----- */

/** Monday-based start of the week containing `ref`. */
export function startOfWeek(ref: Date = new Date()): Date {
  const d = new Date(ref);
  d.setHours(0, 0, 0, 0);
  const dow = (d.getDay() + 6) % 7; // Mon = 0
  d.setDate(d.getDate() - dow);
  return d;
}

export function addDays(d: Date, n: number): Date {
  const out = new Date(d);
  out.setDate(out.getDate() + n);
  return out;
}

export function getWeekRange(date: Date = new Date()): Date[] {
  const mon = startOfWeek(date);
  return Array.from({ length: 7 }, (_, i) => addDays(mon, i));
}

/** Days of the month grid. Starts from the Monday (or Sunday) before the 1st, fills 6 weeks (42 cells). */
export function getMonthGrid(date: Date = new Date()): Date[] {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const dow = (d.getDay() + 6) % 7; // Monday = 0
  const first = addDays(d, -dow);
  return Array.from({ length: 42 }, (_, i) => addDays(first, i));
}

/* ----- formatting ----- */

export function formatPeriodTitle(date: Date, view: "day" | "week" | "month"): string {
  const opts = { month: "short" as const, day: "numeric" as const };
  const yearOpts = { ...opts, year: "numeric" as const };
  const weekdayOpts = { weekday: "short" as const };

  switch (view) {
    case "day": {
      const wd = date.toLocaleDateString([], { weekday: "long" });
      const dt = date.toLocaleDateString([], { month: "long", day: "numeric" });
      return `${wd}, ${dt}`;
    }
    case "week": {
      const mon = startOfWeek(date);
      const sun = addDays(mon, 6);
      const m1 = mon.toLocaleDateString([], { month: "short" });
      const m2 = sun.toLocaleDateString([], { month: "short" });
      const sameYear = mon.getFullYear() === sun.getFullYear();
      return `${m1} ${mon.getDate()} – ${m2} ${sun.getDate()}${sameYear ? "" : ", " + sun.getFullYear()}`;
    }
    case "month": {
      return date.toLocaleDateString([], { month: "long", year: "numeric" });
    }
  }
}

/** "Mon", "Tue", … */
export function dayAbbrev(d: Date): string {
  return d.toLocaleDateString([], { weekday: "short" });
}

/** "Jun 15" */
export function dayShort(d: Date): string {
  return d.toLocaleDateString([], { month: "short", day: "numeric" });
}

/** "June 15" */
export function dayMedium(d: Date): string {
  return d.toLocaleDateString([], { month: "long", day: "numeric" });
}

export function dayIsToday(d: Date): boolean {
  const today = new Date();
  return d.getFullYear() === today.getFullYear() &&
         d.getMonth() === today.getMonth() &&
         d.getDate() === today.getDate();
}

/* ----- entry helpers ----- */

/** Group entries by day key, sorted by start time. */
export function entriesByDay(entries: RawEntry[]): Map<string, RawEntry[]> {
  const map = new Map<string, RawEntry[]>();
  for (const e of entries) {
    const key = localDayKey(e.start);
    (map.get(key) ?? map.set(key, []).get(key)!).push(e);
  }
  for (const list of map.values()) {
    list.sort((a, b) => a.start.localeCompare(b.start));
  }
  return map;
}

export function localDayKey(iso: string): string {
  const d = new Date(iso);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Duration in seconds between two ISO times. */
export function durationSeconds(start: string, end: string): number {
  return Math.max(0, Math.round((new Date(end).getTime() - new Date(start).getTime()) / 1000));
}

/** Format seconds to short string: "2h 30m", "45m", "30s". */
export function formatDurationShort(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  if (h === 0 && m === 0) return `${s}s`;
  if (h === 0) return `${m}m`;
  return `${h}h ${String(m).padStart(2, "0")}m`;
}

/** Format ISO to "9:00 AM" style. */
export function formatTimeOfDay(iso: string): string {
  return new Date(iso).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** Format ISO to "09:00" 24h style. */
export function formatTime24(iso: string): string {
  return new Date(iso).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

/* ----- working hours ----- */

/** Default working hours range. */
export const DEFAULT_WORK_START = 8; // 08:00
export const DEFAULT_WORK_END = 20;  // 20:00

export function getWorkingHoursRange(
  workStart: number = DEFAULT_WORK_START,
  workEnd: number = DEFAULT_WORK_END,
): { start: number; end: number; height: number } {
  const start = hourMinuteToY(workStart, 0);
  const end = hourMinuteToY(workEnd, 0);
  return { start, end, height: end - start };
}
