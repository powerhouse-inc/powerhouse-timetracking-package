/**
 * WARNING: DO NOT EDIT
 * This file is auto-generated and updated by codegen
 */
import { type SignalDispatch } from "document-model";
import type { ContentGlobalState } from "../types.js";
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

export interface ContentDefinitionOperations {
  setTitleOperation: (
    state: ContentGlobalState,
    action: SetTitleAction,
    dispatch?: SignalDispatch,
  ) => void;
  setBriefOperation: (
    state: ContentGlobalState,
    action: SetBriefAction,
    dispatch?: SignalDispatch,
  ) => void;
  setFormatOperation: (
    state: ContentGlobalState,
    action: SetFormatAction,
    dispatch?: SignalDispatch,
  ) => void;
  setChannelsOperation: (
    state: ContentGlobalState,
    action: SetChannelsAction,
    dispatch?: SignalDispatch,
  ) => void;
  setTargetDateOperation: (
    state: ContentGlobalState,
    action: SetTargetDateAction,
    dispatch?: SignalDispatch,
  ) => void;
  setDraftUrlOperation: (
    state: ContentGlobalState,
    action: SetDraftUrlAction,
    dispatch?: SignalDispatch,
  ) => void;
  setCampaignOperation: (
    state: ContentGlobalState,
    action: SetCampaignAction,
    dispatch?: SignalDispatch,
  ) => void;
  addAssetLinkOperation: (
    state: ContentGlobalState,
    action: AddAssetLinkAction,
    dispatch?: SignalDispatch,
  ) => void;
  updateAssetLinkOperation: (
    state: ContentGlobalState,
    action: UpdateAssetLinkAction,
    dispatch?: SignalDispatch,
  ) => void;
  removeAssetLinkOperation: (
    state: ContentGlobalState,
    action: RemoveAssetLinkAction,
    dispatch?: SignalDispatch,
  ) => void;
}
