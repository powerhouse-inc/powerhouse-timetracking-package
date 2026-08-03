/**
 * WARNING: DO NOT EDIT
 * This file is auto-generated and updated by codegen
 */
import { createAction } from "document-model";
import {
  AddAssetLinkInputSchema,
  RemoveAssetLinkInputSchema,
  SetBriefInputSchema,
  SetCampaignInputSchema,
  SetChannelsInputSchema,
  SetDraftUrlInputSchema,
  SetFormatInputSchema,
  SetTargetDateInputSchema,
  SetTitleInputSchema,
  UpdateAssetLinkInputSchema,
} from "../schema/zod.js";
import type {
  AddAssetLinkInput,
  RemoveAssetLinkInput,
  SetBriefInput,
  SetCampaignInput,
  SetChannelsInput,
  SetDraftUrlInput,
  SetFormatInput,
  SetTargetDateInput,
  SetTitleInput,
  UpdateAssetLinkInput,
} from "../types.js";
import type {
  AddAssetLinkAction,
  RemoveAssetLinkAction,
  SetBriefAction,
  SetCampaignAction,
  SetChannelsAction,
  SetDraftUrlAction,
  SetFormatAction,
  SetTargetDateAction,
  SetTitleAction,
  UpdateAssetLinkAction,
} from "./actions.js";

export const setTitle = (input: SetTitleInput) =>
  createAction<SetTitleAction>(
    "SET_TITLE",
    { ...input },
    undefined,
    SetTitleInputSchema,
    "global",
  );

export const setBrief = (input: SetBriefInput) =>
  createAction<SetBriefAction>(
    "SET_BRIEF",
    { ...input },
    undefined,
    SetBriefInputSchema,
    "global",
  );

export const setFormat = (input: SetFormatInput) =>
  createAction<SetFormatAction>(
    "SET_FORMAT",
    { ...input },
    undefined,
    SetFormatInputSchema,
    "global",
  );

export const setChannels = (input: SetChannelsInput) =>
  createAction<SetChannelsAction>(
    "SET_CHANNELS",
    { ...input },
    undefined,
    SetChannelsInputSchema,
    "global",
  );

export const setTargetDate = (input: SetTargetDateInput) =>
  createAction<SetTargetDateAction>(
    "SET_TARGET_DATE",
    { ...input },
    undefined,
    SetTargetDateInputSchema,
    "global",
  );

export const setDraftUrl = (input: SetDraftUrlInput) =>
  createAction<SetDraftUrlAction>(
    "SET_DRAFT_URL",
    { ...input },
    undefined,
    SetDraftUrlInputSchema,
    "global",
  );

export const setCampaign = (input: SetCampaignInput) =>
  createAction<SetCampaignAction>(
    "SET_CAMPAIGN",
    { ...input },
    undefined,
    SetCampaignInputSchema,
    "global",
  );

export const addAssetLink = (input: AddAssetLinkInput) =>
  createAction<AddAssetLinkAction>(
    "ADD_ASSET_LINK",
    { ...input },
    undefined,
    AddAssetLinkInputSchema,
    "global",
  );

export const updateAssetLink = (input: UpdateAssetLinkInput) =>
  createAction<UpdateAssetLinkAction>(
    "UPDATE_ASSET_LINK",
    { ...input },
    undefined,
    UpdateAssetLinkInputSchema,
    "global",
  );

export const removeAssetLink = (input: RemoveAssetLinkInput) =>
  createAction<RemoveAssetLinkAction>(
    "REMOVE_ASSET_LINK",
    { ...input },
    undefined,
    RemoveAssetLinkInputSchema,
    "global",
  );
