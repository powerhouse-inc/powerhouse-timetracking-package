import type { TimesheetDoc } from "./api";
import type {
  DeliverableStatus,
  ScopeOfWorkDoc,
  SowStatus,
  WorkspaceProject,
} from "./types";

export const SOW_STATUS: { key: SowStatus; label: string; color: string }[] = [
  { key: "DRAFT", label: "Draft", color: "#6b7280" },
  { key: "SUBMITTED", label: "Submitted", color: "#3b82f6" },
  { key: "APPROVED", label: "Approved", color: "#06b6d4" },
  { key: "IN_PROGRESS", label: "In progress", color: "#a855f7" },
  { key: "DELIVERED", label: "Delivered", color: "#22c55e" },
  { key: "REJECTED", label: "Rejected", color: "#ef4444" },
  { key: "CANCELED", label: "Canceled", color: "#6b7280" },
];

export const DELIVERABLE_STATUS: {
  key: DeliverableStatus;
  label: string;
  color: string;
}[] = [
  { key: "DRAFT", label: "Draft", color: "#6b7280" },
  { key: "TODO", label: "To do", color: "#3b82f6" },
  { key: "IN_PROGRESS", label: "In progress", color: "#a855f7" },
  { key: "BLOCKED", label: "Blocked", color: "#ef4444" },
  { key: "DELIVERED", label: "Delivered", color: "#22c55e" },
  { key: "WONT_DO", label: "Won't do", color: "#6b7280" },
  { key: "CANCELED", label: "Canceled", color: "#6b7280" },
];

export function statusColor(
  list: { key: string; color: string }[],
  key: string,
): string {
  return list.find((s) => s.key === key)?.color ?? "#6b7280";
}

export interface ProjectHours {
  projectId: string;
  code: string;
  title: string;
  budgetedHours: number;
  trackedHours: number;
}

/** Tracked hours per workspace project name (lowercased), summed from all timesheets. */
function trackedHoursByProjectName(
  timesheets: TimesheetDoc[],
  workspaceProjects: WorkspaceProject[],
): Map<string, number> {
  const nameById = new Map(
    workspaceProjects.map((p) => [p.localId, p.name.toLowerCase()]),
  );
  const byName = new Map<string, number>();
  for (const sheet of timesheets) {
    for (const e of sheet.entries) {
      if (!e.projectId) continue;
      const name = nameById.get(e.projectId);
      if (!name) continue;
      const hours =
        (new Date(e.end).getTime() - new Date(e.start).getTime()) / 3_600_000;
      if (!Number.isFinite(hours) || hours <= 0) continue;
      byName.set(name, (byName.get(name) ?? 0) + hours);
    }
  }
  return byName;
}

/**
 * The flagship join: budgeted hours (from SoW deliverables anchored in Hours)
 * vs tracked hours (from timesheets). SoW projects are matched to workspace
 * projects by name/code, since the two live in separate documents.
 */
export function computeProjectHours(
  sow: ScopeOfWorkDoc,
  workspaceProjects: WorkspaceProject[],
  timesheets: TimesheetDoc[],
): ProjectHours[] {
  const tracked = trackedHoursByProjectName(timesheets, workspaceProjects);

  const budgetedByProject = new Map<string, number>();
  for (const d of sow.deliverables) {
    const a = d.budgetAnchor;
    if (!a || a.unit !== "Hours" || !a.project) continue;
    budgetedByProject.set(
      a.project,
      (budgetedByProject.get(a.project) ?? 0) + a.quantity,
    );
  }

  return sow.projects.map((p) => {
    const key = [p.title.toLowerCase(), p.code.toLowerCase()].find((k) =>
      tracked.has(k),
    );
    return {
      projectId: p.id,
      code: p.code,
      title: p.title,
      budgetedHours: budgetedByProject.get(p.id) ?? 0,
      trackedHours: key ? (tracked.get(key) ?? 0) : 0,
    };
  });
}
