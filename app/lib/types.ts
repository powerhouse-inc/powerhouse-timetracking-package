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
