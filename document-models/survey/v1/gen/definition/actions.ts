/**
 * WARNING: DO NOT EDIT
 * This file is auto-generated and updated by codegen
 */
import type { Action } from "document-model";
import type {
  AddQuestionInput,
  AddSectionInput,
  DeleteQuestionInput,
  DeleteSectionInput,
  MoveQuestionInput,
  ReorderQuestionsInput,
  ReorderSectionsInput,
  SetDescriptionInput,
  SetRecipientInput,
  SetSurveyKindInput,
  SetTitleInput,
  UpdateQuestionInput,
  UpdateSectionInput,
} from "../types.js";

export type SetTitleAction = Action & {
  type: "SET_TITLE";
  input: SetTitleInput;
};
export type SetDescriptionAction = Action & {
  type: "SET_DESCRIPTION";
  input: SetDescriptionInput;
};
export type SetSurveyKindAction = Action & {
  type: "SET_SURVEY_KIND";
  input: SetSurveyKindInput;
};
export type SetRecipientAction = Action & {
  type: "SET_RECIPIENT";
  input: SetRecipientInput;
};
export type AddSectionAction = Action & {
  type: "ADD_SECTION";
  input: AddSectionInput;
};
export type UpdateSectionAction = Action & {
  type: "UPDATE_SECTION";
  input: UpdateSectionInput;
};
export type DeleteSectionAction = Action & {
  type: "DELETE_SECTION";
  input: DeleteSectionInput;
};
export type ReorderSectionsAction = Action & {
  type: "REORDER_SECTIONS";
  input: ReorderSectionsInput;
};
export type AddQuestionAction = Action & {
  type: "ADD_QUESTION";
  input: AddQuestionInput;
};
export type UpdateQuestionAction = Action & {
  type: "UPDATE_QUESTION";
  input: UpdateQuestionInput;
};
export type DeleteQuestionAction = Action & {
  type: "DELETE_QUESTION";
  input: DeleteQuestionInput;
};
export type MoveQuestionAction = Action & {
  type: "MOVE_QUESTION";
  input: MoveQuestionInput;
};
export type ReorderQuestionsAction = Action & {
  type: "REORDER_QUESTIONS";
  input: ReorderQuestionsInput;
};

export type SurveyDefinitionAction =
  | SetTitleAction
  | SetDescriptionAction
  | SetSurveyKindAction
  | SetRecipientAction
  | AddSectionAction
  | UpdateSectionAction
  | DeleteSectionAction
  | ReorderSectionsAction
  | AddQuestionAction
  | UpdateQuestionAction
  | DeleteQuestionAction
  | MoveQuestionAction
  | ReorderQuestionsAction;
