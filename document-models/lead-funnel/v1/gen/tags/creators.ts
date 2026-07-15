/**
 * WARNING: DO NOT EDIT
 * This file is auto-generated and updated by codegen
 */
import { createAction } from "document-model";
import { AddTagInputSchema, RemoveTagInputSchema } from "../schema/zod.js";
import type { AddTagInput, RemoveTagInput } from "../types.js";
import type { AddTagAction, RemoveTagAction } from "./actions.js";

export const addTag = (input: AddTagInput) =>
  createAction<AddTagAction>(
    "ADD_TAG",
    { ...input },
    undefined,
    AddTagInputSchema,
    "global",
  );

export const removeTag = (input: RemoveTagInput) =>
  createAction<RemoveTagAction>(
    "REMOVE_TAG",
    { ...input },
    undefined,
    RemoveTagInputSchema,
    "global",
  );
