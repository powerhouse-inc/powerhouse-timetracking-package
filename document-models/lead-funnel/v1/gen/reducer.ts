/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
import type { Reducer, StateReducer } from "document-model";
import { createReducer, isDocumentAction } from "document-model";
import type { LeadFunnelPHState } from "document-models/lead-funnel/v1";

import { leadFunnelActivitiesOperations } from "../src/reducers/activities.js";
import { leadFunnelFunnelOperations } from "../src/reducers/funnel.js";
import { leadFunnelLeadsOperations } from "../src/reducers/leads.js";
import { leadFunnelTagsOperations } from "../src/reducers/tags.js";

import {
  AddActivityInputSchema,
  AddLeadInputSchema,
  AddTagInputSchema,
  DeleteActivityInputSchema,
  DeleteLeadInputSchema,
  MoveLeadInputSchema,
  RemoveTagInputSchema,
  ReorderLeadInputSchema,
  SetFunnelNameInputSchema,
  UpdateLeadInputSchema,
} from "./schema/zod.js";

const stateReducer: StateReducer<LeadFunnelPHState> = (
  state,
  action,
  dispatch,
) => {
  if (isDocumentAction(action)) {
    return state;
  }
  switch (action.type) {
    case "SET_FUNNEL_NAME": {
      SetFunnelNameInputSchema().parse(action.input);

      leadFunnelFunnelOperations.setFunnelNameOperation(
        (state as any)[action.scope],
        action as any,
        dispatch,
      );

      break;
    }

    case "ADD_LEAD": {
      AddLeadInputSchema().parse(action.input);

      leadFunnelLeadsOperations.addLeadOperation(
        (state as any)[action.scope],
        action as any,
        dispatch,
      );

      break;
    }

    case "UPDATE_LEAD": {
      UpdateLeadInputSchema().parse(action.input);

      leadFunnelLeadsOperations.updateLeadOperation(
        (state as any)[action.scope],
        action as any,
        dispatch,
      );

      break;
    }

    case "MOVE_LEAD": {
      MoveLeadInputSchema().parse(action.input);

      leadFunnelLeadsOperations.moveLeadOperation(
        (state as any)[action.scope],
        action as any,
        dispatch,
      );

      break;
    }

    case "REORDER_LEAD": {
      ReorderLeadInputSchema().parse(action.input);

      leadFunnelLeadsOperations.reorderLeadOperation(
        (state as any)[action.scope],
        action as any,
        dispatch,
      );

      break;
    }

    case "DELETE_LEAD": {
      DeleteLeadInputSchema().parse(action.input);

      leadFunnelLeadsOperations.deleteLeadOperation(
        (state as any)[action.scope],
        action as any,
        dispatch,
      );

      break;
    }

    case "ADD_ACTIVITY": {
      AddActivityInputSchema().parse(action.input);

      leadFunnelActivitiesOperations.addActivityOperation(
        (state as any)[action.scope],
        action as any,
        dispatch,
      );

      break;
    }

    case "DELETE_ACTIVITY": {
      DeleteActivityInputSchema().parse(action.input);

      leadFunnelActivitiesOperations.deleteActivityOperation(
        (state as any)[action.scope],
        action as any,
        dispatch,
      );

      break;
    }

    case "ADD_TAG": {
      AddTagInputSchema().parse(action.input);

      leadFunnelTagsOperations.addTagOperation(
        (state as any)[action.scope],
        action as any,
        dispatch,
      );

      break;
    }

    case "REMOVE_TAG": {
      RemoveTagInputSchema().parse(action.input);

      leadFunnelTagsOperations.removeTagOperation(
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

export const reducer: Reducer<LeadFunnelPHState> = createReducer(stateReducer);
