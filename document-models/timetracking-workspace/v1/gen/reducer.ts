/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
import type { Reducer, StateReducer } from "document-model";
import { createReducer, isDocumentAction } from "document-model";
import type { TimetrackingWorkspacePHState } from "document-models/timetracking-workspace/v1";

import { timetrackingWorkspaceManagementOperations } from "../src/reducers/management.js";

import {
  AddClientInputSchema,
  AddMemberInputSchema,
  AddProjectInputSchema,
  ArchiveClientInputSchema,
  ArchiveMemberInputSchema,
  ArchiveProjectInputSchema,
  SetMemberRoleInputSchema,
  SetWorkspaceNameInputSchema,
  UpdateClientInputSchema,
  UpdateMemberInputSchema,
  UpdateProjectInputSchema,
} from "./schema/zod.js";

const stateReducer: StateReducer<TimetrackingWorkspacePHState> = (
  state,
  action,
  dispatch,
) => {
  if (isDocumentAction(action)) {
    return state;
  }
  switch (action.type) {
    case "SET_WORKSPACE_NAME": {
      SetWorkspaceNameInputSchema().parse(action.input);

      timetrackingWorkspaceManagementOperations.setWorkspaceNameOperation(
        (state as any)[action.scope],
        action as any,
        dispatch,
      );

      break;
    }

    case "ADD_MEMBER": {
      AddMemberInputSchema().parse(action.input);

      timetrackingWorkspaceManagementOperations.addMemberOperation(
        (state as any)[action.scope],
        action as any,
        dispatch,
      );

      break;
    }

    case "UPDATE_MEMBER": {
      UpdateMemberInputSchema().parse(action.input);

      timetrackingWorkspaceManagementOperations.updateMemberOperation(
        (state as any)[action.scope],
        action as any,
        dispatch,
      );

      break;
    }

    case "SET_MEMBER_ROLE": {
      SetMemberRoleInputSchema().parse(action.input);

      timetrackingWorkspaceManagementOperations.setMemberRoleOperation(
        (state as any)[action.scope],
        action as any,
        dispatch,
      );

      break;
    }

    case "ARCHIVE_MEMBER": {
      ArchiveMemberInputSchema().parse(action.input);

      timetrackingWorkspaceManagementOperations.archiveMemberOperation(
        (state as any)[action.scope],
        action as any,
        dispatch,
      );

      break;
    }

    case "ADD_CLIENT": {
      AddClientInputSchema().parse(action.input);

      timetrackingWorkspaceManagementOperations.addClientOperation(
        (state as any)[action.scope],
        action as any,
        dispatch,
      );

      break;
    }

    case "UPDATE_CLIENT": {
      UpdateClientInputSchema().parse(action.input);

      timetrackingWorkspaceManagementOperations.updateClientOperation(
        (state as any)[action.scope],
        action as any,
        dispatch,
      );

      break;
    }

    case "ARCHIVE_CLIENT": {
      ArchiveClientInputSchema().parse(action.input);

      timetrackingWorkspaceManagementOperations.archiveClientOperation(
        (state as any)[action.scope],
        action as any,
        dispatch,
      );

      break;
    }

    case "ADD_PROJECT": {
      AddProjectInputSchema().parse(action.input);

      timetrackingWorkspaceManagementOperations.addProjectOperation(
        (state as any)[action.scope],
        action as any,
        dispatch,
      );

      break;
    }

    case "UPDATE_PROJECT": {
      UpdateProjectInputSchema().parse(action.input);

      timetrackingWorkspaceManagementOperations.updateProjectOperation(
        (state as any)[action.scope],
        action as any,
        dispatch,
      );

      break;
    }

    case "ARCHIVE_PROJECT": {
      ArchiveProjectInputSchema().parse(action.input);

      timetrackingWorkspaceManagementOperations.archiveProjectOperation(
        (state as any)[action.scope],
        action as any,
        dispatch,
      );

      break;
    }

    default:
      return state;
  }
};

export const reducer: Reducer<TimetrackingWorkspacePHState> =
  createReducer(stateReducer);
