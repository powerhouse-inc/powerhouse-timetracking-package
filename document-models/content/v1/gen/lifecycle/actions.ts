/**
 * WARNING: DO NOT EDIT
 * This file is auto-generated and updated by codegen
 */
import type { Action } from "document-model";
import type {
  AdvanceStageInput,
  AssignOwnerInput,
  KillInput,
  ParkInput,
  PublishInput,
  ResumeInput,
} from "../types.js";

export type AssignOwnerAction = Action & {
  type: "ASSIGN_OWNER";
  input: AssignOwnerInput;
};
export type AdvanceStageAction = Action & {
  type: "ADVANCE_STAGE";
  input: AdvanceStageInput;
};
export type PublishAction = Action & { type: "PUBLISH"; input: PublishInput };
export type ParkAction = Action & { type: "PARK"; input: ParkInput };
export type KillAction = Action & { type: "KILL"; input: KillInput };
export type ResumeAction = Action & { type: "RESUME"; input: ResumeInput };

export type ContentLifecycleAction =
  | AssignOwnerAction
  | AdvanceStageAction
  | PublishAction
  | ParkAction
  | KillAction
  | ResumeAction;
