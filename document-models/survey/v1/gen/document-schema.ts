/**
 * WARNING: DO NOT EDIT
 * This file is auto-generated and updated by codegen
 */
import {
  BaseDocumentHeaderSchema,
  BaseDocumentStateSchema,
} from "document-model";
import { z } from "zod";
import { surveyDocumentType } from "./document-type.js";
import { SurveyStateSchema } from "./schema/zod.js";
import type { SurveyDocument, SurveyPHState } from "./types.js";

/** Schema for validating the header object of a Survey document */
export const SurveyDocumentHeaderSchema = BaseDocumentHeaderSchema.extend({
  documentType: z.literal(surveyDocumentType),
});

/** Schema for validating the state object of a Survey document */
export const SurveyPHStateSchema = BaseDocumentStateSchema.extend({
  global: SurveyStateSchema(),
});

export const SurveyDocumentSchema = z.object({
  header: SurveyDocumentHeaderSchema,
  state: SurveyPHStateSchema,
  initialState: SurveyPHStateSchema,
});

/** Simple helper function to check if a state object is a Survey document state object */
export function isSurveyState(state: unknown): state is SurveyPHState {
  return SurveyPHStateSchema.safeParse(state).success;
}

/** Simple helper function to assert that a document state object is a Survey document state object */
export function assertIsSurveyState(
  state: unknown,
): asserts state is SurveyPHState {
  SurveyPHStateSchema.parse(state);
}

/** Simple helper function to check if a document is a Survey document */
export function isSurveyDocument(
  document: unknown,
): document is SurveyDocument {
  return SurveyDocumentSchema.safeParse(document).success;
}

/** Simple helper function to assert that a document is a Survey document */
export function assertIsSurveyDocument(
  document: unknown,
): asserts document is SurveyDocument {
  SurveyDocumentSchema.parse(document);
}
