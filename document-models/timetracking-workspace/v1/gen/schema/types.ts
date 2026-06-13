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

export type AddClientInput = {
  id: Scalars["OID"]["input"];
  name: Scalars["String"]["input"];
};

export type AddMemberInput = {
  address?: InputMaybe<Scalars["String"]["input"]>;
  avatarUrl?: InputMaybe<Scalars["URL"]["input"]>;
  did?: InputMaybe<Scalars["String"]["input"]>;
  id: Scalars["OID"]["input"];
  name: Scalars["String"]["input"];
  role: MemberRole;
};

export type AddProjectInput = {
  billable: Scalars["Boolean"]["input"];
  clientId?: InputMaybe<Scalars["OID"]["input"]>;
  color: Scalars["String"]["input"];
  id: Scalars["OID"]["input"];
  name: Scalars["String"]["input"];
};

export type ArchiveClientInput = {
  id: Scalars["OID"]["input"];
};

export type ArchiveMemberInput = {
  id: Scalars["OID"]["input"];
};

export type ArchiveProjectInput = {
  id: Scalars["OID"]["input"];
};

export type Client = {
  id: Scalars["OID"]["output"];
  name: Scalars["String"]["output"];
  status: EntityStatus;
};

export type EntityStatus = "ACTIVE" | "ARCHIVED";

export type Member = {
  address: Maybe<Scalars["String"]["output"]>;
  avatarUrl: Maybe<Scalars["URL"]["output"]>;
  did: Maybe<Scalars["String"]["output"]>;
  id: Scalars["OID"]["output"];
  name: Scalars["String"]["output"];
  role: MemberRole;
  status: MemberStatus;
};

export type MemberRole = "ADMIN" | "BILLING" | "MANAGER" | "MEMBER";

export type MemberStatus = "ACTIVE" | "ARCHIVED" | "INVITED";

export type Project = {
  billable: Scalars["Boolean"]["output"];
  clientId: Maybe<Scalars["OID"]["output"]>;
  color: Scalars["String"]["output"];
  hourlyRate: Maybe<Scalars["Amount_Money"]["output"]>;
  id: Scalars["OID"]["output"];
  name: Scalars["String"]["output"];
  status: EntityStatus;
};

export type SetMemberRoleInput = {
  id: Scalars["OID"]["input"];
  role: MemberRole;
};

export type SetWorkspaceNameInput = {
  name: Scalars["String"]["input"];
};

export type TimetrackingWorkspaceState = {
  clients: Array<Client>;
  members: Array<Member>;
  name: Scalars["String"]["output"];
  projects: Array<Project>;
};

export type UpdateClientInput = {
  id: Scalars["OID"]["input"];
  name?: InputMaybe<Scalars["String"]["input"]>;
};

export type UpdateMemberInput = {
  avatarUrl?: InputMaybe<Scalars["URL"]["input"]>;
  id: Scalars["OID"]["input"];
  name?: InputMaybe<Scalars["String"]["input"]>;
  status?: InputMaybe<MemberStatus>;
};

export type UpdateProjectInput = {
  billable?: InputMaybe<Scalars["Boolean"]["input"]>;
  clientId?: InputMaybe<Scalars["OID"]["input"]>;
  color?: InputMaybe<Scalars["String"]["input"]>;
  id: Scalars["OID"]["input"];
  name?: InputMaybe<Scalars["String"]["input"]>;
};
