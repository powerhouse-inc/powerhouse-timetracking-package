/**
 * WARNING: DO NOT EDIT
 * This file is auto-generated and updated by codegen
 */
import { type SignalDispatch } from "document-model";
import type { ContentGlobalState } from "../types.js";
import type {
  AdvanceStageAction,
  AssignOwnerAction,
  KillAction,
  ParkAction,
  PublishAction,
  ResumeAction,
} from "./actions.js";

export interface ContentLifecycleOperations {
  assignOwnerOperation: (
    state: ContentGlobalState,
    action: AssignOwnerAction,
    dispatch?: SignalDispatch,
  ) => void;
  advanceStageOperation: (
    state: ContentGlobalState,
    action: AdvanceStageAction,
    dispatch?: SignalDispatch,
  ) => void;
  publishOperation: (
    state: ContentGlobalState,
    action: PublishAction,
    dispatch?: SignalDispatch,
  ) => void;
  parkOperation: (
    state: ContentGlobalState,
    action: ParkAction,
    dispatch?: SignalDispatch,
  ) => void;
  killOperation: (
    state: ContentGlobalState,
    action: KillAction,
    dispatch?: SignalDispatch,
  ) => void;
  resumeOperation: (
    state: ContentGlobalState,
    action: ResumeAction,
    dispatch?: SignalDispatch,
  ) => void;
}
