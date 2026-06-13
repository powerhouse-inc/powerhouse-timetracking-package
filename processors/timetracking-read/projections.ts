import type { TimesheetState } from "document-models/timesheet";
import type { TimetrackingWorkspaceState as WorkspaceState } from "document-models/timetracking-workspace";
import type {
  ClientRow,
  MemberRow,
  ProjectRow,
  TimeEntryRow,
} from "./schema.js";

/** ISO-8601 week label (UTC), e.g. "2026-W24". */
export function isoWeek(iso: string): string {
  const src = new Date(iso);
  const date = new Date(
    Date.UTC(src.getUTCFullYear(), src.getUTCMonth(), src.getUTCDate()),
  );
  const dayNum = (date.getUTCDay() + 6) % 7; // Mon = 0
  date.setUTCDate(date.getUTCDate() - dayNum + 3); // Thursday of this week
  const firstThursday = new Date(Date.UTC(date.getUTCFullYear(), 0, 4));
  const firstDayNum = (firstThursday.getUTCDay() + 6) % 7;
  firstThursday.setUTCDate(firstThursday.getUTCDate() - firstDayNum + 3);
  const week =
    1 +
    Math.round((date.getTime() - firstThursday.getTime()) / (7 * 86_400_000));
  return `${date.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
}

function durationSeconds(start: string, end: string): number {
  const ms = new Date(end).getTime() - new Date(start).getTime();
  return Math.max(0, Math.round(ms / 1000));
}

export function projectTimeEntries(
  timesheetId: string,
  driveId: string,
  state: TimesheetState,
): TimeEntryRow[] {
  const owner = state.ownerAddress ?? null;
  return state.entries.map((e) => {
    const iso = e.start;
    return {
      entryId: `${timesheetId}:${e.id}`,
      timesheetId,
      driveId,
      ownerAddress: owner,
      entryLocalId: e.id,
      description: e.description,
      projectId: e.projectId ?? null,
      startTime: e.start,
      endTime: e.end,
      durationSeconds: durationSeconds(e.start, e.end),
      billable: e.billable,
      tags: JSON.stringify(e.tags),
      day: iso.slice(0, 10),
      week: isoWeek(iso),
      month: iso.slice(0, 7),
      year: new Date(iso).getUTCFullYear(),
    };
  });
}

export function projectMembers(
  workspaceId: string,
  driveId: string,
  state: WorkspaceState,
): MemberRow[] {
  return state.members.map((m) => ({
    memberId: `${workspaceId}:${m.id}`,
    workspaceId,
    driveId,
    localId: m.id,
    address: m.address ?? null,
    did: m.did ?? null,
    name: m.name,
    avatarUrl: m.avatarUrl ?? null,
    role: m.role,
    status: m.status,
  }));
}

export function projectProjects(
  workspaceId: string,
  driveId: string,
  state: WorkspaceState,
): ProjectRow[] {
  return state.projects.map((p) => ({
    projectId: `${workspaceId}:${p.id}`,
    workspaceId,
    driveId,
    localId: p.id,
    name: p.name,
    clientId: p.clientId ?? null,
    color: p.color,
    billable: p.billable,
    hourlyRate: p.hourlyRate == null ? null : String(p.hourlyRate),
    status: p.status,
  }));
}

export function projectClients(
  workspaceId: string,
  driveId: string,
  state: WorkspaceState,
): ClientRow[] {
  return state.clients.map((c) => ({
    clientId: `${workspaceId}:${c.id}`,
    workspaceId,
    driveId,
    localId: c.id,
    name: c.name,
    status: c.status,
  }));
}
