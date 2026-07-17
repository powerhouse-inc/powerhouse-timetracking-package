/**
 * WARNING: DO NOT EDIT
 * This file is auto-generated and updated by codegen
 */
import { createAction } from "document-model";
import {
  CloseSurveyInputSchema,
  PublishSurveyInputSchema,
  RegenerateShareTokenInputSchema,
  ReopenSurveyInputSchema,
} from "../schema/zod.js";
import type {
  CloseSurveyInput,
  PublishSurveyInput,
  RegenerateShareTokenInput,
  ReopenSurveyInput,
} from "../types.js";
import type {
  CloseSurveyAction,
  PublishSurveyAction,
  RegenerateShareTokenAction,
  ReopenSurveyAction,
} from "./actions.js";

export const publishSurvey = (input: PublishSurveyInput) =>
  createAction<PublishSurveyAction>(
    "PUBLISH_SURVEY",
    { ...input },
    undefined,
    PublishSurveyInputSchema,
    "global",
  );

export const closeSurvey = (input: CloseSurveyInput) =>
  createAction<CloseSurveyAction>(
    "CLOSE_SURVEY",
    { ...input },
    undefined,
    CloseSurveyInputSchema,
    "global",
  );

export const reopenSurvey = (input: ReopenSurveyInput) =>
  createAction<ReopenSurveyAction>(
    "REOPEN_SURVEY",
    { ...input },
    undefined,
    ReopenSurveyInputSchema,
    "global",
  );

export const regenerateShareToken = (input: RegenerateShareTokenInput) =>
  createAction<RegenerateShareTokenAction>(
    "REGENERATE_SHARE_TOKEN",
    { ...input },
    undefined,
    RegenerateShareTokenInputSchema,
    "global",
  );
