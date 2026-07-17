/**
 * WARNING: DO NOT EDIT
 * This file is auto-generated and updated by codegen
 */
import type { Action } from "document-model";
import type { AddResponseInput, DeleteResponseInput } from "../types.js";

export type AddResponseAction = Action & {
  type: "ADD_RESPONSE";
  input: AddResponseInput;
};
export type DeleteResponseAction = Action & {
  type: "DELETE_RESPONSE";
  input: DeleteResponseInput;
};

export type SurveyResponsesAction = AddResponseAction | DeleteResponseAction;
