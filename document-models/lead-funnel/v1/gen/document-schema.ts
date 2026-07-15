/**
 * WARNING: DO NOT EDIT
 * This file is auto-generated and updated by codegen
 */
import {
  BaseDocumentHeaderSchema,
  BaseDocumentStateSchema,
} from "document-model";
import { z } from "zod";
import { leadFunnelDocumentType } from "./document-type.js";
import { LeadFunnelStateSchema } from "./schema/zod.js";
import type { LeadFunnelDocument, LeadFunnelPHState } from "./types.js";

/** Schema for validating the header object of a LeadFunnel document */
export const LeadFunnelDocumentHeaderSchema = BaseDocumentHeaderSchema.extend({
  documentType: z.literal(leadFunnelDocumentType),
});

/** Schema for validating the state object of a LeadFunnel document */
export const LeadFunnelPHStateSchema = BaseDocumentStateSchema.extend({
  global: LeadFunnelStateSchema(),
});

export const LeadFunnelDocumentSchema = z.object({
  header: LeadFunnelDocumentHeaderSchema,
  state: LeadFunnelPHStateSchema,
  initialState: LeadFunnelPHStateSchema,
});

/** Simple helper function to check if a state object is a LeadFunnel document state object */
export function isLeadFunnelState(state: unknown): state is LeadFunnelPHState {
  return LeadFunnelPHStateSchema.safeParse(state).success;
}

/** Simple helper function to assert that a document state object is a LeadFunnel document state object */
export function assertIsLeadFunnelState(
  state: unknown,
): asserts state is LeadFunnelPHState {
  LeadFunnelPHStateSchema.parse(state);
}

/** Simple helper function to check if a document is a LeadFunnel document */
export function isLeadFunnelDocument(
  document: unknown,
): document is LeadFunnelDocument {
  return LeadFunnelDocumentSchema.safeParse(document).success;
}

/** Simple helper function to assert that a document is a LeadFunnel document */
export function assertIsLeadFunnelDocument(
  document: unknown,
): asserts document is LeadFunnelDocument {
  LeadFunnelDocumentSchema.parse(document);
}
