import type { ScopeOfWorkContributorsOperations } from "document-models/scope-of-work/v1";
import { type AddAgentAction } from "../../gen/contributors/actions.js";
import { AgentNotFoundError } from "../../gen/contributors/error.js";
import type { Agent, ScopeOfWorkState } from "../../gen/schema/types.js";

export const scopeOfWorkContributorsOperations: ScopeOfWorkContributorsOperations =
  {
    addAgentOperation(state: ScopeOfWorkState, action: AddAgentAction) {
      // Check if agent with same ID already exists
      const existingAgent = state.contributors.find(
        (agent) => agent.id === action.input.id,
      );
      if (existingAgent) {
        throw new Error(`Agent with ID ${action.input.id} already exists`);
      }

      // Create new agent with correct structure matching GraphQL schema
      const agent = {
        id: action.input.id,
        name: action.input.name,
        icon: action.input.icon || null,
        description: action.input.description || null,
      };

      state.contributors.push(agent);
    },
    removeAgentOperation(state, action) {
      // Find agent by ID
      const agentIndex = state.contributors.findIndex(
        (agent) => agent.id === action.input.id,
      );
      if (agentIndex === -1) {
        throw new AgentNotFoundError(
          `Agent with ID ${action.input.id} not found`,
        );
      }

      // Remove agent from contributors array
      state.contributors.splice(agentIndex, 1);
    },
    editAgentOperation(state, action) {
      // Find agent by ID
      const agentIndex = state.contributors.findIndex(
        (agent) => agent.id === action.input.id,
      );
      if (agentIndex === -1) {
        throw new AgentNotFoundError(
          `Agent with ID ${action.input.id} not found`,
        );
      }

      // Update agent with provided fields, preserving existing values for optional fields
      const existingAgent = state.contributors[agentIndex];
      const updatedAgent = {
        ...existingAgent,
        name:
          action.input.name !== undefined
            ? action.input.name
            : existingAgent.name,
        icon:
          action.input.icon !== undefined
            ? action.input.icon
            : existingAgent.icon,
        description:
          action.input.description !== undefined
            ? action.input.description
            : existingAgent.description,
      };

      state.contributors[agentIndex] = updatedAgent as Agent;
    },
  };
