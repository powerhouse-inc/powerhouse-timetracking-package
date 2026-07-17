/**
 * WARNING: DO NOT EDIT
 * This file is auto-generated and updated by codegen
 */
import type { DocumentModelUtils, PHBaseState, Reducer } from "document-model";
import {
  baseCreateDocument,
  baseLoadFromInputVersioned,
  baseSaveToFileHandle,
  defaultBaseState,
} from "document-model";
import { surveyUpgradeManifest } from "../../upgrades/upgrade-manifest.js";
import {
  assertIsSurveyDocument,
  assertIsSurveyState,
  isSurveyDocument,
  isSurveyState,
} from "./document-schema.js";
import { surveyDocumentType } from "./document-type.js";
import { reducer } from "./reducer.js";
import type {
  SurveyGlobalState,
  SurveyLocalState,
  SurveyPHState,
} from "./types.js";

export const initialGlobalState: SurveyGlobalState = {
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
export const initialLocalState: SurveyLocalState = {};

export const utils: DocumentModelUtils<SurveyPHState> = {
  fileExtension: "svy",
  createState(state) {
    return {
      ...defaultBaseState(),
      global: { ...initialGlobalState, ...state?.global },
      local: { ...initialLocalState, ...state?.local },
    };
  },
  createDocument(state) {
    return baseCreateDocument(utils.createState, state, surveyDocumentType);
  },
  saveToFileHandle(document, input) {
    return baseSaveToFileHandle(document, input);
  },
  loadFromInput(input) {
    return baseLoadFromInputVersioned(input, {
      reducers: { 1: reducer as unknown as Reducer<PHBaseState> },
      upgradeManifest: surveyUpgradeManifest,
    });
  },
  isStateOfType(state) {
    return isSurveyState(state);
  },
  assertIsStateOfType(state) {
    return assertIsSurveyState(state);
  },
  isDocumentOfType(document) {
    return isSurveyDocument(document);
  },
  assertIsDocumentOfType(document) {
    return assertIsSurveyDocument(document);
  },
};
