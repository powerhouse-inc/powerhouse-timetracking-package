import type { TimetrackingWorkspaceState } from "document-models/timetracking-workspace";
import { describe, expect, it } from "vitest";
import {
  isoWeek,
  projectClients,
  projectMembers,
  projectProjects,
  projectTimeEntries,
} from "./projections.js";

describe("timetracking-read projections", () => {
  it("projects time entries with duration and date buckets", () => {
    const rows = projectTimeEntries("ts-1", "drive-1", {
      ownerAddress: "0xabc",
      running: null,
      entries: [
        {
          id: "e1",
          description: "Coding",
          projectId: "p1",
          start: "2026-06-08T09:00:00.000Z",
          end: "2026-06-08T10:30:00.000Z",
          billable: true,
          tags: ["dev"],
        },
        {
          id: "e2",
          description: "Email",
          projectId: null,
          start: "2026-06-09T08:00:00.000Z",
          end: "2026-06-09T08:15:00.000Z",
          billable: false,
          tags: [],
        },
      ],
    });

    expect(rows).toHaveLength(2);
    expect(rows[0]).toMatchObject({
      entryId: "ts-1:e1",
      timesheetId: "ts-1",
      ownerAddress: "0xabc",
      projectId: "p1",
      durationSeconds: 5400,
      billable: true,
      day: "2026-06-08",
      month: "2026-06",
      year: 2026,
      tags: '["dev"]',
    });
    expect(rows[1]).toMatchObject({
      entryId: "ts-1:e2",
      projectId: null,
      durationSeconds: 900,
      tags: "[]",
    });
  });

  it("clamps negative durations to zero", () => {
    const rows = projectTimeEntries("ts-1", "drive-1", {
      ownerAddress: null,
      running: null,
      entries: [
        {
          id: "e1",
          description: "Bad",
          projectId: null,
          start: "2026-06-08T10:00:00.000Z",
          end: "2026-06-08T09:00:00.000Z",
          billable: false,
          tags: [],
        },
      ],
    });
    expect(rows[0].durationSeconds).toBe(0);
    expect(rows[0].ownerAddress).toBeNull();
  });

  it("computes ISO week labels", () => {
    expect(isoWeek("2026-06-08T00:00:00.000Z")).toBe("2026-W24");
    expect(isoWeek("2026-01-01T00:00:00.000Z")).toBe("2026-W01");
  });

  it("projects workspace members, projects, and clients", () => {
    const state: TimetrackingWorkspaceState = {
      name: "PH",
      members: [
        {
          id: "m1",
          address: "0xaaa",
          did: "did:key:z",
          name: "Frank",
          avatarUrl: "http://x/a.png",
          role: "ADMIN",
          status: "ACTIVE",
        },
        {
          id: "m2",
          address: null,
          did: null,
          name: "Lumen",
          avatarUrl: null,
          role: "MEMBER",
          status: "INVITED",
        },
      ],
      clients: [{ id: "c1", name: "Acme", status: "ACTIVE" }],
      projects: [
        {
          id: "p1",
          name: "Website",
          clientId: "c1",
          color: "#ff0080",
          billable: true,
          hourlyRate: null,
          status: "ACTIVE",
        },
      ],
    };

    const members = projectMembers("ws-1", "drive-1", state);
    expect(members[0]).toMatchObject({ memberId: "ws-1:m1", role: "ADMIN" });
    expect(members[1]).toMatchObject({ address: null, did: null });

    const projects = projectProjects("ws-1", "drive-1", state);
    expect(projects[0]).toMatchObject({
      projectId: "ws-1:p1",
      localId: "p1",
      clientId: "c1",
      hourlyRate: null,
      billable: true,
    });

    const clients = projectClients("ws-1", "drive-1", state);
    expect(clients[0]).toMatchObject({ clientId: "ws-1:c1", name: "Acme" });
  });
});
