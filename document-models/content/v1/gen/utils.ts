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
import { contentUpgradeManifest } from "../../upgrades/upgrade-manifest.js";
import {
  assertIsContentDocument,
  assertIsContentState,
  isContentDocument,
  isContentState,
} from "./document-schema.js";
import { contentDocumentType } from "./document-type.js";
import { reducer } from "./reducer.js";
import type {
  ContentGlobalState,
  ContentLocalState,
  ContentPHState,
} from "./types.js";

export const initialGlobalState: ContentGlobalState = {
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
export const initialLocalState: ContentLocalState = {};

export const utils: DocumentModelUtils<ContentPHState> = {
  fileExtension: "cnt",
  createState(state) {
    return {
      ...defaultBaseState(),
      global: { ...initialGlobalState, ...state?.global },
      local: { ...initialLocalState, ...state?.local },
    };
  },
  createDocument(state) {
    return baseCreateDocument(utils.createState, state, contentDocumentType);
  },
  saveToFileHandle(document, input) {
    return baseSaveToFileHandle(document, input);
  },
  loadFromInput(input) {
    return baseLoadFromInputVersioned(input, {
      reducers: { 1: reducer as unknown as Reducer<PHBaseState> },
      upgradeManifest: contentUpgradeManifest,
    });
  },
  isStateOfType(state) {
    return isContentState(state);
  },
  assertIsStateOfType(state) {
    return assertIsContentState(state);
  },
  isDocumentOfType(document) {
    return isContentDocument(document);
  },
  assertIsDocumentOfType(document) {
    return assertIsContentDocument(document);
  },
};
