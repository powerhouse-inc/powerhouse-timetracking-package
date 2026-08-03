/**
 * WARNING: DO NOT EDIT
 * This file is auto-generated and updated by codegen
 */
import { createAction } from "document-model";
import {
  AdvanceStageInputSchema,
  AssignOwnerInputSchema,
  KillInputSchema,
  ParkInputSchema,
  PublishInputSchema,
  ResumeInputSchema,
} from "../schema/zod.js";
import type {
  AdvanceStageInput,
  AssignOwnerInput,
  KillInput,
  ParkInput,
  PublishInput,
  ResumeInput,
} from "../types.js";
import type {
  AdvanceStageAction,
  AssignOwnerAction,
  KillAction,
  ParkAction,
  PublishAction,
  ResumeAction,
} from "./actions.js";

export const assignOwner = (input: AssignOwnerInput) =>
  createAction<AssignOwnerAction>(
    "ASSIGN_OWNER",
    { ...input },
    undefined,
    AssignOwnerInputSchema,
    "global",
  );

export const advanceStage = (input: AdvanceStageInput) =>
  createAction<AdvanceStageAction>(
    "ADVANCE_STAGE",
    { ...input },
    undefined,
    AdvanceStageInputSchema,
    "global",
  );

export const publish = (input: PublishInput) =>
  createAction<PublishAction>(
    "PUBLISH",
    { ...input },
    undefined,
    PublishInputSchema,
    "global",
  );

export const park = (input: ParkInput) =>
  createAction<ParkAction>(
    "PARK",
    { ...input },
    undefined,
    ParkInputSchema,
    "global",
  );

export const kill = (input: KillInput) =>
  createAction<KillAction>(
    "KILL",
    { ...input },
    undefined,
    KillInputSchema,
    "global",
  );

export const resume = (input: ResumeInput) =>
  createAction<ResumeAction>(
    "RESUME",
    { ...input },
    undefined,
    ResumeInputSchema,
    "global",
  );
