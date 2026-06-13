/**
 * WARNING: DO NOT EDIT
 * This file is auto-generated and updated by codegen
 * Factory methods for creating TimesheetDocument instances
 */
import type { PHAuthState, PHBaseState, PHDocumentState } from "document-model";
import { createBaseState, defaultBaseState } from "document-model";
import type {
  TimesheetDocument,
  TimesheetGlobalState,
  TimesheetLocalState,
  TimesheetPHState,
} from "./types.js";
import { utils } from "./utils.js";

export function defaultGlobalState(): TimesheetGlobalState {
  return { ownerAddress: null, entries: [], running: null };
}

export function defaultLocalState(): TimesheetLocalState {
  return {};
}

export function defaultPHState(): TimesheetPHState {
  return {
    ...defaultBaseState(),
    global: defaultGlobalState(),
    local: defaultLocalState(),
  };
}

export function createGlobalState(
  state?: Partial<TimesheetGlobalState>,
): TimesheetGlobalState {
  return {
    ...defaultGlobalState(),
    ...(state || {}),
  };
}

export function createLocalState(
  state?: Partial<TimesheetLocalState>,
): TimesheetLocalState {
  return {
    ...defaultLocalState(),
    ...(state || {}),
  } as TimesheetLocalState;
}

export function createState(
  baseState?: Partial<PHBaseState>,
  globalState?: Partial<TimesheetGlobalState>,
  localState?: Partial<TimesheetLocalState>,
): TimesheetPHState {
  return {
    ...createBaseState(baseState?.auth, baseState?.document),
    global: createGlobalState(globalState),
    local: createLocalState(localState),
  };
}

/**
 * Creates a TimesheetDocument with custom global and local state
 * This properly handles the PHBaseState requirements while allowing
 * document-specific state to be set.
 */
export function createTimesheetDocument(
  state?: Partial<{
    auth?: Partial<PHAuthState>;
    document?: Partial<PHDocumentState>;
    global?: Partial<TimesheetGlobalState>;
    local?: Partial<TimesheetLocalState>;
  }>,
): TimesheetDocument {
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
