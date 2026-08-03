import type { ContentDefinitionOperations } from "document-models/content/v1";
import { AssetLinkNotFoundError } from "../../gen/definition/error.js";

export const contentDefinitionOperations: ContentDefinitionOperations = {
  setTitleOperation(state, action) {
    state.title = action.input.title;
  },
  setBriefOperation(state, action) {
    state.brief = action.input.brief || null;
  },
  setFormatOperation(state, action) {
    state.format = action.input.format;
  },
  setChannelsOperation(state, action) {
    state.channels = action.input.channels;
  },
  setTargetDateOperation(state, action) {
    state.targetDate = action.input.targetDate || null;
  },
  setDraftUrlOperation(state, action) {
    state.draftUrl = action.input.draftUrl || null;
  },
  setCampaignOperation(state, action) {
    state.campaignId = action.input.campaignId || null;
    state.campaignName = action.input.campaignName || null;
  },
  addAssetLinkOperation(state, action) {
    state.assetLinks.push({
      id: action.input.id,
      label: action.input.label || null,
      url: action.input.url,
    });
  },
  updateAssetLinkOperation(state, action) {
    const link = state.assetLinks.find((l) => l.id === action.input.id);
    if (!link) {
      throw new AssetLinkNotFoundError("Asset link not found");
    }
    if (action.input.label !== undefined)
      link.label = action.input.label ?? null;
    if (action.input.url) link.url = action.input.url;
  },
  removeAssetLinkOperation(state, action) {
    const index = state.assetLinks.findIndex((l) => l.id === action.input.id);
    if (index === -1) {
      throw new AssetLinkNotFoundError("Asset link not found");
    }
    state.assetLinks.splice(index, 1);
  },
};
