import type { LeadFunnelActivitiesOperations } from "document-models/lead-funnel/v1";
import {
  ActivityNotFoundError,
  DuplicateActivityIdError,
  LeadNotFoundError,
} from "../../gen/activities/error.js";

export const leadFunnelActivitiesOperations: LeadFunnelActivitiesOperations = {
  addActivityOperation(state, action) {
    const lead = state.leads.find((l) => l.id === action.input.leadId);
    if (!lead) {
      throw new LeadNotFoundError(
        `Lead with id ${action.input.leadId} not found`,
      );
    }
    if (lead.activities.some((a) => a.id === action.input.id)) {
      throw new DuplicateActivityIdError(
        `Activity with id ${action.input.id} already exists`,
      );
    }
    lead.activities.push({
      id: action.input.id,
      type: action.input.type,
      note: action.input.note || null,
      timestamp: action.input.timestamp,
    });
    lead.updatedAt = action.input.timestamp;
  },
  deleteActivityOperation(state, action) {
    const lead = state.leads.find((l) => l.id === action.input.leadId);
    if (!lead) {
      throw new LeadNotFoundError(
        `Lead with id ${action.input.leadId} not found`,
      );
    }
    const index = lead.activities.findIndex((a) => a.id === action.input.id);
    if (index === -1) {
      throw new ActivityNotFoundError(
        `Activity with id ${action.input.id} not found`,
      );
    }
    lead.activities.splice(index, 1);
    lead.updatedAt = action.input.timestamp;
  },
};
