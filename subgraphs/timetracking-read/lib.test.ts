import { describe, expect, it } from "vitest";
import type {
  ClientRow,
  ProjectRow,
  TimeEntryRow,
} from "../../processors/timetracking-read/schema.js";
import {
  canSeeTeamReport,
  enrichEntries,
  filterByRange,
  summaryByClient,
  summaryByDay,
  summaryByMember,
  summaryByProject,
} from "./lib.js";

const entry = (over: Partial<TimeEntryRow>): TimeEntryRow => ({
  entryId: "ts:e",
  timesheetId: "ts",
  driveId: "d",
  ownerAddress: "0xa",
  entryLocalId: "e",
  description: "x",
  projectId: "p1",
  startTime: "2026-06-08T09:00:00.000Z",
  endTime: "2026-06-08T10:00:00.000Z",
  durationSeconds: 3600,
  billable: true,
  tags: "[]",
  day: "2026-06-08",
  week: "2026-W24",
  month: "2026-06",
  year: 2026,
  ...over,
});

const projects: ProjectRow[] = [
  {
    projectId: "ws:p1",
    workspaceId: "ws",
    driveId: "d",
    localId: "p1",
    name: "Website",
    clientId: "c1",
    color: "#ff0080",
    billable: true,
    hourlyRate: null,
    status: "ACTIVE",
  },
];
const clients: ClientRow[] = [
  {
    clientId: "ws:c1",
    workspaceId: "ws",
    driveId: "d",
    localId: "c1",
    name: "Acme",
    status: "ACTIVE",
  },
];

describe("timetracking-read subgraph lib", () => {
  it("gates the team report by role", () => {
    expect(canSeeTeamReport("ADMIN")).toBe(true);
    expect(canSeeTeamReport("MANAGER")).toBe(true);
    expect(canSeeTeamReport("BILLING")).toBe(true);
    expect(canSeeTeamReport("MEMBER")).toBe(false);
    expect(canSeeTeamReport(undefined)).toBe(false);
  });

  it("filters by an [from, to) range", () => {
    const entries = [
      entry({ startTime: "2026-06-07T23:59:59.000Z" }),
      entry({ startTime: "2026-06-08T09:00:00.000Z" }),
      entry({ startTime: "2026-06-09T00:00:00.000Z" }),
    ];
    const out = filterByRange(
      entries,
      "2026-06-08T00:00:00.000Z",
      "2026-06-09T00:00:00.000Z",
    );
    expect(out).toHaveLength(1);
    // open-ended bounds keep everything
    expect(filterByRange(entries)).toHaveLength(3);
  });

  it("enriches entries with project and client names, parsing tags", () => {
    const [e] = enrichEntries(
      [entry({ tags: '["dev","urgent"]' })],
      projects,
      clients,
    );
    expect(e.projectName).toBe("Website");
    expect(e.projectColor).toBe("#ff0080");
    expect(e.clientId).toBe("c1");
    expect(e.clientName).toBe("Acme");
    expect(e.tags).toEqual(["dev", "urgent"]);
  });

  it("falls back gracefully for unknown project and bad tags JSON", () => {
    const [e] = enrichEntries(
      [entry({ projectId: "ghost", tags: "not-json" })],
      projects,
      clients,
    );
    expect(e.projectName).toBeNull();
    expect(e.clientName).toBeNull();
    expect(e.tags).toEqual([]);
  });

  it("aggregates by day, project, client, and member", () => {
    const enriched = enrichEntries(
      [
        entry({ day: "2026-06-08", durationSeconds: 3600, billable: true }),
        entry({ day: "2026-06-08", durationSeconds: 1800, billable: false }),
        entry({
          day: "2026-06-09",
          projectId: null,
          durationSeconds: 600,
          billable: true,
          ownerAddress: "0xb",
        }),
      ],
      projects,
      clients,
    );

    const byDay = summaryByDay(enriched);
    expect(byDay).toEqual([
      { day: "2026-06-08", durationSeconds: 5400, billableSeconds: 3600 },
      { day: "2026-06-09", durationSeconds: 600, billableSeconds: 600 },
    ]);

    const byProject = summaryByProject(enriched);
    expect(byProject[0]).toMatchObject({
      projectName: "Website",
      durationSeconds: 5400,
    });
    expect(byProject.find((p) => p.projectId === null)).toMatchObject({
      durationSeconds: 600,
    });

    const byClient = summaryByClient(enriched);
    expect(byClient[0]).toMatchObject({
      clientName: "Acme",
      durationSeconds: 5400,
    });

    const byMember = summaryByMember(
      enriched,
      new Map([
        ["0xa", "Frank"],
        ["0xb", "Lumen"],
      ]),
    );
    expect(byMember[0]).toMatchObject({
      address: "0xa",
      name: "Frank",
      durationSeconds: 5400,
    });
    expect(byMember[1]).toMatchObject({ address: "0xb", name: "Lumen" });
  });
});
