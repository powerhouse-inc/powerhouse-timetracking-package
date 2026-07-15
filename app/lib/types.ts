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
