import type { ContentLifecycleOperations } from "document-models/content/v1";
import {
  CannotResumeKilledError,
  DispositionReasonRequiredError,
  EmptyOwnerError,
  InvalidStageTransitionError,
  ItemNotActiveError,
  OwnerRequiredError,
} from "../../gen/lifecycle/error.js";

export const contentLifecycleOperations: ContentLifecycleOperations = {
  assignOwnerOperation(state, action) {
    if (!action.input.owner.trim()) {
      throw new EmptyOwnerError("An owner name is required");
    }
    state.owner = action.input.owner;
    state.updatedAt = action.input.timestamp;
  },
  advanceStageOperation(state, action) {
    if (state.status !== "ACTIVE") {
      throw new ItemNotActiveError("Only an active item can change stage");
    }
    const from = state.currentStage;
    const to = action.input.toStage;
    if (to === "PUBLISHED") {
      throw new InvalidStageTransitionError(
        "Use PUBLISH to move an item to PUBLISHED",
      );
    }
    const allowed: Record<string, string[]> = {
      IDEA: ["DRAFTING"],
      DRAFTING: ["REVIEW"],
      REVIEW: ["SCHEDULED", "DRAFTING"],
      SCHEDULED: [],
      PUBLISHED: ["REPURPOSE"],
      REPURPOSE: ["IDEA", "DRAFTING"],
    };
    if (!allowed[from].includes(to)) {
      throw new InvalidStageTransitionError(
        `Cannot move from ${from} to ${to}`,
      );
    }
    if (from === "IDEA" && !state.owner) {
      throw new OwnerRequiredError(
        "Assign an owner before leaving the IDEA stage",
      );
    }
    state.currentStage = to;
    state.updatedAt = action.input.timestamp;
    state.history.push({
      id: action.input.eventId,
      fromStage: from,
      toStage: to,
      actor: action.input.actor || null,
      timestamp: action.input.timestamp,
      note: action.input.note || null,
    });
  },
  publishOperation(state, action) {
    if (state.status !== "ACTIVE") {
      throw new ItemNotActiveError("Only an active item can be published");
    }
    const from = state.currentStage;
    if (from !== "SCHEDULED") {
      throw new InvalidStageTransitionError(
        "Only a scheduled item can be published",
      );
    }
    state.publishedUrl = action.input.publishedUrl;
    state.publishedDate = action.input.publishedDate;
    state.currentStage = "PUBLISHED";
    state.updatedAt = action.input.timestamp;
    state.history.push({
      id: action.input.eventId,
      fromStage: from,
      toStage: "PUBLISHED",
      actor: action.input.actor || null,
      timestamp: action.input.timestamp,
      note: action.input.note || null,
    });
  },
  parkOperation(state, action) {
    if (state.status === "KILLED") {
      throw new ItemNotActiveError("A killed item cannot be parked");
    }
    if (!action.input.reason.trim()) {
      throw new DispositionReasonRequiredError(
        "A reason is required to park an item",
      );
    }
    state.status = "PARKED";
    state.dispositionReason = action.input.reason;
    state.updatedAt = action.input.timestamp;
    state.history.push({
      id: action.input.eventId,
      fromStage: state.currentStage,
      toStage: state.currentStage,
      actor: action.input.actor || null,
      timestamp: action.input.timestamp,
      note: `Parked: ${action.input.reason}`,
    });
  },
  killOperation(state, action) {
    if (state.status === "KILLED") {
      throw new ItemNotActiveError("The item is already killed");
    }
    if (!action.input.reason.trim()) {
      throw new DispositionReasonRequiredError(
        "A reason is required to kill an item",
      );
    }
    state.status = "KILLED";
    state.dispositionReason = action.input.reason;
    state.updatedAt = action.input.timestamp;
    state.history.push({
      id: action.input.eventId,
      fromStage: state.currentStage,
      toStage: state.currentStage,
      actor: action.input.actor || null,
      timestamp: action.input.timestamp,
      note: `Killed: ${action.input.reason}`,
    });
  },
  resumeOperation(state, action) {
    if (state.status === "KILLED") {
      throw new CannotResumeKilledError("A killed item cannot be resumed");
    }
    state.status = "ACTIVE";
    state.dispositionReason = null;
    state.updatedAt = action.input.timestamp;
    state.history.push({
      id: action.input.eventId,
      fromStage: state.currentStage,
      toStage: state.currentStage,
      actor: action.input.actor || null,
      timestamp: action.input.timestamp,
      note: "Resumed",
    });
  },
};
