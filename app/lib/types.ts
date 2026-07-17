export type Role = "ADMIN" | "MANAGER" | "MEMBER" | "BILLING";
export type EntityStatus = "ACTIVE" | "ARCHIVED";
export type MemberStatus = "ACTIVE" | "INVITED" | "ARCHIVED";

export interface TimeEntry {
  entryId: string;
  timesheetId: string;
  ownerAddress: string | null;
  entryLocalId: string;
  description: string;
  projectId: string | null;
  projectName: string | null;
  projectColor: string | null;
  clientId: string | null;
  clientName: string | null;
  startTime: string;
  endTime: string;
  durationSeconds: number;
  billable: boolean;
  tags: string[];
  day: string;
  week: string;
  month: string;
  year: number;
}

export interface DaySummary {
  day: string;
  durationSeconds: number;
  billableSeconds: number;
}

export interface ProjectSummary {
  projectId: string | null;
  projectName: string | null;
  color: string | null;
  durationSeconds: number;
  billableSeconds: number;
}

export interface ClientSummary {
  clientId: string | null;
  clientName: string | null;
  durationSeconds: number;
  billableSeconds: number;
}

export interface MemberSummary {
  address: string | null;
  name: string | null;
  durationSeconds: number;
  billableSeconds: number;
}

export interface WorkspaceMember {
  localId: string;
  address: string | null;
  did: string | null;
  name: string;
  avatarUrl: string | null;
  role: Role;
  status: MemberStatus;
}

export interface WorkspaceProject {
  localId: string;
  name: string;
  clientId: string | null;
  clientName: string | null;
  color: string;
  billable: boolean;
  hourlyRate: number | null;
  status: EntityStatus;
}

export interface WorkspaceClient {
  localId: string;
  name: string;
  status: EntityStatus;
}

/* -------------------------------- sales -------------------------------- */

export type LeadStage =
  | "NEW"
  | "CONTACTED"
  | "QUALIFIED"
  | "PROPOSAL"
  | "NEGOTIATION"
  | "WON"
  | "LOST";
export type LeadSource =
  | "WEBSITE"
  | "REFERRAL"
  | "COLD_OUTREACH"
  | "EVENT"
  | "SOCIAL"
  | "OTHER";
export type LeadPriority = "LOW" | "MEDIUM" | "HIGH";
export type ActivityType = "CALL" | "EMAIL" | "MEETING" | "NOTE";

export interface LeadActivity {
  id: string;
  type: ActivityType;
  note: string | null;
  timestamp: string;
}

export interface Lead {
  id: string;
  name: string;
  company: string | null;
  clientId: string | null;
  email: string | null;
  phone: string | null;
  source: LeadSource;
  stage: LeadStage;
  priority: LeadPriority;
  estimatedValue: number | null;
  owner: string | null;
  score: number;
  tags: string[];
  notes: string | null;
  activities: LeadActivity[];
  createdAt: string;
  updatedAt: string;
}

/* ------------------------------- delivery ------------------------------ */

export type SowStatus =
  | "DRAFT"
  | "SUBMITTED"
  | "IN_PROGRESS"
  | "REJECTED"
  | "APPROVED"
  | "DELIVERED"
  | "CANCELED";

export type DeliverableStatus =
  | "WONT_DO"
  | "DRAFT"
  | "TODO"
  | "BLOCKED"
  | "IN_PROGRESS"
  | "DELIVERED"
  | "CANCELED";

export type BudgetUnit = "StoryPoints" | "Hours";

export interface SowBudgetAnchor {
  project: string | null;
  unit: BudgetUnit | null;
  unitCost: number;
  quantity: number;
  margin: number;
}

export interface SowDeliverable {
  id: string;
  title: string;
  code: string;
  description: string;
  owner: string | null;
  status: DeliverableStatus;
  /** normalized 0–100 completion, or null when unset */
  progressPercent: number | null;
  budgetAnchor: SowBudgetAnchor | null;
}

export interface SowProject {
  id: string;
  code: string;
  title: string;
  workspaceProjectId: string | null;
  budget: number | null;
  currency: string | null;
  budgetType: string | null;
}

export interface ScopeOfWorkDoc {
  id: string;
  name: string;
  title: string;
  description: string;
  status: SowStatus;
  projects: SowProject[];
  deliverables: SowDeliverable[];
}

/* ------------------------------- billing ------------------------------- */

export type InvoiceStatus =
  | "DRAFT"
  | "ISSUED"
  | "CANCELLED"
  | "ACCEPTED"
  | "REJECTED"
  | "PAYMENTSCHEDULED"
  | "PAYMENTSENT"
  | "PAYMENTISSUE"
  | "PAYMENTRECEIVED"
  | "PAYMENTCLOSED";

export interface InvoiceLineItem {
  id: string;
  description: string;
  taxPercent: number;
  quantity: number;
  currency: string;
  unitPriceTaxExcl: number;
  unitPriceTaxIncl: number;
  totalPriceTaxExcl: number;
  totalPriceTaxIncl: number;
}

export interface InvoicePayment {
  id: string;
  paymentDate: string | null;
  txnRef: string | null;
  confirmed: boolean;
  amount: number | null;
}

export interface InvoiceDoc {
  id: string;
  name: string;
  status: InvoiceStatus;
  invoiceNo: string;
  currency: string;
  dateIssued: string | null;
  dateDue: string | null;
  issuerName: string | null;
  payerName: string | null;
  lineItems: InvoiceLineItem[];
  payments: InvoicePayment[];
  totalPriceTaxExcl: number;
  totalPriceTaxIncl: number;
  notes: string | null;
}

export type BillingStatementStatus =
  | "DRAFT"
  | "ISSUED"
  | "ACCEPTED"
  | "REJECTED"
  | "PAID";

export type BillingUnit = "MINUTE" | "HOUR" | "DAY" | "UNIT";

export interface BillingLineItem {
  id: string;
  description: string;
  quantity: number;
  unit: BillingUnit;
  unitPriceCash: number;
  unitPricePwt: number;
  totalPriceCash: number;
  totalPricePwt: number;
}

export interface BillingStatementDoc {
  id: string;
  name: string;
  contributor: string | null;
  status: BillingStatementStatus;
  currency: string;
  dateIssued: string | null;
  dateDue: string | null;
  totalCash: number;
  totalPowt: number;
  lineItems: BillingLineItem[];
  notes: string | null;
}

/* ------------------------------- finance ------------------------------- */

export type AccountType = "Source" | "Internal" | "Destination" | "External";
export type KycAmlStatus = "PASSED" | "PENDING" | "FAILED";
export type ExpenseReportStatus = "DRAFT" | "REVIEW" | "FINAL";
export type TransactionDirection = "INFLOW" | "OUTFLOW";

/** An entry in an Accounts registry document. */
export interface AccountEntry {
  id: string;
  account: string;
  name: string;
  budgetPath: string | null;
  accountTransactionsId: string | null;
  chain: string[];
  type: AccountType;
  owners: string[];
  kycAmlStatus: KycAmlStatus | null;
}

export interface AccountTransaction {
  id: string;
  counterParty: string | null;
  /** Raw Amount_Currency value — format with formatAmountCurrency(). */
  amount: unknown;
  datetime: string;
  txHash: string;
  token: string | null;
  blockNumber: number | null;
  budget: string | null;
  accountingPeriod: string;
  direction: TransactionDirection;
}

/** An AccountTransactions document: one account plus its ledger. */
export interface AccountTransactionsDoc {
  id: string;
  name: string;
  account: {
    id: string;
    account: string;
    name: string;
    type: string | null;
    chain: string[];
    owners: string[];
    kycAmlStatus: string | null;
  };
  transactions: AccountTransaction[];
}

export interface ExpenseReportDoc {
  id: string;
  name: string;
  status: ExpenseReportStatus;
  periodStart: string | null;
  periodEnd: string | null;
  walletCount: number;
  totalBudget: number;
  totalActuals: number;
  totalForecast: number;
  totalPayments: number;
}

export interface SnapshotReportDoc {
  id: string;
  name: string;
  reportName: string | null;
  periodStart: string | null;
  periodEnd: string | null;
  accountCount: number;
  /** Sum of INFLOW transaction amounts across all snapshot accounts. */
  netInflow: number;
  /** Sum of OUTFLOW transaction amounts across all snapshot accounts. */
  netOutflow: number;
}

/* -------------------------------- surveys -------------------------------- */

export type SurveyKind = "SURVEY" | "TEMPLATE";
export type SurveyStatus = "DRAFT" | "OPEN" | "CLOSED";
export type QuestionType =
  | "SHORT_TEXT"
  | "LONG_TEXT"
  | "SINGLE_SELECT"
  | "MULTI_SELECT"
  | "RATING"
  | "GRID";
export type GridColumnType = "TEXT" | "SELECT";

export interface QuestionOption {
  id: string;
  label: string;
}

export interface RatingScale {
  min: number;
  max: number;
  minLabel: string | null;
  maxLabel: string | null;
}

export interface GridColumn {
  id: string;
  label: string;
  type: GridColumnType;
  options: QuestionOption[];
}

export interface SurveySection {
  id: string;
  title: string;
  description: string | null;
}

export interface SurveyQuestion {
  id: string;
  sectionId: string;
  type: QuestionType;
  title: string;
  helpText: string | null;
  required: boolean;
  options: QuestionOption[];
  ratingScale: RatingScale | null;
  columns: GridColumn[];
}

export interface GridCell {
  columnId: string;
  text: string | null;
  optionId: string | null;
}

export interface GridRow {
  cells: GridCell[];
}

export interface SurveyAnswer {
  questionId: string;
  text: string | null;
  optionIds: string[];
  rating: number | null;
  rows: GridRow[];
}

export interface SurveyResponse {
  id: string;
  submittedAt: string;
  answers: SurveyAnswer[];
}

export interface SurveyDoc {
  id: string;
  name: string;
  title: string;
  description: string | null;
  kind: SurveyKind;
  status: SurveyStatus;
  shareToken: string | null;
  clientId: string | null;
  clientName: string | null;
  sections: SurveySection[];
  questions: SurveyQuestion[];
  responses: SurveyResponse[];
  createdAt: string | null;
  publishedAt: string | null;
  closedAt: string | null;
}
