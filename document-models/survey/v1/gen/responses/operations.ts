/**
 * WARNING: DO NOT EDIT
 * This file is auto-generated and updated by codegen
 */
import { type SignalDispatch } from "document-model";
import type { SurveyGlobalState } from "../types.js";
import type { AddResponseAction, DeleteResponseAction } from "./actions.js";

export interface SurveyResponsesOperations {
  addResponseOperation: (
    state: SurveyGlobalState,
    action: AddResponseAction,
    dispatch?: SignalDispatch,
  ) => void;
  deleteResponseOperation: (
    state: SurveyGlobalState,
    action: DeleteResponseAction,
    dispatch?: SignalDispatch,
  ) => void;
}
