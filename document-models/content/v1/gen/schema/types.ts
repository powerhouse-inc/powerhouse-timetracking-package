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

export type AddAssetLinkInput = {
  attachmentRef?: InputMaybe<Scalars["String"]["input"]>;
  fileName?: InputMaybe<Scalars["String"]["input"]>;
  id: Scalars["OID"]["input"];
  label?: InputMaybe<Scalars["String"]["input"]>;
  mimeType?: InputMaybe<Scalars["String"]["input"]>;
  sizeBytes?: InputMaybe<Scalars["Int"]["input"]>;
  url?: InputMaybe<Scalars["URL"]["input"]>;
};

export type AdvanceStageInput = {
  actor?: InputMaybe<Scalars["String"]["input"]>;
  eventId: Scalars["OID"]["input"];
  note?: InputMaybe<Scalars["String"]["input"]>;
  timestamp: Scalars["DateTime"]["input"];
  toStage: ContentStage;
};

export type AssetLink = {
  attachmentRef: Maybe<Scalars["String"]["output"]>;
  fileName: Maybe<Scalars["String"]["output"]>;
  id: Scalars["OID"]["output"];
  label: Maybe<Scalars["String"]["output"]>;
  mimeType: Maybe<Scalars["String"]["output"]>;
  sizeBytes: Maybe<Scalars["Int"]["output"]>;
  url: Maybe<Scalars["URL"]["output"]>;
};

export type AssignOwnerInput = {
  owner: Scalars["String"]["input"];
  timestamp: Scalars["DateTime"]["input"];
};

export type ContentChannel =
  | "DIRECTORY"
  | "DISCORD"
  | "EMAIL"
  | "FACEBOOK_GROUP"
  | "FORUM"
  | "LINKEDIN"
  | "OTHER"
  | "REDDIT"
  | "TELEGRAM"
  | "WEB";

export type ContentFormat =
  | "ARTICLE"
  | "DM_SCRIPT"
  | "LEAD_MAGNET"
  | "ONE_PAGER"
  | "OTHER"
  | "POST"
  | "VIDEO";

export type ContentStage =
  | "DRAFTING"
  | "IDEA"
  | "PUBLISHED"
  | "REPURPOSE"
  | "REVIEW"
  | "SCHEDULED";

export type ContentState = {
  assetLinks: Array<AssetLink>;
  brief: Maybe<Scalars["String"]["output"]>;
  campaignId: Maybe<Scalars["PHID"]["output"]>;
  campaignName: Maybe<Scalars["String"]["output"]>;
  channels: Array<ContentChannel>;
  createdAt: Maybe<Scalars["DateTime"]["output"]>;
  currentStage: ContentStage;
  dispositionReason: Maybe<Scalars["String"]["output"]>;
  draftUrl: Maybe<Scalars["URL"]["output"]>;
  format: ContentFormat;
  history: Array<StageEvent>;
  owner: Maybe<Scalars["String"]["output"]>;
  publishedDate: Maybe<Scalars["Date"]["output"]>;
  publishedUrl: Maybe<Scalars["URL"]["output"]>;
  status: ContentStatus;
  targetDate: Maybe<Scalars["Date"]["output"]>;
  title: Scalars["String"]["output"];
  updatedAt: Maybe<Scalars["DateTime"]["output"]>;
};

export type ContentStatus = "ACTIVE" | "KILLED" | "PARKED";

export type KillInput = {
  actor?: InputMaybe<Scalars["String"]["input"]>;
  eventId: Scalars["OID"]["input"];
  reason: Scalars["String"]["input"];
  timestamp: Scalars["DateTime"]["input"];
};

export type ParkInput = {
  actor?: InputMaybe<Scalars["String"]["input"]>;
  eventId: Scalars["OID"]["input"];
  reason: Scalars["String"]["input"];
  timestamp: Scalars["DateTime"]["input"];
};

export type PublishInput = {
  actor?: InputMaybe<Scalars["String"]["input"]>;
  eventId: Scalars["OID"]["input"];
  note?: InputMaybe<Scalars["String"]["input"]>;
  publishedDate: Scalars["Date"]["input"];
  publishedUrl: Scalars["URL"]["input"];
  timestamp: Scalars["DateTime"]["input"];
};

export type RemoveAssetLinkInput = {
  id: Scalars["OID"]["input"];
};

export type ResumeInput = {
  actor?: InputMaybe<Scalars["String"]["input"]>;
  eventId: Scalars["OID"]["input"];
  timestamp: Scalars["DateTime"]["input"];
};

export type SetBriefInput = {
  brief?: InputMaybe<Scalars["String"]["input"]>;
};

export type SetCampaignInput = {
  campaignId?: InputMaybe<Scalars["PHID"]["input"]>;
  campaignName?: InputMaybe<Scalars["String"]["input"]>;
};

export type SetChannelsInput = {
  channels: Array<ContentChannel>;
};

export type SetDraftUrlInput = {
  draftUrl?: InputMaybe<Scalars["URL"]["input"]>;
};

export type SetFormatInput = {
  format: ContentFormat;
};

export type SetTargetDateInput = {
  targetDate?: InputMaybe<Scalars["Date"]["input"]>;
};

export type SetTitleInput = {
  title: Scalars["String"]["input"];
};

export type StageEvent = {
  actor: Maybe<Scalars["String"]["output"]>;
  fromStage: Maybe<ContentStage>;
  id: Scalars["OID"]["output"];
  note: Maybe<Scalars["String"]["output"]>;
  timestamp: Scalars["DateTime"]["output"];
  toStage: ContentStage;
};

export type UpdateAssetLinkInput = {
  id: Scalars["OID"]["input"];
  label?: InputMaybe<Scalars["String"]["input"]>;
  url?: InputMaybe<Scalars["URL"]["input"]>;
};
