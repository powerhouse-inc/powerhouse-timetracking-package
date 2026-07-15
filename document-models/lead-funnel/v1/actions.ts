/**
 * WARNING: DO NOT EDIT
 * This file is auto-generated and updated by codegen
 */
import { baseActions } from "document-model";
import {
  leadFunnelActivitiesActions,
  leadFunnelFunnelActions,
  leadFunnelLeadsActions,
  leadFunnelTagsActions,
} from "./gen/creators.js";

/** Actions for the LeadFunnel document model */

export const actions = {
  ...baseActions,
  ...leadFunnelFunnelActions,
  ...leadFunnelLeadsActions,
  ...leadFunnelActivitiesActions,
  ...leadFunnelTagsActions,
};
