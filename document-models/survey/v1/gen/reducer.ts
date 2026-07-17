/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
import type { Reducer, StateReducer } from "document-model";
import { createReducer, isDocumentAction } from "document-model";
import type { SurveyPHState } from "document-models/survey/v1";

import { surveyDefinitionOperations } from "../src/reducers/definition.js";
import { surveyPublishingOperations } from "../src/reducers/publishing.js";
import { surveyResponsesOperations } from "../src/reducers/responses.js";

import {
  AddQuestionInputSchema,
  AddResponseInputSchema,
  AddSectionInputSchema,
  CloseSurveyInputSchema,
  DeleteQuestionInputSchema,
  DeleteResponseInputSchema,
  DeleteSectionInputSchema,
  MoveQuestionInputSchema,
  PublishSurveyInputSchema,
  RegenerateShareTokenInputSchema,
  ReopenSurveyInputSchema,
  ReorderQuestionsInputSchema,
  ReorderSectionsInputSchema,
  SetDescriptionInputSchema,
  SetRecipientInputSchema,
  SetSurveyKindInputSchema,
  SetTitleInputSchema,
  UpdateQuestionInputSchema,
  UpdateSectionInputSchema,
} from "./schema/zod.js";

const stateReducer: StateReducer<SurveyPHState> = (state, action, dispatch) => {
  if (isDocumentAction(action)) {
    return state;
  }
  switch (action.type) {
    case "SET_TITLE": {
      SetTitleInputSchema().parse(action.input);

      surveyDefinitionOperations.setTitleOperation(
        (state as any)[action.scope],
        action as any,
        dispatch,
      );

      break;
    }

    case "SET_DESCRIPTION": {
      SetDescriptionInputSchema().parse(action.input);

      surveyDefinitionOperations.setDescriptionOperation(
        (state as any)[action.scope],
        action as any,
        dispatch,
      );

      break;
    }

    case "SET_SURVEY_KIND": {
      SetSurveyKindInputSchema().parse(action.input);

      surveyDefinitionOperations.setSurveyKindOperation(
        (state as any)[action.scope],
        action as any,
        dispatch,
      );

      break;
    }

    case "SET_RECIPIENT": {
      SetRecipientInputSchema().parse(action.input);

      surveyDefinitionOperations.setRecipientOperation(
        (state as any)[action.scope],
        action as any,
        dispatch,
      );

      break;
    }

    case "ADD_SECTION": {
      AddSectionInputSchema().parse(action.input);

      surveyDefinitionOperations.addSectionOperation(
        (state as any)[action.scope],
        action as any,
        dispatch,
      );

      break;
    }

    case "UPDATE_SECTION": {
      UpdateSectionInputSchema().parse(action.input);

      surveyDefinitionOperations.updateSectionOperation(
        (state as any)[action.scope],
        action as any,
        dispatch,
      );

      break;
    }

    case "DELETE_SECTION": {
      DeleteSectionInputSchema().parse(action.input);

      surveyDefinitionOperations.deleteSectionOperation(
        (state as any)[action.scope],
        action as any,
        dispatch,
      );

      break;
    }

    case "REORDER_SECTIONS": {
      ReorderSectionsInputSchema().parse(action.input);

      surveyDefinitionOperations.reorderSectionsOperation(
        (state as any)[action.scope],
        action as any,
        dispatch,
      );

      break;
    }

    case "ADD_QUESTION": {
      AddQuestionInputSchema().parse(action.input);

      surveyDefinitionOperations.addQuestionOperation(
        (state as any)[action.scope],
        action as any,
        dispatch,
      );

      break;
    }

    case "UPDATE_QUESTION": {
      UpdateQuestionInputSchema().parse(action.input);

      surveyDefinitionOperations.updateQuestionOperation(
        (state as any)[action.scope],
        action as any,
        dispatch,
      );

      break;
    }

    case "DELETE_QUESTION": {
      DeleteQuestionInputSchema().parse(action.input);

      surveyDefinitionOperations.deleteQuestionOperation(
        (state as any)[action.scope],
        action as any,
        dispatch,
      );

      break;
    }

    case "MOVE_QUESTION": {
      MoveQuestionInputSchema().parse(action.input);

      surveyDefinitionOperations.moveQuestionOperation(
        (state as any)[action.scope],
        action as any,
        dispatch,
      );

      break;
    }

    case "REORDER_QUESTIONS": {
      ReorderQuestionsInputSchema().parse(action.input);

      surveyDefinitionOperations.reorderQuestionsOperation(
        (state as any)[action.scope],
        action as any,
        dispatch,
      );

      break;
    }

    case "PUBLISH_SURVEY": {
      PublishSurveyInputSchema().parse(action.input);

      surveyPublishingOperations.publishSurveyOperation(
        (state as any)[action.scope],
        action as any,
        dispatch,
      );

      break;
    }

    case "CLOSE_SURVEY": {
      CloseSurveyInputSchema().parse(action.input);

      surveyPublishingOperations.closeSurveyOperation(
        (state as any)[action.scope],
        action as any,
        dispatch,
      );

      break;
    }

    case "REOPEN_SURVEY": {
      ReopenSurveyInputSchema().parse(action.input);

      surveyPublishingOperations.reopenSurveyOperation(
        (state as any)[action.scope],
        action as any,
        dispatch,
      );

      break;
    }

    case "REGENERATE_SHARE_TOKEN": {
      RegenerateShareTokenInputSchema().parse(action.input);

      surveyPublishingOperations.regenerateShareTokenOperation(
        (state as any)[action.scope],
        action as any,
        dispatch,
      );

      break;
    }

    case "ADD_RESPONSE": {
      AddResponseInputSchema().parse(action.input);

      surveyResponsesOperations.addResponseOperation(
        (state as any)[action.scope],
        action as any,
        dispatch,
      );

      break;
    }

    case "DELETE_RESPONSE": {
      DeleteResponseInputSchema().parse(action.input);

      surveyResponsesOperations.deleteResponseOperation(
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

export const reducer: Reducer<SurveyPHState> = createReducer(stateReducer);
