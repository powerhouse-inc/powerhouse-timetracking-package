/**
 * Relational read-model schema for the timetracking package.
 *
 * One namespaced database exists per drive, so every row here belongs to a
 * single drive. `driveId` is kept on each row for debugging/joins, but the
 * namespace is the real tenant boundary.
 *
 * Within a drive there is one TimetrackingWorkspace document; `localId`
 * columns hold the entity ids used as cross-references inside the documents
 * (e.g. a TimeEntry's `projectId` matches a project's `localId`).
 */

export interface TimeEntryRow {
  /** `${timesheetId}:${entryLocalId}` */
  entryId: string;
  timesheetId: string;
  driveId: string;
  ownerAddress: string | null;
  entryLocalId: string;
  description: string;
  /** local Project id referenced by the entry, or null */
  projectId: string | null;
  startTime: string;
  endTime: string;
  durationSeconds: number;
  billable: boolean;
  /** JSON-encoded string[] */
  tags: string;
  /** UTC YYYY-MM-DD of startTime */
  day: string;
  /** ISO week, UTC, YYYY-Www */
  week: string;
  /** UTC YYYY-MM of startTime */
  month: string;
  /** UTC full year of startTime */
  year: number;
}

export interface MemberRow {
  /** `${workspaceId}:${localId}` */
  memberId: string;
  workspaceId: string;
  driveId: string;
  localId: string;
  address: string | null;
  did: string | null;
  name: string;
  avatarUrl: string | null;
  role: string;
  status: string;
}

export interface ProjectRow {
  /** `${workspaceId}:${localId}` */
  projectId: string;
  workspaceId: string;
  driveId: string;
  localId: string;
  name: string;
  clientId: string | null;
  color: string;
  billable: boolean;
  hourlyRate: string | null;
  status: string;
}

export interface ClientRow {
  /** `${workspaceId}:${localId}` */
  clientId: string;
  workspaceId: string;
  driveId: string;
  localId: string;
  name: string;
  status: string;
}

export interface DB {
  tt_time_entries: TimeEntryRow;
  tt_members: MemberRow;
  tt_projects: ProjectRow;
  tt_clients: ClientRow;
}
