/* eslint-disable @typescript-eslint/no-empty-object-type */

import * as z from "zod";
import type {
  AddEntryInput,
  DeleteEntryInput,
  DiscardTimerInput,
  RunningEntry,
  SetOwnerInput,
  StartTimerInput,
  StopTimerInput,
  TimeEntry,
  TimesheetState,
  UpdateEntryInput,
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

export function AddEntryInputSchema(): z.ZodObject<Properties<AddEntryInput>> {
  return z.object({
    billable: z.boolean(),
    description: z.string(),
    end: z.iso.datetime(),
    id: z.string(),
    projectId: z.string().nullish(),
    start: z.iso.datetime(),
    tags: z.array(z.string()),
  });
}

export function DeleteEntryInputSchema(): z.ZodObject<
  Properties<DeleteEntryInput>
> {
  return z.object({
    id: z.string(),
  });
}

export function DiscardTimerInputSchema(): z.ZodObject<
  Properties<DiscardTimerInput>
> {
  return z.object({
    _: z.boolean().nullish(),
  });
}

export function RunningEntrySchema(): z.ZodObject<Properties<RunningEntry>> {
  return z.object({
    __typename: z.literal("RunningEntry").optional(),
    billable: z.boolean(),
    description: z.string(),
    id: z.string(),
    projectId: z.string().nullish(),
    start: z.iso.datetime(),
    tags: z.array(z.string()),
  });
}

export function SetOwnerInputSchema(): z.ZodObject<Properties<SetOwnerInput>> {
  return z.object({
    ownerAddress: z.string(),
  });
}

export function StartTimerInputSchema(): z.ZodObject<
  Properties<StartTimerInput>
> {
  return z.object({
    billable: z.boolean(),
    description: z.string(),
    id: z.string(),
    projectId: z.string().nullish(),
    start: z.iso.datetime(),
    tags: z.array(z.string()),
  });
}

export function StopTimerInputSchema(): z.ZodObject<
  Properties<StopTimerInput>
> {
  return z.object({
    end: z.iso.datetime(),
  });
}

export function TimeEntrySchema(): z.ZodObject<Properties<TimeEntry>> {
  return z.object({
    __typename: z.literal("TimeEntry").optional(),
    billable: z.boolean(),
    description: z.string(),
    end: z.iso.datetime(),
    id: z.string(),
    projectId: z.string().nullish(),
    start: z.iso.datetime(),
    tags: z.array(z.string()),
  });
}

export function TimesheetStateSchema(): z.ZodObject<
  Properties<TimesheetState>
> {
  return z.object({
    __typename: z.literal("TimesheetState").optional(),
    entries: z.array(z.lazy(() => TimeEntrySchema())),
    ownerAddress: z.string().nullish(),
    running: z.lazy(() => RunningEntrySchema().nullish()),
  });
}

export function UpdateEntryInputSchema(): z.ZodObject<
  Properties<UpdateEntryInput>
> {
  return z.object({
    billable: z.boolean().nullish(),
    description: z.string().nullish(),
    end: z.iso.datetime().nullish(),
    id: z.string(),
    projectId: z.string().nullish(),
    start: z.iso.datetime().nullish(),
    tags: z.array(z.string()).nullish(),
  });
}
