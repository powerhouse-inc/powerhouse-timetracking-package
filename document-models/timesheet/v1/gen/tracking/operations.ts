/**
 * WARNING: DO NOT EDIT
 * This file is auto-generated and updated by codegen
 */
import { type SignalDispatch } from "document-model";
import type { TimesheetGlobalState } from "../types.js";
import type {
  AddEntryAction,
  DeleteEntryAction,
  DiscardTimerAction,
  SetOwnerAction,
  StartTimerAction,
  StopTimerAction,
  UpdateEntryAction,
} from "./actions.js";

export interface TimesheetTrackingOperations {
  setOwnerOperation: (
    state: TimesheetGlobalState,
    action: SetOwnerAction,
    dispatch?: SignalDispatch,
  ) => void;
  startTimerOperation: (
    state: TimesheetGlobalState,
    action: StartTimerAction,
    dispatch?: SignalDispatch,
  ) => void;
  stopTimerOperation: (
    state: TimesheetGlobalState,
    action: StopTimerAction,
    dispatch?: SignalDispatch,
  ) => void;
  discardTimerOperation: (
    state: TimesheetGlobalState,
    action: DiscardTimerAction,
    dispatch?: SignalDispatch,
  ) => void;
  addEntryOperation: (
    state: TimesheetGlobalState,
    action: AddEntryAction,
    dispatch?: SignalDispatch,
  ) => void;
  updateEntryOperation: (
    state: TimesheetGlobalState,
    action: UpdateEntryAction,
    dispatch?: SignalDispatch,
  ) => void;
  deleteEntryOperation: (
    state: TimesheetGlobalState,
    action: DeleteEntryAction,
    dispatch?: SignalDispatch,
  ) => void;
}
