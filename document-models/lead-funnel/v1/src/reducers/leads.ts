import type { LeadFunnelLeadsOperations } from "document-models/lead-funnel/v1";
import {
  DuplicateLeadIdError,
  LeadNotFoundError,
} from "../../gen/leads/error.js";

export const leadFunnelLeadsOperations: LeadFunnelLeadsOperations = {
  addLeadOperation(state, action) {
    if (state.leads.some((l) => l.id === action.input.id)) {
      throw new DuplicateLeadIdError(
        `Lead with id ${action.input.id} already exists`,
      );
    }
    state.leads.push({
      id: action.input.id,
      name: action.input.name,
      company: action.input.company || null,
      clientId: action.input.clientId || null,
      email: action.input.email || null,
      phone: action.input.phone || null,
      source: action.input.source || "OTHER",
      stage: "NEW",
      priority: action.input.priority || "MEDIUM",
      estimatedValue: action.input.estimatedValue || null,
      owner: action.input.owner || null,
      score: action.input.score ?? 0,
      tags: action.input.tags || [],
      notes: action.input.notes || null,
      activities: [],
      createdAt: action.input.createdAt,
      updatedAt: action.input.createdAt,
    });
  },
  updateLeadOperation(state, action) {
    const lead = state.leads.find((l) => l.id === action.input.id);
    if (!lead) {
      throw new LeadNotFoundError(`Lead with id ${action.input.id} not found`);
    }
    if (action.input.name) lead.name = action.input.name;
    if (action.input.company) lead.company = action.input.company;
    if (action.input.clientId) lead.clientId = action.input.clientId;
    if (action.input.email) lead.email = action.input.email;
    if (action.input.phone) lead.phone = action.input.phone;
    if (action.input.source) lead.source = action.input.source;
    if (action.input.priority) lead.priority = action.input.priority;
    if (action.input.estimatedValue)
      lead.estimatedValue = action.input.estimatedValue;
    if (action.input.owner) lead.owner = action.input.owner;
    if (action.input.score !== undefined && action.input.score !== null)
      lead.score = action.input.score;
    if (action.input.notes) lead.notes = action.input.notes;
    lead.updatedAt = action.input.updatedAt;
  },
  moveLeadOperation(state, action) {
    const lead = state.leads.find((l) => l.id === action.input.id);
    if (!lead) {
      throw new LeadNotFoundError(`Lead with id ${action.input.id} not found`);
    }
    lead.stage = action.input.stage;
    lead.updatedAt = action.input.updatedAt;
  },
  reorderLeadOperation(state, action) {
    const currentIndex = state.leads.findIndex((l) => l.id === action.input.id);
    if (currentIndex === -1) {
      throw new LeadNotFoundError(`Lead with id ${action.input.id} not found`);
    }
    const [lead] = state.leads.splice(currentIndex, 1);
    const target = Math.max(
      0,
      Math.min(action.input.targetIndex, state.leads.length),
    );
    state.leads.splice(target, 0, lead);
  },
  deleteLeadOperation(state, action) {
    const index = state.leads.findIndex((l) => l.id === action.input.id);
    if (index === -1) {
      throw new LeadNotFoundError(`Lead with id ${action.input.id} not found`);
    }
    state.leads.splice(index, 1);
  },
};
