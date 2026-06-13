import type { IRelationalDb } from "@powerhousedao/reactor-browser";

export async function up(db: IRelationalDb<any>): Promise<void> {
  await db.schema
    .createTable("tt_time_entries")
    .addColumn("entryId", "text")
    .addColumn("timesheetId", "text")
    .addColumn("driveId", "text")
    .addColumn("ownerAddress", "text")
    .addColumn("entryLocalId", "text")
    .addColumn("description", "text")
    .addColumn("projectId", "text")
    .addColumn("startTime", "text")
    .addColumn("endTime", "text")
    .addColumn("durationSeconds", "integer")
    .addColumn("billable", "boolean")
    .addColumn("tags", "text")
    .addColumn("day", "text")
    .addColumn("week", "text")
    .addColumn("month", "text")
    .addColumn("year", "integer")
    .addPrimaryKeyConstraint("tt_time_entries_pkey", ["entryId"])
    .ifNotExists()
    .execute();

  await db.schema
    .createTable("tt_members")
    .addColumn("memberId", "text")
    .addColumn("workspaceId", "text")
    .addColumn("driveId", "text")
    .addColumn("localId", "text")
    .addColumn("address", "text")
    .addColumn("did", "text")
    .addColumn("name", "text")
    .addColumn("avatarUrl", "text")
    .addColumn("role", "text")
    .addColumn("status", "text")
    .addPrimaryKeyConstraint("tt_members_pkey", ["memberId"])
    .ifNotExists()
    .execute();

  await db.schema
    .createTable("tt_projects")
    .addColumn("projectId", "text")
    .addColumn("workspaceId", "text")
    .addColumn("driveId", "text")
    .addColumn("localId", "text")
    .addColumn("name", "text")
    .addColumn("clientId", "text")
    .addColumn("color", "text")
    .addColumn("billable", "boolean")
    .addColumn("hourlyRate", "text")
    .addColumn("status", "text")
    .addPrimaryKeyConstraint("tt_projects_pkey", ["projectId"])
    .ifNotExists()
    .execute();

  await db.schema
    .createTable("tt_clients")
    .addColumn("clientId", "text")
    .addColumn("workspaceId", "text")
    .addColumn("driveId", "text")
    .addColumn("localId", "text")
    .addColumn("name", "text")
    .addColumn("status", "text")
    .addPrimaryKeyConstraint("tt_clients_pkey", ["clientId"])
    .ifNotExists()
    .execute();
}

export async function down(db: IRelationalDb<any>): Promise<void> {
  await db.schema.dropTable("tt_time_entries").ifExists().execute();
  await db.schema.dropTable("tt_members").ifExists().execute();
  await db.schema.dropTable("tt_projects").ifExists().execute();
  await db.schema.dropTable("tt_clients").ifExists().execute();
}
