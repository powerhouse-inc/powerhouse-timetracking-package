import {
  ClientNotFoundError,
  DuplicateClientError,
  DuplicateMemberError,
  DuplicateProjectError,
  MemberNotFoundError,
  ProjectNotFoundError,
} from "../../gen/management/error.js";
import type { TimetrackingWorkspaceManagementOperations } from "document-models/timetracking-workspace/v1";

export const timetrackingWorkspaceManagementOperations: TimetrackingWorkspaceManagementOperations =
  {
    setWorkspaceNameOperation(state, action) {
      state.name = action.input.name;
    },
    addMemberOperation(state, action) {
      if (
        state.members.some(
          (m) =>
            m.id === action.input.id ||
            (action.input.address && m.address === action.input.address),
        )
      ) {
        throw new DuplicateMemberError("Member id or address already exists");
      }
      state.members.push({
        id: action.input.id,
        address: action.input.address ?? null,
        did: action.input.did ?? null,
        name: action.input.name,
        avatarUrl: action.input.avatarUrl ?? null,
        role: action.input.role,
        status: "INVITED",
      });
    },
    updateMemberOperation(state, action) {
      const member = state.members.find((m) => m.id === action.input.id);
      if (!member) throw new MemberNotFoundError("Member not found");
      if (action.input.name) member.name = action.input.name;
      if (action.input.avatarUrl) member.avatarUrl = action.input.avatarUrl;
      if (action.input.status) member.status = action.input.status;
    },
    setMemberRoleOperation(state, action) {
      const member = state.members.find((m) => m.id === action.input.id);
      if (!member) throw new MemberNotFoundError("Member not found");
      member.role = action.input.role;
    },
    archiveMemberOperation(state, action) {
      const member = state.members.find((m) => m.id === action.input.id);
      if (!member) throw new MemberNotFoundError("Member not found");
      member.status = "ARCHIVED";
    },
    addClientOperation(state, action) {
      if (state.clients.some((c) => c.id === action.input.id)) {
        throw new DuplicateClientError("Client id already exists");
      }
      state.clients.push({
        id: action.input.id,
        name: action.input.name,
        status: "ACTIVE",
      });
    },
    updateClientOperation(state, action) {
      const client = state.clients.find((c) => c.id === action.input.id);
      if (!client) throw new ClientNotFoundError("Client not found");
      if (action.input.name) client.name = action.input.name;
    },
    archiveClientOperation(state, action) {
      const client = state.clients.find((c) => c.id === action.input.id);
      if (!client) throw new ClientNotFoundError("Client not found");
      client.status = "ARCHIVED";
    },
    addProjectOperation(state, action) {
      if (state.projects.some((p) => p.id === action.input.id)) {
        throw new DuplicateProjectError("Project id already exists");
      }
      if (
        action.input.clientId &&
        !state.clients.some((c) => c.id === action.input.clientId)
      ) {
        throw new ClientNotFoundError("Client not found");
      }
      state.projects.push({
        id: action.input.id,
        name: action.input.name,
        clientId: action.input.clientId ?? null,
        color: action.input.color,
        billable: action.input.billable,
        hourlyRate: null,
        status: "ACTIVE",
      });
    },
    updateProjectOperation(state, action) {
      const project = state.projects.find((p) => p.id === action.input.id);
      if (!project) throw new ProjectNotFoundError("Project not found");
      if (action.input.name) project.name = action.input.name;
      if (action.input.clientId) project.clientId = action.input.clientId;
      if (action.input.color) project.color = action.input.color;
      if (action.input.billable !== undefined && action.input.billable !== null)
        project.billable = action.input.billable;
    },
    archiveProjectOperation(state, action) {
      const project = state.projects.find((p) => p.id === action.input.id);
      if (!project) throw new ProjectNotFoundError("Project not found");
      project.status = "ARCHIVED";
    },
  };
