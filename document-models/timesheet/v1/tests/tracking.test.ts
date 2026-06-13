import {
  addEntry,
  deleteEntry,
  discardTimer,
  reducer,
  setOwner,
  startTimer,
  stopTimer,
  updateEntry,
  utils,
} from "document-models/timesheet/v1";
import { describe, expect, it } from "vitest";

const lastError = (doc: ReturnType<typeof utils.createDocument>) => {
  const ops = doc.operations.global;
  return ops[ops.length - 1].error;
};

describe("Timesheet tracking reducers", () => {
  it("runs a full tracking flow", () => {
    let doc = utils.createDocument();

    // 1. set owner
    doc = reducer(doc, setOwner({ ownerAddress: "0xabc" }));
    expect(doc.state.global.ownerAddress).toBe("0xabc");

    // 2. start a timer with a project, then stop it -> entry with projectId
    doc = reducer(
      doc,
      startTimer({
        id: "t1",
        description: "Coding",
        projectId: "p1",
        start: "2026-06-13T09:00:00.000Z",
        billable: true,
        tags: ["dev"],
      }),
    );
    expect(doc.state.global.running?.id).toBe("t1");
    doc = reducer(doc, stopTimer({ end: "2026-06-13T10:00:00.000Z" }));
    expect(doc.state.global.running).toBeNull();
    expect(doc.state.global.entries).toHaveLength(1);
    expect(doc.state.global.entries[0]).toMatchObject({
      id: "t1",
      projectId: "p1",
      end: "2026-06-13T10:00:00.000Z",
    });

    // 3. start a timer WITHOUT a project, then stop -> entry with projectId null
    doc = reducer(
      doc,
      startTimer({
        id: "t2",
        description: "Meeting",
        start: "2026-06-13T11:00:00.000Z",
        billable: false,
        tags: [],
      }),
    );
    doc = reducer(doc, stopTimer({ end: "2026-06-13T11:30:00.000Z" }));
    expect(doc.state.global.entries[1].projectId).toBeNull();

    // 4. manual add with project, and without project
    doc = reducer(
      doc,
      addEntry({
        id: "e1",
        description: "Review",
        projectId: "p2",
        start: "2026-06-13T12:00:00.000Z",
        end: "2026-06-13T12:45:00.000Z",
        billable: true,
        tags: ["x"],
      }),
    );
    doc = reducer(
      doc,
      addEntry({
        id: "e2",
        description: "Email",
        start: "2026-06-13T13:00:00.000Z",
        end: "2026-06-13T13:15:00.000Z",
        billable: false,
        tags: [],
      }),
    );
    expect(doc.state.global.entries).toHaveLength(4);
    expect(doc.state.global.entries[3].projectId).toBeNull();

    // 5. update only the description (start/end/projectId/billable/tags skipped)
    doc = reducer(doc, updateEntry({ id: "e1", description: "Code review" }));
    expect(doc.state.global.entries[2].description).toBe("Code review");
    expect(doc.state.global.entries[2].projectId).toBe("p2");

    // 6. update every field, including billable:false (falsy but valid)
    doc = reducer(
      doc,
      updateEntry({
        id: "e1",
        description: "Deep review",
        projectId: "p3",
        start: "2026-06-13T12:05:00.000Z",
        end: "2026-06-13T12:50:00.000Z",
        billable: false,
        tags: ["y"],
      }),
    );
    expect(doc.state.global.entries[2]).toMatchObject({
      description: "Deep review",
      projectId: "p3",
      start: "2026-06-13T12:05:00.000Z",
      end: "2026-06-13T12:50:00.000Z",
      billable: false,
      tags: ["y"],
    });

    // 6b. update without a description (only tags) -> description untouched
    doc = reducer(doc, updateEntry({ id: "e1", tags: ["z"] }));
    expect(doc.state.global.entries[2].tags).toEqual(["z"]);
    expect(doc.state.global.entries[2].description).toBe("Deep review");

    // 7. start then discard a timer
    doc = reducer(
      doc,
      startTimer({
        id: "t3",
        description: "Scratch",
        start: "2026-06-13T14:00:00.000Z",
        billable: true,
        tags: [],
      }),
    );
    expect(doc.state.global.running?.id).toBe("t3");
    doc = reducer(doc, discardTimer({}));
    expect(doc.state.global.running).toBeNull();

    // 8. delete an entry
    doc = reducer(doc, deleteEntry({ id: "e2" }));
    expect(doc.state.global.entries.find((e) => e.id === "e2")).toBeUndefined();
    expect(doc.state.global.entries).toHaveLength(3);
  });

  it("rejects starting a timer when one is already running", () => {
    let doc = utils.createDocument();
    doc = reducer(
      doc,
      startTimer({
        id: "t1",
        description: "A",
        start: "2026-06-13T09:00:00.000Z",
        billable: true,
        tags: [],
      }),
    );
    doc = reducer(
      doc,
      startTimer({
        id: "t2",
        description: "B",
        start: "2026-06-13T09:05:00.000Z",
        billable: true,
        tags: [],
      }),
    );
    expect(lastError(doc)).toBe("A timer is already running");
    expect(doc.state.global.running?.id).toBe("t1");
  });

  it("rejects stopping when no timer runs", () => {
    let doc = utils.createDocument();
    doc = reducer(doc, stopTimer({ end: "2026-06-13T10:00:00.000Z" }));
    expect(lastError(doc)).toBe("No timer is running");
  });

  it("rejects stopping with end before start", () => {
    let doc = utils.createDocument();
    doc = reducer(
      doc,
      startTimer({
        id: "t1",
        description: "A",
        start: "2026-06-13T10:00:00.000Z",
        billable: true,
        tags: [],
      }),
    );
    doc = reducer(doc, stopTimer({ end: "2026-06-13T09:00:00.000Z" }));
    expect(lastError(doc)).toBe("End must be after start");
    expect(doc.state.global.running?.id).toBe("t1");
    expect(doc.state.global.entries).toHaveLength(0);
  });

  it("rejects discarding when no timer runs", () => {
    let doc = utils.createDocument();
    doc = reducer(doc, discardTimer({}));
    expect(lastError(doc)).toBe("No timer is running");
  });

  it("rejects a duplicate entry id", () => {
    let doc = utils.createDocument();
    const base = {
      description: "A",
      start: "2026-06-13T09:00:00.000Z",
      end: "2026-06-13T09:30:00.000Z",
      billable: true,
      tags: [] as string[],
    };
    doc = reducer(doc, addEntry({ id: "e1", ...base }));
    doc = reducer(doc, addEntry({ id: "e1", ...base }));
    expect(lastError(doc)).toBe("Entry id already exists");
    expect(doc.state.global.entries).toHaveLength(1);
  });

  it("rejects a manual entry with end before start", () => {
    let doc = utils.createDocument();
    doc = reducer(
      doc,
      addEntry({
        id: "e1",
        description: "A",
        start: "2026-06-13T10:00:00.000Z",
        end: "2026-06-13T09:00:00.000Z",
        billable: true,
        tags: [],
      }),
    );
    expect(lastError(doc)).toBe("End must be after start");
    expect(doc.state.global.entries).toHaveLength(0);
  });

  it("rejects updating a missing entry", () => {
    let doc = utils.createDocument();
    doc = reducer(doc, updateEntry({ id: "nope", description: "x" }));
    expect(lastError(doc)).toBe("Entry not found");
  });

  it("rejects an update that makes end precede start", () => {
    let doc = utils.createDocument();
    doc = reducer(
      doc,
      addEntry({
        id: "e1",
        description: "A",
        start: "2026-06-13T09:00:00.000Z",
        end: "2026-06-13T10:00:00.000Z",
        billable: true,
        tags: [],
      }),
    );
    doc = reducer(
      doc,
      updateEntry({ id: "e1", end: "2026-06-13T08:00:00.000Z" }),
    );
    expect(lastError(doc)).toBe("End must be after start");
    expect(doc.state.global.entries[0].end).toBe("2026-06-13T10:00:00.000Z");
  });

  it("rejects deleting a missing entry", () => {
    let doc = utils.createDocument();
    doc = reducer(doc, deleteEntry({ id: "nope" }));
    expect(lastError(doc)).toBe("Entry not found");
  });
});
