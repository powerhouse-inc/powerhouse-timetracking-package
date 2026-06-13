/**
 * WARNING: DO NOT EDIT
 * This file is auto-generated and updated by codegen
 * Factory methods for creating TimetrackingWorkspaceDocument instances
 */
import type { PHAuthState, PHBaseState, PHDocumentState } from "document-model";
import { createBaseState, defaultBaseState } from "document-model";
import type {
  TimetrackingWorkspaceDocument,
  TimetrackingWorkspaceGlobalState,
  TimetrackingWorkspaceLocalState,
  TimetrackingWorkspacePHState,
} from "./types.js";
import { utils } from "./utils.js";

export function defaultGlobalState(): TimetrackingWorkspaceGlobalState {
  return { name: "", members: [], clients: [], projects: [] };
}

export function defaultLocalState(): TimetrackingWorkspaceLocalState {
  return {};
}

export function defaultPHState(): TimetrackingWorkspacePHState {
  return {
    ...defaultBaseState(),
    global: defaultGlobalState(),
    local: defaultLocalState(),
  };
}

export function createGlobalState(
  state?: Partial<TimetrackingWorkspaceGlobalState>,
): TimetrackingWorkspaceGlobalState {
  return {
    ...defaultGlobalState(),
    ...(state || {}),
  };
}

export function createLocalState(
  state?: Partial<TimetrackingWorkspaceLocalState>,
): TimetrackingWorkspaceLocalState {
  return {
    ...defaultLocalState(),
    ...(state || {}),
  } as TimetrackingWorkspaceLocalState;
}

export function createState(
  baseState?: Partial<PHBaseState>,
  globalState?: Partial<TimetrackingWorkspaceGlobalState>,
  localState?: Partial<TimetrackingWorkspaceLocalState>,
): TimetrackingWorkspacePHState {
  return {
    ...createBaseState(baseState?.auth, baseState?.document),
    global: createGlobalState(globalState),
    local: createLocalState(localState),
  };
}

/**
 * Creates a TimetrackingWorkspaceDocument with custom global and local state
 * This properly handles the PHBaseState requirements while allowing
 * document-specific state to be set.
 */
export function createTimetrackingWorkspaceDocument(
  state?: Partial<{
    auth?: Partial<PHAuthState>;
    document?: Partial<PHDocumentState>;
    global?: Partial<TimetrackingWorkspaceGlobalState>;
    local?: Partial<TimetrackingWorkspaceLocalState>;
  }>,
): TimetrackingWorkspaceDocument {
  const document = utils.createDocument(
    state
      ? createState(
          createBaseState(state.auth, state.document),
          state.global,
          state.local,
        )
      : undefined,
  );

  return document;
}
