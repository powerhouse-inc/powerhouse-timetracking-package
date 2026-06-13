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
  TimetrackingWorkspaceAction,
  TimetrackingWorkspaceDocument,
} from "document-models/timetracking-workspace/v1";
import {
  assertIsTimetrackingWorkspaceDocument,
  isTimetrackingWorkspaceDocument,
} from "./gen/document-schema.js";

/** Hook to get a TimetrackingWorkspace document by its id */
export function useTimetrackingWorkspaceDocumentById(
  documentId: string | null | undefined,
):
  | [
      TimetrackingWorkspaceDocument,
      DocumentDispatch<TimetrackingWorkspaceAction>,
    ]
  | [undefined, undefined] {
  const [document, dispatch] = useDocumentById(documentId);
  if (!isTimetrackingWorkspaceDocument(document)) return [undefined, undefined];
  return [document, dispatch];
}

/** Hook to get the selected TimetrackingWorkspace document */
export function useSelectedTimetrackingWorkspaceDocument(): [
  TimetrackingWorkspaceDocument,
  DocumentDispatch<TimetrackingWorkspaceAction>,
] {
  const [document, dispatch] = useSelectedDocument();

  assertIsTimetrackingWorkspaceDocument(document);
  return [document, dispatch] as const;
}

/** Hook to get all TimetrackingWorkspace documents in the selected drive */
export function useTimetrackingWorkspaceDocumentsInSelectedDrive() {
  const documentsInSelectedDrive = useDocumentsInSelectedDrive();
  return documentsInSelectedDrive?.filter(isTimetrackingWorkspaceDocument);
}

/** Hook to get all TimetrackingWorkspace documents in the selected folder */
export function useTimetrackingWorkspaceDocumentsInSelectedFolder() {
  const documentsInSelectedFolder = useDocumentsInSelectedFolder();
  return documentsInSelectedFolder?.filter(isTimetrackingWorkspaceDocument);
}
