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
import { leadFunnelUpgradeManifest } from "../../upgrades/upgrade-manifest.js";
import {
  assertIsLeadFunnelDocument,
  assertIsLeadFunnelState,
  isLeadFunnelDocument,
  isLeadFunnelState,
} from "./document-schema.js";
import { leadFunnelDocumentType } from "./document-type.js";
import { reducer } from "./reducer.js";
import type {
  LeadFunnelGlobalState,
  LeadFunnelLocalState,
  LeadFunnelPHState,
} from "./types.js";

export const initialGlobalState: LeadFunnelGlobalState = {
  name: "Lead Funnel",
  leads: [],
};
export const initialLocalState: LeadFunnelLocalState = {};

export const utils: DocumentModelUtils<LeadFunnelPHState> = {
  fileExtension: "lfnl",
  createState(state) {
    return {
      ...defaultBaseState(),
      global: { ...initialGlobalState, ...state?.global },
      local: { ...initialLocalState, ...state?.local },
    };
  },
  createDocument(state) {
    return baseCreateDocument(utils.createState, state, leadFunnelDocumentType);
  },
  saveToFileHandle(document, input) {
    return baseSaveToFileHandle(document, input);
  },
  loadFromInput(input) {
    return baseLoadFromInputVersioned(input, {
      reducers: { 1: reducer as unknown as Reducer<PHBaseState> },
      upgradeManifest: leadFunnelUpgradeManifest,
    });
  },
  isStateOfType(state) {
    return isLeadFunnelState(state);
  },
  assertIsStateOfType(state) {
    return assertIsLeadFunnelState(state);
  },
  isDocumentOfType(document) {
    return isLeadFunnelDocument(document);
  },
  assertIsDocumentOfType(document) {
    return assertIsLeadFunnelDocument(document);
  },
};
