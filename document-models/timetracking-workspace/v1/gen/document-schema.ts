/**
 * WARNING: DO NOT EDIT
 * This file is auto-generated and updated by codegen
 */
import {
  BaseDocumentHeaderSchema,
  BaseDocumentStateSchema,
} from "document-model";
import { z } from "zod";
import { timetrackingWorkspaceDocumentType } from "./document-type.js";
import { TimetrackingWorkspaceStateSchema } from "./schema/zod.js";
import type {
  TimetrackingWorkspaceDocument,
  TimetrackingWorkspacePHState,
} from "./types.js";

/** Schema for validating the header object of a TimetrackingWorkspace document */
export const TimetrackingWorkspaceDocumentHeaderSchema =
  BaseDocumentHeaderSchema.extend({
    documentType: z.literal(timetrackingWorkspaceDocumentType),
  });

/** Schema for validating the state object of a TimetrackingWorkspace document */
export const TimetrackingWorkspacePHStateSchema =
  BaseDocumentStateSchema.extend({
    global: TimetrackingWorkspaceStateSchema(),
  });

export const TimetrackingWorkspaceDocumentSchema = z.object({
  header: TimetrackingWorkspaceDocumentHeaderSchema,
  state: TimetrackingWorkspacePHStateSchema,
  initialState: TimetrackingWorkspacePHStateSchema,
});

/** Simple helper function to check if a state object is a TimetrackingWorkspace document state object */
export function isTimetrackingWorkspaceState(
  state: unknown,
): state is TimetrackingWorkspacePHState {
  return TimetrackingWorkspacePHStateSchema.safeParse(state).success;
}

/** Simple helper function to assert that a document state object is a TimetrackingWorkspace document state object */
export function assertIsTimetrackingWorkspaceState(
  state: unknown,
): asserts state is TimetrackingWorkspacePHState {
  TimetrackingWorkspacePHStateSchema.parse(state);
}

/** Simple helper function to check if a document is a TimetrackingWorkspace document */
export function isTimetrackingWorkspaceDocument(
  document: unknown,
): document is TimetrackingWorkspaceDocument {
  return TimetrackingWorkspaceDocumentSchema.safeParse(document).success;
}

/** Simple helper function to assert that a document is a TimetrackingWorkspace document */
export function assertIsTimetrackingWorkspaceDocument(
  document: unknown,
): asserts document is TimetrackingWorkspaceDocument {
  TimetrackingWorkspaceDocumentSchema.parse(document);
}
