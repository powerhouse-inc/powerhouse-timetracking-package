/**
 * WARNING: DO NOT EDIT
 * This file is auto-generated and updated by codegen
 */
import type { LeadFunnelActivitiesAction } from "./activities/actions.js";
import type { LeadFunnelFunnelAction } from "./funnel/actions.js";
import type { LeadFunnelLeadsAction } from "./leads/actions.js";
import type { LeadFunnelTagsAction } from "./tags/actions.js";

export * from "./activities/actions.js";
export * from "./funnel/actions.js";
export * from "./leads/actions.js";
export * from "./tags/actions.js";

export type LeadFunnelAction =
  | LeadFunnelFunnelAction
  | LeadFunnelLeadsAction
  | LeadFunnelActivitiesAction
  | LeadFunnelTagsAction;
