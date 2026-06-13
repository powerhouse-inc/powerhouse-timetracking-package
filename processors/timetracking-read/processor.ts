import {
  type IRelationalDb,
  type ProcessorFilter,
  RelationalDbProcessor,
} from "@powerhousedao/reactor-browser";
import {
  logger,
  type OperationWithContext,
  type PHDocument,
} from "document-model";
import * as TimesheetModel from "document-models/timesheet";
import * as WorkspaceModel from "document-models/timetracking-workspace";
import { up } from "./migrations.js";
import {
  projectClients,
  projectMembers,
  projectProjects,
  projectTimeEntries,
} from "./projections.js";
import type { DB } from "./schema.js";

const TIMESHEET_TYPE = "powerhouse/timesheet";
const WORKSPACE_TYPE = "powerhouse/timetracking-workspace";

type CacheEntry = { type: string; doc: PHDocument };

export class TimetrackingRead extends RelationalDbProcessor<DB> {
  private readonly driveId: string;
  private readonly cache = new Map<string, CacheEntry>();

  constructor(
    namespace: string,
    filter: ProcessorFilter,
    relationalDb: IRelationalDb<DB>,
    driveId = "",
  ) {
    super(namespace, filter, relationalDb);
    this.driveId = driveId;
  }

  static override getNamespace(driveId: string): string {
    // Suffix bumps the schema version: changing it forces a fresh, complete
    // re-index from the beginning of history (used when the projection shape
    // changes).
    return `${super.getNamespace(driveId)}_v1`;
  }

  override async initAndUpgrade(): Promise<void> {
    await up(this.relationalDb);
  }

  override async onOperations(
    operations: OperationWithContext[],
  ): Promise<void> {
    const touched = new Set<string>();

    for (const { operation, context } of operations) {
      if (context.scope !== "global") continue;
      const { documentId, documentType } = context;

      let entry = this.cache.get(documentId);
      if (!entry) {
        const doc = this.createInitialDoc(documentType);
        if (!doc) continue; // unknown document type
        entry = { type: documentType, doc };
        this.cache.set(documentId, entry);
      }

      try {
        const reduce =
          entry.type === TIMESHEET_TYPE
            ? TimesheetModel.reducer
            : WorkspaceModel.reducer;
        entry.doc = reduce(entry.doc as never, operation.action);
      } catch (err) {
        logger.warn(
          `[${this.namespace}] reducer failed for ${documentId}`,
          err,
        );
        continue;
      }
      touched.add(documentId);
    }

    for (const documentId of touched) {
      const entry = this.cache.get(documentId);
      if (!entry) continue;
      try {
        if (entry.type === TIMESHEET_TYPE) {
          await this.syncTimesheet(documentId, entry.doc);
        } else if (entry.type === WORKSPACE_TYPE) {
          await this.syncWorkspace(documentId, entry.doc);
        }
      } catch (err) {
        logger.error(
          `[${this.namespace}] projection failed for ${documentId}`,
          err,
        );
      }
    }
  }

  override onDisconnect(): Promise<void> {
    this.cache.clear();
    return Promise.resolve();
  }

  private createInitialDoc(documentType: string): PHDocument | null {
    if (documentType === TIMESHEET_TYPE) {
      return TimesheetModel.utils.createDocument();
    }
    if (documentType === WORKSPACE_TYPE) {
      return WorkspaceModel.utils.createDocument();
    }
    return null;
  }

  private async syncTimesheet(
    timesheetId: string,
    doc: PHDocument,
  ): Promise<void> {
    const state = (
      doc.state as unknown as { global: TimesheetModel.TimesheetState }
    ).global;
    const rows = projectTimeEntries(timesheetId, this.driveId, state);
    await this.relationalDb
      .deleteFrom("tt_time_entries")
      .where("timesheetId", "=", timesheetId)
      .execute();
    if (rows.length > 0) {
      await this.relationalDb
        .insertInto("tt_time_entries")
        .values(rows)
        .execute();
    }
  }

  private async syncWorkspace(
    workspaceId: string,
    doc: PHDocument,
  ): Promise<void> {
    const state = (
      doc.state as unknown as {
        global: WorkspaceModel.TimetrackingWorkspaceState;
      }
    ).global;

    await this.relationalDb
      .deleteFrom("tt_members")
      .where("workspaceId", "=", workspaceId)
      .execute();
    const members = projectMembers(workspaceId, this.driveId, state);
    if (members.length > 0) {
      await this.relationalDb
        .insertInto("tt_members")
        .values(members)
        .execute();
    }

    await this.relationalDb
      .deleteFrom("tt_projects")
      .where("workspaceId", "=", workspaceId)
      .execute();
    const projects = projectProjects(workspaceId, this.driveId, state);
    if (projects.length > 0) {
      await this.relationalDb
        .insertInto("tt_projects")
        .values(projects)
        .execute();
    }

    await this.relationalDb
      .deleteFrom("tt_clients")
      .where("workspaceId", "=", workspaceId)
      .execute();
    const clients = projectClients(workspaceId, this.driveId, state);
    if (clients.length > 0) {
      await this.relationalDb
        .insertInto("tt_clients")
        .values(clients)
        .execute();
    }
  }
}
