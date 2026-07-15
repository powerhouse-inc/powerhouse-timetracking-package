/**
 * WARNING: DO NOT EDIT
 * This file is auto-generated and updated by codegen
 */
import type { Action } from "document-model";
import type {
  AddLeadInput,
  DeleteLeadInput,
  MoveLeadInput,
  ReorderLeadInput,
  UpdateLeadInput,
} from "../types.js";

export type AddLeadAction = Action & { type: "ADD_LEAD"; input: AddLeadInput };
export type UpdateLeadAction = Action & {
  type: "UPDATE_LEAD";
  input: UpdateLeadInput;
};
export type MoveLeadAction = Action & {
  type: "MOVE_LEAD";
  input: MoveLeadInput;
};
export type ReorderLeadAction = Action & {
  type: "REORDER_LEAD";
  input: ReorderLeadInput;
};
export type DeleteLeadAction = Action & {
  type: "DELETE_LEAD";
  input: DeleteLeadInput;
};

export type LeadFunnelLeadsAction =
  | AddLeadAction
  | UpdateLeadAction
  | MoveLeadAction
  | ReorderLeadAction
  | DeleteLeadAction;
