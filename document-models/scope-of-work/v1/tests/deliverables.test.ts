import {
  addDeliverable,
  addKeyResult,
  addProject,
  addProjectDeliverable,
  editDeliverable,
  editKeyResult,
  isScopeOfWorkDocument,
  reducer,
  removeDeliverable,
  removeKeyResult,
  setDeliverableBudgetAnchorProject,
  setDeliverableProgress,
  utils,
} from "document-models/scope-of-work/v1";
import { describe, expect, it } from "vitest";

function findDeliverable(
  doc: ReturnType<typeof utils.createDocument>,
  id: string,
) {
  return doc.state.global.deliverables.find((d) => d.id === id);
}

describe("Deliverables operations", () => {
  it("adds deliverables with full and minimal inputs", () => {
    let doc = utils.createDocument();

    doc = reducer(
      doc,
      addDeliverable({
        id: "d1",
        owner: "owner-1",
        title: "Deliverable 1",
        code: "D1",
        description: "First deliverable",
        status: "TODO",
      }),
    );
    // minimal -> `||` fallbacks for owner(null)/title/code/description/status
    doc = reducer(doc, addDeliverable({ id: "d2" }));

    expect(isScopeOfWorkDocument(doc)).toBe(true);
    expect(doc.state.global.deliverables).toHaveLength(2);
    expect(findDeliverable(doc, "d1")).toMatchObject({
      owner: "owner-1",
      title: "Deliverable 1",
      code: "D1",
      description: "First deliverable",
      status: "TODO",
    });
    expect(findDeliverable(doc, "d2")).toMatchObject({
      owner: null,
      title: "",
      code: "",
      description: "",
      status: "DRAFT",
    });
  });

  it("edits a deliverable: provided values, null coercions, and omitted fallbacks", () => {
    let doc = utils.createDocument();
    doc = reducer(
      doc,
      addDeliverable({
        id: "d1",
        owner: "owner-1",
        title: "Title",
        code: "C",
        description: "Desc",
        status: "TODO",
      }),
    );

    // All provided with concrete values.
    const full = reducer(
      doc,
      editDeliverable({
        id: "d1",
        owner: "owner-2",
        icon: "icon.png",
        title: "New Title",
        code: "C2",
        description: "New Desc",
        status: "IN_PROGRESS",
      }),
    );
    expect(findDeliverable(full, "d1")).toMatchObject({
      owner: "owner-2",
      icon: "icon.png",
      title: "New Title",
      code: "C2",
      description: "New Desc",
      status: "IN_PROGRESS",
    });

    // Nulls provided -> `?? ""` coercion for title/code/description; status null keeps existing.
    const nulls = reducer(
      full,
      editDeliverable({
        id: "d1",
        title: null,
        code: null,
        description: null,
        status: null,
      }),
    );
    expect(findDeliverable(nulls, "d1")).toMatchObject({
      title: "",
      code: "",
      description: "",
      status: "IN_PROGRESS",
    });

    // Everything omitted -> keep existing values.
    const omitted = reducer(nulls, editDeliverable({ id: "d1" }));
    expect(findDeliverable(omitted, "d1")).toMatchObject({
      owner: "owner-2",
      icon: "icon.png",
      title: "",
      status: "IN_PROGRESS",
    });
  });

  it("returns errors for deliverable ops on missing deliverables", () => {
    const doc = utils.createDocument();

    expect(
      reducer(doc, editDeliverable({ id: "ghost" })).operations.global[0].error,
    ).toBe("Deliverable not found");
    expect(
      reducer(doc, removeDeliverable({ id: "ghost" })).operations.global[0]
        .error,
    ).toBe("Deliverable not found");
    expect(
      reducer(doc, setDeliverableProgress({ id: "ghost" })).operations.global[0]
        .error,
    ).toBe("Deliverable not found");
    expect(
      reducer(
        doc,
        addKeyResult({ id: "k", deliverableId: "ghost", title: "t" }),
      ).operations.global[0].error,
    ).toBe("Deliverable not found");
    expect(
      reducer(doc, removeKeyResult({ id: "k", deliverableId: "ghost" }))
        .operations.global[0].error,
    ).toBe("Deliverable not found");
    expect(
      reducer(doc, editKeyResult({ id: "k", deliverableId: "ghost" }))
        .operations.global[0].error,
    ).toBe("Deliverable not found");
    expect(
      reducer(
        doc,
        setDeliverableBudgetAnchorProject({ deliverableId: "ghost" }),
      ).operations.global[0].error,
    ).toBe("Deliverable not found");
  });

  describe("setDeliverableProgress union variants", () => {
    it("percentage progress below 100 keeps IN_PROGRESS", () => {
      let doc = utils.createDocument();
      doc = reducer(doc, addDeliverable({ id: "d1" }));

      doc = reducer(
        doc,
        setDeliverableProgress({ id: "d1", workProgress: { percentage: 40 } }),
      );

      const d = findDeliverable(doc, "d1");
      expect(d?.workProgress).toEqual({ value: 40 });
      expect(d?.status).toBe("IN_PROGRESS");
    });

    it("percentage progress at 100 becomes DELIVERED", () => {
      let doc = utils.createDocument();
      doc = reducer(doc, addDeliverable({ id: "d1" }));

      doc = reducer(
        doc,
        setDeliverableProgress({ id: "d1", workProgress: { percentage: 100 } }),
      );

      const d = findDeliverable(doc, "d1");
      expect(d?.workProgress).toEqual({ value: 100 });
      expect(d?.status).toBe("DELIVERED");
    });

    it("story point progress: partial stays IN_PROGRESS, full becomes DELIVERED", () => {
      let doc = utils.createDocument();
      doc = reducer(doc, addDeliverable({ id: "d1" }));

      const partial = reducer(
        doc,
        setDeliverableProgress({
          id: "d1",
          workProgress: { storyPoints: { total: 10, completed: 4 } },
        }),
      );
      expect(findDeliverable(partial, "d1")?.workProgress).toEqual({
        total: 10,
        completed: 4,
      });
      expect(findDeliverable(partial, "d1")?.status).toBe("IN_PROGRESS");

      const full = reducer(
        partial,
        setDeliverableProgress({
          id: "d1",
          workProgress: { storyPoints: { total: 10, completed: 10 } },
        }),
      );
      expect(findDeliverable(full, "d1")?.status).toBe("DELIVERED");
    });

    it("binary progress: false stays IN_PROGRESS, true becomes DELIVERED", () => {
      let doc = utils.createDocument();
      doc = reducer(doc, addDeliverable({ id: "d1" }));

      const notDone = reducer(
        doc,
        setDeliverableProgress({ id: "d1", workProgress: { done: false } }),
      );
      expect(findDeliverable(notDone, "d1")?.workProgress).toEqual({
        done: false,
      });
      expect(findDeliverable(notDone, "d1")?.status).toBe("IN_PROGRESS");

      const done = reducer(
        notDone,
        setDeliverableProgress({ id: "d1", workProgress: { done: true } }),
      );
      expect(findDeliverable(done, "d1")?.status).toBe("DELIVERED");
    });

    it("empty workProgress object and omitted workProgress fall back to existing", () => {
      let doc = utils.createDocument();
      doc = reducer(doc, addDeliverable({ id: "d1" }));

      // workProgress present but no variant field set -> falls back to existing (null)
      const emptyObj = reducer(
        doc,
        setDeliverableProgress({ id: "d1", workProgress: {} }),
      );
      expect(findDeliverable(emptyObj, "d1")?.workProgress).toBeNull();

      // workProgress omitted entirely -> falls back to existing
      const omitted = reducer(doc, setDeliverableProgress({ id: "d1" }));
      expect(findDeliverable(omitted, "d1")?.workProgress).toBeNull();
    });
  });

  it("manages key results with present and omitted optional fields", () => {
    let doc = utils.createDocument();
    doc = reducer(doc, addDeliverable({ id: "d1" }));

    // add with link, then add minimal (no link -> "" fallback)
    doc = reducer(
      doc,
      addKeyResult({
        id: "k1",
        deliverableId: "d1",
        title: "KR1",
        link: "https://kr1",
      }),
    );
    doc = reducer(
      doc,
      addKeyResult({ id: "k2", deliverableId: "d1", title: "KR2" }),
    );
    expect(findDeliverable(doc, "d1")?.keyResults).toHaveLength(2);
    expect(findDeliverable(doc, "d1")?.keyResults[1].link).toBe("");

    // edit with values
    const edited = reducer(
      doc,
      editKeyResult({
        id: "k1",
        deliverableId: "d1",
        title: "KR1 updated",
        link: "https://kr1-updated",
      }),
    );
    expect(findDeliverable(edited, "d1")?.keyResults[0]).toMatchObject({
      title: "KR1 updated",
      link: "https://kr1-updated",
    });

    // edit with omitted fields -> `|| keyResult?.x` fallbacks retain values
    const fallback = reducer(
      edited,
      editKeyResult({ id: "k1", deliverableId: "d1" }),
    );
    expect(fallback.state.global.deliverables[0].keyResults[0]).toMatchObject({
      title: "KR1 updated",
      link: "https://kr1-updated",
    });

    // remove a key result
    const removed = reducer(
      fallback,
      removeKeyResult({ id: "k1", deliverableId: "d1" }),
    );
    expect(findDeliverable(removed, "d1")?.keyResults.map((k) => k.id)).toEqual(
      ["k2"],
    );
  });

  it("sets a deliverable budget anchor and recalculates project budget", () => {
    let doc = utils.createDocument();
    doc = reducer(
      doc,
      addProject({ id: "p1", code: "P1", title: "Project 1", budget: 0 }),
    );
    doc = reducer(
      doc,
      addProjectDeliverable({
        projectId: "p1",
        deliverableId: "d1",
        title: "Deliverable",
      }),
    );

    doc = reducer(
      doc,
      setDeliverableBudgetAnchorProject({
        deliverableId: "d1",
        project: "p1",
        unit: "Hours",
        unitCost: 100,
        quantity: 10,
        margin: 20,
      }),
    );

    const anchor = findDeliverable(doc, "d1")?.budgetAnchor;
    expect(anchor).toMatchObject({
      unitCost: 100,
      quantity: 10,
      margin: 20,
    });
    // budget invariant: unitCost * quantity * (1 + margin/100) = 100*10*1.2 = 1200
    expect(doc.state.global.projects[0].budget).toBe(1200);
  });

  it("removes a deliverable and cleans it out of milestone and project sets", () => {
    let doc = utils.createDocument();
    doc = reducer(
      doc,
      addProject({ id: "p1", code: "P1", title: "Project 1" }),
    );
    doc = reducer(
      doc,
      addProjectDeliverable({
        projectId: "p1",
        deliverableId: "d1",
        title: "Deliverable",
      }),
    );
    expect(doc.state.global.projects[0].scope?.deliverables).toEqual(["d1"]);

    const removed = reducer(doc, removeDeliverable({ id: "d1" }));
    expect(removed.state.global.deliverables).toHaveLength(0);
    expect(removed.state.global.projects[0].scope?.deliverables).toEqual([]);
  });
});
