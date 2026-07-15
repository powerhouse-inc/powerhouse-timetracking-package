import { generateMock } from "document-model";
import {
  addLead,
  addTag,
  AddTagInputSchema,
  isLeadFunnelDocument,
  reducer,
  removeTag,
  RemoveTagInputSchema,
  utils,
} from "document-models/lead-funnel/v1";
import { describe, expect, it } from "vitest";

const T0 = "2026-07-13T10:00:00.000Z";

function seed() {
  let doc = utils.createDocument();
  doc = reducer(doc, addLead({ id: "lead-1", name: "Ada", createdAt: T0 }));
  return doc;
}

describe("Tags operations", () => {
  it("adds and removes tags", () => {
    let doc = seed();
    doc = reducer(doc, addTag({ leadId: "lead-1", tag: "vip" }));
    doc = reducer(doc, addTag({ leadId: "lead-1", tag: "warm" }));
    expect(doc.state.global.leads[0].tags).toEqual(["vip", "warm"]);

    doc = reducer(doc, removeTag({ leadId: "lead-1", tag: "vip" }));
    expect(doc.state.global.leads[0].tags).toEqual(["warm"]);
  });

  it("rejects tag operations on a missing lead", () => {
    let doc = seed();
    doc = reducer(doc, addTag({ leadId: "ghost", tag: "vip" }));
    doc = reducer(doc, removeTag({ leadId: "ghost", tag: "vip" }));
    expect(doc.operations.global[1].error).toBe("Lead with id ghost not found");
    expect(doc.operations.global[2].error).toBe("Lead with id ghost not found");
  });

  it("rejects a duplicate tag", () => {
    let doc = seed();
    doc = reducer(doc, addTag({ leadId: "lead-1", tag: "vip" }));
    doc = reducer(doc, addTag({ leadId: "lead-1", tag: "vip" }));
    expect(doc.operations.global[2].error).toBe(
      "Tag vip already exists on this lead",
    );
    expect(doc.state.global.leads[0].tags).toEqual(["vip"]);
  });

  it("rejects removing a tag that is not present", () => {
    let doc = seed();
    doc = reducer(doc, removeTag({ leadId: "lead-1", tag: "ghost-tag" }));
    expect(doc.operations.global[1].error).toBe(
      "Tag ghost-tag not found on this lead",
    );
  });

  it("should handle addTag operation", () => {
    const document = utils.createDocument();
    const input = generateMock(AddTagInputSchema());

    const updatedDocument = reducer(document, addTag(input));

    expect(isLeadFunnelDocument(updatedDocument)).toBe(true);
    expect(updatedDocument.operations.global).toHaveLength(1);
    expect(updatedDocument.operations.global[0].action.type).toBe("ADD_TAG");
    expect(updatedDocument.operations.global[0].action.input).toStrictEqual(
      input,
    );
    expect(updatedDocument.operations.global[0].index).toEqual(0);
  });

  it("should handle removeTag operation", () => {
    const document = utils.createDocument();
    const input = generateMock(RemoveTagInputSchema());

    const updatedDocument = reducer(document, removeTag(input));

    expect(isLeadFunnelDocument(updatedDocument)).toBe(true);
    expect(updatedDocument.operations.global).toHaveLength(1);
    expect(updatedDocument.operations.global[0].action.type).toBe("REMOVE_TAG");
    expect(updatedDocument.operations.global[0].action.input).toStrictEqual(
      input,
    );
    expect(updatedDocument.operations.global[0].index).toEqual(0);
  });
});
