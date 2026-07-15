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
  /** how tracked hours were sourced: a real id link, a name fallback, or none */
  matchedBy: "id" | "name" | "none";
}

interface TrackedHours {
  byId: Map<string, number>;
  byName: Map<string, number>;
}

function trackedHours(
  timesheets: TimesheetDoc[],
  workspaceProjects: WorkspaceProject[],
): TrackedHours {
  const nameById = new Map(
    workspaceProjects.map((p) => [p.localId, p.name.toLowerCase()]),
  );
  const byId = new Map<string, number>();
  const byName = new Map<string, number>();
  for (const sheet of timesheets) {
    for (const e of sheet.entries) {
      if (!e.projectId) continue;
      const hours =
        (new Date(e.end).getTime() - new Date(e.start).getTime()) / 3_600_000;
      if (!Number.isFinite(hours) || hours <= 0) continue;
      byId.set(e.projectId, (byId.get(e.projectId) ?? 0) + hours);
      const name = nameById.get(e.projectId);
      if (name) byName.set(name, (byName.get(name) ?? 0) + hours);
    }
  }
  return { byId, byName };
}

/**
 * The flagship join: budgeted hours (from SoW deliverables anchored in Hours)
 * vs tracked hours (from timesheets). Prefers the explicit `workspaceProjectId`
 * link; falls back to matching by project name/code and flags when a SoW
 * project has no workspace counterpart at all.
 */
export function computeProjectHours(
  sow: ScopeOfWorkDoc,
  workspaceProjects: WorkspaceProject[],
  timesheets: TimesheetDoc[],
): ProjectHours[] {
  const tracked = trackedHours(timesheets, workspaceProjects);
  const wsIds = new Set(workspaceProjects.map((p) => p.localId));

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
    let trackedH = 0;
    let matchedBy: ProjectHours["matchedBy"] = "none";
    if (p.workspaceProjectId && wsIds.has(p.workspaceProjectId)) {
      trackedH = tracked.byId.get(p.workspaceProjectId) ?? 0;
      matchedBy = "id";
    } else {
      const key = [p.title.toLowerCase(), p.code.toLowerCase()].find((k) =>
        tracked.byName.has(k),
      );
      if (key) {
        trackedH = tracked.byName.get(key) ?? 0;
        matchedBy = "name";
      }
    }
    return {
      projectId: p.id,
      code: p.code,
      title: p.title,
      budgetedHours: budgetedByProject.get(p.id) ?? 0,
      trackedHours: trackedH,
      matchedBy,
    };
  });
}
