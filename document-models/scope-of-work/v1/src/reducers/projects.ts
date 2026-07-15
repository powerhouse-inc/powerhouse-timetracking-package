import type { ScopeOfWorkProjectsOperations } from "document-models/scope-of-work/v1";
import type {
  Binary,
  Deliverable,
  DeliverablesSet,
  Percentage,
  Progress,
  ScopeOfWorkState,
  StoryPoint,
} from "../../gen/schema/types.js";

export const scopeOfWorkProjectsOperations: ScopeOfWorkProjectsOperations = {
  addProjectOperation(state, action) {
    const project = {
      id: action.input.id,
      code: action.input.code,
      title: action.input.title,
      workspaceProjectId: action.input.workspaceProjectId || null,
      slug: action.input.slug || "",
      projectOwner: action.input.projectOwner || null,
      abstract: action.input.abstract || null,
      imageUrl: action.input.imageUrl || null,
      budgetType: action.input.budgetType || "CAPEX",
      currency: action.input.currency || "USD",
      budget: action.input.budget || 0,
      expenditure: {
        percentage: 0,
        actuals: 0,
        cap: 0,
      },
      scope: {
        deliverables: [],
        status: "DRAFT" as const,
        progress: {
          value: 0,
        },
        deliverablesCompleted: {
          total: 0,
          completed: 0,
        },
      },
    };
    state.projects.push(project);
  },
  updateProjectOperation(state, action) {
    const project = state.projects.find((p) => p.id === action.input.id);
    if (!project) {
      throw new Error("Project not found");
    }
    Object.assign(project, action.input);
  },
  updateProjectOwnerOperation(state, action) {
    const project = state.projects.find((p) => p.id === action.input.id);
    if (!project) {
      throw new Error("Project not found");
    }
    project.projectOwner = action.input.projectOwner;
  },
  removeProjectOperation(state, action) {
    // remove deliverables linked to project from project scope
    const project = state.projects.find((p) => p.id === action.input.projectId);
    if (project?.scope?.deliverables) {
      project.scope.deliverables.forEach((deliverableId) => {
        state.deliverables = state.deliverables.filter(
          (d) => d.id !== deliverableId,
        );
      });
    }

    state.projects = state.projects.filter(
      (p) => p.id !== action.input.projectId,
    );
    applyInvariants(state, ["budget", "margin"]);
  },
  setProjectMarginOperation(state, action) {
    const project = state.projects.find((p) => p.id === action.input.projectId);
    if (!project) {
      throw new Error("Project not found");
    }

    const projectDeliverableSet = project.scope;
    if (!projectDeliverableSet) {
      throw new Error("Project deliverable set not found`");
    }
    if (projectDeliverableSet.deliverables.length < 1) {
      throw new Error("Project deliverable set has no deliverables");
    }

    const projectDeliverables = projectDeliverableSet.deliverables
      .map((id) => state.deliverables.find((d) => d.id === id))
      .filter((d) => d !== undefined);

    projectDeliverables.forEach((deliverable: Deliverable) => {
      if (deliverable.budgetAnchor) {
        deliverable.budgetAnchor = {
          ...deliverable.budgetAnchor,
          margin: action.input.margin,
        };
      }
    });

    applyInvariants(state, ["budget"]);
  },
  setProjectTotalBudgetOperation(state, action) {
    const project = state.projects.find((p) => p.id === action.input.projectId);
    if (!project) {
      throw new Error("Project not found");
    }
    project.budget = action.input.totalBudget;
    applyInvariants(state, ["margin"]);
  },
  addProjectDeliverableOperation(state, action) {
    // add deliverable to deliverables
    const newDeliverable: Deliverable = {
      id: action.input.deliverableId,
      owner: "",
      title: action.input.title,
      icon: "",
      code: "",
      description: "",
      status: "DRAFT",
      workProgress: {
        value: 0,
      },
      keyResults: [],
      budgetAnchor: {
        project: action.input.projectId,
        unit: "Hours",
        unitCost: 0,
        quantity: 0,
        margin: 0,
      },
    };

    state.deliverables.push(newDeliverable);

    const project = state.projects.find((p) => p.id === action.input.projectId);
    if (!project) {
      throw new Error("Project not found");
    }
    if (!project.scope) {
      throw new Error("Project deliverable set not found");
    }
    project.scope.deliverables.push(newDeliverable.id);
  },
  removeProjectDeliverableOperation(state, action) {
    const project = state.projects.find((p) => p.id === action.input.projectId);
    if (!project) {
      throw new Error("Project not found");
    }
    if (!project.scope) {
      throw new Error("Project deliverable set not found");
    }
    project.scope.deliverables = project.scope.deliverables.filter(
      (d) => d !== action.input.deliverableId,
    );

    state.deliverables = state.deliverables.map((deliverable) => {
      return String(deliverable.id) === String(action.input.deliverableId)
        ? {
            ...deliverable,
            budgetAnchor: {
              project: "",
              unit: deliverable.budgetAnchor?.unit || "Hours",
              unitCost: deliverable.budgetAnchor?.unitCost || 0,
              quantity: deliverable.budgetAnchor?.quantity || 0,
              margin: deliverable.budgetAnchor?.margin || 0,
            },
          }
        : deliverable;
    });
    applyInvariants(state, ["budget", "margin", "progress"]);
  },
};

export const applyInvariants = (state: ScopeOfWorkState, updates: string[]) => {
  /*
  invariant: budget = totalCost * margin
   
  */

  if (updates.includes("budget")) {
    state.projects.forEach((project) => {
      if (project.scope) {
        project.budget = calculateTotalBudget(state, project.scope);
      }
    });
    state.roadmaps.forEach((roadmap) => {
      roadmap.milestones.forEach((milestone) => {
        if (milestone.scope) {
          milestone.budget = calculateTotalBudget(state, milestone.scope);
        }
      });
    });
  }

  if (updates.includes("margin")) {
    state.projects.forEach((project) => {
      if (project.scope) {
        const margin = project.budget
          ? project.budget / calculateTotalCost(state, project.scope)
          : 0;
        const deliverables = project.scope.deliverables.map((id) =>
          state.deliverables.find((d) => d.id === id),
        );
        deliverables.forEach((deliverable) => {
          if (deliverable?.budgetAnchor) {
            deliverable.budgetAnchor = {
              ...deliverable.budgetAnchor,
              margin,
            };
          }
        });
      }
    });
  }

  // another invariant: deliverableSet.progress = function of deliverableSet.deliverables.progress
  if (updates.includes("progress")) {
    calculateDeliverableSetsProgress(state);
  }

  // recalculate when
  /*
    - deliverableSet.deliverables.progress changes
    - deliverableSet.deliverables.status changes
    - deliverable is added / created / removed / deleted to deliverableSet
    - deliverable is added / created / removed / deleted from deliverableSet
  */
};

export const calculateTotalCost = (
  state: ScopeOfWorkState,
  deliverableSet: DeliverablesSet,
) => {
  const deliverables = deliverableSet.deliverables
    .map((id) => state.deliverables.find((d) => d.id === id))
    .filter((deliverable) => deliverable !== undefined);
  const totalCost = deliverables.reduce((acc, deliverable) => {
    return (
      acc +
      (deliverable.budgetAnchor?.unitCost || 0) *
        (deliverable.budgetAnchor?.quantity || 0)
    );
  }, 0);
  return totalCost === 0 ? 0 : Number(totalCost.toFixed(2));
};

const calculateTotalBudget = (
  state: ScopeOfWorkState,
  deliverableSet: DeliverablesSet,
) => {
  const deliverables = deliverableSet.deliverables
    .map((id) => state.deliverables.find((d) => d.id === id))
    .filter((deliverable) => deliverable !== undefined);
  const totalBudget = deliverables.reduce((acc, deliverable) => {
    // Assume margin is a percentage (e.g., 5 means 5%)
    // Convert margin to a multiplier: (1 + margin/100)
    return (
      acc +
      (deliverable.budgetAnchor?.unitCost || 0) *
        (deliverable.budgetAnchor?.quantity || 0) *
        (1 + (deliverable.budgetAnchor?.margin || 0) / 100)
    );
  }, 0);
  return totalBudget === 0 ? 0 : Number(totalBudget.toFixed(2));
};

type WorkProgress = Progress | null | undefined;

// Helper function to determine if a deliverable uses story points
const isStoryPointsProgress = (
  progress: WorkProgress,
): progress is StoryPoint => {
  return progress != null && "total" in progress;
};

// Helper function to determine if a deliverable uses percentage progress
const isPercentageProgress = (
  progress: WorkProgress,
): progress is Percentage => {
  return progress != null && "value" in progress;
};

// Helper function to determine if a deliverable uses binary progress
const isBinaryProgress = (progress: WorkProgress): progress is Binary => {
  return (
    progress != null && "done" in progress && typeof progress.done === "boolean"
  );
};

// Helper function to calculate percentage equivalent for any progress type
const getPercentageEquivalent = (deliverable: Deliverable): number => {
  const progress = deliverable.workProgress;
  if (!progress) {
    return 0;
  }

  if (isPercentageProgress(progress)) {
    return progress.value;
  }

  if (isStoryPointsProgress(progress)) {
    return progress.total > 0 ? (progress.completed / progress.total) * 100 : 0;
  }

  if (isBinaryProgress(progress)) {
    if (deliverable.status === "IN_PROGRESS") {
      return 50;
    }
    return progress.done ? 100 : 0;
  }

  return 0;
};

// Helper function to check if deliverable should be ignored
const shouldIgnoreDeliverable = (deliverable: Deliverable): boolean => {
  return deliverable.status === "CANCELED" || deliverable.status === "WONT_DO";
};

// Helper function to calculate progress for a single deliverable set
const calculateDeliverableSetProgress = (
  state: ScopeOfWorkState,
  deliverableSet: DeliverablesSet,
) => {
  // Get all deliverables in this set, filtering out ignored ones
  const deliverables = deliverableSet.deliverables
    .map((id) => state.deliverables.find((d) => d.id === id))
    .filter(
      (deliverable): deliverable is Deliverable =>
        deliverable !== undefined && !shouldIgnoreDeliverable(deliverable),
    );

  if (deliverables.length === 0) {
    // No valid deliverables, set default progress
    deliverableSet.progress = { value: 0 };
    deliverableSet.deliverablesCompleted = { total: 0, completed: 0 };
    return;
  }

  // Determine if ALL deliverables use story points
  const allUseStoryPoints = deliverables.every(
    (d) => d.workProgress && isStoryPointsProgress(d.workProgress),
  );

  if (allUseStoryPoints) {
    // 3.a) If StoryPoints only => deliverableSet.progress.completed = Sum (completed[i]), deliverableSet.progress.total = Sum (total[i])
    const storyPoints = deliverables
      .map((deliverable) => deliverable.workProgress)
      .filter(isStoryPointsProgress);

    deliverableSet.progress = {
      total: storyPoints.reduce((sum, p) => sum + p.total, 0),
      completed: storyPoints.reduce((sum, p) => sum + p.completed, 0),
    };
  } else {
    // 3.b) If !storyPointsOnly => AVERAGE (percentageCompletedEquivalent[i])
    const percentages = deliverables.map((d) => getPercentageEquivalent(d));
    // deliverables.length > 0 is guaranteed above, so percentages is non-empty.
    const averagePercentage =
      percentages.reduce((sum, p) => sum + p, 0) / percentages.length;

    deliverableSet.progress = {
      value: Math.round(averagePercentage * 100) / 100, // Round to 2 decimal places
    };
  }

  // Update deliverablesCompleted count
  const completedDeliverables = deliverables.filter(
    (d) =>
      d.status === "DELIVERED" ||
      (d.workProgress &&
        isBinaryProgress(d.workProgress) &&
        d.workProgress.done),
  );

  deliverableSet.deliverablesCompleted = {
    total: deliverables.length,
    completed: completedDeliverables.length,
  };
};

const calculateDeliverableSetsProgress = (state: ScopeOfWorkState) => {
  // run through all deliverable sets in milestones, projects and calculate the progress from each deliverable
  // The progress has to be calculated for each deliverableSet inside a milestone or project
  /* For every set
    1) Remove / ignore CANCELLED or WONT_DO deliverables
    2) Determine storyPointsOnly = true or false
      if storyPointsOnly = true => set progress to StoryPoints on deliverableSet
      if storyPointsOnly = false => set progress to Percentage on deliverableSet
    (completed / total) * 100
    3.a) If StoryPoints only => deliverableSet.progress.completed = Sum (completed[i]), deliverableSet.progress.total = Sum (total[i])
    3.b) If !storyPointsOnly => AVERAGE (percentageCompletedEquivalent[i])
    percentageCompletedEquivalent[i] = 
    Progress.percentage ? percentageValue
    Progress.storyPoints ? completed / total
    Progress.binary ? (status = IN_PROGESS ) : 50% : ( completed ? 100 : 0 ))

  */

  // Process all deliverable sets in projects
  state.projects.forEach((project) => {
    if (project.scope) {
      calculateDeliverableSetProgress(state, project.scope);
    }
  });

  // Process all deliverable sets in milestones
  state.roadmaps.forEach((roadmap) => {
    roadmap.milestones.forEach((milestone) => {
      if (milestone.scope) {
        calculateDeliverableSetProgress(state, milestone.scope);
      }
    });
  });
};
