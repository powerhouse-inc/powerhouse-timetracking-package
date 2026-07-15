/**
 * WARNING: DO NOT EDIT
 * This file is auto-generated and updated by codegen
 */
import type { Action } from "document-model";
import type { AddTagInput, RemoveTagInput } from "../types.js";

export type AddTagAction = Action & { type: "ADD_TAG"; input: AddTagInput };
export type RemoveTagAction = Action & {
  type: "REMOVE_TAG";
  input: RemoveTagInput;
};

export type LeadFunnelTagsAction = AddTagAction | RemoveTagAction;
