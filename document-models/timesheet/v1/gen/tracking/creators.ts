/**
 * WARNING: DO NOT EDIT
 * This file is auto-generated and updated by codegen
 */
import { createAction } from "document-model";
import {
  AddEntryInputSchema,
  DeleteEntryInputSchema,
  DiscardTimerInputSchema,
  SetOwnerInputSchema,
  StartTimerInputSchema,
  StopTimerInputSchema,
  UpdateEntryInputSchema,
} from "../schema/zod.js";
import type {
  AddEntryInput,
  DeleteEntryInput,
  DiscardTimerInput,
  SetOwnerInput,
  StartTimerInput,
  StopTimerInput,
  UpdateEntryInput,
} from "../types.js";
import type {
  AddEntryAction,
  DeleteEntryAction,
  DiscardTimerAction,
  SetOwnerAction,
  StartTimerAction,
  StopTimerAction,
  UpdateEntryAction,
} from "./actions.js";

export const setOwner = (input: SetOwnerInput) =>
  createAction<SetOwnerAction>(
    "SET_OWNER",
    { ...input },
    undefined,
    SetOwnerInputSchema,
    "global",
  );

export const startTimer = (input: StartTimerInput) =>
  createAction<StartTimerAction>(
    "START_TIMER",
    { ...input },
    undefined,
    StartTimerInputSchema,
    "global",
  );

export const stopTimer = (input: StopTimerInput) =>
  createAction<StopTimerAction>(
    "STOP_TIMER",
    { ...input },
    undefined,
    StopTimerInputSchema,
    "global",
  );

export const discardTimer = (input: DiscardTimerInput) =>
  createAction<DiscardTimerAction>(
    "DISCARD_TIMER",
    { ...input },
    undefined,
    DiscardTimerInputSchema,
    "global",
  );

export const addEntry = (input: AddEntryInput) =>
  createAction<AddEntryAction>(
    "ADD_ENTRY",
    { ...input },
    undefined,
    AddEntryInputSchema,
    "global",
  );

export const updateEntry = (input: UpdateEntryInput) =>
  createAction<UpdateEntryAction>(
    "UPDATE_ENTRY",
    { ...input },
    undefined,
    UpdateEntryInputSchema,
    "global",
  );

export const deleteEntry = (input: DeleteEntryInput) =>
  createAction<DeleteEntryAction>(
    "DELETE_ENTRY",
    { ...input },
    undefined,
    DeleteEntryInputSchema,
    "global",
  );
