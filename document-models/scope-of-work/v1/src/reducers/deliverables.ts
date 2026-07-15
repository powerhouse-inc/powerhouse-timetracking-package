import type { ScopeOfWorkDeliverablesOperations } from "document-models/scope-of-work/v1";
import type { Deliverable, KeyResult } from "../../gen/schema/types.js";
import { applyInvariants } from "./projects.js";

export const scopeOfWorkDeliverablesOperations: ScopeOfWorkDeliverablesOperations =
  {
    addDeliverableOperation(state, action) {
      const deliverable: Deliverable = {
        id: action.input.id,
        owner: action.input.owner || null,
        icon: null,
        title: action.input.title || "",
        code: action.input.code || "",
        description: action.input.description || "",
        status: action.input.status || "DRAFT",
        workProgress: null,
        keyResults: [],
        budgetAnchor: {
          project: "",
          unit: "Hours",
          unitCost: 0,
          quantity: 0,
          margin: 0,
        },
      };

      state.deliverables.push(deliverable);
    },
    removeDeliverableOperation(state, action) {
      const deliverable = state.deliverables.find(
        (deliverable) => String(deliverable.id) === String(action.input.id),
      );
      if (!deliverable) {
        throw new Error("Deliverable not found");
      }

      // remove deliverable from deliverable sets in milestone and project
      const roadmap = state.roadmaps.find((roadmap) =>
        roadmap.milestones.find((milestone) =>
          milestone?.scope?.deliverables?.includes(action.input.id),
        ),
      );
      const milestone = roadmap?.milestones.find((milestone) =>
        milestone?.scope?.deliverables?.includes(action.input.id),
      );
      if (milestone && milestone.scope) {
        milestone.scope.deliverables = milestone.scope.deliverables?.filter(
          (deliverable) => String(deliverable) !== String(action.input.id),
        );
      }

      const project = state.projects.find((project) =>
        project.scope?.deliverables.includes(action.input.id),
      );
      if (project && project.scope) {
        project.scope.deliverables = project.scope.deliverables?.filter(
          (deliverable) => String(deliverable) !== String(action.input.id),
        );
      }

      state.deliverables = state.deliverables.filter(
        (deliverable) => String(deliverable.id) !== String(action.input.id),
      );
      applyInvariants(state, ["budget", "margin", "progress"]);
    },
    editDeliverableOperation(state, action) {
      const deliverable = state.deliverables.find(
        (deliverable) => String(deliverable.id) === String(action.input.id),
      );
      if (!deliverable) {
        throw new Error("Deliverable not found");
      }

      const updatedDeliverable: Deliverable = {
        ...deliverable,
        owner:
          action.input.owner !== undefined
            ? action.input.owner
            : deliverable.owner,
        icon:
          action.input.icon !== undefined
            ? action.input.icon
            : deliverable.icon,
        title:
          action.input.title !== undefined
            ? (action.input.title ?? "")
            : deliverable.title,
        code:
          action.input.code !== undefined
            ? (action.input.code ?? "")
            : deliverable.code,
        description:
          action.input.description !== undefined
            ? (action.input.description ?? "")
            : deliverable.description,
        status:
          action.input.status !== undefined && action.input.status !== null
            ? action.input.status
            : deliverable.status,
      };

      state.deliverables = state.deliverables.map((deliverable) =>
        String(deliverable.id) === String(action.input.id)
          ? updatedDeliverable
          : deliverable,
      );
      applyInvariants(state, ["progress"]);
    },
    setDeliverableProgressOperation(state, action) {
      const deliverable = state.deliverables.find(
        (deliverable) => String(deliverable.id) === String(action.input.id),
      );
      if (!deliverable) {
        throw new Error("Deliverable not found");
      }

      const updatedDeliverable = {
        ...deliverable,
        workProgress: action.input.workProgress
          ? action.input.workProgress.percentage !== undefined &&
            action.input.workProgress.percentage !== null
            ? { value: action.input.workProgress.percentage }
            : action.input.workProgress.storyPoints
              ? {
                  total: action.input.workProgress.storyPoints.total,
                  completed: action.input.workProgress.storyPoints.completed,
                }
              : action.input.workProgress.done !== undefined &&
                  action.input.workProgress.done !== null
                ? { done: action.input.workProgress.done }
                : deliverable.workProgress
          : deliverable.workProgress,
      };

      updatedDeliverable.status = "IN_PROGRESS";
      if (
        deliverableIsCompleted(updatedDeliverable) &&
        !["WONT_DO", "DELIVERED", "CANCELED"].includes(
          updatedDeliverable.status,
        )
      ) {
        updatedDeliverable.status = "DELIVERED";
      }

      state.deliverables = state.deliverables.map((deliverable) =>
        String(deliverable.id) === String(action.input.id)
          ? updatedDeliverable
          : deliverable,
      );
      applyInvariants(state, ["progress"]);
    },
    addKeyResultOperation(state, action) {
      const updatedDeliverable = state.deliverables.find(
        (deliverable) =>
          String(deliverable.id) === String(action.input.deliverableId),
      );
      if (!updatedDeliverable) {
        throw new Error("Deliverable not found");
      }

      const keyResult = {
        id: action.input.id,
        title: action.input.title || "",
        link: action.input.link || "",
      };

      updatedDeliverable.keyResults.push(keyResult);
      state.deliverables = state.deliverables.map((deliverable) =>
        String(deliverable.id) === String(action.input.deliverableId)
          ? updatedDeliverable
          : deliverable,
      );
    },
    removeKeyResultOperation(state, action) {
      const updatedDeliverable = state.deliverables.find(
        (deliverable) =>
          String(deliverable.id) === String(action.input.deliverableId),
      );
      if (!updatedDeliverable) {
        throw new Error("Deliverable not found");
      }

      updatedDeliverable.keyResults = updatedDeliverable.keyResults.filter(
        (keyResult) => String(keyResult.id) !== String(action.input.id),
      );
      state.deliverables = state.deliverables.map((deliverable) =>
        String(deliverable.id) === String(action.input.deliverableId)
          ? updatedDeliverable
          : deliverable,
      );
    },
    editKeyResultOperation(state, action) {
      const updatedDeliverable = state.deliverables.find(
        (deliverable) =>
          String(deliverable.id) === String(action.input.deliverableId),
      );
      if (!updatedDeliverable) {
        throw new Error("Deliverable not found");
      }

      const keyResult = updatedDeliverable.keyResults.find(
        (keyResult) => String(keyResult.id) === String(action.input.id),
      );

      const updatedKeyResult = {
        ...keyResult,
        title: action.input.title || keyResult?.title,
        link: action.input.link || keyResult?.link,
      };

      updatedDeliverable.keyResults = updatedDeliverable.keyResults?.map(
        (keyResult) =>
          String(keyResult.id) === String(action.input.id)
            ? updatedKeyResult
            : keyResult,
      ) as KeyResult[];
      state.deliverables = state.deliverables.map((deliverable) =>
        String(deliverable.id) === String(action.input.deliverableId)
          ? updatedDeliverable
          : deliverable,
      );
    },
    setDeliverableBudgetAnchorProjectOperation(state, action) {
      const foundDeliverable = state.deliverables.find(
        (deliverable) =>
          String(deliverable.id) === String(action.input.deliverableId),
      );
      if (!foundDeliverable) {
        throw new Error("Deliverable not found");
      }

      Object.assign(foundDeliverable, {
        budgetAnchor: { ...foundDeliverable.budgetAnchor, ...action.input },
      });

      state.deliverables = state.deliverables.map((deliverable) =>
        String(deliverable.id) === String(action.input.deliverableId)
          ? foundDeliverable
          : deliverable,
      );

      // Only apply budget and progress invariants, not margin invariant when setting margin
      // This prevents the margin from being recalculated and overriding user input
      applyInvariants(state, ["budget", "progress"]);
    },
  };

const deliverableIsCompleted = (deliverable: Deliverable): boolean => {
  const progress = deliverable.workProgress;
  if (!progress) {
    return false;
  }

  if ("done" in progress && progress.done === true) {
    return true;
  }

  if ("value" in progress && progress.value === 100) {
    return true;
  }

  if (
    "total" in progress &&
    "completed" in progress &&
    progress.completed === progress.total &&
    progress.total > 0
  ) {
    return true;
  }

  return false;
};
