/* eslint-disable @typescript-eslint/no-empty-object-type */
/* eslint-disable @typescript-eslint/no-unused-vars */
import * as z from "zod";
import type {
  AddAssetLinkInput,
  AdvanceStageInput,
  AssetLink,
  AssignOwnerInput,
  ContentChannel,
  ContentFormat,
  ContentStage,
  ContentState,
  ContentStatus,
  KillInput,
  ParkInput,
  PublishInput,
  RemoveAssetLinkInput,
  ResumeInput,
  SetBriefInput,
  SetCampaignInput,
  SetChannelsInput,
  SetDraftUrlInput,
  SetFormatInput,
  SetTargetDateInput,
  SetTitleInput,
  StageEvent,
  UpdateAssetLinkInput,
} from "./types.js";

type Properties<T> = Required<{
  [K in keyof T]: z.ZodType<T[K]>;
}>;

type definedNonNullAny = {};

export const isDefinedNonNullAny = (v: any): v is definedNonNullAny =>
  v !== undefined && v !== null;

export const definedNonNullAnySchema = z
  .any()
  .refine((v) => isDefinedNonNullAny(v));

export const ContentChannelSchema = z.enum([
  "DIRECTORY",
  "DISCORD",
  "EMAIL",
  "FACEBOOK_GROUP",
  "FORUM",
  "LINKEDIN",
  "OTHER",
  "REDDIT",
  "TELEGRAM",
  "WEB",
]);

export const ContentFormatSchema = z.enum([
  "ARTICLE",
  "DM_SCRIPT",
  "LEAD_MAGNET",
  "ONE_PAGER",
  "OTHER",
  "POST",
  "VIDEO",
]);

export const ContentStageSchema = z.enum([
  "DRAFTING",
  "IDEA",
  "PUBLISHED",
  "REPURPOSE",
  "REVIEW",
  "SCHEDULED",
]);

export const ContentStatusSchema = z.enum(["ACTIVE", "KILLED", "PARKED"]);

export function AddAssetLinkInputSchema(): z.ZodObject<
  Properties<AddAssetLinkInput>
> {
  return z.object({
    id: z.string(),
    label: z.string().nullish(),
    url: z.url(),
  });
}

export function AdvanceStageInputSchema(): z.ZodObject<
  Properties<AdvanceStageInput>
> {
  return z.object({
    actor: z.string().nullish(),
    eventId: z.string(),
    note: z.string().nullish(),
    timestamp: z.iso.datetime(),
    toStage: ContentStageSchema,
  });
}

export function AssetLinkSchema(): z.ZodObject<Properties<AssetLink>> {
  return z.object({
    __typename: z.literal("AssetLink").optional(),
    id: z.string(),
    label: z.string().nullish(),
    url: z.url(),
  });
}

export function AssignOwnerInputSchema(): z.ZodObject<
  Properties<AssignOwnerInput>
> {
  return z.object({
    owner: z.string(),
    timestamp: z.iso.datetime(),
  });
}

export function ContentStateSchema(): z.ZodObject<Properties<ContentState>> {
  return z.object({
    __typename: z.literal("ContentState").optional(),
    assetLinks: z.array(z.lazy(() => AssetLinkSchema())),
    brief: z.string().nullish(),
    campaignId: z.string().nullish(),
    campaignName: z.string().nullish(),
    channels: z.array(ContentChannelSchema),
    createdAt: z.iso.datetime().nullish(),
    currentStage: ContentStageSchema,
    dispositionReason: z.string().nullish(),
    draftUrl: z.url().nullish(),
    format: ContentFormatSchema,
    history: z.array(z.lazy(() => StageEventSchema())),
    owner: z.string().nullish(),
    publishedDate: z.iso.datetime().nullish(),
    publishedUrl: z.url().nullish(),
    status: ContentStatusSchema,
    targetDate: z.iso.datetime().nullish(),
    title: z.string(),
    updatedAt: z.iso.datetime().nullish(),
  });
}

export function KillInputSchema(): z.ZodObject<Properties<KillInput>> {
  return z.object({
    actor: z.string().nullish(),
    eventId: z.string(),
    reason: z.string(),
    timestamp: z.iso.datetime(),
  });
}

export function ParkInputSchema(): z.ZodObject<Properties<ParkInput>> {
  return z.object({
    actor: z.string().nullish(),
    eventId: z.string(),
    reason: z.string(),
    timestamp: z.iso.datetime(),
  });
}

export function PublishInputSchema(): z.ZodObject<Properties<PublishInput>> {
  return z.object({
    actor: z.string().nullish(),
    eventId: z.string(),
    note: z.string().nullish(),
    publishedDate: z.iso.datetime(),
    publishedUrl: z.url(),
    timestamp: z.iso.datetime(),
  });
}

export function RemoveAssetLinkInputSchema(): z.ZodObject<
  Properties<RemoveAssetLinkInput>
> {
  return z.object({
    id: z.string(),
  });
}

export function ResumeInputSchema(): z.ZodObject<Properties<ResumeInput>> {
  return z.object({
    actor: z.string().nullish(),
    eventId: z.string(),
    timestamp: z.iso.datetime(),
  });
}

export function SetBriefInputSchema(): z.ZodObject<Properties<SetBriefInput>> {
  return z.object({
    brief: z.string().nullish(),
  });
}

export function SetCampaignInputSchema(): z.ZodObject<
  Properties<SetCampaignInput>
> {
  return z.object({
    campaignId: z.string().nullish(),
    campaignName: z.string().nullish(),
  });
}

export function SetChannelsInputSchema(): z.ZodObject<
  Properties<SetChannelsInput>
> {
  return z.object({
    channels: z.array(ContentChannelSchema),
  });
}

export function SetDraftUrlInputSchema(): z.ZodObject<
  Properties<SetDraftUrlInput>
> {
  return z.object({
    draftUrl: z.url().nullish(),
  });
}

export function SetFormatInputSchema(): z.ZodObject<
  Properties<SetFormatInput>
> {
  return z.object({
    format: ContentFormatSchema,
  });
}

export function SetTargetDateInputSchema(): z.ZodObject<
  Properties<SetTargetDateInput>
> {
  return z.object({
    targetDate: z.iso.datetime().nullish(),
  });
}

export function SetTitleInputSchema(): z.ZodObject<Properties<SetTitleInput>> {
  return z.object({
    title: z.string(),
  });
}

export function StageEventSchema(): z.ZodObject<Properties<StageEvent>> {
  return z.object({
    __typename: z.literal("StageEvent").optional(),
    actor: z.string().nullish(),
    fromStage: ContentStageSchema.nullish(),
    id: z.string(),
    note: z.string().nullish(),
    timestamp: z.iso.datetime(),
    toStage: ContentStageSchema,
  });
}

export function UpdateAssetLinkInputSchema(): z.ZodObject<
  Properties<UpdateAssetLinkInput>
> {
  return z.object({
    id: z.string(),
    label: z.string().nullish(),
    url: z.url().nullish(),
  });
}
