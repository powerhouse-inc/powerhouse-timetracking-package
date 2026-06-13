/**
 * WARNING: DO NOT EDIT
 * This file is auto-generated and updated by codegen
 */
import type { PHBaseState, PHDocument } from "document-model";
import type { TimetrackingWorkspaceAction } from "./actions.js";
import type { TimetrackingWorkspaceState as TimetrackingWorkspaceGlobalState } from "./schema/types.js";

type TimetrackingWorkspaceLocalState = Record<PropertyKey, never>;

type TimetrackingWorkspacePHState = PHBaseState & {
  global: TimetrackingWorkspaceGlobalState;
  local: TimetrackingWorkspaceLocalState;
};
type TimetrackingWorkspaceDocument = PHDocument<TimetrackingWorkspacePHState>;

export * from "./schema/types.js";

export type {
  TimetrackingWorkspaceAction,
  TimetrackingWorkspaceDocument,
  TimetrackingWorkspaceGlobalState,
  TimetrackingWorkspaceLocalState,
  TimetrackingWorkspacePHState,
};
