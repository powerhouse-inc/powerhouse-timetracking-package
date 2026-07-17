/**
 * WARNING: DO NOT EDIT
 * This file is auto-generated and updated by codegen
 */
import { type SignalDispatch } from "document-model";
import type { SurveyGlobalState } from "../types.js";
import type {
  CloseSurveyAction,
  PublishSurveyAction,
  RegenerateShareTokenAction,
  ReopenSurveyAction,
} from "./actions.js";

export interface SurveyPublishingOperations {
  publishSurveyOperation: (
    state: SurveyGlobalState,
    action: PublishSurveyAction,
    dispatch?: SignalDispatch,
  ) => void;
  closeSurveyOperation: (
    state: SurveyGlobalState,
    action: CloseSurveyAction,
    dispatch?: SignalDispatch,
  ) => void;
  reopenSurveyOperation: (
    state: SurveyGlobalState,
    action: ReopenSurveyAction,
    dispatch?: SignalDispatch,
  ) => void;
  regenerateShareTokenOperation: (
    state: SurveyGlobalState,
    action: RegenerateShareTokenAction,
    dispatch?: SignalDispatch,
  ) => void;
}
