/**
 * WARNING: DO NOT EDIT
 * This file is auto-generated and updated by codegen
 */
import { type SignalDispatch } from "document-model";
import type { SurveyGlobalState } from "../types.js";
import type {
  AddQuestionAction,
  AddSectionAction,
  DeleteQuestionAction,
  DeleteSectionAction,
  MoveQuestionAction,
  ReorderQuestionsAction,
  ReorderSectionsAction,
  SetDescriptionAction,
  SetRecipientAction,
  SetSurveyKindAction,
  SetTitleAction,
  UpdateQuestionAction,
  UpdateSectionAction,
} from "./actions.js";

export interface SurveyDefinitionOperations {
  setTitleOperation: (
    state: SurveyGlobalState,
    action: SetTitleAction,
    dispatch?: SignalDispatch,
  ) => void;
  setDescriptionOperation: (
    state: SurveyGlobalState,
    action: SetDescriptionAction,
    dispatch?: SignalDispatch,
  ) => void;
  setSurveyKindOperation: (
    state: SurveyGlobalState,
    action: SetSurveyKindAction,
    dispatch?: SignalDispatch,
  ) => void;
  setRecipientOperation: (
    state: SurveyGlobalState,
    action: SetRecipientAction,
    dispatch?: SignalDispatch,
  ) => void;
  addSectionOperation: (
    state: SurveyGlobalState,
    action: AddSectionAction,
    dispatch?: SignalDispatch,
  ) => void;
  updateSectionOperation: (
    state: SurveyGlobalState,
    action: UpdateSectionAction,
    dispatch?: SignalDispatch,
  ) => void;
  deleteSectionOperation: (
    state: SurveyGlobalState,
    action: DeleteSectionAction,
    dispatch?: SignalDispatch,
  ) => void;
  reorderSectionsOperation: (
    state: SurveyGlobalState,
    action: ReorderSectionsAction,
    dispatch?: SignalDispatch,
  ) => void;
  addQuestionOperation: (
    state: SurveyGlobalState,
    action: AddQuestionAction,
    dispatch?: SignalDispatch,
  ) => void;
  updateQuestionOperation: (
    state: SurveyGlobalState,
    action: UpdateQuestionAction,
    dispatch?: SignalDispatch,
  ) => void;
  deleteQuestionOperation: (
    state: SurveyGlobalState,
    action: DeleteQuestionAction,
    dispatch?: SignalDispatch,
  ) => void;
  moveQuestionOperation: (
    state: SurveyGlobalState,
    action: MoveQuestionAction,
    dispatch?: SignalDispatch,
  ) => void;
  reorderQuestionsOperation: (
    state: SurveyGlobalState,
    action: ReorderQuestionsAction,
    dispatch?: SignalDispatch,
  ) => void;
}
