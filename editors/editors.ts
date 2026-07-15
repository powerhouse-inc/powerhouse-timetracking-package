/**
 * Hand-maintained editor registry.
 *
 * NOTE: editor codegen regenerates this file from the editor *documents* on
 * the Vetra drive, but it cannot scaffold drive editors (the built-in
 * `powerhouse/document-drive` type has no package metadata). `TtDriveEditor`
 * and the imported drive-app editors are hand-written and added here manually
 * — keep them in the array if codegen rewrites this file.
 */
import type { EditorModule } from "document-model";
import { Accounts as AccountsEditor } from "./accounts-editor/module.js";
import { AccountTransactions as AccountTransactionsEditor } from "./account-transactions-editor/module.js";
import { BillingStatement as BillingStatementEditor } from "./billing-statement/module.js";
import { BuilderTeamAdmin as BuilderTeamAdminEditor } from "./builder-team-admin/module.js";
import { ContributorBilling as ContributorBillingEditor } from "./contributor-billing/module.js";
import { ExpenseReport as ExpenseReportEditor } from "./expense-report/module.js";
import { Invoice as InvoiceEditor } from "./invoice/module.js";
import { LeadFunnelBoard } from "./lead-funnel-board/module.js";
import { OperationalHubProfileEditor } from "./operational-hub-profile-editor/module.js";
import { ScopeOfWorkEditor } from "./scope-of-work/module.js";
import { SnapshotReport as SnapshotReportEditor } from "./snapshot-report-editor/module.js";
import { TimesheetEditor } from "./timesheet-editor/module.js";
import { TtDriveEditor } from "./tt-drive/module.js";
import { WorkspaceEditor } from "./workspace-editor/module.js";

export const editors: EditorModule[] = [
  // Time
  TimesheetEditor,
  WorkspaceEditor,
  TtDriveEditor,
  // Sales
  LeadFunnelBoard,
  // Delivery
  ScopeOfWorkEditor,
  // Billing
  InvoiceEditor,
  BillingStatementEditor,
  AccountsEditor,
  AccountTransactionsEditor,
  ExpenseReportEditor,
  SnapshotReportEditor,
  OperationalHubProfileEditor,
  ContributorBillingEditor,
  BuilderTeamAdminEditor,
];
