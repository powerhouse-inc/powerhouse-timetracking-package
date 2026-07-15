/** Shared display formatters. */

/** Human date, e.g. "Jul 10, 2026". Accepts YYYY-MM-DD or full ISO. */
export function fmtDate(v?: string | null): string {
  if (!v) return "—";
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return v;
  // Pin to en-US so dates match the app's en-US money formatting rather than
  // splitting locales (e.g. "Jul 11, 2026" alongside "$3,000").
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

/** Value for a native <input type="date"> (needs YYYY-MM-DD). */
export function dateInputValue(v?: string | null): string {
  return v ? v.slice(0, 10) : "";
}

/** Pluralize a count with its noun: plural(1,"invoice") -> "1 invoice". */
export function plural(n: number, singular: string, pluralForm?: string): string {
  return `${n} ${n === 1 ? singular : (pluralForm ?? `${singular}s`)}`;
}
