/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
import type { Reducer, StateReducer } from "document-model";
import { createReducer, isDocumentAction } from "document-model";
import type { TimesheetPHState } from "document-models/timesheet/v1";

import { timesheetTrackingOperations } from "../src/reducers/tracking.js";

import {
  AddEntryInputSchema,
  DeleteEntryInputSchema,
  DiscardTimerInputSchema,
  SetOwnerInputSchema,
  StartTimerInputSchema,
  StopTimerInputSchema,
  UpdateEntryInputSchema,
} from "./schema/zod.js";

const stateReducer: StateReducer<TimesheetPHState> = (
  state,
  action,
  dispatch,
) => {
  if (isDocumentAction(action)) {
    return state;
  }
  switch (action.type) {
    case "SET_OWNER": {
      SetOwnerInputSchema().parse(action.input);

      timesheetTrackingOperations.setOwnerOperation(
        (state as any)[action.scope],
        action as any,
        dispatch,
      );

      break;
    }

    case "START_TIMER": {
      StartTimerInputSchema().parse(action.input);

      timesheetTrackingOperations.startTimerOperation(
        (state as any)[action.scope],
        action as any,
        dispatch,
      );

      break;
    }

    case "STOP_TIMER": {
      StopTimerInputSchema().parse(action.input);

      timesheetTrackingOperations.stopTimerOperation(
        (state as any)[action.scope],
        action as any,
        dispatch,
      );

      break;
    }

    case "DISCARD_TIMER": {
      DiscardTimerInputSchema().parse(action.input);

      timesheetTrackingOperations.discardTimerOperation(
        (state as any)[action.scope],
        action as any,
        dispatch,
      );

      break;
    }

    case "ADD_ENTRY": {
      AddEntryInputSchema().parse(action.input);

      timesheetTrackingOperations.addEntryOperation(
        (state as any)[action.scope],
        action as any,
        dispatch,
      );

      break;
    }

    case "UPDATE_ENTRY": {
      UpdateEntryInputSchema().parse(action.input);

      timesheetTrackingOperations.updateEntryOperation(
        (state as any)[action.scope],
        action as any,
        dispatch,
      );

      break;
    }

    case "DELETE_ENTRY": {
      DeleteEntryInputSchema().parse(action.input);

      timesheetTrackingOperations.deleteEntryOperation(
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

export const reducer: Reducer<TimesheetPHState> = createReducer(stateReducer);
