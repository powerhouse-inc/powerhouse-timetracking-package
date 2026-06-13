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
import { timetrackingWorkspaceUpgradeManifest } from "../../upgrades/upgrade-manifest.js";
import {
  assertIsTimetrackingWorkspaceDocument,
  assertIsTimetrackingWorkspaceState,
  isTimetrackingWorkspaceDocument,
  isTimetrackingWorkspaceState,
} from "./document-schema.js";
import { timetrackingWorkspaceDocumentType } from "./document-type.js";
import { reducer } from "./reducer.js";
import type {
  TimetrackingWorkspaceGlobalState,
  TimetrackingWorkspaceLocalState,
  TimetrackingWorkspacePHState,
} from "./types.js";

export const initialGlobalState: TimetrackingWorkspaceGlobalState = {
  name: "",
  members: [],
  clients: [],
  projects: [],
};
export const initialLocalState: TimetrackingWorkspaceLocalState = {};

export const utils: DocumentModelUtils<TimetrackingWorkspacePHState> = {
  fileExtension: "phtw",
  createState(state) {
    return {
      ...defaultBaseState(),
      global: { ...initialGlobalState, ...state?.global },
      local: { ...initialLocalState, ...state?.local },
    };
  },
  createDocument(state) {
    return baseCreateDocument(
      utils.createState,
      state,
      timetrackingWorkspaceDocumentType,
    );
  },
  saveToFileHandle(document, input) {
    return baseSaveToFileHandle(document, input);
  },
  loadFromInput(input) {
    return baseLoadFromInputVersioned(input, {
      reducers: { 1: reducer as unknown as Reducer<PHBaseState> },
      upgradeManifest: timetrackingWorkspaceUpgradeManifest,
    });
  },
  isStateOfType(state) {
    return isTimetrackingWorkspaceState(state);
  },
  assertIsStateOfType(state) {
    return assertIsTimetrackingWorkspaceState(state);
  },
  isDocumentOfType(document) {
    return isTimetrackingWorkspaceDocument(document);
  },
  assertIsDocumentOfType(document) {
    return assertIsTimetrackingWorkspaceDocument(document);
  },
};
