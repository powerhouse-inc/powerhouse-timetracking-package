import {
  addProject,
  addProjectDeliverable,
  editDeliverable,
  isScopeOfWorkDocument,
  reducer,
  removeProject,
  removeProjectDeliverable,
  setDeliverableBudgetAnchorProject,
  setDeliverableProgress,
  setProjectMargin,
  setProjectTotalBudget,
  updateProject,
  updateProjectOwner,
  utils,
} from "document-models/scope-of-work/v1";
import { describe, expect, it } from "vitest";

function project(doc: ReturnType<typeof utils.createDocument>, id: string) {
  return doc.state.global.projects.find((p) => p.id === id);
}
function deliverable(doc: ReturnType<typeof utils.createDocument>, id: string) {
  return doc.state.global.deliverables.find((d) => d.id === id);
}

describe("Projects operations", () => {
  it("adds projects with full and minimal inputs", () => {
    let doc = utils.createDocument();

    doc = reducer(
      doc,
      addProject({
        id: "p1",
        code: "P1",
        title: "Project 1",
        slug: "project-1",
        projectOwner: "owner-1",
        abstract: "An abstract",
        imageUrl: "https://img",
        budgetType: "OPEX",
        currency: "EUR",
        budget: 500,
      }),
    );
    doc = reducer(
      doc,
      addProject({ id: "p2", code: "P2", title: "Project 2" }),
    );

    expect(isScopeOfWorkDocument(doc)).toBe(true);
    expect(project(doc, "p1")).toMatchObject({
      slug: "project-1",
      projectOwner: "owner-1",
      abstract: "An abstract",
      imageUrl: "https://img",
      budgetType: "OPEX",
      currency: "EUR",
      budget: 500,
    });
    expect(project(doc, "p2")).toMatchObject({
      slug: "",
      projectOwner: null,
      abstract: null,
      imageUrl: null,
      budgetType: "CAPEX",
      currency: "USD",
      budget: 0,
    });
    expect(project(doc, "p2")?.scope).toMatchObject({
      deliverables: [],
      status: "DRAFT",
    });
  });

  it("updates a project and its owner, with not-found errors", () => {
    let doc = utils.createDocument();
    doc = reducer(
      doc,
      addProject({ id: "p1", code: "P1", title: "Project 1" }),
    );

    doc = reducer(
      doc,
      updateProject({ id: "p1", title: "Renamed", slug: "renamed" }),
    );
    expect(project(doc, "p1")).toMatchObject({
      title: "Renamed",
      slug: "renamed",
    });

    doc = reducer(
      doc,
      updateProjectOwner({ id: "p1", projectOwner: "owner-x" }),
    );
    expect(project(doc, "p1")?.projectOwner).toBe("owner-x");

    expect(
      reducer(doc, updateProject({ id: "ghost", title: "x" })).operations
        .global[doc.operations.global.length].error,
    ).toBe("Project not found");
    expect(
      reducer(doc, updateProjectOwner({ id: "ghost", projectOwner: "y" }))
        .operations.global[doc.operations.global.length].error,
    ).toBe("Project not found");
  });

  it("sets project margin across deliverables and recalculates budget", () => {
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
        title: "D1",
      }),
    );
    doc = reducer(
      doc,
      setDeliverableBudgetAnchorProject({
        deliverableId: "d1",
        unitCost: 50,
        quantity: 4,
      }),
    );

    doc = reducer(doc, setProjectMargin({ projectId: "p1", margin: 25 }));

    expect(deliverable(doc, "d1")?.budgetAnchor?.margin).toBe(25);
    // budget = 50*4*(1+25/100) = 250
    expect(project(doc, "p1")?.budget).toBe(250);
  });

  it("errors on setProjectMargin for missing project or empty deliverable set", () => {
    let doc = utils.createDocument();
    doc = reducer(
      doc,
      addProject({ id: "p1", code: "P1", title: "Project 1" }),
    );

    const missing = reducer(
      doc,
      setProjectMargin({ projectId: "ghost", margin: 5 }),
    );
    expect(
      missing.operations.global[missing.operations.global.length - 1].error,
    ).toBe("Project not found");

    const empty = reducer(
      doc,
      setProjectMargin({ projectId: "p1", margin: 5 }),
    );
    expect(
      empty.operations.global[empty.operations.global.length - 1].error,
    ).toBe("Project deliverable set has no deliverables");
  });

  it("sets total budget (budget>0 and budget=0 margin branches) and errors when missing", () => {
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
        title: "D1",
      }),
    );
    doc = reducer(
      doc,
      setDeliverableBudgetAnchorProject({
        deliverableId: "d1",
        unitCost: 100,
        quantity: 2,
      }),
    );

    // budget > 0 -> margin invariant divides by total cost (200)
    const withBudget = reducer(
      doc,
      setProjectTotalBudget({ projectId: "p1", totalBudget: 400 }),
    );
    expect(project(withBudget, "p1")?.budget).toBe(400);
    // margin = 400 / 200 = 2
    expect(deliverable(withBudget, "d1")?.budgetAnchor?.margin).toBe(2);

    // budget = 0 -> margin invariant falls back to 0
    const zeroBudget = reducer(
      withBudget,
      setProjectTotalBudget({ projectId: "p1", totalBudget: 0 }),
    );
    expect(deliverable(zeroBudget, "d1")?.budgetAnchor?.margin).toBe(0);

    const missing = reducer(
      doc,
      setProjectTotalBudget({ projectId: "ghost", totalBudget: 1 }),
    );
    expect(
      missing.operations.global[missing.operations.global.length - 1].error,
    ).toBe("Project not found");
  });

  it("adds/removes project deliverables with errors for missing project/scope", () => {
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
        title: "D1",
      }),
    );
    expect(project(doc, "p1")?.scope?.deliverables).toEqual(["d1"]);
    expect(deliverable(doc, "d1")?.budgetAnchor?.project).toBe("p1");

    const removed = reducer(
      doc,
      removeProjectDeliverable({ projectId: "p1", deliverableId: "d1" }),
    );
    expect(project(removed, "p1")?.scope?.deliverables).toEqual([]);
    // budget anchor project reset to "" on removal
    expect(deliverable(removed, "d1")?.budgetAnchor?.project).toBe("");

    const addMissing = reducer(
      doc,
      addProjectDeliverable({
        projectId: "ghost",
        deliverableId: "d2",
        title: "D2",
      }),
    );
    expect(
      addMissing.operations.global[addMissing.operations.global.length - 1]
        .error,
    ).toBe("Project not found");

    const removeMissing = reducer(
      doc,
      removeProjectDeliverable({ projectId: "ghost", deliverableId: "d1" }),
    );
    expect(
      removeMissing.operations.global[
        removeMissing.operations.global.length - 1
      ].error,
    ).toBe("Project not found");
  });

  it("removes a project (with and without deliverables) and cascades", () => {
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
        title: "D1",
      }),
    );
    doc = reducer(
      doc,
      addProject({ id: "p2", code: "P2", title: "Project 2" }),
    );

    const removed = reducer(doc, removeProject({ projectId: "p1" }));
    expect(removed.state.global.projects.map((p) => p.id)).toEqual(["p2"]);
    expect(removed.state.global.deliverables).toHaveLength(0);

    // removing a project that has no matching entry is a no-op (project?.scope guard)
    const noop = reducer(removed, removeProject({ projectId: "ghost" }));
    expect(noop.state.global.projects.map((p) => p.id)).toEqual(["p2"]);
  });

  describe("deliverable-set progress calculation", () => {
    it("computes story-point totals when all deliverables use story points", () => {
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

      // First set -> mixed (d2 still percentage) exercises the average path.
      doc = reducer(
        doc,
        setDeliverableProgress({
          id: "d1",
          workProgress: { storyPoints: { total: 10, completed: 4 } },
        }),
      );
      expect(project(doc, "p1")?.scope?.progress).toHaveProperty("value");

      // Now all story points -> sum path.
      doc = reducer(
        doc,
        setDeliverableProgress({
          id: "d2",
          workProgress: { storyPoints: { total: 20, completed: 20 } },
        }),
      );
      expect(project(doc, "p1")?.scope?.progress).toEqual({
        total: 30,
        completed: 24,
      });
      expect(project(doc, "p1")?.scope?.deliverablesCompleted).toEqual({
        total: 2,
        completed: 1,
      });
    });

    it("averages mixed progress types and ignores canceled/wont-do deliverables", () => {
      let doc = utils.createDocument();
      doc = reducer(doc, addProject({ id: "p1", code: "P1", title: "P1" }));
      // Also keep an empty project around to hit the length===0 default branch
      // during recalculation.
      doc = reducer(doc, addProject({ id: "pEmpty", code: "PE", title: "PE" }));

      for (const id of ["d1", "d2", "d3", "d4", "d5"]) {
        doc = reducer(
          doc,
          addProjectDeliverable({
            projectId: "p1",
            deliverableId: id,
            title: id,
          }),
        );
      }

      // d1 percentage 40, d2 binary in-progress (=>50), d3 binary done (=>100),
      // d4 story points total 0 (=>0), d5 left as percentage 0.
      doc = reducer(
        doc,
        setDeliverableProgress({ id: "d1", workProgress: { percentage: 40 } }),
      );
      doc = reducer(
        doc,
        setDeliverableProgress({ id: "d2", workProgress: { done: false } }),
      );
      doc = reducer(
        doc,
        setDeliverableProgress({ id: "d3", workProgress: { done: true } }),
      );
      doc = reducer(
        doc,
        setDeliverableProgress({
          id: "d4",
          workProgress: { storyPoints: { total: 0, completed: 0 } },
        }),
      );
      // d4 -> CANCELED so it is ignored; d5 stays.
      doc = reducer(doc, editDeliverable({ id: "d4", status: "CANCELED" }));
      // trigger a recalculation after status change
      doc = reducer(
        doc,
        setDeliverableProgress({ id: "d5", workProgress: { percentage: 0 } }),
      );

      const scope = project(doc, "p1")?.scope;
      // Remaining valid: d1(40) d2(50) d3(100) d5(0) -> average 47.5
      expect(scope?.progress).toEqual({ value: 47.5 });
      expect(scope?.deliverablesCompleted.total).toBe(4);
      // Empty project scope defaulted.
      expect(project(doc, "pEmpty")?.scope?.progress).toEqual({ value: 0 });
    });

    it("defaults progress to zero when every deliverable is ignored", () => {
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
      // editDeliverable triggers a progress recalculation; WONT_DO is ignored,
      // leaving the set with zero valid deliverables.
      doc = reducer(doc, editDeliverable({ id: "d1", status: "WONT_DO" }));

      const scope = project(doc, "p1")?.scope;
      expect(scope?.progress).toEqual({ value: 0 });
      expect(scope?.deliverablesCompleted).toEqual({ total: 0, completed: 0 });
    });
  });
});
