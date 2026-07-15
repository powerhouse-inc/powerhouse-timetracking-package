import type { LeadFunnelTagsOperations } from "document-models/lead-funnel/v1";
import {
  DuplicateTagError,
  LeadNotFoundError,
  TagNotFoundError,
} from "../../gen/tags/error.js";

export const leadFunnelTagsOperations: LeadFunnelTagsOperations = {
  addTagOperation(state, action) {
    const lead = state.leads.find((l) => l.id === action.input.leadId);
    if (!lead) {
      throw new LeadNotFoundError(
        `Lead with id ${action.input.leadId} not found`,
      );
    }
    if (lead.tags.includes(action.input.tag)) {
      throw new DuplicateTagError(
        `Tag ${action.input.tag} already exists on this lead`,
      );
    }
    lead.tags.push(action.input.tag);
  },
  removeTagOperation(state, action) {
    const lead = state.leads.find((l) => l.id === action.input.leadId);
    if (!lead) {
      throw new LeadNotFoundError(
        `Lead with id ${action.input.leadId} not found`,
      );
    }
    const index = lead.tags.indexOf(action.input.tag);
    if (index === -1) {
      throw new TagNotFoundError(
        `Tag ${action.input.tag} not found on this lead`,
      );
    }
    lead.tags.splice(index, 1);
  },
};
