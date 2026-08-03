/**
 * WARNING: DO NOT EDIT
 * This file is auto-generated and updated by codegen
 * Factory methods for creating ContentDocument instances
 */
import type { PHAuthState, PHBaseState, PHDocumentState } from "document-model";
import { createBaseState, defaultBaseState } from "document-model";
import type {
  ContentDocument,
  ContentGlobalState,
  ContentLocalState,
  ContentPHState,
} from "./types.js";
import { utils } from "./utils.js";

export function defaultGlobalState(): ContentGlobalState {
  return {
    title: "",
    brief: null,
    format: "POST",
    channels: [],
    currentStage: "IDEA",
    status: "ACTIVE",
    dispositionReason: null,
    owner: null,
    targetDate: null,
    publishedUrl: null,
    publishedDate: null,
    draftUrl: null,
    assetLinks: [],
    campaignId: null,
    campaignName: null,
    history: [],
    createdAt: null,
    updatedAt: null,
  };
}

export function defaultLocalState(): ContentLocalState {
  return {};
}

export function defaultPHState(): ContentPHState {
  return {
    ...defaultBaseState(),
    global: defaultGlobalState(),
    local: defaultLocalState(),
  };
}

export function createGlobalState(
  state?: Partial<ContentGlobalState>,
): ContentGlobalState {
  return {
    ...defaultGlobalState(),
    ...(state || {}),
  };
}

export function createLocalState(
  state?: Partial<ContentLocalState>,
): ContentLocalState {
  return {
    ...defaultLocalState(),
    ...(state || {}),
  } as ContentLocalState;
}

export function createState(
  baseState?: Partial<PHBaseState>,
  globalState?: Partial<ContentGlobalState>,
  localState?: Partial<ContentLocalState>,
): ContentPHState {
  return {
    ...createBaseState(baseState?.auth, baseState?.document),
    global: createGlobalState(globalState),
    local: createLocalState(localState),
  };
}

/**
 * Creates a ContentDocument with custom global and local state
 * This properly handles the PHBaseState requirements while allowing
 * document-specific state to be set.
 */
export function createContentDocument(
  state?: Partial<{
    auth?: Partial<PHAuthState>;
    document?: Partial<PHDocumentState>;
    global?: Partial<ContentGlobalState>;
    local?: Partial<ContentLocalState>;
  }>,
): ContentDocument {
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
