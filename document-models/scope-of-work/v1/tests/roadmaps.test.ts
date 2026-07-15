import {
  addMilestone,
  addMilestoneDeliverable,
  addRoadmap,
  editRoadmap,
  isScopeOfWorkDocument,
  reducer,
  removeRoadmap,
  utils,
} from "document-models/scope-of-work/v1";
import { describe, expect, it } from "vitest";

describe("Roadmaps operations", () => {
  it("adds roadmaps with and without optional slug/description", () => {
    const document = utils.createDocument();

    const withOptional = reducer(
      document,
      addRoadmap({
        id: "r1",
        title: "Roadmap One",
        slug: "roadmap-one",
        description: "First roadmap",
      }),
    );
    const minimal = reducer(
      withOptional,
      // omit slug/description -> `|| ""` fallback branch
      addRoadmap({ id: "r2", title: "Roadmap Two" }),
    );

    expect(isScopeOfWorkDocument(minimal)).toBe(true);
    expect(minimal.state.global.roadmaps).toHaveLength(2);
    expect(minimal.state.global.roadmaps[0]).toMatchObject({
      id: "r1",
      title: "Roadmap One",
      slug: "roadmap-one",
      description: "First roadmap",
      milestones: [],
    });
    expect(minimal.state.global.roadmaps[1]).toMatchObject({
      id: "r2",
      title: "Roadmap Two",
      slug: "",
      description: "",
    });
  });

  it("edits a roadmap fully and with fallbacks for omitted fields", () => {
    const document = utils.createDocument();
    const seeded = reducer(
      document,
      addRoadmap({
        id: "r1",
        title: "Original",
        slug: "orig",
        description: "orig desc",
      }),
    );

    const full = reducer(
      seeded,
      editRoadmap({
        id: "r1",
        title: "Updated",
        slug: "updated",
        description: "updated desc",
      }),
    );
    expect(full.state.global.roadmaps[0]).toMatchObject({
      title: "Updated",
      slug: "updated",
      description: "updated desc",
    });

    // Omit all optional fields -> `|| roadmap.x` fallback keeps prior values.
    const fallback = reducer(full, editRoadmap({ id: "r1" }));
    expect(fallback.state.global.roadmaps[0]).toMatchObject({
      title: "Updated",
      slug: "updated",
      description: "updated desc",
    });
  });

  it("returns an error when editing a missing roadmap", () => {
    const document = utils.createDocument();

    const next = reducer(document, editRoadmap({ id: "nope", title: "x" }));

    expect(next.operations.global[0].error).toBe("Roadmap not found");
  });

  it("removes a roadmap and cascades deletion of its milestone deliverables", () => {
    const document = utils.createDocument();
    let doc = reducer(document, addRoadmap({ id: "r1", title: "R1" }));
    doc = reducer(doc, addMilestone({ id: "m1", roadmapId: "r1" }));
    doc = reducer(
      doc,
      addMilestoneDeliverable({
        milestoneId: "m1",
        deliverableId: "d1",
        title: "Deliverable 1",
      }),
    );
    // Second roadmap with a milestone but no deliverables (empty scope path).
    doc = reducer(doc, addRoadmap({ id: "r2", title: "R2" }));
    doc = reducer(doc, addMilestone({ id: "m2", roadmapId: "r2" }));

    expect(doc.state.global.deliverables).toHaveLength(1);

    const removedR1 = reducer(doc, removeRoadmap({ id: "r1" }));
    expect(removedR1.state.global.roadmaps.map((r) => r.id)).toEqual(["r2"]);
    // Deliverable that belonged to r1's milestone is cascaded away.
    expect(removedR1.state.global.deliverables).toHaveLength(0);

    const removedR2 = reducer(removedR1, removeRoadmap({ id: "r2" }));
    expect(removedR2.state.global.roadmaps).toHaveLength(0);
  });

  it("returns an error when removing a missing roadmap", () => {
    const document = utils.createDocument();

    const next = reducer(document, removeRoadmap({ id: "ghost" }));

    expect(next.operations.global[0].error).toBe("Roadmap not found");
  });
});
