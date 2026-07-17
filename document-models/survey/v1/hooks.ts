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
import type { SurveyAction, SurveyDocument } from "document-models/survey/v1";
import {
  assertIsSurveyDocument,
  isSurveyDocument,
} from "./gen/document-schema.js";

/** Hook to get a Survey document by its id */
export function useSurveyDocumentById(
  documentId: string | null | undefined,
): [SurveyDocument, DocumentDispatch<SurveyAction>] | [undefined, undefined] {
  const [document, dispatch] = useDocumentById(documentId);
  if (!isSurveyDocument(document)) return [undefined, undefined];
  return [document, dispatch];
}

/** Hook to get the selected Survey document */
export function useSelectedSurveyDocument(): [
  SurveyDocument,
  DocumentDispatch<SurveyAction>,
] {
  const [document, dispatch] = useSelectedDocument();

  assertIsSurveyDocument(document);
  return [document, dispatch] as const;
}

/** Hook to get all Survey documents in the selected drive */
export function useSurveyDocumentsInSelectedDrive() {
  const documentsInSelectedDrive = useDocumentsInSelectedDrive();
  return documentsInSelectedDrive?.filter(isSurveyDocument);
}

/** Hook to get all Survey documents in the selected folder */
export function useSurveyDocumentsInSelectedFolder() {
  const documentsInSelectedFolder = useDocumentsInSelectedFolder();
  return documentsInSelectedFolder?.filter(isSurveyDocument);
}
