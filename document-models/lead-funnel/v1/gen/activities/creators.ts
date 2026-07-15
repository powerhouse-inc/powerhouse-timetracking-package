/**
 * WARNING: DO NOT EDIT
 * This file is auto-generated and updated by codegen
 */
import { createAction } from "document-model";
import {
  AddActivityInputSchema,
  DeleteActivityInputSchema,
} from "../schema/zod.js";
import type { AddActivityInput, DeleteActivityInput } from "../types.js";
import type { AddActivityAction, DeleteActivityAction } from "./actions.js";

export const addActivity = (input: AddActivityInput) =>
  createAction<AddActivityAction>(
    "ADD_ACTIVITY",
    { ...input },
    undefined,
    AddActivityInputSchema,
    "global",
  );

export const deleteActivity = (input: DeleteActivityInput) =>
  createAction<DeleteActivityAction>(
    "DELETE_ACTIVITY",
    { ...input },
    undefined,
    DeleteActivityInputSchema,
    "global",
  );
