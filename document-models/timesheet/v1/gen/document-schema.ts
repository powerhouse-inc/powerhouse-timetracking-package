/**
 * WARNING: DO NOT EDIT
 * This file is auto-generated and updated by codegen
 */
import {
  BaseDocumentHeaderSchema,
  BaseDocumentStateSchema,
} from "document-model";
import { z } from "zod";
import { timesheetDocumentType } from "./document-type.js";
import { TimesheetStateSchema } from "./schema/zod.js";
import type { TimesheetDocument, TimesheetPHState } from "./types.js";

/** Schema for validating the header object of a Timesheet document */
export const TimesheetDocumentHeaderSchema = BaseDocumentHeaderSchema.extend({
  documentType: z.literal(timesheetDocumentType),
});

/** Schema for validating the state object of a Timesheet document */
export const TimesheetPHStateSchema = BaseDocumentStateSchema.extend({
  global: TimesheetStateSchema(),
});

export const TimesheetDocumentSchema = z.object({
  header: TimesheetDocumentHeaderSchema,
  state: TimesheetPHStateSchema,
  initialState: TimesheetPHStateSchema,
});

/** Simple helper function to check if a state object is a Timesheet document state object */
export function isTimesheetState(state: unknown): state is TimesheetPHState {
  return TimesheetPHStateSchema.safeParse(state).success;
}

/** Simple helper function to assert that a document state object is a Timesheet document state object */
export function assertIsTimesheetState(
  state: unknown,
): asserts state is TimesheetPHState {
  TimesheetPHStateSchema.parse(state);
}

/** Simple helper function to check if a document is a Timesheet document */
export function isTimesheetDocument(
  document: unknown,
): document is TimesheetDocument {
  return TimesheetDocumentSchema.safeParse(document).success;
}

/** Simple helper function to assert that a document is a Timesheet document */
export function assertIsTimesheetDocument(
  document: unknown,
): asserts document is TimesheetDocument {
  TimesheetDocumentSchema.parse(document);
}
