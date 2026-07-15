import {
  addDeliverable,
  addDeliverableInSet,
  addMilestone,
  addProject,
  addRoadmap,
  editDeliverablesSet,
  isScopeOfWorkDocument,
  reducer,
  removeDeliverableInSet,
  utils,
} from "document-models/scope-of-work/v1";
import { describe, expect, it } from "vitest";

function seedRoadmapMilestone() {
  let doc = reducer(
    utils.createDocument(),
    addRoadmap({ id: "r1", title: "Roadmap" }),
  );
  doc = reducer(doc, addMilestone({ id: "m1", roadmapId: "r1" }));
  return doc;
}

describe("DeliverablesSet operations", () => {
  it("edits a milestone deliverable set (provided values and fallbacks)", () => {
    let doc = seedRoadmapMilestone();

    doc = reducer(
      doc,
      editDeliverablesSet({
        milestoneId: "m1",
        status: "IN_PROGRESS",
        deliverablesCompleted: { total: 3, completed: 1 },
      }),
    );
    expect(isScopeOfWorkDocument(doc)).toBe(true);
    let scope = doc.state.global.roadmaps[0].milestones[0].scope;
    expect(scope?.status).toBe("IN_PROGRESS");
    // progress invariant recomputes deliverablesCompleted for the (empty) set.
    expect(scope?.deliverablesCompleted).toEqual({ total: 0, completed: 0 });

    // Omit optionals -> `|| existing` fallbacks keep the status value.
    doc = reducer(doc, editDeliverablesSet({ milestoneId: "m1" }));
    scope = doc.state.global.roadmaps[0].milestones[0].scope;
    expect(scope?.status).toBe("IN_PROGRESS");
  });

  it("errors when editing a milestone set whose roadmap is missing", () => {
    const doc = utils.createDocument();

    const next = reducer(doc, editDeliverablesSet({ milestoneId: "ghost" }));

    expect(next.operations.global[0].error).toBe(
      "Roadmap with milestone not found",
    );
  });

  it("edits a project deliverable set (provided values and fallbacks)", () => {
    let doc = reducer(
      utils.createDocument(),
      addProject({ id: "p1", code: "P1", title: "Project 1" }),
    );

    doc = reducer(
      doc,
      editDeliverablesSet({
        projectId: "p1",
        status: "IN_PROGRESS",
        deliverablesCompleted: { total: 5, completed: 2 },
      }),
    );
    let scope = doc.state.global.projects[0].scope;
    expect(scope?.status).toBe("IN_PROGRESS");
    // progress invariant recomputes deliverablesCompleted for the (empty) set.
    expect(scope?.deliverablesCompleted).toEqual({ total: 0, completed: 0 });

    // Omit optionals -> fall back to existing scope status.
    doc = reducer(doc, editDeliverablesSet({ projectId: "p1" }));
    scope = doc.state.global.projects[0].scope;
    expect(scope?.status).toBe("IN_PROGRESS");
  });

  it("editDeliverablesSet is a no-op when neither or both ids are given", () => {
    const doc = utils.createDocument();

    // neither id -> first `if` and `else if` both false
    const neither = reducer(doc, editDeliverablesSet({ status: "TODO" }));
    expect(neither.operations.global[0].error).toBeFalsy();
    expect(neither.state.global.projects).toHaveLength(0);

    // both ids -> `else if (projectId && !milestoneId)` is false
    const both = reducer(
      doc,
      editDeliverablesSet({ milestoneId: "m1", projectId: "p1" }),
    );
    expect(both.operations.global[0].error).toBeFalsy();
  });

  it("errors when editing a project set whose project is missing", () => {
    const doc = utils.createDocument();

    const next = reducer(doc, editDeliverablesSet({ projectId: "ghost" }));

    expect(next.operations.global[0].error).toBe(
      "Project with id ghost not found",
    );
  });

  it("adds/removes deliverables in a milestone set (with dedupe)", () => {
    let doc = seedRoadmapMilestone();

    doc = reducer(
      doc,
      addDeliverableInSet({ milestoneId: "m1", deliverableId: "d1" }),
    );
    // duplicate -> ignored
    doc = reducer(
      doc,
      addDeliverableInSet({ milestoneId: "m1", deliverableId: "d1" }),
    );
    expect(
      doc.state.global.roadmaps[0].milestones[0].scope?.deliverables,
    ).toEqual(["d1"]);

    doc = reducer(
      doc,
      removeDeliverableInSet({ milestoneId: "m1", deliverableId: "d1" }),
    );
    expect(
      doc.state.global.roadmaps[0].milestones[0].scope?.deliverables,
    ).toEqual([]);
  });

  it("adds/removes deliverables in a project set and updates budget anchor", () => {
    let doc = reducer(
      utils.createDocument(),
      addProject({ id: "p1", code: "P1", title: "Project 1" }),
    );
    doc = reducer(doc, addDeliverable({ id: "d1", title: "D1" }));

    doc = reducer(
      doc,
      addDeliverableInSet({ projectId: "p1", deliverableId: "d1" }),
    );
    // duplicate -> ignored
    doc = reducer(
      doc,
      addDeliverableInSet({ projectId: "p1", deliverableId: "d1" }),
    );
    expect(doc.state.global.projects[0].scope?.deliverables).toEqual(["d1"]);
    expect(
      doc.state.global.deliverables.find((d) => d.id === "d1")?.budgetAnchor
        ?.project,
    ).toBe("p1");

    doc = reducer(
      doc,
      removeDeliverableInSet({ projectId: "p1", deliverableId: "d1" }),
    );
    expect(doc.state.global.projects[0].scope?.deliverables).toEqual([]);
    expect(
      doc.state.global.deliverables.find((d) => d.id === "d1")?.budgetAnchor
        ?.project,
    ).toBe("");
  });

  it("errors when adding a deliverable to a set with neither id", () => {
    const doc = utils.createDocument();

    const next = reducer(doc, addDeliverableInSet({ deliverableId: "d1" }));

    expect(next.operations.global[0].error).toBe(
      "Either milestoneId or projectId must be provided",
    );
  });

  it("errors when adding to a set with a missing milestone roadmap or project", () => {
    const doc = utils.createDocument();

    const noRoadmap = reducer(
      doc,
      addDeliverableInSet({ milestoneId: "ghost", deliverableId: "d1" }),
    );
    expect(noRoadmap.operations.global[0].error).toBe(
      "Roadmap with milestone ghost not found",
    );

    const noProject = reducer(
      doc,
      addDeliverableInSet({ projectId: "ghost", deliverableId: "d1" }),
    );
    expect(noProject.operations.global[0].error).toBe(
      "Project with id ghost not found",
    );
  });

  it("errors when removing from a set with a missing milestone roadmap or project", () => {
    const doc = utils.createDocument();

    const noRoadmap = reducer(
      doc,
      removeDeliverableInSet({ milestoneId: "ghost", deliverableId: "d1" }),
    );
    expect(noRoadmap.operations.global[0].error).toBe(
      "Roadmap with milestone not found",
    );

    const noProject = reducer(
      doc,
      removeDeliverableInSet({ projectId: "ghost", deliverableId: "d1" }),
    );
    expect(noProject.operations.global[0].error).toBe(
      "Project with id ghost not found",
    );
  });
});
