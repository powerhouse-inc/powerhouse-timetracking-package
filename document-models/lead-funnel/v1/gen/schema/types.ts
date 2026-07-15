export type Maybe<T> = T | null | undefined;
export type InputMaybe<T> = T | null | undefined;
export type Exact<T extends { [key: string]: unknown }> = {
  [K in keyof T]: T[K];
};
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & {
  [SubKey in K]?: Maybe<T[SubKey]>;
};
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & {
  [SubKey in K]: Maybe<T[SubKey]>;
};
export type MakeEmpty<
  T extends { [key: string]: unknown },
  K extends keyof T,
> = { [_ in K]?: never };
export type Incremental<T> =
  | T
  | {
      [P in keyof T]?: P extends " $fragmentName" | "__typename" ? T[P] : never;
    };
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: { input: string; output: string };
  String: { input: string; output: string };
  Boolean: { input: boolean; output: boolean };
  Int: { input: number; output: number };
  Float: { input: number; output: number };
  Address: { input: `${string}:0x${string}`; output: `${string}:0x${string}` };
  Amount: {
    input: { unit?: string; value?: number };
    output: { unit?: string; value?: number };
  };
  Amount_Crypto: {
    input: { unit: string; value: string };
    output: { unit: string; value: string };
  };
  Amount_Currency: {
    input: { unit: string; value: string };
    output: { unit: string; value: string };
  };
  Amount_Fiat: {
    input: { unit: string; value: number };
    output: { unit: string; value: number };
  };
  Amount_Money: { input: number; output: number };
  Amount_Percentage: { input: number; output: number };
  Amount_Tokens: { input: number; output: number };
  AttachmentRef: {
    input: `attachment://v${number}:${string}`;
    output: `attachment://v${number}:${string}`;
  };
  Currency: { input: string; output: string };
  Date: { input: string; output: string };
  DateTime: { input: string; output: string };
  EmailAddress: { input: string; output: string };
  EthereumAddress: { input: string; output: string };
  OID: { input: string; output: string };
  OLabel: { input: string; output: string };
  PHID: { input: string; output: string };
  URL: { input: string; output: string };
  Unknown: { input: unknown; output: unknown };
  Upload: { input: File; output: File };
};

export type Activity = {
  id: Scalars["OID"]["output"];
  note: Maybe<Scalars["String"]["output"]>;
  timestamp: Scalars["DateTime"]["output"];
  type: ActivityType;
};

export type ActivityType = "CALL" | "EMAIL" | "MEETING" | "NOTE";

export type AddActivityInput = {
  id: Scalars["OID"]["input"];
  leadId: Scalars["OID"]["input"];
  note?: InputMaybe<Scalars["String"]["input"]>;
  timestamp: Scalars["DateTime"]["input"];
  type: ActivityType;
};

export type AddLeadInput = {
  clientId?: InputMaybe<Scalars["OID"]["input"]>;
  company?: InputMaybe<Scalars["String"]["input"]>;
  createdAt: Scalars["DateTime"]["input"];
  email?: InputMaybe<Scalars["EmailAddress"]["input"]>;
  estimatedValue?: InputMaybe<Scalars["Amount_Money"]["input"]>;
  id: Scalars["OID"]["input"];
  name: Scalars["String"]["input"];
  notes?: InputMaybe<Scalars["String"]["input"]>;
  owner?: InputMaybe<Scalars["String"]["input"]>;
  phone?: InputMaybe<Scalars["String"]["input"]>;
  priority?: InputMaybe<LeadPriority>;
  score?: InputMaybe<Scalars["Int"]["input"]>;
  source?: InputMaybe<LeadSource>;
  tags?: InputMaybe<Array<Scalars["String"]["input"]>>;
};

export type AddTagInput = {
  leadId: Scalars["OID"]["input"];
  tag: Scalars["String"]["input"];
};

export type DeleteActivityInput = {
  id: Scalars["OID"]["input"];
  leadId: Scalars["OID"]["input"];
  timestamp: Scalars["DateTime"]["input"];
};

export type DeleteLeadInput = {
  id: Scalars["OID"]["input"];
};

export type Lead = {
  activities: Array<Activity>;
  clientId: Maybe<Scalars["OID"]["output"]>;
  company: Maybe<Scalars["String"]["output"]>;
  createdAt: Scalars["DateTime"]["output"];
  email: Maybe<Scalars["EmailAddress"]["output"]>;
  estimatedValue: Maybe<Scalars["Amount_Money"]["output"]>;
  id: Scalars["OID"]["output"];
  name: Scalars["String"]["output"];
  notes: Maybe<Scalars["String"]["output"]>;
  owner: Maybe<Scalars["String"]["output"]>;
  phone: Maybe<Scalars["String"]["output"]>;
  priority: LeadPriority;
  score: Scalars["Int"]["output"];
  source: LeadSource;
  stage: LeadStage;
  tags: Array<Scalars["String"]["output"]>;
  updatedAt: Scalars["DateTime"]["output"];
};

export type LeadFunnelState = {
  leads: Array<Lead>;
  name: Scalars["String"]["output"];
};

export type LeadPriority = "HIGH" | "LOW" | "MEDIUM";

export type LeadSource =
  | "COLD_OUTREACH"
  | "EVENT"
  | "OTHER"
  | "REFERRAL"
  | "SOCIAL"
  | "WEBSITE";

export type LeadStage =
  | "CONTACTED"
  | "LOST"
  | "NEGOTIATION"
  | "NEW"
  | "PROPOSAL"
  | "QUALIFIED"
  | "WON";

export type MoveLeadInput = {
  id: Scalars["OID"]["input"];
  stage: LeadStage;
  updatedAt: Scalars["DateTime"]["input"];
};

export type RemoveTagInput = {
  leadId: Scalars["OID"]["input"];
  tag: Scalars["String"]["input"];
};

export type ReorderLeadInput = {
  id: Scalars["OID"]["input"];
  targetIndex: Scalars["Int"]["input"];
};

export type SetFunnelNameInput = {
  name: Scalars["String"]["input"];
};

export type UpdateLeadInput = {
  clientId?: InputMaybe<Scalars["OID"]["input"]>;
  company?: InputMaybe<Scalars["String"]["input"]>;
  email?: InputMaybe<Scalars["EmailAddress"]["input"]>;
  estimatedValue?: InputMaybe<Scalars["Amount_Money"]["input"]>;
  id: Scalars["OID"]["input"];
  name?: InputMaybe<Scalars["String"]["input"]>;
  notes?: InputMaybe<Scalars["String"]["input"]>;
  owner?: InputMaybe<Scalars["String"]["input"]>;
  phone?: InputMaybe<Scalars["String"]["input"]>;
  priority?: InputMaybe<LeadPriority>;
  score?: InputMaybe<Scalars["Int"]["input"]>;
  source?: InputMaybe<LeadSource>;
  updatedAt: Scalars["DateTime"]["input"];
};
