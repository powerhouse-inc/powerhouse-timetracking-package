/**
 * WARNING: DO NOT EDIT
 * This file is auto-generated and updated by codegen
 */
import { type SignalDispatch } from "document-model";
import type { LeadFunnelGlobalState } from "../types.js";
import type { AddActivityAction, DeleteActivityAction } from "./actions.js";

export interface LeadFunnelActivitiesOperations {
  addActivityOperation: (
    state: LeadFunnelGlobalState,
    action: AddActivityAction,
    dispatch?: SignalDispatch,
  ) => void;
  deleteActivityOperation: (
    state: LeadFunnelGlobalState,
    action: DeleteActivityAction,
    dispatch?: SignalDispatch,
  ) => void;
}
