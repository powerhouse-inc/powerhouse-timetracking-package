/**
 * These tests cover the reducers' defensive guards for NULLABLE state fields
 * (`Milestone.scope`, `Project.scope`, `Deliverable.budgetAnchor`,
 * `BudgetAnchorProject.unit`, binary `Progress.done`).
 *
 * Those fields are nullable in schema.graphql, so externally-loaded documents
 * can legitimately arrive with them null/absent even though the operation
 * reducers always populate them. We reproduce that shape by seeding a document
 * with `createState(...)` and then exercising each guard.
 */
import {
  addDeliverableInSet,
  addMilestoneDeliverable,
  addProjectDeliverable,
  createState,
  editDeliverablesSet,
  reducer,
  removeDeliverableInSet,
  removeMilestone,
  removeMilestoneDeliverable,
  removeProject,
  removeProjectDeliverable,
  removeRoadmap,
  setDeliverableProgress,
  setProjectMargin,
  utils,
} from "document-models/scope-of-work/v1";
import type {
  BudgetAnchorProject,
  Deliverable,
  DeliverablesSet,
  Milestone,
  Progress,
  Project,
  Roadmap,
  ScopeOfWorkGlobalState,
} from "document-models/scope-of-work/v1";
import { describe, expect, it } from "vitest";

function anchor(over: Partial<BudgetAnchorProject> = {}): BudgetAnchorProject {
  return {
    project: "",
    unit: "Hours",
    unitCost: 0,
    quantity: 0,
    margin: 0,
    ...over,
  };
}
function mkSet(over: Partial<DeliverablesSet> = {}): DeliverablesSet {
  return {
    deliverables: [],
    status: "DRAFT",
    progress: { value: 0 },
    deliverablesCompleted: { total: 0, completed: 0 },
    ...over,
  };
}
function mkDeliverable(
  id: string,
  over: Partial<Deliverable> = {},
): Deliverable {
  return {
    id,
    owner: null,
    icon: null,
    title: "",
    code: "",
    description: "",
    status: "DRAFT",
    workProgress: null,
    keyResults: [],
    budgetAnchor: anchor(),
    ...over,
  };
}
function mkProject(id: string, over: Partial<Project> = {}): Project {
  return {
    id,
    slug: "",
    code: id,
    title: id,
    projectOwner: null,
    abstract: null,
    imageUrl: null,
    scope: mkSet(),
    budgetType: "CAPEX",
    currency: "USD",
    budget: 0,
    expenditure: { percentage: 0, actuals: 0, cap: 0 },
    ...over,
  };
}
function mkMilestone(id: string, over: Partial<Milestone> = {}): Milestone {
  return {
    id,
    sequenceCode: "",
    title: "",
    description: "",
    deliveryTarget: "",
    scope: mkSet(),
    coordinators: [],
    budget: 0,
    ...over,
  };
}
function mkRoadmap(id: string, over: Partial<Roadmap> = {}): Roadmap {
  return { id, slug: "", title: id, description: "", milestones: [], ...over };
}
function seed(global: Partial<ScopeOfWorkGlobalState>) {
  return utils.createDocument(createState(undefined, global));
}

describe("nullable Milestone.scope guards", () => {
  it("removeRoadmap skips a milestone whose scope is null", () => {
    const doc = seed({
      roadmaps: [
        mkRoadmap("r1", { milestones: [mkMilestone("m1", { scope: null })] }),
      ],
    });

    const next = reducer(doc, removeRoadmap({ id: "r1" }));

    expect(next.operations.global[0].error).toBeFalsy();
    expect(next.state.global.roadmaps).toHaveLength(0);
  });

  it("removeMilestone skips a milestone whose scope is null", () => {
    const doc = seed({
      roadmaps: [
        mkRoadmap("r1", { milestones: [mkMilestone("m1", { scope: null })] }),
      ],
    });

    const next = reducer(doc, removeMilestone({ id: "m1", roadmapId: "r1" }));

    expect(next.state.global.roadmaps[0].milestones).toHaveLength(0);
  });

  it("addMilestoneDeliverable errors when the milestone scope is null", () => {
    const doc = seed({
      roadmaps: [
        mkRoadmap("r1", { milestones: [mkMilestone("m1", { scope: null })] }),
      ],
    });

    const next = reducer(
      doc,
      addMilestoneDeliverable({
        milestoneId: "m1",
        deliverableId: "d1",
        title: "D",
      }),
    );

    expect(next.operations.global[0].error).toBe(
      "Milestone deliverable set not found",
    );
  });

  it("removeMilestoneDeliverable errors when the milestone scope is null", () => {
    const doc = seed({
      roadmaps: [
        mkRoadmap("r1", { milestones: [mkMilestone("m1", { scope: null })] }),
      ],
    });

    const next = reducer(
      doc,
      removeMilestoneDeliverable({ milestoneId: "m1", deliverableId: "d1" }),
    );

    expect(next.operations.global[0].error).toBe(
      "Milestone deliverable set not found",
    );
  });

  it("editDeliverablesSet errors when the milestone scope is null", () => {
    const doc = seed({
      roadmaps: [
        mkRoadmap("r1", { milestones: [mkMilestone("m1", { scope: null })] }),
      ],
    });

    const next = reducer(doc, editDeliverablesSet({ milestoneId: "m1" }));

    expect(next.operations.global[0].error).toBe(
      "Milestone or scope not found",
    );
  });

  it("addDeliverableInSet initializes a null milestone scope", () => {
    const doc = seed({
      roadmaps: [
        mkRoadmap("r1", { milestones: [mkMilestone("m1", { scope: null })] }),
      ],
    });

    const next = reducer(
      doc,
      addDeliverableInSet({ milestoneId: "m1", deliverableId: "d1" }),
    );

    expect(
      next.state.global.roadmaps[0].milestones[0].scope?.deliverables,
    ).toEqual(["d1"]);
  });

  it("removeDeliverableInSet errors when the milestone scope is null", () => {
    const doc = seed({
      roadmaps: [
        mkRoadmap("r1", { milestones: [mkMilestone("m1", { scope: null })] }),
      ],
    });

    const next = reducer(
      doc,
      removeDeliverableInSet({ milestoneId: "m1", deliverableId: "d1" }),
    );

    expect(next.operations.global[0].error).toBe("Milestone scope not found");
  });
});

describe("nullable Project.scope guards", () => {
  it("editDeliverablesSet rebuilds a null project scope from fallbacks", () => {
    const doc = seed({ projects: [mkProject("p1", { scope: null })] });

    const next = reducer(doc, editDeliverablesSet({ projectId: "p1" }));

    const scope = next.state.global.projects[0].scope;
    expect(scope?.status).toBe("DRAFT");
    expect(scope?.deliverables).toEqual([]);
    expect(scope?.deliverablesCompleted).toEqual({ total: 0, completed: 0 });
  });

  it("addDeliverableInSet initializes a null project scope", () => {
    const doc = seed({
      projects: [mkProject("p1", { scope: null })],
      deliverables: [mkDeliverable("d1")],
    });

    const next = reducer(
      doc,
      addDeliverableInSet({ projectId: "p1", deliverableId: "d1" }),
    );

    expect(next.state.global.projects[0].scope?.deliverables).toEqual(["d1"]);
  });

  it("removeDeliverableInSet errors when the project scope is null", () => {
    const doc = seed({ projects: [mkProject("p1", { scope: null })] });

    const next = reducer(
      doc,
      removeDeliverableInSet({ projectId: "p1", deliverableId: "d1" }),
    );

    expect(next.operations.global[0].error).toBe(
      "Project scope not found for project p1",
    );
  });

  it("setProjectMargin errors when the project scope is null", () => {
    const doc = seed({ projects: [mkProject("p1", { scope: null })] });

    const next = reducer(doc, setProjectMargin({ projectId: "p1", margin: 5 }));

    expect(next.operations.global[0].error).toBe(
      "Project deliverable set not found`",
    );
  });

  it("addProjectDeliverable errors when the project scope is null", () => {
    const doc = seed({ projects: [mkProject("p1", { scope: null })] });

    const next = reducer(
      doc,
      addProjectDeliverable({
        projectId: "p1",
        deliverableId: "d1",
        title: "D",
      }),
    );

    expect(next.operations.global[0].error).toBe(
      "Project deliverable set not found",
    );
  });

  it("removeProjectDeliverable errors when the project scope is null", () => {
    const doc = seed({ projects: [mkProject("p1", { scope: null })] });

    const next = reducer(
      doc,
      removeProjectDeliverable({ projectId: "p1", deliverableId: "d1" }),
    );

    expect(next.operations.global[0].error).toBe(
      "Project deliverable set not found",
    );
  });
});

describe("nullable budget-invariant guards over null scopes", () => {
  it("budget & margin invariants skip null project/milestone scopes on removeProject", () => {
    const doc = seed({
      projects: [mkProject("pNull", { scope: null }), mkProject("pReal")],
      roadmaps: [
        mkRoadmap("r1", {
          milestones: [mkMilestone("mNull", { scope: null })],
        }),
      ],
    });

    const next = reducer(doc, removeProject({ projectId: "pReal" }));

    expect(next.operations.global[0].error).toBeFalsy();
    expect(next.state.global.projects.map((p) => p.id)).toEqual(["pNull"]);
  });

  it("progress invariant skips null project/milestone scopes on setDeliverableProgress", () => {
    const doc = seed({
      projects: [mkProject("pNull", { scope: null })],
      roadmaps: [
        mkRoadmap("r1", {
          milestones: [mkMilestone("mNull", { scope: null })],
        }),
      ],
      deliverables: [mkDeliverable("dReal")],
    });

    const next = reducer(
      doc,
      setDeliverableProgress({ id: "dReal", workProgress: { percentage: 50 } }),
    );

    expect(next.state.global.deliverables[0].workProgress).toEqual({
      value: 50,
    });
  });
});

describe("nullable BudgetAnchorProject.unit fallbacks", () => {
  it("removeMilestoneDeliverable falls back to Hours for a null unit", () => {
    const doc = seed({
      roadmaps: [
        mkRoadmap("r1", {
          milestones: [
            mkMilestone("m1", { scope: mkSet({ deliverables: ["d1"] }) }),
          ],
        }),
      ],
      deliverables: [
        mkDeliverable("d1", { budgetAnchor: anchor({ unit: null }) }),
      ],
    });

    const next = reducer(
      doc,
      removeMilestoneDeliverable({ milestoneId: "m1", deliverableId: "d1" }),
    );

    expect(next.state.global.deliverables[0].budgetAnchor?.unit).toBe("Hours");
  });

  it("addDeliverableInSet (project) falls back to Hours for a null unit", () => {
    const doc = seed({
      projects: [mkProject("p1")],
      deliverables: [
        mkDeliverable("d1", { budgetAnchor: anchor({ unit: null }) }),
      ],
    });

    const next = reducer(
      doc,
      addDeliverableInSet({ projectId: "p1", deliverableId: "d1" }),
    );

    expect(next.state.global.deliverables[0].budgetAnchor?.unit).toBe("Hours");
  });

  it("removeDeliverableInSet (project) falls back to Hours for a null unit", () => {
    const doc = seed({
      projects: [mkProject("p1", { scope: mkSet({ deliverables: ["d1"] }) })],
      deliverables: [
        mkDeliverable("d1", { budgetAnchor: anchor({ unit: null }) }),
      ],
    });

    const next = reducer(
      doc,
      removeDeliverableInSet({ projectId: "p1", deliverableId: "d1" }),
    );

    expect(next.state.global.deliverables[0].budgetAnchor?.unit).toBe("Hours");
  });

  it("removeProjectDeliverable falls back to Hours for a null unit", () => {
    const doc = seed({
      projects: [mkProject("p1", { scope: mkSet({ deliverables: ["d1"] }) })],
      deliverables: [
        mkDeliverable("d1", { budgetAnchor: anchor({ unit: null }) }),
      ],
    });

    const next = reducer(
      doc,
      removeProjectDeliverable({ projectId: "p1", deliverableId: "d1" }),
    );

    expect(next.state.global.deliverables[0].budgetAnchor?.unit).toBe("Hours");
  });
});

describe("nullable Deliverable.budgetAnchor & binary Progress.done", () => {
  it("setProjectMargin skips a deliverable whose budgetAnchor is null", () => {
    const doc = seed({
      projects: [mkProject("p1", { scope: mkSet({ deliverables: ["d1"] }) })],
      deliverables: [mkDeliverable("d1", { budgetAnchor: null })],
    });

    const next = reducer(doc, setProjectMargin({ projectId: "p1", margin: 5 }));

    expect(next.operations.global[0].error).toBeFalsy();
    expect(next.state.global.deliverables[0].budgetAnchor).toBeNull();
  });

  it("progress calc treats a binary deliverable with done=null as 0%", () => {
    const doc = seed({
      projects: [mkProject("p1", { scope: mkSet({ deliverables: ["d1"] }) })],
      deliverables: [
        mkDeliverable("d1", { workProgress: { done: null } as Progress }),
      ],
    });

    const next = reducer(
      doc,
      editDeliverablesSet({ projectId: "p1", status: "TODO" }),
    );

    expect(next.state.global.projects[0].scope?.progress).toEqual({ value: 0 });
  });
});
