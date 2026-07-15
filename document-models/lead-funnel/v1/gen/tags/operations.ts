/**
 * WARNING: DO NOT EDIT
 * This file is auto-generated and updated by codegen
 */
import { type SignalDispatch } from "document-model";
import type { LeadFunnelGlobalState } from "../types.js";
import type { AddTagAction, RemoveTagAction } from "./actions.js";

export interface LeadFunnelTagsOperations {
  addTagOperation: (
    state: LeadFunnelGlobalState,
    action: AddTagAction,
    dispatch?: SignalDispatch,
  ) => void;
  removeTagOperation: (
    state: LeadFunnelGlobalState,
    action: RemoveTagAction,
    dispatch?: SignalDispatch,
  ) => void;
}
