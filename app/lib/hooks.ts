"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  fetchAccounts,
  fetchAccountTransactions,
  fetchBillingStatements,
  fetchExpenseReports,
  fetchInvoices,
  fetchLeadFunnel,
  fetchScopesOfWork,
  fetchSnapshotReports,
  fetchSurveys,
  fetchTimesheets,
  fetchWorkspace,
  type LeadFunnelDoc,
  type TimesheetDoc,
  type WorkspaceDoc,
} from "./api";
import type {
  AccountEntry,
  AccountTransactionsDoc,
  BillingStatementDoc,
  ExpenseReportDoc,
  InvoiceDoc,
  Role,
  ScopeOfWorkDoc,
  SnapshotReportDoc,
  SurveyDoc,
} from "./types";

export function useWorkspace() {
  return useQuery<WorkspaceDoc | null>({
    queryKey: ["workspace"],
    queryFn: fetchWorkspace,
    refetchInterval: 4000,
  });
}

export function useTimesheets() {
  return useQuery<TimesheetDoc[]>({
    queryKey: ["timesheets"],
    queryFn: fetchTimesheets,
    refetchInterval: 4000,
  });
}

export function useMyTimesheet(address: string | null | undefined) {
  const { data: sheets, ...rest } = useTimesheets();
  const mine =
    address != null
      ? (sheets?.find((s) => s.ownerAddress === address) ?? null)
      : null;
  return { timesheet: mine, sheets: sheets ?? [], ...rest };
}

/** Role of the current user as recorded in the workspace (defaults to MEMBER). */
export function useMyRole(address: string | null | undefined): Role | null {
  const { data: workspace } = useWorkspace();
  if (!address || !workspace) return null;
  const addr = address.toLowerCase();
  const member = workspace.members.find(
    (m) => m.status !== "ARCHIVED" && m.address?.toLowerCase() === addr,
  );
  return member?.role ?? null;
}

export function useLeadFunnel() {
  return useQuery<LeadFunnelDoc | null>({
    queryKey: ["leadFunnel"],
    queryFn: fetchLeadFunnel,
    refetchInterval: 4000,
  });
}

export function useScopesOfWork() {
  return useQuery<ScopeOfWorkDoc[]>({
    queryKey: ["scopesOfWork"],
    queryFn: fetchScopesOfWork,
    refetchInterval: 4000,
  });
}

export function useInvoices() {
  return useQuery<InvoiceDoc[]>({
    queryKey: ["invoices"],
    queryFn: fetchInvoices,
    refetchInterval: 4000,
  });
}

export function useBillingStatements() {
  return useQuery<BillingStatementDoc[]>({
    queryKey: ["billingStatements"],
    queryFn: fetchBillingStatements,
    refetchInterval: 4000,
  });
}

export function useAccounts() {
  return useQuery<AccountEntry[]>({
    queryKey: ["accounts"],
    queryFn: fetchAccounts,
    refetchInterval: 4000,
  });
}

export function useAccountTransactions() {
  return useQuery<AccountTransactionsDoc[]>({
    queryKey: ["accountTransactions"],
    queryFn: fetchAccountTransactions,
    refetchInterval: 4000,
  });
}

export function useExpenseReports() {
  return useQuery<ExpenseReportDoc[]>({
    queryKey: ["expenseReports"],
    queryFn: fetchExpenseReports,
    refetchInterval: 4000,
  });
}

export function useSnapshotReports() {
  return useQuery<SnapshotReportDoc[]>({
    queryKey: ["snapshotReports"],
    queryFn: fetchSnapshotReports,
    refetchInterval: 4000,
  });
}

export function useSurveys() {
  return useQuery<SurveyDoc[]>({
    queryKey: ["surveys"],
    queryFn: fetchSurveys,
    refetchInterval: 4000,
  });
}

/** Invalidate the read queries after a mutation so the UI reflects changes fast. */
export function useRefresh() {
  const qc = useQueryClient();
  return () => {
    void qc.invalidateQueries({ queryKey: ["timesheets"] });
    void qc.invalidateQueries({ queryKey: ["workspace"] });
    void qc.invalidateQueries({ queryKey: ["leadFunnel"] });
    void qc.invalidateQueries({ queryKey: ["scopesOfWork"] });
    void qc.invalidateQueries({ queryKey: ["invoices"] });
    void qc.invalidateQueries({ queryKey: ["billingStatements"] });
    void qc.invalidateQueries({ queryKey: ["surveys"] });
  };
}

export function useAction<TArgs extends unknown[]>(
  fn: (...args: TArgs) => Promise<void>,
) {
  const refresh = useRefresh();
  return useMutation({
    mutationFn: (args: TArgs) => fn(...args),
    onSuccess: refresh,
  });
}
