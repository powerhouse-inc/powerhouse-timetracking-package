/**
 * WARNING: DO NOT EDIT
 * This file is auto-generated and updated by codegen
 */
import type { PHBaseState, PHDocument } from "document-model";
import type { SurveyAction } from "./actions.js";
import type { SurveyState as SurveyGlobalState } from "./schema/types.js";

type SurveyLocalState = Record<PropertyKey, never>;

type SurveyPHState = PHBaseState & {
  global: SurveyGlobalState;
  local: SurveyLocalState;
};
type SurveyDocument = PHDocument<SurveyPHState>;

export * from "./schema/types.js";

export type {
  SurveyAction,
  SurveyDocument,
  SurveyGlobalState,
  SurveyLocalState,
  SurveyPHState,
};
