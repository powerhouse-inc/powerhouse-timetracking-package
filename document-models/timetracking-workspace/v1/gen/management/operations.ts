/**
 * WARNING: DO NOT EDIT
 * This file is auto-generated and updated by codegen
 */
import { type SignalDispatch } from "document-model";
import type { TimetrackingWorkspaceGlobalState } from "../types.js";
import type {
  AddClientAction,
  AddMemberAction,
  AddProjectAction,
  ArchiveClientAction,
  ArchiveMemberAction,
  ArchiveProjectAction,
  SetMemberRoleAction,
  SetWorkspaceNameAction,
  UpdateClientAction,
  UpdateMemberAction,
  UpdateProjectAction,
} from "./actions.js";

export interface TimetrackingWorkspaceManagementOperations {
  setWorkspaceNameOperation: (
    state: TimetrackingWorkspaceGlobalState,
    action: SetWorkspaceNameAction,
    dispatch?: SignalDispatch,
  ) => void;
  addMemberOperation: (
    state: TimetrackingWorkspaceGlobalState,
    action: AddMemberAction,
    dispatch?: SignalDispatch,
  ) => void;
  updateMemberOperation: (
    state: TimetrackingWorkspaceGlobalState,
    action: UpdateMemberAction,
    dispatch?: SignalDispatch,
  ) => void;
  setMemberRoleOperation: (
    state: TimetrackingWorkspaceGlobalState,
    action: SetMemberRoleAction,
    dispatch?: SignalDispatch,
  ) => void;
  archiveMemberOperation: (
    state: TimetrackingWorkspaceGlobalState,
    action: ArchiveMemberAction,
    dispatch?: SignalDispatch,
  ) => void;
  addClientOperation: (
    state: TimetrackingWorkspaceGlobalState,
    action: AddClientAction,
    dispatch?: SignalDispatch,
  ) => void;
  updateClientOperation: (
    state: TimetrackingWorkspaceGlobalState,
    action: UpdateClientAction,
    dispatch?: SignalDispatch,
  ) => void;
  archiveClientOperation: (
    state: TimetrackingWorkspaceGlobalState,
    action: ArchiveClientAction,
    dispatch?: SignalDispatch,
  ) => void;
  addProjectOperation: (
    state: TimetrackingWorkspaceGlobalState,
    action: AddProjectAction,
    dispatch?: SignalDispatch,
  ) => void;
  updateProjectOperation: (
    state: TimetrackingWorkspaceGlobalState,
    action: UpdateProjectAction,
    dispatch?: SignalDispatch,
  ) => void;
  archiveProjectOperation: (
    state: TimetrackingWorkspaceGlobalState,
    action: ArchiveProjectAction,
    dispatch?: SignalDispatch,
  ) => void;
}
