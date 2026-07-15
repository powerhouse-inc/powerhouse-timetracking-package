import type { LeadFunnelFunnelOperations } from "document-models/lead-funnel/v1";

export const leadFunnelFunnelOperations: LeadFunnelFunnelOperations = {
  setFunnelNameOperation(state, action) {
    state.name = action.input.name;
  },
};
