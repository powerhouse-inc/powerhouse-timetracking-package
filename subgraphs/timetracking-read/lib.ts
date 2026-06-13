import type {
  ClientRow,
  ProjectRow,
  TimeEntryRow,
} from "../../processors/timetracking-read/schema.js";

/** A time entry enriched with denormalized project/client metadata. */
export interface EnrichedEntry {
  entryId: string;
  timesheetId: string;
  ownerAddress: string | null;
  entryLocalId: string;
  description: string;
  projectId: string | null;
  projectName: string | null;
  projectColor: string | null;
  clientId: string | null;
  clientName: string | null;
  startTime: string;
  endTime: string;
  durationSeconds: number;
  billable: boolean;
  tags: string[];
  day: string;
  week: string;
  month: string;
  year: number;
}

const MANAGERIAL_ROLES = new Set(["ADMIN", "MANAGER", "BILLING"]);

export function canSeeTeamReport(role: string | undefined): boolean {
  return role !== undefined && MANAGERIAL_ROLES.has(role);
}

/** Keep entries whose start falls within [from, to) (ISO strings; bounds optional). */
export function filterByRange(
  entries: TimeEntryRow[],
  from?: string | null,
  to?: string | null,
): TimeEntryRow[] {
  return entries.filter((e) => {
    if (from && e.startTime < from) return false;
    if (to && e.startTime >= to) return false;
    return true;
  });
}

export function enrichEntries(
  entries: TimeEntryRow[],
  projects: ProjectRow[],
  clients: ClientRow[],
): EnrichedEntry[] {
  const projectByLocalId = new Map(projects.map((p) => [p.localId, p]));
  const clientByLocalId = new Map(clients.map((c) => [c.localId, c]));
  return entries.map((e) => {
    const project = e.projectId ? projectByLocalId.get(e.projectId) : undefined;
    const client = project?.clientId
      ? clientByLocalId.get(project.clientId)
      : undefined;
    let tags: string[] = [];
    try {
      tags = JSON.parse(e.tags) as string[];
    } catch {
      tags = [];
    }
    return {
      entryId: e.entryId,
      timesheetId: e.timesheetId,
      ownerAddress: e.ownerAddress,
      entryLocalId: e.entryLocalId,
      description: e.description,
      projectId: e.projectId,
      projectName: project?.name ?? null,
      projectColor: project?.color ?? null,
      clientId: project?.clientId ?? null,
      clientName: client?.name ?? null,
      startTime: e.startTime,
      endTime: e.endTime,
      durationSeconds: e.durationSeconds,
      billable: e.billable,
      tags,
      day: e.day,
      week: e.week,
      month: e.month,
      year: e.year,
    };
  });
}

interface Bucket {
  durationSeconds: number;
  billableSeconds: number;
}

function addTo(map: Map<string, Bucket>, key: string, e: EnrichedEntry): void {
  const b = map.get(key) ?? { durationSeconds: 0, billableSeconds: 0 };
  b.durationSeconds += e.durationSeconds;
  if (e.billable) b.billableSeconds += e.durationSeconds;
  map.set(key, b);
}

export function summaryByDay(
  entries: EnrichedEntry[],
): { day: string; durationSeconds: number; billableSeconds: number }[] {
  const map = new Map<string, Bucket>();
  for (const e of entries) addTo(map, e.day, e);
  return [...map.entries()]
    .map(([day, b]) => ({ day, ...b }))
    .sort((a, b) => a.day.localeCompare(b.day));
}

export function summaryByProject(entries: EnrichedEntry[]): {
  projectId: string | null;
  projectName: string | null;
  color: string | null;
  durationSeconds: number;
  billableSeconds: number;
}[] {
  const map = new Map<string, Bucket>();
  const meta = new Map<
    string,
    {
      projectId: string | null;
      projectName: string | null;
      color: string | null;
    }
  >();
  for (const e of entries) {
    const key = e.projectId ?? "__none__";
    addTo(map, key, e);
    if (!meta.has(key)) {
      meta.set(key, {
        projectId: e.projectId,
        projectName: e.projectName,
        color: e.projectColor,
      });
    }
  }
  return [...map.entries()]
    .map(([key, b]) => ({ ...meta.get(key)!, ...b }))
    .sort((a, b) => b.durationSeconds - a.durationSeconds);
}

export function summaryByClient(entries: EnrichedEntry[]): {
  clientId: string | null;
  clientName: string | null;
  durationSeconds: number;
  billableSeconds: number;
}[] {
  const map = new Map<string, Bucket>();
  const meta = new Map<
    string,
    { clientId: string | null; clientName: string | null }
  >();
  for (const e of entries) {
    const key = e.clientId ?? "__none__";
    addTo(map, key, e);
    if (!meta.has(key)) {
      meta.set(key, { clientId: e.clientId, clientName: e.clientName });
    }
  }
  return [...map.entries()]
    .map(([key, b]) => ({ ...meta.get(key)!, ...b }))
    .sort((a, b) => b.durationSeconds - a.durationSeconds);
}

export function summaryByMember(
  entries: EnrichedEntry[],
  nameByAddress: Map<string, string>,
): {
  address: string | null;
  name: string | null;
  durationSeconds: number;
  billableSeconds: number;
}[] {
  const map = new Map<string, Bucket>();
  for (const e of entries) addTo(map, e.ownerAddress ?? "__none__", e);
  return [...map.entries()]
    .map(([key, b]) => ({
      address: key === "__none__" ? null : key,
      name: nameByAddress.get(key) ?? null,
      ...b,
    }))
    .sort((a, b) => b.durationSeconds - a.durationSeconds);
}
