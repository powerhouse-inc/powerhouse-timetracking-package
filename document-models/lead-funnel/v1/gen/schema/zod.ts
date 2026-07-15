/* eslint-disable @typescript-eslint/no-empty-object-type */
/* eslint-disable @typescript-eslint/no-unused-vars */
import * as z from "zod";
import type {
  Activity,
  ActivityType,
  AddActivityInput,
  AddLeadInput,
  AddTagInput,
  DeleteActivityInput,
  DeleteLeadInput,
  Lead,
  LeadFunnelState,
  LeadPriority,
  LeadSource,
  LeadStage,
  MoveLeadInput,
  RemoveTagInput,
  ReorderLeadInput,
  SetFunnelNameInput,
  UpdateLeadInput,
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

export const ActivityTypeSchema = z.enum(["CALL", "EMAIL", "MEETING", "NOTE"]);

export const LeadPrioritySchema = z.enum(["HIGH", "LOW", "MEDIUM"]);

export const LeadSourceSchema = z.enum([
  "COLD_OUTREACH",
  "EVENT",
  "OTHER",
  "REFERRAL",
  "SOCIAL",
  "WEBSITE",
]);

export const LeadStageSchema = z.enum([
  "CONTACTED",
  "LOST",
  "NEGOTIATION",
  "NEW",
  "PROPOSAL",
  "QUALIFIED",
  "WON",
]);

export function ActivitySchema(): z.ZodObject<Properties<Activity>> {
  return z.object({
    __typename: z.literal("Activity").optional(),
    id: z.string(),
    note: z.string().nullish(),
    timestamp: z.iso.datetime(),
    type: ActivityTypeSchema,
  });
}

export function AddActivityInputSchema(): z.ZodObject<
  Properties<AddActivityInput>
> {
  return z.object({
    id: z.string(),
    leadId: z.string(),
    note: z.string().nullish(),
    timestamp: z.iso.datetime(),
    type: ActivityTypeSchema,
  });
}

export function AddLeadInputSchema(): z.ZodObject<Properties<AddLeadInput>> {
  return z.object({
    clientId: z.string().nullish(),
    company: z.string().nullish(),
    createdAt: z.iso.datetime(),
    email: z.email().nullish(),
    estimatedValue: z.number().nullish(),
    id: z.string(),
    name: z.string(),
    notes: z.string().nullish(),
    owner: z.string().nullish(),
    phone: z.string().nullish(),
    priority: LeadPrioritySchema.nullish(),
    score: z.number().nullish(),
    source: LeadSourceSchema.nullish(),
    tags: z.array(z.string()).nullish(),
  });
}

export function AddTagInputSchema(): z.ZodObject<Properties<AddTagInput>> {
  return z.object({
    leadId: z.string(),
    tag: z.string(),
  });
}

export function DeleteActivityInputSchema(): z.ZodObject<
  Properties<DeleteActivityInput>
> {
  return z.object({
    id: z.string(),
    leadId: z.string(),
    timestamp: z.iso.datetime(),
  });
}

export function DeleteLeadInputSchema(): z.ZodObject<
  Properties<DeleteLeadInput>
> {
  return z.object({
    id: z.string(),
  });
}

export function LeadSchema(): z.ZodObject<Properties<Lead>> {
  return z.object({
    __typename: z.literal("Lead").optional(),
    activities: z.array(z.lazy(() => ActivitySchema())),
    clientId: z.string().nullish(),
    company: z.string().nullish(),
    createdAt: z.iso.datetime(),
    email: z.email().nullish(),
    estimatedValue: z.number().nullish(),
    id: z.string(),
    name: z.string(),
    notes: z.string().nullish(),
    owner: z.string().nullish(),
    phone: z.string().nullish(),
    priority: LeadPrioritySchema,
    score: z.number(),
    source: LeadSourceSchema,
    stage: LeadStageSchema,
    tags: z.array(z.string()),
    updatedAt: z.iso.datetime(),
  });
}

export function LeadFunnelStateSchema(): z.ZodObject<
  Properties<LeadFunnelState>
> {
  return z.object({
    __typename: z.literal("LeadFunnelState").optional(),
    leads: z.array(z.lazy(() => LeadSchema())),
    name: z.string(),
  });
}

export function MoveLeadInputSchema(): z.ZodObject<Properties<MoveLeadInput>> {
  return z.object({
    id: z.string(),
    stage: LeadStageSchema,
    updatedAt: z.iso.datetime(),
  });
}

export function RemoveTagInputSchema(): z.ZodObject<
  Properties<RemoveTagInput>
> {
  return z.object({
    leadId: z.string(),
    tag: z.string(),
  });
}

export function ReorderLeadInputSchema(): z.ZodObject<
  Properties<ReorderLeadInput>
> {
  return z.object({
    id: z.string(),
    targetIndex: z.number(),
  });
}

export function SetFunnelNameInputSchema(): z.ZodObject<
  Properties<SetFunnelNameInput>
> {
  return z.object({
    name: z.string(),
  });
}

export function UpdateLeadInputSchema(): z.ZodObject<
  Properties<UpdateLeadInput>
> {
  return z.object({
    clientId: z.string().nullish(),
    company: z.string().nullish(),
    email: z.email().nullish(),
    estimatedValue: z.number().nullish(),
    id: z.string(),
    name: z.string().nullish(),
    notes: z.string().nullish(),
    owner: z.string().nullish(),
    phone: z.string().nullish(),
    priority: LeadPrioritySchema.nullish(),
    score: z.number().nullish(),
    source: LeadSourceSchema.nullish(),
    updatedAt: z.iso.datetime(),
  });
}
