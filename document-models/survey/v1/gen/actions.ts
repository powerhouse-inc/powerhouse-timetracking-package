/**
 * WARNING: DO NOT EDIT
 * This file is auto-generated and updated by codegen
 */
import type { SurveyDefinitionAction } from "./definition/actions.js";
import type { SurveyPublishingAction } from "./publishing/actions.js";
import type { SurveyResponsesAction } from "./responses/actions.js";

export * from "./definition/actions.js";
export * from "./publishing/actions.js";
export * from "./responses/actions.js";

export type SurveyAction =
  | SurveyDefinitionAction
  | SurveyPublishingAction
  | SurveyResponsesAction;
