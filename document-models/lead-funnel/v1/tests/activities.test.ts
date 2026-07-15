import { generateMock } from "document-model";
import {
  addActivity,
  AddActivityInputSchema,
  addLead,
  deleteActivity,
  DeleteActivityInputSchema,
  isLeadFunnelDocument,
  reducer,
  utils,
} from "document-models/lead-funnel/v1";
import { describe, expect, it } from "vitest";

const T0 = "2026-07-13T10:00:00.000Z";
const T1 = "2026-07-13T11:00:00.000Z";
const T2 = "2026-07-13T12:00:00.000Z";

function seed() {
  let doc = utils.createDocument();
  doc = reducer(doc, addLead({ id: "lead-1", name: "Ada", createdAt: T0 }));
  return doc;
}

describe("Activities operations", () => {
  it("logs an activity with a note and one without (note fallback)", () => {
    let doc = seed();
    doc = reducer(
      doc,
      addActivity({
        leadId: "lead-1",
        id: "act-1",
        type: "CALL",
        note: "Intro call",
        timestamp: T1,
      }),
    );
    doc = reducer(
      doc,
      addActivity({
        leadId: "lead-1",
        id: "act-2",
        type: "EMAIL",
        timestamp: T2,
      }),
    );

    const activities = doc.state.global.leads[0].activities;
    expect(activities).toHaveLength(2);
    expect(activities[0].note).toBe("Intro call");
    expect(activities[1].note).toBeNull();
    expect(doc.state.global.leads[0].updatedAt).toBe(T2); // last activity bumps updatedAt
  });

  it("rejects an activity on a missing lead", () => {
    let doc = seed();
    doc = reducer(
      doc,
      addActivity({
        leadId: "ghost",
        id: "act-1",
        type: "NOTE",
        timestamp: T1,
      }),
    );
    expect(doc.operations.global[1].error).toBe("Lead with id ghost not found");
  });

  it("rejects a duplicate activity id", () => {
    let doc = seed();
    doc = reducer(
      doc,
      addActivity({
        leadId: "lead-1",
        id: "act-1",
        type: "MEETING",
        timestamp: T1,
      }),
    );
    doc = reducer(
      doc,
      addActivity({
        leadId: "lead-1",
        id: "act-1",
        type: "NOTE",
        timestamp: T2,
      }),
    );
    expect(doc.operations.global[2].error).toBe(
      "Activity with id act-1 already exists",
    );
    expect(doc.state.global.leads[0].activities).toHaveLength(1);
  });

  it("deletes an activity", () => {
    let doc = seed();
    doc = reducer(
      doc,
      addActivity({
        leadId: "lead-1",
        id: "act-1",
        type: "CALL",
        timestamp: T1,
      }),
    );
    doc = reducer(
      doc,
      deleteActivity({ leadId: "lead-1", id: "act-1", timestamp: T2 }),
    );
    expect(doc.state.global.leads[0].activities).toHaveLength(0);
    expect(doc.state.global.leads[0].updatedAt).toBe(T2);
  });

  it("returns errors deleting from a missing lead or a missing activity", () => {
    let doc = seed();
    doc = reducer(
      doc,
      deleteActivity({ leadId: "ghost", id: "act-1", timestamp: T1 }),
    );
    doc = reducer(
      doc,
      deleteActivity({ leadId: "lead-1", id: "nope", timestamp: T1 }),
    );
    expect(doc.operations.global[1].error).toBe("Lead with id ghost not found");
    expect(doc.operations.global[2].error).toBe(
      "Activity with id nope not found",
    );
  });

  it("should handle addActivity operation", () => {
    const document = utils.createDocument();
    const input = generateMock(AddActivityInputSchema());

    const updatedDocument = reducer(document, addActivity(input));

    expect(isLeadFunnelDocument(updatedDocument)).toBe(true);
    expect(updatedDocument.operations.global).toHaveLength(1);
    expect(updatedDocument.operations.global[0].action.type).toBe(
      "ADD_ACTIVITY",
    );
    expect(updatedDocument.operations.global[0].action.input).toStrictEqual(
      input,
    );
    expect(updatedDocument.operations.global[0].index).toEqual(0);
  });

  it("should handle deleteActivity operation", () => {
    const document = utils.createDocument();
    const input = generateMock(DeleteActivityInputSchema());

    const updatedDocument = reducer(document, deleteActivity(input));

    expect(isLeadFunnelDocument(updatedDocument)).toBe(true);
    expect(updatedDocument.operations.global).toHaveLength(1);
    expect(updatedDocument.operations.global[0].action.type).toBe(
      "DELETE_ACTIVITY",
    );
    expect(updatedDocument.operations.global[0].action.input).toStrictEqual(
      input,
    );
    expect(updatedDocument.operations.global[0].index).toEqual(0);
  });
});
