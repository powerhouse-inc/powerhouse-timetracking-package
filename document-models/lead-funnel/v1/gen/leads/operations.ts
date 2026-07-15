/**
 * WARNING: DO NOT EDIT
 * This file is auto-generated and updated by codegen
 */
import { type SignalDispatch } from "document-model";
import type { LeadFunnelGlobalState } from "../types.js";
import type {
  AddLeadAction,
  DeleteLeadAction,
  MoveLeadAction,
  ReorderLeadAction,
  UpdateLeadAction,
} from "./actions.js";

export interface LeadFunnelLeadsOperations {
  addLeadOperation: (
    state: LeadFunnelGlobalState,
    action: AddLeadAction,
    dispatch?: SignalDispatch,
  ) => void;
  updateLeadOperation: (
    state: LeadFunnelGlobalState,
    action: UpdateLeadAction,
    dispatch?: SignalDispatch,
  ) => void;
  moveLeadOperation: (
    state: LeadFunnelGlobalState,
    action: MoveLeadAction,
    dispatch?: SignalDispatch,
  ) => void;
  reorderLeadOperation: (
    state: LeadFunnelGlobalState,
    action: ReorderLeadAction,
    dispatch?: SignalDispatch,
  ) => void;
  deleteLeadOperation: (
    state: LeadFunnelGlobalState,
    action: DeleteLeadAction,
    dispatch?: SignalDispatch,
  ) => void;
}
