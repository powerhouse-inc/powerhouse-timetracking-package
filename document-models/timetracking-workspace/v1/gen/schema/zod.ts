/* eslint-disable @typescript-eslint/no-empty-object-type */
/* eslint-disable @typescript-eslint/no-unused-vars */
import * as z from "zod";
import type {
  AddClientInput,
  AddMemberInput,
  AddProjectInput,
  ArchiveClientInput,
  ArchiveMemberInput,
  ArchiveProjectInput,
  Client,
  EntityStatus,
  Member,
  MemberRole,
  MemberStatus,
  Project,
  SetMemberRoleInput,
  SetWorkspaceNameInput,
  TimetrackingWorkspaceState,
  UpdateClientInput,
  UpdateMemberInput,
  UpdateProjectInput,
} from "./types.js";

type Properties<T> = Required<{
  [K in keyof T]: z.ZodType<T[K]>;
}>;

type definedNonNullAny = {};

export const isDefinedNonNullAny = (v: any): v is definedNonNullAny =>
  v !== undefined && v !== null;

export const definedNonNullAnySchema = z
  .any()
  .refine((v) => isDefinedNonNullAny(v));

export const EntityStatusSchema = z.enum(["ACTIVE", "ARCHIVED"]);

export const MemberRoleSchema = z.enum([
  "ADMIN",
  "BILLING",
  "MANAGER",
  "MEMBER",
]);

export const MemberStatusSchema = z.enum(["ACTIVE", "ARCHIVED", "INVITED"]);

export function AddClientInputSchema(): z.ZodObject<
  Properties<AddClientInput>
> {
  return z.object({
    id: z.string(),
    name: z.string(),
  });
}

export function AddMemberInputSchema(): z.ZodObject<
  Properties<AddMemberInput>
> {
  return z.object({
    address: z.string().nullish(),
    avatarUrl: z.url().nullish(),
    did: z.string().nullish(),
    id: z.string(),
    name: z.string(),
    role: MemberRoleSchema,
  });
}

export function AddProjectInputSchema(): z.ZodObject<
  Properties<AddProjectInput>
> {
  return z.object({
    billable: z.boolean(),
    clientId: z.string().nullish(),
    color: z.string(),
    id: z.string(),
    name: z.string(),
  });
}

export function ArchiveClientInputSchema(): z.ZodObject<
  Properties<ArchiveClientInput>
> {
  return z.object({
    id: z.string(),
  });
}

export function ArchiveMemberInputSchema(): z.ZodObject<
  Properties<ArchiveMemberInput>
> {
  return z.object({
    id: z.string(),
  });
}

export function ArchiveProjectInputSchema(): z.ZodObject<
  Properties<ArchiveProjectInput>
> {
  return z.object({
    id: z.string(),
  });
}

export function ClientSchema(): z.ZodObject<Properties<Client>> {
  return z.object({
    __typename: z.literal("Client").optional(),
    id: z.string(),
    name: z.string(),
    status: EntityStatusSchema,
  });
}

export function MemberSchema(): z.ZodObject<Properties<Member>> {
  return z.object({
    __typename: z.literal("Member").optional(),
    address: z.string().nullish(),
    avatarUrl: z.url().nullish(),
    did: z.string().nullish(),
    id: z.string(),
    name: z.string(),
    role: MemberRoleSchema,
    status: MemberStatusSchema,
  });
}

export function ProjectSchema(): z.ZodObject<Properties<Project>> {
  return z.object({
    __typename: z.literal("Project").optional(),
    billable: z.boolean(),
    clientId: z.string().nullish(),
    color: z.string(),
    hourlyRate: z.number().nullish(),
    id: z.string(),
    name: z.string(),
    status: EntityStatusSchema,
  });
}

export function SetMemberRoleInputSchema(): z.ZodObject<
  Properties<SetMemberRoleInput>
> {
  return z.object({
    id: z.string(),
    role: MemberRoleSchema,
  });
}

export function SetWorkspaceNameInputSchema(): z.ZodObject<
  Properties<SetWorkspaceNameInput>
> {
  return z.object({
    name: z.string(),
  });
}

export function TimetrackingWorkspaceStateSchema(): z.ZodObject<
  Properties<TimetrackingWorkspaceState>
> {
  return z.object({
    __typename: z.literal("TimetrackingWorkspaceState").optional(),
    clients: z.array(z.lazy(() => ClientSchema())),
    members: z.array(z.lazy(() => MemberSchema())),
    name: z.string(),
    projects: z.array(z.lazy(() => ProjectSchema())),
  });
}

export function UpdateClientInputSchema(): z.ZodObject<
  Properties<UpdateClientInput>
> {
  return z.object({
    id: z.string(),
    name: z.string().nullish(),
  });
}

export function UpdateMemberInputSchema(): z.ZodObject<
  Properties<UpdateMemberInput>
> {
  return z.object({
    avatarUrl: z.url().nullish(),
    id: z.string(),
    name: z.string().nullish(),
    status: MemberStatusSchema.nullish(),
  });
}

export function UpdateProjectInputSchema(): z.ZodObject<
  Properties<UpdateProjectInput>
> {
  return z.object({
    billable: z.boolean().nullish(),
    clientId: z.string().nullish(),
    color: z.string().nullish(),
    id: z.string(),
    name: z.string().nullish(),
  });
}
