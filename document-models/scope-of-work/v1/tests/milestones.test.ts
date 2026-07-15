import {
  addCoordinator,
  addMilestone,
  addMilestoneDeliverable,
  addRoadmap,
  editMilestone,
  isScopeOfWorkDocument,
  reducer,
  removeCoordinator,
  removeMilestone,
  removeMilestoneDeliverable,
  utils,
} from "document-models/scope-of-work/v1";
import { describe, expect, it } from "vitest";

function withRoadmap(id = "r1") {
  return reducer(utils.createDocument(), addRoadmap({ id, title: "Roadmap" }));
}

describe("Milestones operations", () => {
  it("adds milestones with full and minimal inputs", () => {
    let doc = withRoadmap();

    doc = reducer(
      doc,
      addMilestone({
        id: "m1",
        roadmapId: "r1",
        sequenceCode: "M1",
        title: "Milestone 1",
        description: "First",
        deliveryTarget: "2026-01-01",
      }),
    );
    doc = reducer(doc, addMilestone({ id: "m2", roadmapId: "r1" }));

    expect(isScopeOfWorkDocument(doc)).toBe(true);
    const milestones = doc.state.global.roadmaps[0].milestones;
    expect(milestones).toHaveLength(2);
    expect(milestones[0]).toMatchObject({
      id: "m1",
      sequenceCode: "M1",
      title: "Milestone 1",
      description: "First",
      deliveryTarget: "2026-01-01",
      coordinators: [],
      budget: 0,
    });
    expect(milestones[1]).toMatchObject({
      id: "m2",
      sequenceCode: "",
      title: "",
      description: "",
      deliveryTarget: "",
    });
  });

  it("errors when adding a milestone to a missing roadmap", () => {
    const doc = utils.createDocument();

    const next = reducer(doc, addMilestone({ id: "m1", roadmapId: "ghost" }));

    expect(next.operations.global[0].error).toBe("Roadmap not found");
  });

  it("edits a milestone fully and with fallbacks", () => {
    let doc = withRoadmap();
    doc = reducer(
      doc,
      addMilestone({
        id: "m1",
        roadmapId: "r1",
        sequenceCode: "M1",
        title: "Title",
        description: "Desc",
        deliveryTarget: "2026-01-01",
      }),
    );

    const full = reducer(
      doc,
      editMilestone({
        id: "m1",
        roadmapId: "r1",
        sequenceCode: "M2",
        title: "New Title",
        description: "New Desc",
        deliveryTarget: "2026-02-02",
      }),
    );
    expect(full.state.global.roadmaps[0].milestones[0]).toMatchObject({
      sequenceCode: "M2",
      title: "New Title",
      description: "New Desc",
      deliveryTarget: "2026-02-02",
    });

    // Omit all optionals -> `|| foundMilestone.x` fallbacks retain values.
    const fallback = reducer(
      full,
      editMilestone({ id: "m1", roadmapId: "r1" }),
    );
    expect(fallback.state.global.roadmaps[0].milestones[0]).toMatchObject({
      sequenceCode: "M2",
      title: "New Title",
      description: "New Desc",
      deliveryTarget: "2026-02-02",
    });
  });

  it("errors when editing with a missing roadmap or missing milestone", () => {
    let doc = withRoadmap();
    doc = reducer(doc, addMilestone({ id: "m1", roadmapId: "r1" }));

    const noRoadmap = reducer(
      doc,
      editMilestone({ id: "m1", roadmapId: "ghost" }),
    );
    expect(
      noRoadmap.operations.global[noRoadmap.operations.global.length - 1].error,
    ).toBe("Roadmap not found");

    const noMilestone = reducer(
      doc,
      editMilestone({ id: "ghost", roadmapId: "r1" }),
    );
    expect(
      noMilestone.operations.global[noMilestone.operations.global.length - 1]
        .error,
    ).toBe("Milestone not found");
  });

  it("adds and removes coordinators, ignoring duplicates", () => {
    let doc = withRoadmap();
    doc = reducer(doc, addMilestone({ id: "m1", roadmapId: "r1" }));

    doc = reducer(doc, addCoordinator({ id: "c1", milestoneId: "m1" }));
    // duplicate -> not added again
    doc = reducer(doc, addCoordinator({ id: "c1", milestoneId: "m1" }));
    doc = reducer(doc, addCoordinator({ id: "c2", milestoneId: "m1" }));
    expect(doc.state.global.roadmaps[0].milestones[0].coordinators).toEqual([
      "c1",
      "c2",
    ]);

    doc = reducer(doc, removeCoordinator({ id: "c1", milestoneId: "m1" }));
    expect(doc.state.global.roadmaps[0].milestones[0].coordinators).toEqual([
      "c2",
    ]);
  });

  it("errors on coordinator ops for a milestone with no roadmap", () => {
    const doc = utils.createDocument();

    const added = reducer(doc, addCoordinator({ id: "c1", milestoneId: "x" }));
    expect(added.operations.global[0].error).toBe(
      "Roadmap with milestone x not found",
    );

    const removed = reducer(
      doc,
      removeCoordinator({ id: "c1", milestoneId: "x" }),
    );
    expect(removed.operations.global[0].error).toBe(
      "Roadmap with milestone x not found",
    );
  });

  it("adds and removes milestone deliverables", () => {
    let doc = withRoadmap();
    doc = reducer(doc, addMilestone({ id: "m1", roadmapId: "r1" }));

    doc = reducer(
      doc,
      addMilestoneDeliverable({
        milestoneId: "m1",
        deliverableId: "d1",
        title: "Deliverable 1",
      }),
    );
    expect(doc.state.global.deliverables).toHaveLength(1);
    expect(
      doc.state.global.roadmaps[0].milestones[0].scope?.deliverables,
    ).toEqual(["d1"]);

    doc = reducer(
      doc,
      removeMilestoneDeliverable({ milestoneId: "m1", deliverableId: "d1" }),
    );
    expect(
      doc.state.global.roadmaps[0].milestones[0].scope?.deliverables,
    ).toEqual([]);
    // Deliverable's budget anchor project is reset to "".
    expect(doc.state.global.deliverables[0].budgetAnchor?.project).toBe("");
  });

  it("errors when adding a milestone deliverable to a missing milestone", () => {
    const doc = utils.createDocument();

    const next = reducer(
      doc,
      addMilestoneDeliverable({
        milestoneId: "ghost",
        deliverableId: "d1",
        title: "x",
      }),
    );

    expect(next.operations.global[0].error).toBe("Milestone not found");
  });

  it("errors when removing a milestone deliverable with a missing roadmap", () => {
    const doc = utils.createDocument();

    const next = reducer(
      doc,
      removeMilestoneDeliverable({ milestoneId: "ghost", deliverableId: "d1" }),
    );

    expect(next.operations.global[0].error).toBe("Roadmap not found");
  });

  it("removes a milestone and cascades its deliverables", () => {
    let doc = withRoadmap();
    doc = reducer(doc, addMilestone({ id: "m1", roadmapId: "r1" }));
    doc = reducer(
      doc,
      addMilestoneDeliverable({
        milestoneId: "m1",
        deliverableId: "d1",
        title: "D1",
      }),
    );
    expect(doc.state.global.deliverables).toHaveLength(1);

    const removed = reducer(
      doc,
      removeMilestone({ id: "m1", roadmapId: "r1" }),
    );
    expect(removed.state.global.roadmaps[0].milestones).toHaveLength(0);
    expect(removed.state.global.deliverables).toHaveLength(0);
  });

  it("errors when removing a milestone with missing roadmap or milestone", () => {
    let doc = withRoadmap();
    doc = reducer(doc, addMilestone({ id: "m1", roadmapId: "r1" }));

    const noRoadmap = reducer(
      doc,
      removeMilestone({ id: "m1", roadmapId: "ghost" }),
    );
    expect(
      noRoadmap.operations.global[noRoadmap.operations.global.length - 1].error,
    ).toBe("Roadmap not found");

    const noMilestone = reducer(
      doc,
      removeMilestone({ id: "ghost", roadmapId: "r1" }),
    );
    expect(
      noMilestone.operations.global[noMilestone.operations.global.length - 1]
        .error,
    ).toBe("Milestone not found");
  });
});
