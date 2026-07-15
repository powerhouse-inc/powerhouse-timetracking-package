/**
 * WARNING: DO NOT EDIT
 * This file is auto-generated and updated by codegen
 */
import type { PHBaseState, PHDocument } from "document-model";
import type { LeadFunnelAction } from "./actions.js";
import type { LeadFunnelState as LeadFunnelGlobalState } from "./schema/types.js";

type LeadFunnelLocalState = Record<PropertyKey, never>;

type LeadFunnelPHState = PHBaseState & {
  global: LeadFunnelGlobalState;
  local: LeadFunnelLocalState;
};
type LeadFunnelDocument = PHDocument<LeadFunnelPHState>;

export * from "./schema/types.js";

export type {
  LeadFunnelAction,
  LeadFunnelDocument,
  LeadFunnelGlobalState,
  LeadFunnelLocalState,
  LeadFunnelPHState,
};
