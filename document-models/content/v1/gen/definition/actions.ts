/**
 * WARNING: DO NOT EDIT
 * This file is auto-generated and updated by codegen
 */
import type { Action } from "document-model";
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

export type SetTitleAction = Action & {
  type: "SET_TITLE";
  input: SetTitleInput;
};
export type SetBriefAction = Action & {
  type: "SET_BRIEF";
  input: SetBriefInput;
};
export type SetFormatAction = Action & {
  type: "SET_FORMAT";
  input: SetFormatInput;
};
export type SetChannelsAction = Action & {
  type: "SET_CHANNELS";
  input: SetChannelsInput;
};
export type SetTargetDateAction = Action & {
  type: "SET_TARGET_DATE";
  input: SetTargetDateInput;
};
export type SetDraftUrlAction = Action & {
  type: "SET_DRAFT_URL";
  input: SetDraftUrlInput;
};
export type SetCampaignAction = Action & {
  type: "SET_CAMPAIGN";
  input: SetCampaignInput;
};
export type AddAssetLinkAction = Action & {
  type: "ADD_ASSET_LINK";
  input: AddAssetLinkInput;
};
export type UpdateAssetLinkAction = Action & {
  type: "UPDATE_ASSET_LINK";
  input: UpdateAssetLinkInput;
};
export type RemoveAssetLinkAction = Action & {
  type: "REMOVE_ASSET_LINK";
  input: RemoveAssetLinkInput;
};

export type ContentDefinitionAction =
  | SetTitleAction
  | SetBriefAction
  | SetFormatAction
  | SetChannelsAction
  | SetTargetDateAction
  | SetDraftUrlAction
  | SetCampaignAction
  | AddAssetLinkAction
  | UpdateAssetLinkAction
  | RemoveAssetLinkAction;
