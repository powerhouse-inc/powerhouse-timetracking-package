/**
 * WARNING: DO NOT EDIT
 * This file is auto-generated and updated by codegen
 */
import type { Action } from "document-model";
import type { AddActivityInput, DeleteActivityInput } from "../types.js";

export type AddActivityAction = Action & {
  type: "ADD_ACTIVITY";
  input: AddActivityInput;
};
export type DeleteActivityAction = Action & {
  type: "DELETE_ACTIVITY";
  input: DeleteActivityInput;
};

export type LeadFunnelActivitiesAction =
  | AddActivityAction
  | DeleteActivityAction;
