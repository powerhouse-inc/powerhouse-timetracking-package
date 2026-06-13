/**
 * WARNING: DO NOT EDIT
 * This file is auto-generated and updated by codegen
 */
import type { Action } from "document-model";
import type {
  AddClientInput,
  AddMemberInput,
  AddProjectInput,
  ArchiveClientInput,
  ArchiveMemberInput,
  ArchiveProjectInput,
  SetMemberRoleInput,
  SetWorkspaceNameInput,
  UpdateClientInput,
  UpdateMemberInput,
  UpdateProjectInput,
} from "../types.js";

export type SetWorkspaceNameAction = Action & {
  type: "SET_WORKSPACE_NAME";
  input: SetWorkspaceNameInput;
};
export type AddMemberAction = Action & {
  type: "ADD_MEMBER";
  input: AddMemberInput;
};
export type UpdateMemberAction = Action & {
  type: "UPDATE_MEMBER";
  input: UpdateMemberInput;
};
export type SetMemberRoleAction = Action & {
  type: "SET_MEMBER_ROLE";
  input: SetMemberRoleInput;
};
export type ArchiveMemberAction = Action & {
  type: "ARCHIVE_MEMBER";
  input: ArchiveMemberInput;
};
export type AddClientAction = Action & {
  type: "ADD_CLIENT";
  input: AddClientInput;
};
export type UpdateClientAction = Action & {
  type: "UPDATE_CLIENT";
  input: UpdateClientInput;
};
export type ArchiveClientAction = Action & {
  type: "ARCHIVE_CLIENT";
  input: ArchiveClientInput;
};
export type AddProjectAction = Action & {
  type: "ADD_PROJECT";
  input: AddProjectInput;
};
export type UpdateProjectAction = Action & {
  type: "UPDATE_PROJECT";
  input: UpdateProjectInput;
};
export type ArchiveProjectAction = Action & {
  type: "ARCHIVE_PROJECT";
  input: ArchiveProjectInput;
};

export type TimetrackingWorkspaceManagementAction =
  | SetWorkspaceNameAction
  | AddMemberAction
  | UpdateMemberAction
  | SetMemberRoleAction
  | ArchiveMemberAction
  | AddClientAction
  | UpdateClientAction
  | ArchiveClientAction
  | AddProjectAction
  | UpdateProjectAction
  | ArchiveProjectAction;
