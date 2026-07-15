/**
 * WARNING: DO NOT EDIT
 * This file is auto-generated and updated by codegen
 * Factory methods for creating LeadFunnelDocument instances
 */
import type { PHAuthState, PHBaseState, PHDocumentState } from "document-model";
import { createBaseState, defaultBaseState } from "document-model";
import type {
  LeadFunnelDocument,
  LeadFunnelGlobalState,
  LeadFunnelLocalState,
  LeadFunnelPHState,
} from "./types.js";
import { utils } from "./utils.js";

export function defaultGlobalState(): LeadFunnelGlobalState {
  return { name: "Lead Funnel", leads: [] };
}

export function defaultLocalState(): LeadFunnelLocalState {
  return {};
}

export function defaultPHState(): LeadFunnelPHState {
  return {
    ...defaultBaseState(),
    global: defaultGlobalState(),
    local: defaultLocalState(),
  };
}

export function createGlobalState(
  state?: Partial<LeadFunnelGlobalState>,
): LeadFunnelGlobalState {
  return {
    ...defaultGlobalState(),
    ...(state || {}),
  };
}

export function createLocalState(
  state?: Partial<LeadFunnelLocalState>,
): LeadFunnelLocalState {
  return {
    ...defaultLocalState(),
    ...(state || {}),
  } as LeadFunnelLocalState;
}

export function createState(
  baseState?: Partial<PHBaseState>,
  globalState?: Partial<LeadFunnelGlobalState>,
  localState?: Partial<LeadFunnelLocalState>,
): LeadFunnelPHState {
  return {
    ...createBaseState(baseState?.auth, baseState?.document),
    global: createGlobalState(globalState),
    local: createLocalState(localState),
  };
}

/**
 * Creates a LeadFunnelDocument with custom global and local state
 * This properly handles the PHBaseState requirements while allowing
 * document-specific state to be set.
 */
export function createLeadFunnelDocument(
  state?: Partial<{
    auth?: Partial<PHAuthState>;
    document?: Partial<PHDocumentState>;
    global?: Partial<LeadFunnelGlobalState>;
    local?: Partial<LeadFunnelLocalState>;
  }>,
): LeadFunnelDocument {
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
