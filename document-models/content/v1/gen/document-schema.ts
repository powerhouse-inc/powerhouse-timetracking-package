/**
 * WARNING: DO NOT EDIT
 * This file is auto-generated and updated by codegen
 */
import {
  BaseDocumentHeaderSchema,
  BaseDocumentStateSchema,
} from "document-model";
import { z } from "zod";
import { contentDocumentType } from "./document-type.js";
import { ContentStateSchema } from "./schema/zod.js";
import type { ContentDocument, ContentPHState } from "./types.js";

/** Schema for validating the header object of a Content document */
export const ContentDocumentHeaderSchema = BaseDocumentHeaderSchema.extend({
  documentType: z.literal(contentDocumentType),
});

/** Schema for validating the state object of a Content document */
export const ContentPHStateSchema = BaseDocumentStateSchema.extend({
  global: ContentStateSchema(),
});

export const ContentDocumentSchema = z.object({
  header: ContentDocumentHeaderSchema,
  state: ContentPHStateSchema,
  initialState: ContentPHStateSchema,
});

/** Simple helper function to check if a state object is a Content document state object */
export function isContentState(state: unknown): state is ContentPHState {
  return ContentPHStateSchema.safeParse(state).success;
}

/** Simple helper function to assert that a document state object is a Content document state object */
export function assertIsContentState(
  state: unknown,
): asserts state is ContentPHState {
  ContentPHStateSchema.parse(state);
}

/** Simple helper function to check if a document is a Content document */
export function isContentDocument(
  document: unknown,
): document is ContentDocument {
  return ContentDocumentSchema.safeParse(document).success;
}

/** Simple helper function to assert that a document is a Content document */
export function assertIsContentDocument(
  document: unknown,
): asserts document is ContentDocument {
  ContentDocumentSchema.parse(document);
}
