/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
import type { Reducer, StateReducer } from "document-model";
import { createReducer, isDocumentAction } from "document-model";
import type { ContentPHState } from "document-models/content/v1";

import { contentDefinitionOperations } from "../src/reducers/definition.js";
import { contentLifecycleOperations } from "../src/reducers/lifecycle.js";

import {
  AddAssetLinkInputSchema,
  AdvanceStageInputSchema,
  AssignOwnerInputSchema,
  KillInputSchema,
  ParkInputSchema,
  PublishInputSchema,
  RemoveAssetLinkInputSchema,
  ResumeInputSchema,
  SetBriefInputSchema,
  SetCampaignInputSchema,
  SetChannelsInputSchema,
  SetDraftUrlInputSchema,
  SetFormatInputSchema,
  SetTargetDateInputSchema,
  SetTitleInputSchema,
  UpdateAssetLinkInputSchema,
} from "./schema/zod.js";

const stateReducer: StateReducer<ContentPHState> = (
  state,
  action,
  dispatch,
) => {
  if (isDocumentAction(action)) {
    return state;
  }
  switch (action.type) {
    case "SET_TITLE": {
      SetTitleInputSchema().parse(action.input);

      contentDefinitionOperations.setTitleOperation(
        (state as any)[action.scope],
        action as any,
        dispatch,
      );

      break;
    }

    case "SET_BRIEF": {
      SetBriefInputSchema().parse(action.input);

      contentDefinitionOperations.setBriefOperation(
        (state as any)[action.scope],
        action as any,
        dispatch,
      );

      break;
    }

    case "SET_FORMAT": {
      SetFormatInputSchema().parse(action.input);

      contentDefinitionOperations.setFormatOperation(
        (state as any)[action.scope],
        action as any,
        dispatch,
      );

      break;
    }

    case "SET_CHANNELS": {
      SetChannelsInputSchema().parse(action.input);

      contentDefinitionOperations.setChannelsOperation(
        (state as any)[action.scope],
        action as any,
        dispatch,
      );

      break;
    }

    case "SET_TARGET_DATE": {
      SetTargetDateInputSchema().parse(action.input);

      contentDefinitionOperations.setTargetDateOperation(
        (state as any)[action.scope],
        action as any,
        dispatch,
      );

      break;
    }

    case "SET_DRAFT_URL": {
      SetDraftUrlInputSchema().parse(action.input);

      contentDefinitionOperations.setDraftUrlOperation(
        (state as any)[action.scope],
        action as any,
        dispatch,
      );

      break;
    }

    case "SET_CAMPAIGN": {
      SetCampaignInputSchema().parse(action.input);

      contentDefinitionOperations.setCampaignOperation(
        (state as any)[action.scope],
        action as any,
        dispatch,
      );

      break;
    }

    case "ADD_ASSET_LINK": {
      AddAssetLinkInputSchema().parse(action.input);

      contentDefinitionOperations.addAssetLinkOperation(
        (state as any)[action.scope],
        action as any,
        dispatch,
      );

      break;
    }

    case "UPDATE_ASSET_LINK": {
      UpdateAssetLinkInputSchema().parse(action.input);

      contentDefinitionOperations.updateAssetLinkOperation(
        (state as any)[action.scope],
        action as any,
        dispatch,
      );

      break;
    }

    case "REMOVE_ASSET_LINK": {
      RemoveAssetLinkInputSchema().parse(action.input);

      contentDefinitionOperations.removeAssetLinkOperation(
        (state as any)[action.scope],
        action as any,
        dispatch,
      );

      break;
    }

    case "ASSIGN_OWNER": {
      AssignOwnerInputSchema().parse(action.input);

      contentLifecycleOperations.assignOwnerOperation(
        (state as any)[action.scope],
        action as any,
        dispatch,
      );

      break;
    }

    case "ADVANCE_STAGE": {
      AdvanceStageInputSchema().parse(action.input);

      contentLifecycleOperations.advanceStageOperation(
        (state as any)[action.scope],
        action as any,
        dispatch,
      );

      break;
    }

    case "PUBLISH": {
      PublishInputSchema().parse(action.input);

      contentLifecycleOperations.publishOperation(
        (state as any)[action.scope],
        action as any,
        dispatch,
      );

      break;
    }

    case "PARK": {
      ParkInputSchema().parse(action.input);

      contentLifecycleOperations.parkOperation(
        (state as any)[action.scope],
        action as any,
        dispatch,
      );

      break;
    }

    case "KILL": {
      KillInputSchema().parse(action.input);

      contentLifecycleOperations.killOperation(
        (state as any)[action.scope],
        action as any,
        dispatch,
      );

      break;
    }

    case "RESUME": {
      ResumeInputSchema().parse(action.input);

      contentLifecycleOperations.resumeOperation(
        (state as any)[action.scope],
        action as any,
        dispatch,
      );

      break;
    }

    default:
      return state;
  }
};

export const reducer: Reducer<ContentPHState> = createReducer(stateReducer);
