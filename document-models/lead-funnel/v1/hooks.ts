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
  LeadFunnelAction,
  LeadFunnelDocument,
} from "document-models/lead-funnel/v1";
import {
  assertIsLeadFunnelDocument,
  isLeadFunnelDocument,
} from "./gen/document-schema.js";

/** Hook to get a LeadFunnel document by its id */
export function useLeadFunnelDocumentById(
  documentId: string | null | undefined,
):
  | [LeadFunnelDocument, DocumentDispatch<LeadFunnelAction>]
  | [undefined, undefined] {
  const [document, dispatch] = useDocumentById(documentId);
  if (!isLeadFunnelDocument(document)) return [undefined, undefined];
  return [document, dispatch];
}

/** Hook to get the selected LeadFunnel document */
export function useSelectedLeadFunnelDocument(): [
  LeadFunnelDocument,
  DocumentDispatch<LeadFunnelAction>,
] {
  const [document, dispatch] = useSelectedDocument();

  assertIsLeadFunnelDocument(document);
  return [document, dispatch] as const;
}

/** Hook to get all LeadFunnel documents in the selected drive */
export function useLeadFunnelDocumentsInSelectedDrive() {
  const documentsInSelectedDrive = useDocumentsInSelectedDrive();
  return documentsInSelectedDrive?.filter(isLeadFunnelDocument);
}

/** Hook to get all LeadFunnel documents in the selected folder */
export function useLeadFunnelDocumentsInSelectedFolder() {
  const documentsInSelectedFolder = useDocumentsInSelectedFolder();
  return documentsInSelectedFolder?.filter(isLeadFunnelDocument);
}
