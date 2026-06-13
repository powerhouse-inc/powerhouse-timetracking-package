/**
 * WARNING: DO NOT EDIT
 * This file is auto-generated and updated by codegen
 */
import type { Action } from "document-model";
import type {
  AddEntryInput,
  DeleteEntryInput,
  DiscardTimerInput,
  SetOwnerInput,
  StartTimerInput,
  StopTimerInput,
  UpdateEntryInput,
} from "../types.js";

export type SetOwnerAction = Action & {
  type: "SET_OWNER";
  input: SetOwnerInput;
};
export type StartTimerAction = Action & {
  type: "START_TIMER";
  input: StartTimerInput;
};
export type StopTimerAction = Action & {
  type: "STOP_TIMER";
  input: StopTimerInput;
};
export type DiscardTimerAction = Action & {
  type: "DISCARD_TIMER";
  input: DiscardTimerInput;
};
export type AddEntryAction = Action & {
  type: "ADD_ENTRY";
  input: AddEntryInput;
};
export type UpdateEntryAction = Action & {
  type: "UPDATE_ENTRY";
  input: UpdateEntryInput;
};
export type DeleteEntryAction = Action & {
  type: "DELETE_ENTRY";
  input: DeleteEntryInput;
};

export type TimesheetTrackingAction =
  | SetOwnerAction
  | StartTimerAction
  | StopTimerAction
  | DiscardTimerAction
  | AddEntryAction
  | UpdateEntryAction
  | DeleteEntryAction;
