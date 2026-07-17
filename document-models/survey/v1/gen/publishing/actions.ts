/**
 * WARNING: DO NOT EDIT
 * This file is auto-generated and updated by codegen
 */
import type { Action } from "document-model";
import type {
  CloseSurveyInput,
  PublishSurveyInput,
  RegenerateShareTokenInput,
  ReopenSurveyInput,
} from "../types.js";

export type PublishSurveyAction = Action & {
  type: "PUBLISH_SURVEY";
  input: PublishSurveyInput;
};
export type CloseSurveyAction = Action & {
  type: "CLOSE_SURVEY";
  input: CloseSurveyInput;
};
export type ReopenSurveyAction = Action & {
  type: "REOPEN_SURVEY";
  input: ReopenSurveyInput;
};
export type RegenerateShareTokenAction = Action & {
  type: "REGENERATE_SHARE_TOKEN";
  input: RegenerateShareTokenInput;
};

export type SurveyPublishingAction =
  | PublishSurveyAction
  | CloseSurveyAction
  | ReopenSurveyAction
  | RegenerateShareTokenAction;
