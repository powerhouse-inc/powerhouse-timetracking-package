import { useTimesheetDocumentsInSelectedDrive } from "document-models/timesheet";
import { useTimetrackingWorkspaceDocumentsInSelectedDrive } from "document-models/timetracking-workspace";
import { useMemo, useState } from "react";
import { durationSeconds, formatDurationShort } from "../shared/time.js";
import { driveStyles } from "./styles.js";

type Section = "overview" | "members" | "projects" | "clients";

export default function Editor() {
  const workspaces = useTimetrackingWorkspaceDocumentsInSelectedDrive();
  const timesheets = useTimesheetDocumentsInSelectedDrive();
  const [section, setSection] = useState<Section>("overview");

  const workspace = workspaces?.[0]?.state.global;
  const sheets = timesheets ?? [];

  const allEntries = useMemo(
    () => sheets.flatMap((d) => d.state.global.entries),
    [sheets],
  );

  const totalSeconds = allEntries.reduce(
    (s, e) => s + durationSeconds(e.start, e.end),
    0,
  );
  const billableSeconds = allEntries.reduce(
    (s, e) => (e.billable ? s + durationSeconds(e.start, e.end) : s),
    0,
  );

  const projectName = (id: string | null | undefined) =>
    workspace?.projects.find((p) => p.id === id)?.name ?? "No project";
  const projectColor = (id: string | null | undefined) =>
    workspace?.projects.find((p) => p.id === id)?.color ?? "#6b7280";

  const byProject = useMemo(() => {
    const map = new Map<string, number>();
    for (const e of allEntries) {
      const key = e.projectId ?? "__none__";
      map.set(key, (map.get(key) ?? 0) + durationSeconds(e.start, e.end));
    }
    return [...map.entries()].sort((a, b) => b[1] - a[1]);
  }, [allEntries]);

  const byMember = useMemo(() => {
    const map = new Map<string, number>();
    for (const d of sheets) {
      const owner = d.state.global.ownerAddress ?? d.header.id;
      const total = d.state.global.entries.reduce(
        (s, e) => s + durationSeconds(e.start, e.end),
        0,
      );
      map.set(owner, (map.get(owner) ?? 0) + total);
    }
    return map;
  }, [sheets]);

  return (
    <div className="ttd">
      <style>{driveStyles}</style>
      <aside className="ttd__nav">
        <div className="ttd__brand">⏱ Timetracking</div>
        {(["overview", "members", "projects", "clients"] as Section[]).map(
          (s) => (
            <button
              key={s}
              type="button"
              className={`ttd__navlink ${section === s ? "is-on" : ""}`}
              onClick={() => setSection(s)}
            >
              {s[0].toUpperCase() + s.slice(1)}
            </button>
          ),
        )}
      </aside>

      <main className="ttd__main">
        {!workspace && (
          <div className="ttd__empty">
            No TimetrackingWorkspace in this drive yet. Create one to manage
            projects, clients, and members.
          </div>
        )}

        {section === "overview" && (
          <>
            <h1 className="ttd__h1">Team overview</h1>
            <div className="ttd__cards">
              <div className="ttd__card">
                <span className="ttd__card-label">Total tracked</span>
                <span className="ttd__card-value">
                  {formatDurationShort(totalSeconds)}
                </span>
              </div>
              <div className="ttd__card">
                <span className="ttd__card-label">Billable</span>
                <span className="ttd__card-value">
                  {formatDurationShort(billableSeconds)}
                </span>
              </div>
              <div className="ttd__card">
                <span className="ttd__card-label">Members tracking</span>
                <span className="ttd__card-value">{sheets.length}</span>
              </div>
            </div>

            <h2 className="ttd__h2">By project</h2>
            <div className="ttd__bars">
              {byProject.map(([id, secs]) => (
                <div key={id} className="ttd__bar">
                  <span className="ttd__bar-label">
                    <span
                      className="ttd__dot"
                      style={{
                        background:
                          id === "__none__" ? "#6b7280" : projectColor(id),
                      }}
                    />
                    {id === "__none__" ? "No project" : projectName(id)}
                  </span>
                  <span className="ttd__bar-track">
                    <span
                      className="ttd__bar-fill"
                      style={{
                        width: `${totalSeconds ? (secs / totalSeconds) * 100 : 0}%`,
                        background:
                          id === "__none__" ? "#6b7280" : projectColor(id),
                      }}
                    />
                  </span>
                  <span className="ttd__bar-val">
                    {formatDurationShort(secs)}
                  </span>
                </div>
              ))}
              {byProject.length === 0 && (
                <div className="ttd__empty">No time tracked yet.</div>
              )}
            </div>
          </>
        )}

        {section === "members" && (
          <>
            <h1 className="ttd__h1">Members</h1>
            <table className="ttd__table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Access</th>
                  <th>Status</th>
                  <th>Tracked</th>
                </tr>
              </thead>
              <tbody>
                {(workspace?.members ?? []).map((m) => (
                  <tr key={m.id}>
                    <td>{m.name}</td>
                    <td>{m.role}</td>
                    <td>{m.status}</td>
                    <td>
                      {formatDurationShort(
                        m.address ? (byMember.get(m.address) ?? 0) : 0,
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}

        {section === "projects" && (
          <>
            <h1 className="ttd__h1">Projects</h1>
            <table className="ttd__table">
              <thead>
                <tr>
                  <th>Project</th>
                  <th>Billable</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {(workspace?.projects ?? []).map((p) => (
                  <tr key={p.id}>
                    <td>
                      <span
                        className="ttd__dot"
                        style={{ background: p.color }}
                      />
                      {p.name}
                    </td>
                    <td>{p.billable ? "Billable" : "Non-billable"}</td>
                    <td>{p.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}

        {section === "clients" && (
          <>
            <h1 className="ttd__h1">Clients</h1>
            <table className="ttd__table">
              <thead>
                <tr>
                  <th>Client</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {(workspace?.clients ?? []).map((c) => (
                  <tr key={c.id}>
                    <td>{c.name}</td>
                    <td>{c.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}
      </main>
    </div>
  );
}
