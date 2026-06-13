import type { TimeEntry } from "document-models/timesheet";
import type { Project } from "document-models/timetracking-workspace";
import {
  durationSeconds,
  formatDayHeading,
  formatDurationShort,
  formatTimeOfDay,
  localDayKey,
} from "../../shared/time.js";

export interface EntryPatch {
  description?: string;
  projectId?: string | null;
  billable?: boolean;
}

interface EntryListProps {
  entries: TimeEntry[];
  projects: Project[];
  onUpdate: (id: string, patch: EntryPatch) => void;
  onDelete: (id: string) => void;
}

export function EntryList({
  entries,
  projects,
  onUpdate,
  onDelete,
}: EntryListProps) {
  const projectById = new Map(projects.map((p) => [p.id, p]));

  // newest first, grouped by local day
  const sorted = [...entries].sort((a, b) => b.start.localeCompare(a.start));
  const days = new Map<string, TimeEntry[]>();
  for (const e of sorted) {
    const key = localDayKey(e.start);
    const list = days.get(key) ?? [];
    list.push(e);
    days.set(key, list);
  }

  if (entries.length === 0) {
    return (
      <div className="tt-empty">
        No entries yet — start the timer or add one manually.
      </div>
    );
  }

  return (
    <div className="tt-entrylist">
      {[...days.entries()].map(([day, dayEntries]) => {
        const dayTotal = dayEntries.reduce(
          (sum, e) => sum + durationSeconds(e.start, e.end),
          0,
        );
        return (
          <section key={day} className="tt-day">
            <header className="tt-day__head">
              <span>{formatDayHeading(day)}</span>
              <span className="tt-day__total">
                {formatDurationShort(dayTotal)}
              </span>
            </header>
            {dayEntries.map((e) => {
              const project = e.projectId
                ? projectById.get(e.projectId)
                : undefined;
              return (
                <div key={e.id} className="tt-entry">
                  <span
                    className="tt-entry__dot"
                    style={{ background: project?.color ?? "#6b7280" }}
                  />
                  <input
                    className="tt-entry__desc"
                    defaultValue={e.description}
                    onBlur={(ev) => {
                      const v = ev.target.value.trim();
                      if (v && v !== e.description)
                        onUpdate(e.id, { description: v });
                    }}
                  />
                  <select
                    className="tt-entry__project"
                    value={e.projectId ?? ""}
                    onChange={(ev) =>
                      onUpdate(e.id, { projectId: ev.target.value || null })
                    }
                  >
                    <option value="">No project</option>
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    className={`tt-entry__billable ${e.billable ? "is-on" : ""}`}
                    onClick={() => onUpdate(e.id, { billable: !e.billable })}
                    title="Billable"
                  >
                    $
                  </button>
                  <span className="tt-entry__range">
                    {formatTimeOfDay(e.start)} – {formatTimeOfDay(e.end)}
                  </span>
                  <span className="tt-entry__dur">
                    {formatDurationShort(durationSeconds(e.start, e.end))}
                  </span>
                  <button
                    type="button"
                    className="tt-entry__del"
                    onClick={() => onDelete(e.id)}
                    title="Delete entry"
                  >
                    ✕
                  </button>
                </div>
              );
            })}
          </section>
        );
      })}
    </div>
  );
}
