import { generateMock } from "document-model";
import {
  addLead,
  AddLeadInputSchema,
  deleteLead,
  DeleteLeadInputSchema,
  isLeadFunnelDocument,
  moveLead,
  MoveLeadInputSchema,
  reducer,
  reorderLead,
  ReorderLeadInputSchema,
  updateLead,
  UpdateLeadInputSchema,
  utils,
} from "document-models/lead-funnel/v1";
import { describe, expect, it } from "vitest";

const T0 = "2026-07-13T10:00:00.000Z";
const T1 = "2026-07-13T11:00:00.000Z";

describe("Leads operations", () => {
  it("adds a fully-specified lead and a minimal lead (covers fallbacks)", () => {
    let doc = utils.createDocument();

    doc = reducer(
      doc,
      addLead({
        id: "lead-1",
        name: "Ada Lovelace",
        company: "Analytical Engines",
        email: "ada@example.com",
        phone: "+1 555 0100",
        source: "REFERRAL",
        priority: "HIGH",
        estimatedValue: 50000,
        owner: "sam",
        score: 0,
        tags: ["vip", "warm"],
        notes: "Met at conference",
        createdAt: T0,
      }),
    );

    // Minimal input exercises the || null / || "OTHER" / || "MEDIUM" / ?? 0 / || [] branches.
    doc = reducer(doc, addLead({ id: "lead-2", name: "Grace", createdAt: T0 }));

    const [full, minimal] = doc.state.global.leads;
    expect(full.company).toBe("Analytical Engines");
    expect(full.source).toBe("REFERRAL");
    expect(full.priority).toBe("HIGH");
    expect(full.estimatedValue).toBe(50000);
    expect(full.score).toBe(0); // ?? keeps falsy-but-valid 0
    expect(full.tags).toEqual(["vip", "warm"]);
    expect(full.stage).toBe("NEW");

    expect(minimal.company).toBeNull();
    expect(minimal.source).toBe("OTHER");
    expect(minimal.priority).toBe("MEDIUM");
    expect(minimal.estimatedValue).toBeNull();
    expect(minimal.owner).toBeNull();
    expect(minimal.notes).toBeNull();
    expect(minimal.score).toBe(0);
    expect(minimal.tags).toEqual([]);
    expect(minimal.stage).toBe("NEW");
  });

  it("rejects a duplicate lead id and does not mutate state", () => {
    let doc = utils.createDocument();
    doc = reducer(doc, addLead({ id: "lead-1", name: "Ada", createdAt: T0 }));
    doc = reducer(doc, addLead({ id: "lead-1", name: "Dup", createdAt: T0 }));

    expect(doc.operations.global[1].error).toBe(
      "Lead with id lead-1 already exists",
    );
    expect(doc.state.global.leads).toHaveLength(1);
    expect(doc.state.global.leads[0].name).toBe("Ada");
  });

  it("updates every editable field, then a no-op update (both branch sides)", () => {
    let doc = utils.createDocument();
    doc = reducer(doc, addLead({ id: "lead-1", name: "Ada", createdAt: T0 }));

    // Truthy side of every `if`.
    doc = reducer(
      doc,
      updateLead({
        id: "lead-1",
        name: "Ada L.",
        company: "AE Ltd",
        email: "ada@ae.com",
        phone: "555",
        source: "EVENT",
        priority: "LOW",
        estimatedValue: 999,
        owner: "kate",
        score: 42,
        notes: "hot",
        updatedAt: T1,
      }),
    );
    let lead = doc.state.global.leads[0];
    expect(lead.name).toBe("Ada L.");
    expect(lead.company).toBe("AE Ltd");
    expect(lead.source).toBe("EVENT");
    expect(lead.priority).toBe("LOW");
    expect(lead.estimatedValue).toBe(999);
    expect(lead.score).toBe(42);
    expect(lead.updatedAt).toBe(T1);

    // Falsy/absent side of every `if`; score omitted -> first condition false.
    doc = reducer(doc, updateLead({ id: "lead-1", updatedAt: T0 }));
    lead = doc.state.global.leads[0];
    expect(lead.name).toBe("Ada L."); // unchanged
    expect(lead.score).toBe(42); // unchanged
    expect(lead.updatedAt).toBe(T0);

    // score === 0 -> both conditions true (falsy-but-valid); then null -> right side false.
    doc = reducer(doc, updateLead({ id: "lead-1", score: 0, updatedAt: T1 }));
    expect(doc.state.global.leads[0].score).toBe(0);
    doc = reducer(
      doc,
      updateLead({ id: "lead-1", score: null, updatedAt: T1 }),
    );
    expect(doc.state.global.leads[0].score).toBe(0); // null skipped
  });

  it("returns LeadNotFoundError for update/move/reorder/delete on a missing lead", () => {
    let doc = utils.createDocument();
    doc = reducer(doc, updateLead({ id: "ghost", updatedAt: T0 }));
    doc = reducer(doc, moveLead({ id: "ghost", stage: "WON", updatedAt: T0 }));
    doc = reducer(doc, reorderLead({ id: "ghost", targetIndex: 0 }));
    doc = reducer(doc, deleteLead({ id: "ghost" }));

    expect(doc.operations.global[0].error).toBe("Lead with id ghost not found");
    expect(doc.operations.global[1].error).toBe("Lead with id ghost not found");
    expect(doc.operations.global[2].error).toBe("Lead with id ghost not found");
    expect(doc.operations.global[3].error).toBe("Lead with id ghost not found");
  });

  it("moves a lead between stages", () => {
    let doc = utils.createDocument();
    doc = reducer(doc, addLead({ id: "lead-1", name: "Ada", createdAt: T0 }));
    doc = reducer(
      doc,
      moveLead({ id: "lead-1", stage: "QUALIFIED", updatedAt: T1 }),
    );
    expect(doc.state.global.leads[0].stage).toBe("QUALIFIED");
    expect(doc.state.global.leads[0].updatedAt).toBe(T1);
  });

  it("reorders leads within the board, clamping out-of-range targets", () => {
    let doc = utils.createDocument();
    for (const id of ["a", "b", "c"]) {
      doc = reducer(doc, addLead({ id, name: id, createdAt: T0 }));
    }
    // Move "a" to the end (target beyond length -> Math.min clamps to length).
    doc = reducer(doc, reorderLead({ id: "a", targetIndex: 99 }));
    expect(doc.state.global.leads.map((l) => l.id)).toEqual(["b", "c", "a"]);

    // Move "a" to the front (negative target -> Math.max clamps to 0).
    doc = reducer(doc, reorderLead({ id: "a", targetIndex: -5 }));
    expect(doc.state.global.leads.map((l) => l.id)).toEqual(["a", "b", "c"]);
  });

  it("deletes a lead", () => {
    let doc = utils.createDocument();
    doc = reducer(doc, addLead({ id: "lead-1", name: "Ada", createdAt: T0 }));
    doc = reducer(doc, deleteLead({ id: "lead-1" }));
    expect(doc.state.global.leads).toHaveLength(0);
  });

  it("should handle addLead operation", () => {
    const document = utils.createDocument();
    const input = generateMock(AddLeadInputSchema());

    const updatedDocument = reducer(document, addLead(input));

    expect(isLeadFunnelDocument(updatedDocument)).toBe(true);
    expect(updatedDocument.operations.global).toHaveLength(1);
    expect(updatedDocument.operations.global[0].action.type).toBe("ADD_LEAD");
    expect(updatedDocument.operations.global[0].action.input).toStrictEqual(
      input,
    );
    expect(updatedDocument.operations.global[0].index).toEqual(0);
  });

  it("should handle updateLead operation", () => {
    const document = utils.createDocument();
    const input = generateMock(UpdateLeadInputSchema());

    const updatedDocument = reducer(document, updateLead(input));

    expect(isLeadFunnelDocument(updatedDocument)).toBe(true);
    expect(updatedDocument.operations.global).toHaveLength(1);
    expect(updatedDocument.operations.global[0].action.type).toBe(
      "UPDATE_LEAD",
    );
    expect(updatedDocument.operations.global[0].action.input).toStrictEqual(
      input,
    );
    expect(updatedDocument.operations.global[0].index).toEqual(0);
  });

  it("should handle moveLead operation", () => {
    const document = utils.createDocument();
    const input = generateMock(MoveLeadInputSchema());

    const updatedDocument = reducer(document, moveLead(input));

    expect(isLeadFunnelDocument(updatedDocument)).toBe(true);
    expect(updatedDocument.operations.global).toHaveLength(1);
    expect(updatedDocument.operations.global[0].action.type).toBe("MOVE_LEAD");
    expect(updatedDocument.operations.global[0].action.input).toStrictEqual(
      input,
    );
    expect(updatedDocument.operations.global[0].index).toEqual(0);
  });

  it("should handle reorderLead operation", () => {
    const document = utils.createDocument();
    const input = generateMock(ReorderLeadInputSchema());

    const updatedDocument = reducer(document, reorderLead(input));

    expect(isLeadFunnelDocument(updatedDocument)).toBe(true);
    expect(updatedDocument.operations.global).toHaveLength(1);
    expect(updatedDocument.operations.global[0].action.type).toBe(
      "REORDER_LEAD",
    );
    expect(updatedDocument.operations.global[0].action.input).toStrictEqual(
      input,
    );
    expect(updatedDocument.operations.global[0].index).toEqual(0);
  });

  it("should handle deleteLead operation", () => {
    const document = utils.createDocument();
    const input = generateMock(DeleteLeadInputSchema());

    const updatedDocument = reducer(document, deleteLead(input));

    expect(isLeadFunnelDocument(updatedDocument)).toBe(true);
    expect(updatedDocument.operations.global).toHaveLength(1);
    expect(updatedDocument.operations.global[0].action.type).toBe(
      "DELETE_LEAD",
    );
    expect(updatedDocument.operations.global[0].action.input).toStrictEqual(
      input,
    );
    expect(updatedDocument.operations.global[0].index).toEqual(0);
  });
});
