/**
 * WARNING: DO NOT EDIT
 * This file is auto-generated and updated by codegen
 */
import { createAction } from "document-model";
import {
  AddLeadInputSchema,
  DeleteLeadInputSchema,
  MoveLeadInputSchema,
  ReorderLeadInputSchema,
  UpdateLeadInputSchema,
} from "../schema/zod.js";
import type {
  AddLeadInput,
  DeleteLeadInput,
  MoveLeadInput,
  ReorderLeadInput,
  UpdateLeadInput,
} from "../types.js";
import type {
  AddLeadAction,
  DeleteLeadAction,
  MoveLeadAction,
  ReorderLeadAction,
  UpdateLeadAction,
} from "./actions.js";

export const addLead = (input: AddLeadInput) =>
  createAction<AddLeadAction>(
    "ADD_LEAD",
    { ...input },
    undefined,
    AddLeadInputSchema,
    "global",
  );

export const updateLead = (input: UpdateLeadInput) =>
  createAction<UpdateLeadAction>(
    "UPDATE_LEAD",
    { ...input },
    undefined,
    UpdateLeadInputSchema,
    "global",
  );

export const moveLead = (input: MoveLeadInput) =>
  createAction<MoveLeadAction>(
    "MOVE_LEAD",
    { ...input },
    undefined,
    MoveLeadInputSchema,
    "global",
  );

export const reorderLead = (input: ReorderLeadInput) =>
  createAction<ReorderLeadAction>(
    "REORDER_LEAD",
    { ...input },
    undefined,
    ReorderLeadInputSchema,
    "global",
  );

export const deleteLead = (input: DeleteLeadInput) =>
  createAction<DeleteLeadAction>(
    "DELETE_LEAD",
    { ...input },
    undefined,
    DeleteLeadInputSchema,
    "global",
  );
