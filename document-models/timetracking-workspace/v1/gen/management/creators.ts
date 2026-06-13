/**
 * WARNING: DO NOT EDIT
 * This file is auto-generated and updated by codegen
 */
import { createAction } from "document-model";
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
} from "../schema/zod.js";
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

export const setWorkspaceName = (input: SetWorkspaceNameInput) =>
  createAction<SetWorkspaceNameAction>(
    "SET_WORKSPACE_NAME",
    { ...input },
    undefined,
    SetWorkspaceNameInputSchema,
    "global",
  );

export const addMember = (input: AddMemberInput) =>
  createAction<AddMemberAction>(
    "ADD_MEMBER",
    { ...input },
    undefined,
    AddMemberInputSchema,
    "global",
  );

export const updateMember = (input: UpdateMemberInput) =>
  createAction<UpdateMemberAction>(
    "UPDATE_MEMBER",
    { ...input },
    undefined,
    UpdateMemberInputSchema,
    "global",
  );

export const setMemberRole = (input: SetMemberRoleInput) =>
  createAction<SetMemberRoleAction>(
    "SET_MEMBER_ROLE",
    { ...input },
    undefined,
    SetMemberRoleInputSchema,
    "global",
  );

export const archiveMember = (input: ArchiveMemberInput) =>
  createAction<ArchiveMemberAction>(
    "ARCHIVE_MEMBER",
    { ...input },
    undefined,
    ArchiveMemberInputSchema,
    "global",
  );

export const addClient = (input: AddClientInput) =>
  createAction<AddClientAction>(
    "ADD_CLIENT",
    { ...input },
    undefined,
    AddClientInputSchema,
    "global",
  );

export const updateClient = (input: UpdateClientInput) =>
  createAction<UpdateClientAction>(
    "UPDATE_CLIENT",
    { ...input },
    undefined,
    UpdateClientInputSchema,
    "global",
  );

export const archiveClient = (input: ArchiveClientInput) =>
  createAction<ArchiveClientAction>(
    "ARCHIVE_CLIENT",
    { ...input },
    undefined,
    ArchiveClientInputSchema,
    "global",
  );

export const addProject = (input: AddProjectInput) =>
  createAction<AddProjectAction>(
    "ADD_PROJECT",
    { ...input },
    undefined,
    AddProjectInputSchema,
    "global",
  );

export const updateProject = (input: UpdateProjectInput) =>
  createAction<UpdateProjectAction>(
    "UPDATE_PROJECT",
    { ...input },
    undefined,
    UpdateProjectInputSchema,
    "global",
  );

export const archiveProject = (input: ArchiveProjectInput) =>
  createAction<ArchiveProjectAction>(
    "ARCHIVE_PROJECT",
    { ...input },
    undefined,
    ArchiveProjectInputSchema,
    "global",
  );
