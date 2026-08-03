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
  ContentAction,
  ContentDocument,
} from "document-models/content/v1";
import {
  assertIsContentDocument,
  isContentDocument,
} from "./gen/document-schema.js";

/** Hook to get a Content document by its id */
export function useContentDocumentById(
  documentId: string | null | undefined,
): [ContentDocument, DocumentDispatch<ContentAction>] | [undefined, undefined] {
  const [document, dispatch] = useDocumentById(documentId);
  if (!isContentDocument(document)) return [undefined, undefined];
  return [document, dispatch];
}

/** Hook to get the selected Content document */
export function useSelectedContentDocument(): [
  ContentDocument,
  DocumentDispatch<ContentAction>,
] {
  const [document, dispatch] = useSelectedDocument();

  assertIsContentDocument(document);
  return [document, dispatch] as const;
}

/** Hook to get all Content documents in the selected drive */
export function useContentDocumentsInSelectedDrive() {
  const documentsInSelectedDrive = useDocumentsInSelectedDrive();
  return documentsInSelectedDrive?.filter(isContentDocument);
}

/** Hook to get all Content documents in the selected folder */
export function useContentDocumentsInSelectedFolder() {
  const documentsInSelectedFolder = useDocumentsInSelectedFolder();
  return documentsInSelectedFolder?.filter(isContentDocument);
}
