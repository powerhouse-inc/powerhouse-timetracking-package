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
import { timesheetUpgradeManifest } from "../../upgrades/upgrade-manifest.js";
import {
  assertIsTimesheetDocument,
  assertIsTimesheetState,
  isTimesheetDocument,
  isTimesheetState,
} from "./document-schema.js";
import { timesheetDocumentType } from "./document-type.js";
import { reducer } from "./reducer.js";
import type {
  TimesheetGlobalState,
  TimesheetLocalState,
  TimesheetPHState,
} from "./types.js";

export const initialGlobalState: TimesheetGlobalState = {
  ownerAddress: null,
  entries: [],
  running: null,
};
export const initialLocalState: TimesheetLocalState = {};

export const utils: DocumentModelUtils<TimesheetPHState> = {
  fileExtension: "phts",
  createState(state) {
    return {
      ...defaultBaseState(),
      global: { ...initialGlobalState, ...state?.global },
      local: { ...initialLocalState, ...state?.local },
    };
  },
  createDocument(state) {
    return baseCreateDocument(utils.createState, state, timesheetDocumentType);
  },
  saveToFileHandle(document, input) {
    return baseSaveToFileHandle(document, input);
  },
  loadFromInput(input) {
    return baseLoadFromInputVersioned(input, {
      reducers: { 1: reducer as unknown as Reducer<PHBaseState> },
      upgradeManifest: timesheetUpgradeManifest,
    });
  },
  isStateOfType(state) {
    return isTimesheetState(state);
  },
  assertIsStateOfType(state) {
    return assertIsTimesheetState(state);
  },
  isDocumentOfType(document) {
    return isTimesheetDocument(document);
  },
  assertIsDocumentOfType(document) {
    return assertIsTimesheetDocument(document);
  },
};
