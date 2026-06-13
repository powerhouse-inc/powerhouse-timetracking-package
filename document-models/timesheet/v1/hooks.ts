/**
 * WARNING: DO NOT EDIT
 * This file is auto-generated and updated by codegen
 */
import type { DocumentDispatch } from "@powerhousedao/reactor-browser";
import {
  useDocumentById,
  useDocumentsInSelectedDrive,
  useDocumentsInSelectedFolder,
  useSelectedDocument,
} from "@powerhousedao/reactor-browser";
import type {
  TimesheetAction,
  TimesheetDocument,
} from "document-models/timesheet/v1";
import {
  assertIsTimesheetDocument,
  isTimesheetDocument,
} from "./gen/document-schema.js";

/** Hook to get a Timesheet document by its id */
export function useTimesheetDocumentById(
  documentId: string | null | undefined,
):
  | [TimesheetDocument, DocumentDispatch<TimesheetAction>]
  | [undefined, undefined] {
  const [document, dispatch] = useDocumentById(documentId);
  if (!isTimesheetDocument(document)) return [undefined, undefined];
  return [document, dispatch];
}

/** Hook to get the selected Timesheet document */
export function useSelectedTimesheetDocument(): [
  TimesheetDocument,
  DocumentDispatch<TimesheetAction>,
] {
  const [document, dispatch] = useSelectedDocument();

  assertIsTimesheetDocument(document);
  return [document, dispatch] as const;
}

/** Hook to get all Timesheet documents in the selected drive */
export function useTimesheetDocumentsInSelectedDrive() {
  const documentsInSelectedDrive = useDocumentsInSelectedDrive();
  return documentsInSelectedDrive?.filter(isTimesheetDocument);
}

/** Hook to get all Timesheet documents in the selected folder */
export function useTimesheetDocumentsInSelectedFolder() {
  const documentsInSelectedFolder = useDocumentsInSelectedFolder();
  return documentsInSelectedFolder?.filter(isTimesheetDocument);
}
