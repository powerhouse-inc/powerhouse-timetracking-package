/**
 * WARNING: DO NOT EDIT
 * This file is auto-generated and updated by codegen
 * Factory methods for creating SurveyDocument instances
 */
import type { PHAuthState, PHBaseState, PHDocumentState } from "document-model";
import { createBaseState, defaultBaseState } from "document-model";
import type {
  SurveyDocument,
  SurveyGlobalState,
  SurveyLocalState,
  SurveyPHState,
} from "./types.js";
import { utils } from "./utils.js";

export function defaultGlobalState(): SurveyGlobalState {
  return {
    title: "",
    description: null,
    kind: "SURVEY",
    status: "DRAFT",
    shareToken: null,
    clientId: null,
    clientName: null,
    sections: [],
    questions: [],
    responses: [],
    createdAt: null,
    publishedAt: null,
    closedAt: null,
  };
}

export function defaultLocalState(): SurveyLocalState {
  return {};
}

export function defaultPHState(): SurveyPHState {
  return {
    ...defaultBaseState(),
    global: defaultGlobalState(),
    local: defaultLocalState(),
  };
}

export function createGlobalState(
  state?: Partial<SurveyGlobalState>,
): SurveyGlobalState {
  return {
    ...defaultGlobalState(),
    ...(state || {}),
  };
}

export function createLocalState(
  state?: Partial<SurveyLocalState>,
): SurveyLocalState {
  return {
    ...defaultLocalState(),
    ...(state || {}),
  } as SurveyLocalState;
}

export function createState(
  baseState?: Partial<PHBaseState>,
  globalState?: Partial<SurveyGlobalState>,
  localState?: Partial<SurveyLocalState>,
): SurveyPHState {
  return {
    ...createBaseState(baseState?.auth, baseState?.document),
    global: createGlobalState(globalState),
    local: createLocalState(localState),
  };
}

/**
 * Creates a SurveyDocument with custom global and local state
 * This properly handles the PHBaseState requirements while allowing
 * document-specific state to be set.
 */
export function createSurveyDocument(
  state?: Partial<{
    auth?: Partial<PHAuthState>;
    document?: Partial<PHDocumentState>;
    global?: Partial<SurveyGlobalState>;
    local?: Partial<SurveyLocalState>;
  }>,
): SurveyDocument {
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
