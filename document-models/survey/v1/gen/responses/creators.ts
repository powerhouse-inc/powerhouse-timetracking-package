/**
 * WARNING: DO NOT EDIT
 * This file is auto-generated and updated by codegen
 */
import { createAction } from "document-model";
import {
  AddResponseInputSchema,
  DeleteResponseInputSchema,
} from "../schema/zod.js";
import type { AddResponseInput, DeleteResponseInput } from "../types.js";
import type { AddResponseAction, DeleteResponseAction } from "./actions.js";

export const addResponse = (input: AddResponseInput) =>
  createAction<AddResponseAction>(
    "ADD_RESPONSE",
    { ...input },
    undefined,
    AddResponseInputSchema,
    "global",
  );

export const deleteResponse = (input: DeleteResponseInput) =>
  createAction<DeleteResponseAction>(
    "DELETE_RESPONSE",
    { ...input },
    undefined,
    DeleteResponseInputSchema,
    "global",
  );
