/**
 * WARNING: DO NOT EDIT
 * This file is auto-generated and updated by codegen
 */
import type { PHBaseState, PHDocument } from "document-model";
import type { TimesheetAction } from "./actions.js";
import type { TimesheetState as TimesheetGlobalState } from "./schema/types.js";

type TimesheetLocalState = Record<PropertyKey, never>;

type TimesheetPHState = PHBaseState & {
  global: TimesheetGlobalState;
  local: TimesheetLocalState;
};
type TimesheetDocument = PHDocument<TimesheetPHState>;

export * from "./schema/types.js";

export type {
  TimesheetAction,
  TimesheetDocument,
  TimesheetGlobalState,
  TimesheetLocalState,
  TimesheetPHState,
};
