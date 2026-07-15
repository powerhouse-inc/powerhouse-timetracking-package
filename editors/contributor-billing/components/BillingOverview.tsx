import { CreditCard, FileText } from "lucide-react";
import { useBillingFolderStructure } from "../hooks/useBillingFolderStructure.js";
import {
  useDocumentsInSelectedDrive,
  useSelectedDrive,
  isFileNodeKind,
} from "@powerhousedao/reactor-browser";
import { useMemo, useEffect, useCallback } from "react";
import { MonthlyReportsOverview } from "./MonthlyReportsOverview.js";
import type { SelectedFolderInfo } from "./FolderTree.js";

interface BillingOverviewProps {
  onFolderSelect?: (folderInfo: SelectedFolderInfo | null) => void;
  onActiveNodeIdChange?: (nodeId: string) => void;
}

/**
 * Overview for the Billing folder showing payment stats and monthly reporting
 */
export function BillingOverview({
  onFolderSelect,
  onActiveNodeIdChange,
}: BillingOverviewProps) {
  const {
    billingFolder,
    monthFolders,
    createMonthFolder,
    createBillingFolder,
    paymentsFolderIds,
  } = useBillingFolderStructure();
  const documentsInDrive = useDocumentsInSelectedDrive();
  const [driveDocument] = useSelectedDrive();

  // Calculate payment stats across all months
  const paymentStats = useMemo(() => {
    if (!documentsInDrive || !driveDocument) {
      return {
        totalInvoices: 0,
        totalAmount: 0,
        pendingCount: 0,
        paidCount: 0,
      };
    }

    const nodes = driveDocument.state.global.nodes;

    // Get all invoice file IDs that are in any payments folder
    const invoiceIds = new Set(
      nodes
        .filter(
          (n) =>
            isFileNodeKind(n) &&
            paymentsFolderIds.has(n.parentFolder || "") &&
            n.documentType === "powerhouse/invoice",
        )
        .map((n) => n.id),
    );

    // Filter invoices in payments folders
    const invoices = documentsInDrive.filter(
      (doc) =>
        doc.header.documentType === "powerhouse/invoice" &&
        invoiceIds.has(doc.header.id),
    );

    let totalAmount = 0;
    let pendingCount = 0;
    let paidCount = 0;

    for (const invoice of invoices) {
      const state = invoice.state as {
        global?: { totalPriceTaxIncl?: number; status?: string };
      };
      totalAmount += state.global?.totalPriceTaxIncl || 0;

      const status = state.global?.status?.toUpperCase() || "DRAFT";
      if (
        status === "PAYMENTSENT" ||
        status === "PAYMENTRECEIVED" ||
        status === "PAYMENTCLOSED"
      ) {
        paidCount++;
      } else if (status !== "REJECTED" && status !== "CANCELLED") {
        pendingCount++;
      }
    }

    return {
      totalInvoices: invoices.length,
      totalAmount,
      pendingCount,
      paidCount,
    };
  }, [documentsInDrive, driveDocument, paymentsFolderIds]);

  // Auto-create billing folder if it doesn't exist
  const ensureBillingFolder = useCallback(async () => {
    if (!billingFolder) {
      await createBillingFolder();
    }
  }, [billingFolder, createBillingFolder]);

  // Create billing folder automatically when component mounts
  useEffect(() => {
    void ensureBillingFolder();
  }, [ensureBillingFolder]);

  // Show loading state while billing folder is being created
  if (!billingFolder) {
    return (
      <div>
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Billing</h1>
          <p className="text-gray-600">
            Manage monthly billing, payments, and reports
          </p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
          <div className="animate-pulse">
            <div className="w-12 h-12 bg-gray-200 rounded-full mx-auto mb-4" />
            <div className="h-5 bg-gray-200 rounded w-32 mx-auto mb-2" />
            <div className="h-4 bg-gray-100 rounded w-48 mx-auto" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Billing</h1>
        <p className="text-gray-600">
          Manage monthly billing, payments, and reports
        </p>
      </div>

      {/* Payment Stats */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-blue-100 rounded-lg">
            <CreditCard className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              Payment Summary
            </h2>
            <p className="text-sm text-gray-600">
              Overview of all invoices across billing months
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <FileText className="w-4 h-4 text-gray-500" />
              <span className="text-sm text-gray-600">Total Invoices</span>
            </div>
            <p className="text-xl font-bold text-gray-900">
              {paymentStats.totalInvoices}
            </p>
          </div>
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <CreditCard className="w-4 h-4 text-gray-500" />
              <span className="text-sm text-gray-600">Total Amount</span>
            </div>
            <p className="text-xl font-bold text-gray-900">
              $
              {paymentStats.totalAmount.toLocaleString("en-US", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </p>
          </div>
          <div className="bg-amber-50 rounded-lg p-3">
            <span className="text-sm text-amber-600">Pending</span>
            <p className="text-xl font-bold text-amber-700">
              {paymentStats.pendingCount}
            </p>
          </div>
          <div className="bg-green-50 rounded-lg p-3">
            <span className="text-sm text-green-600">Paid</span>
            <p className="text-xl font-bold text-green-700">
              {paymentStats.paidCount}
            </p>
          </div>
        </div>
      </div>

      {/* Monthly Reports Overview */}
      <MonthlyReportsOverview
        onFolderSelect={onFolderSelect}
        monthFolders={monthFolders}
        onCreateMonth={createMonthFolder}
        onActiveNodeIdChange={onActiveNodeIdChange}
      />
    </div>
  );
}
