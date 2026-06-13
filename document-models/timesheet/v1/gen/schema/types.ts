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

export type AddEntryInput = {
  billable: Scalars["Boolean"]["input"];
  description: Scalars["String"]["input"];
  end: Scalars["DateTime"]["input"];
  id: Scalars["OID"]["input"];
  projectId?: InputMaybe<Scalars["OID"]["input"]>;
  start: Scalars["DateTime"]["input"];
  tags: Array<Scalars["String"]["input"]>;
};

export type DeleteEntryInput = {
  id: Scalars["OID"]["input"];
};

export type DiscardTimerInput = {
  _?: InputMaybe<Scalars["Boolean"]["input"]>;
};

export type RunningEntry = {
  billable: Scalars["Boolean"]["output"];
  description: Scalars["String"]["output"];
  id: Scalars["OID"]["output"];
  projectId: Maybe<Scalars["OID"]["output"]>;
  start: Scalars["DateTime"]["output"];
  tags: Array<Scalars["String"]["output"]>;
};

export type SetOwnerInput = {
  ownerAddress: Scalars["String"]["input"];
};

export type StartTimerInput = {
  billable: Scalars["Boolean"]["input"];
  description: Scalars["String"]["input"];
  id: Scalars["OID"]["input"];
  projectId?: InputMaybe<Scalars["OID"]["input"]>;
  start: Scalars["DateTime"]["input"];
  tags: Array<Scalars["String"]["input"]>;
};

export type StopTimerInput = {
  end: Scalars["DateTime"]["input"];
};

export type TimeEntry = {
  billable: Scalars["Boolean"]["output"];
  description: Scalars["String"]["output"];
  end: Scalars["DateTime"]["output"];
  id: Scalars["OID"]["output"];
  projectId: Maybe<Scalars["OID"]["output"]>;
  start: Scalars["DateTime"]["output"];
  tags: Array<Scalars["String"]["output"]>;
};

export type TimesheetState = {
  entries: Array<TimeEntry>;
  ownerAddress: Maybe<Scalars["String"]["output"]>;
  running: Maybe<RunningEntry>;
};

export type UpdateEntryInput = {
  billable?: InputMaybe<Scalars["Boolean"]["input"]>;
  description?: InputMaybe<Scalars["String"]["input"]>;
  end?: InputMaybe<Scalars["DateTime"]["input"]>;
  id: Scalars["OID"]["input"];
  projectId?: InputMaybe<Scalars["OID"]["input"]>;
  start?: InputMaybe<Scalars["DateTime"]["input"]>;
  tags?: InputMaybe<Array<Scalars["String"]["input"]>>;
};
