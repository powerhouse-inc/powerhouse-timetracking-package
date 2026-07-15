import {
  addCoordinator,
  addDeliverable,
  addDeliverableInSet,
  addKeyResult,
  addMilestone,
  addMilestoneDeliverable,
  addProject,
  addProjectDeliverable,
  addRoadmap,
  editDeliverable,
  editDeliverablesSet,
  editKeyResult,
  editMilestone,
  editRoadmap,
  reducer,
  removeCoordinator,
  removeDeliverable,
  removeDeliverableInSet,
  removeKeyResult,
  removeMilestone,
  removeMilestoneDeliverable,
  removeProjectDeliverable,
  setDeliverableBudgetAnchorProject,
  setDeliverableProgress,
  setProjectMargin,
  setProjectTotalBudget,
  utils,
} from "document-models/scope-of-work/v1";
import { describe, expect, it } from "vitest";

const d = (doc: ReturnType<typeof utils.createDocument>, id: string) =>
  doc.state.global.deliverables.find((x) => x.id === id);

describe("coverage: .map non-matching (false) branches", () => {
  it("roadmaps: editing one roadmap iterates past another", () => {
    let doc = reducer(
      utils.createDocument(),
      addRoadmap({ id: "r1", title: "R1" }),
    );
    doc = reducer(doc, addRoadmap({ id: "r2", title: "R2" }));

    doc = reducer(doc, editRoadmap({ id: "r2", title: "R2 updated" }));

    expect(doc.state.global.roadmaps[0].title).toBe("R1");
    expect(doc.state.global.roadmaps[1].title).toBe("R2 updated");
  });

  it("deliverables: key-result & budget-anchor ops iterate past another deliverable", () => {
    let doc = utils.createDocument();
    doc = reducer(doc, addDeliverable({ id: "d1" }));
    doc = reducer(doc, addDeliverable({ id: "d2" }));

    // addKeyResult with empty title -> `|| ""` right branch, and map skips d2
    doc = reducer(
      doc,
      addKeyResult({ id: "k1", deliverableId: "d1", title: "" }),
    );
    expect(d(doc, "d1")?.keyResults[0].title).toBe("");

    doc = reducer(
      doc,
      editKeyResult({ id: "k1", deliverableId: "d1", title: "T" }),
    );
    expect(d(doc, "d1")?.keyResults[0].title).toBe("T");

    doc = reducer(doc, removeKeyResult({ id: "k1", deliverableId: "d1" }));
    expect(d(doc, "d1")?.keyResults).toHaveLength(0);

    doc = reducer(
      doc,
      setDeliverableBudgetAnchorProject({ deliverableId: "d1", unitCost: 5 }),
    );
    expect(d(doc, "d1")?.budgetAnchor?.unitCost).toBe(5);
    // d2 untouched
    expect(d(doc, "d2")?.budgetAnchor?.unitCost).toBe(0);
  });

  it("milestones: coordinator/edit/remove ops iterate past other roadmaps & milestones", () => {
    let doc = reducer(
      utils.createDocument(),
      addRoadmap({ id: "r1", title: "R1" }),
    );
    doc = reducer(doc, addRoadmap({ id: "r2", title: "R2" }));
    doc = reducer(doc, addMilestone({ id: "m1", roadmapId: "r2" }));
    doc = reducer(doc, addMilestone({ id: "m2", roadmapId: "r2" }));

    doc = reducer(
      doc,
      editMilestone({ id: "m2", roadmapId: "r2", title: "M2" }),
    );
    expect(doc.state.global.roadmaps[1].milestones[1].title).toBe("M2");

    // add a coordinator, then remove it (both iterate past r1)
    doc = reducer(
      doc,
      addMilestoneDeliverable({
        milestoneId: "m2",
        deliverableId: "dd",
        title: "DD",
      }),
    );
    const mdoc = reducer(doc, removeMilestone({ id: "m1", roadmapId: "r2" }));
    expect(mdoc.state.global.roadmaps[1].milestones.map((m) => m.id)).toEqual([
      "m2",
    ]);

    const removed = reducer(
      doc,
      removeCoordinator({ id: "nobody", milestoneId: "m2" }),
    );
    expect(removed.state.global.roadmaps[1].milestones[1].coordinators).toEqual(
      [],
    );
  });

  it("deliverables-set: ops iterate past other roadmaps/projects/deliverables", () => {
    let doc = utils.createDocument();
    doc = reducer(doc, addRoadmap({ id: "r1", title: "R1" }));
    doc = reducer(doc, addRoadmap({ id: "r2", title: "R2" }));
    doc = reducer(doc, addMilestone({ id: "m2", roadmapId: "r2" }));
    doc = reducer(doc, addProject({ id: "p1", code: "P1", title: "P1" }));
    doc = reducer(doc, addProject({ id: "p2", code: "P2", title: "P2" }));
    doc = reducer(doc, addDeliverable({ id: "d1" }));
    doc = reducer(doc, addDeliverable({ id: "d2" }));

    // milestone set add/remove on r2/m2 iterates past r1
    doc = reducer(
      doc,
      addDeliverableInSet({ milestoneId: "m2", deliverableId: "d1" }),
    );
    expect(
      doc.state.global.roadmaps[1].milestones[0].scope?.deliverables,
    ).toEqual(["d1"]);
    doc = reducer(
      doc,
      removeDeliverableInSet({ milestoneId: "m2", deliverableId: "d1" }),
    );
    expect(
      doc.state.global.roadmaps[1].milestones[0].scope?.deliverables,
    ).toEqual([]);

    // project set add/remove on p2 iterates past p1, and the deliverables.map past d2
    doc = reducer(
      doc,
      addDeliverableInSet({ projectId: "p2", deliverableId: "d1" }),
    );
    expect(doc.state.global.projects[1].scope?.deliverables).toEqual(["d1"]);
    expect(d(doc, "d1")?.budgetAnchor?.project).toBe("p2");
    doc = reducer(
      doc,
      removeDeliverableInSet({ projectId: "p2", deliverableId: "d1" }),
    );
    expect(doc.state.global.projects[1].scope?.deliverables).toEqual([]);
  });

  it("deliverables-set: removeDeliverableInSet with neither id is a no-op", () => {
    const doc = utils.createDocument();
    const next = reducer(doc, removeDeliverableInSet({ deliverableId: "x" }));
    // No milestone/project branch taken; nothing changes, no error.
    expect(next.operations.global[0].error).toBeFalsy();
    expect(next.state.global.roadmaps).toHaveLength(0);
  });

  it("deliverables-set: editDeliverablesSet iterates past other roadmaps/projects", () => {
    let doc = utils.createDocument();
    doc = reducer(doc, addRoadmap({ id: "r1", title: "R1" }));
    doc = reducer(doc, addRoadmap({ id: "r2", title: "R2" }));
    doc = reducer(doc, addMilestone({ id: "m2", roadmapId: "r2" }));
    doc = reducer(doc, addProject({ id: "p1", code: "P1", title: "P1" }));
    doc = reducer(doc, addProject({ id: "p2", code: "P2", title: "P2" }));

    doc = reducer(
      doc,
      editDeliverablesSet({ milestoneId: "m2", status: "TODO" }),
    );
    expect(doc.state.global.roadmaps[1].milestones[0].scope?.status).toBe(
      "TODO",
    );

    doc = reducer(
      doc,
      editDeliverablesSet({ projectId: "p2", status: "TODO" }),
    );
    expect(doc.state.global.projects[1].scope?.status).toBe("TODO");
  });

  it("deliverables-set: addDeliverableInSet with BOTH ids is a no-op", () => {
    let doc = utils.createDocument();
    doc = reducer(doc, addRoadmap({ id: "r1", title: "R1" }));
    doc = reducer(doc, addMilestone({ id: "m1", roadmapId: "r1" }));
    doc = reducer(doc, addProject({ id: "p1", code: "P1", title: "P1" }));

    // Both milestoneId and projectId provided -> neither branch runs.
    const next = reducer(
      doc,
      addDeliverableInSet({
        milestoneId: "m1",
        projectId: "p1",
        deliverableId: "d1",
      }),
    );

    expect(
      next.operations.global[next.operations.global.length - 1].error,
    ).toBeFalsy();
    expect(
      next.state.global.roadmaps[0].milestones[0].scope?.deliverables,
    ).toEqual([]);
    expect(next.state.global.projects[0].scope?.deliverables).toEqual([]);
  });

  it("milestones: addCoordinator iterates past another roadmap", () => {
    let doc = utils.createDocument();
    doc = reducer(doc, addRoadmap({ id: "r1", title: "R1" }));
    doc = reducer(doc, addRoadmap({ id: "r2", title: "R2" }));
    doc = reducer(doc, addMilestone({ id: "m2", roadmapId: "r2" }));

    doc = reducer(doc, addCoordinator({ id: "c1", milestoneId: "m2" }));

    expect(doc.state.global.roadmaps[1].milestones[0].coordinators).toEqual([
      "c1",
    ]);
  });

  it("milestones: removeMilestoneDeliverable iterates past another deliverable", () => {
    let doc = utils.createDocument();
    doc = reducer(doc, addRoadmap({ id: "r1", title: "R1" }));
    doc = reducer(doc, addMilestone({ id: "m1", roadmapId: "r1" }));
    doc = reducer(
      doc,
      addMilestoneDeliverable({
        milestoneId: "m1",
        deliverableId: "d1",
        title: "D1",
      }),
    );
    doc = reducer(doc, addDeliverable({ id: "d2" }));

    const removed = reducer(
      doc,
      removeMilestoneDeliverable({ milestoneId: "m1", deliverableId: "d1" }),
    );

    expect(
      removed.state.global.roadmaps[0].milestones[0].scope?.deliverables,
    ).toEqual([]);
    // d2 remains untouched.
    expect(d(removed, "d2")).toBeDefined();
  });

  it("projects: calculateTotalCost runs over a zero-cost resolved deliverable", () => {
    let doc = utils.createDocument();
    doc = reducer(doc, addProject({ id: "p1", code: "P1", title: "P1" }));
    doc = reducer(
      doc,
      addProjectDeliverable({
        projectId: "p1",
        deliverableId: "d1",
        title: "D1",
      }),
    );

    // budget > 0 forces the margin invariant to divide by calculateTotalCost,
    // which reduces over d1 with unitCost/quantity 0 (the `|| 0` branches).
    const next = reducer(
      doc,
      setProjectTotalBudget({ projectId: "p1", totalBudget: 100 }),
    );

    expect(next.state.global.projects[0].budget).toBe(100);
  });
});

describe("coverage: remove deliverable that lives in a milestone scope", () => {
  it("cleans the deliverable out of the milestone scope", () => {
    let doc = utils.createDocument();
    doc = reducer(doc, addRoadmap({ id: "r1", title: "R1" }));
    doc = reducer(doc, addMilestone({ id: "m1", roadmapId: "r1" }));
    doc = reducer(
      doc,
      addMilestoneDeliverable({
        milestoneId: "m1",
        deliverableId: "d1",
        title: "D1",
      }),
    );

    const removed = reducer(doc, removeDeliverable({ id: "d1" }));

    expect(removed.state.global.deliverables).toHaveLength(0);
    expect(
      removed.state.global.roadmaps[0].milestones[0].scope?.deliverables,
    ).toEqual([]);
  });
});

describe("coverage: removeProjectDeliverable iterates past another deliverable", () => {
  it("resets only the removed deliverable's budget anchor", () => {
    let doc = utils.createDocument();
    doc = reducer(doc, addProject({ id: "p1", code: "P1", title: "P1" }));
    doc = reducer(
      doc,
      addProjectDeliverable({
        projectId: "p1",
        deliverableId: "d1",
        title: "D1",
      }),
    );
    doc = reducer(
      doc,
      addProjectDeliverable({
        projectId: "p1",
        deliverableId: "d2",
        title: "D2",
      }),
    );

    const removed = reducer(
      doc,
      removeProjectDeliverable({ projectId: "p1", deliverableId: "d1" }),
    );

    expect(d(removed, "d1")?.budgetAnchor?.project).toBe("");
    expect(d(removed, "d2")?.budgetAnchor?.project).toBe("p1");
  });
});

describe("coverage: budget/cost calculations with zero-cost & unresolved deliverables", () => {
  it("zero-cost deliverable yields zero budget and zero cost (0-fallback branches)", () => {
    let doc = utils.createDocument();
    doc = reducer(doc, addProject({ id: "p1", code: "P1", title: "P1" }));
    doc = reducer(
      doc,
      addProjectDeliverable({
        projectId: "p1",
        deliverableId: "d1",
        title: "D1",
      }),
    );

    // setProjectMargin -> budget invariant -> calculateTotalBudget over a
    // zero unitCost/quantity deliverable -> `|| 0` right branches, total 0.
    doc = reducer(doc, setProjectMargin({ projectId: "p1", margin: 10 }));
    expect(doc.state.global.projects[0].budget).toBe(0);

    // setProjectTotalBudget -> margin invariant -> calculateTotalCost over a
    // zero-cost deliverable -> total 0 -> the `=== 0` short-circuit branch.
    doc = reducer(
      doc,
      setProjectTotalBudget({ projectId: "p1", totalBudget: 0 }),
    );
    expect(doc.state.global.projects[0].budget).toBe(0);
  });

  it("margin invariant tolerates a scope id with no matching deliverable", () => {
    let doc = utils.createDocument();
    doc = reducer(doc, addProject({ id: "p1", code: "P1", title: "P1" }));
    // Add a phantom id to the scope without creating a deliverable.
    doc = reducer(
      doc,
      addDeliverableInSet({ projectId: "p1", deliverableId: "phantom" }),
    );
    expect(doc.state.global.projects[0].scope?.deliverables).toEqual([
      "phantom",
    ]);

    // margin invariant maps ids -> undefined; the `deliverable?.budgetAnchor`
    // guard must handle the undefined entry.
    const next = reducer(
      doc,
      setProjectTotalBudget({ projectId: "p1", totalBudget: 100 }),
    );
    expect(next.state.global.projects[0].budget).toBe(100);
  });
});

describe("coverage: binary progress when not in progress", () => {
  it("binary progress with a non-IN_PROGRESS status maps to done?100:0", () => {
    let doc = utils.createDocument();
    doc = reducer(doc, addProject({ id: "p1", code: "P1", title: "P1" }));
    doc = reducer(
      doc,
      addProjectDeliverable({
        projectId: "p1",
        deliverableId: "d1",
        title: "D1",
      }),
    );

    // binary done:false -> status forced IN_PROGRESS by the progress op
    doc = reducer(
      doc,
      setDeliverableProgress({ id: "d1", workProgress: { done: false } }),
    );
    // change status to TODO (not IN_PROGRESS) without touching workProgress;
    // editDeliverable triggers a progress recalculation.
    doc = reducer(doc, editDeliverable({ id: "d1", status: "TODO" }));

    // binary + status TODO + done false -> percentage equivalent 0
    expect(doc.state.global.projects[0].scope?.progress).toEqual({ value: 0 });
  });
});
