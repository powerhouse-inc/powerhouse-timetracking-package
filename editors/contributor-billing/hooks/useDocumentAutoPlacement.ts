import { useEffect, useMemo } from "react";
import {
  isFileNodeKind,
  isFolderNodeKind,
  useSelectedDrive,
  useDocumentsInSelectedDrive,
  useNodeActions,
} from "@powerhousedao/reactor-browser";
import type { FileNode, Node } from "document-drive";
import type { ExpenseReportDocument } from "document-models/expense-report";
import { useBillingFolderStructure } from "./useBillingFolderStructure.js";

// Module-level tracking to prevent duplicate processing
const globalProcessingState = {
  processedDocs: new Map<string, Set<string>>(), // driveId -> Set of doc IDs processed
};

interface UseDocumentAutoPlacementResult {
  /** Whether auto-placement is active */
  isActive: boolean;
}

/**
 * Hook that handles automatic placement of uploaded documents in the Contributor Billing drive.
 *
 * For Expense Reports:
 * - Places them in the appropriate Reporting folder based on periodStart
 * - Creates month folder structure if needed
 *
 * For Accounts:
 * - Keeps them at root level (no folder placement needed)
 * - The Accounts document is a single document, not multiple files
 */
export function useDocumentAutoPlacement(): UseDocumentAutoPlacementResult {
  const [driveDocument] = useSelectedDrive();
  const documentsInDrive = useDocumentsInSelectedDrive();
  const { reportingFolderIds, monthFolders, billingFolder, createMonthFolder } =
    useBillingFolderStructure();
  const { onMoveNode, onRenameNode } = useNodeActions();
  const driveId = driveDocument?.header.id;

  // Initialize module-level tracking for this drive
  if (driveId && !globalProcessingState.processedDocs.has(driveId)) {
    globalProcessingState.processedDocs.set(driveId, new Set());
  }

  // Helper function to get month name from periodStart date
  // Uses UTC to avoid timezone issues - extracts year and month directly from ISO string
  const getMonthNameFromPeriod = (
    periodStart: string | null | undefined,
  ): string | null => {
    if (!periodStart) return null;
    try {
      // Parse the ISO date string and extract UTC components
      // ISO format: "2025-07-01T00:00:00.000Z" or "2025-07-01"
      const date = new Date(periodStart);
      if (isNaN(date.getTime())) return null;

      // Use UTC methods to get year and month, avoiding timezone conversion
      const year = date.getUTCFullYear();
      const month = date.getUTCMonth(); // 0-11

      // Format as "Month Year" (e.g., "July 2025")
      const monthNames = [
        "January",
        "February",
        "March",
        "April",
        "May",
        "June",
        "July",
        "August",
        "September",
        "October",
        "November",
        "December",
      ];

      return `${monthNames[month]} ${year}`;
    } catch {
      return null;
    }
  };

  // Convert "August 2025" → "08-2025"
  const formatMonthCode = (monthName: string): string => {
    const date = new Date(monthName + " 1");
    if (isNaN(date.getTime())) return monthName;
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${month}-${year}`;
  };

  // Standard naming pattern: "MM-YYYY Expense Report N"
  const STANDARD_NAME_PATTERN = /^\d{2}-\d{4} Expense Report \d+$/;

  // Auto-place expense reports into appropriate Reporting folders
  useEffect(() => {
    if (!driveId || !driveDocument || !documentsInDrive) return;

    const allNodes = driveDocument.state.global.nodes;
    const processedDocs = globalProcessingState.processedDocs.get(driveId);
    if (!processedDocs) return;

    // Find all expense report file nodes that are not in a Reporting folder
    const expenseReportNodesToProcess = allNodes.filter(
      (node): node is FileNode =>
        isFileNodeKind(node) &&
        node.documentType === "powerhouse/expense-report" &&
        !reportingFolderIds.has(node.parentFolder || ""),
    );

    // Count existing expense reports per reporting folder for numbering
    const expenseCountByFolder = new Map<string, number>();
    for (const node of allNodes) {
      if (
        isFileNodeKind(node) &&
        node.documentType === "powerhouse/expense-report" &&
        node.parentFolder &&
        reportingFolderIds.has(node.parentFolder)
      ) {
        const count = expenseCountByFolder.get(node.parentFolder) || 0;
        expenseCountByFolder.set(node.parentFolder, count + 1);
      }
    }

    // Process each expense report
    for (const fileNode of expenseReportNodesToProcess) {
      // Skip if already processed
      if (processedDocs.has(fileNode.id)) continue;

      // Find the corresponding document to get periodStart
      const doc = documentsInDrive.find(
        (d): d is ExpenseReportDocument =>
          d.header.documentType === "powerhouse/expense-report" &&
          d.header.id === fileNode.id,
      );

      if (!doc) continue;

      const periodStart = doc.state.global.periodStart;
      const monthName = getMonthNameFromPeriod(periodStart);

      // Mark as processed immediately to prevent duplicate processing
      processedDocs.add(fileNode.id);

      if (monthName) {
        // Find the reporting folder for this month
        const monthInfo = monthFolders.get(monthName);
        const reportingFolder = monthInfo?.reportingFolder;

        if (reportingFolder) {
          // Move to the appropriate Reporting folder
          console.log(
            `[DocumentAutoPlacement] Moving expense report ${fileNode.id} to Reporting folder for ${monthName}`,
          );
          // Compute the new name before moving (increment folder count)
          const folderId = reportingFolder.id;
          const currentCount = expenseCountByFolder.get(folderId) || 0;
          const reportNumber = currentCount + 1;
          expenseCountByFolder.set(folderId, reportNumber);
          const monthCode = formatMonthCode(monthName);
          const standardName = `${monthCode} Expense Report ${reportNumber}`;

          onMoveNode(fileNode, reportingFolder)
            .then(async () => {
              console.log(
                `[DocumentAutoPlacement] Successfully moved expense report to ${monthName} Reporting folder`,
              );

              // Rename if the node name doesn't match the standard pattern
              if (!STANDARD_NAME_PATTERN.test(fileNode.name)) {
                try {
                  await onRenameNode(standardName, fileNode);
                  console.log(
                    `[DocumentAutoPlacement] Renamed "${fileNode.name}" → "${standardName}"`,
                  );
                } catch (renameError: unknown) {
                  console.error(
                    `[DocumentAutoPlacement] Failed to rename expense report:`,
                    renameError,
                  );
                }
              }
            })
            .catch((error: unknown) => {
              console.error(
                `[DocumentAutoPlacement] Failed to move expense report to Reporting folder:`,
                error,
              );
              // Remove from processed so it can be retried
              processedDocs.delete(fileNode.id);
            });
        } else {
          // Month folder doesn't exist yet - try to create it
          console.log(
            `[DocumentAutoPlacement] Month folder "${monthName}" doesn't exist, attempting to create it`,
          );
          if (billingFolder && driveId) {
            // Create the month folder and its subfolders
            createMonthFolder(monthName)
              .then(() => {
                console.log(
                  `[DocumentAutoPlacement] Created month folder "${monthName}", will retry placement on next effect run`,
                );
                // Remove from processed so it can be retried on next effect run
                processedDocs.delete(fileNode.id);
              })
              .catch((error: unknown) => {
                console.error(
                  `[DocumentAutoPlacement] Failed to create month folder "${monthName}":`,
                  error,
                );
                // Remove from processed so it can be retried
                processedDocs.delete(fileNode.id);
              });
          } else {
            // Can't create folder - remove from processed so it can be retried later
            processedDocs.delete(fileNode.id);
          }
        }
      } else {
        // No period defined - leave at root for now
        // User can manually move it later
        console.warn(
          `[DocumentAutoPlacement] Expense report ${fileNode.id} has no periodStart, leaving at root`,
        );
      }
    }
  }, [
    driveId,
    driveDocument,
    documentsInDrive,
    reportingFolderIds,
    monthFolders,
    billingFolder,
    createMonthFolder,
    onMoveNode,
    onRenameNode,
  ]);

  return {
    isActive: !!driveId,
  };
}
