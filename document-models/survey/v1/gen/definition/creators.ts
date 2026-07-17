/**
 * WARNING: DO NOT EDIT
 * This file is auto-generated and updated by codegen
 */
import { createAction } from "document-model";
import {
  AddQuestionInputSchema,
  AddSectionInputSchema,
  DeleteQuestionInputSchema,
  DeleteSectionInputSchema,
  MoveQuestionInputSchema,
  ReorderQuestionsInputSchema,
  ReorderSectionsInputSchema,
  SetDescriptionInputSchema,
  SetRecipientInputSchema,
  SetSurveyKindInputSchema,
  SetTitleInputSchema,
  UpdateQuestionInputSchema,
  UpdateSectionInputSchema,
} from "../schema/zod.js";
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

export const setTitle = (input: SetTitleInput) =>
  createAction<SetTitleAction>(
    "SET_TITLE",
    { ...input },
    undefined,
    SetTitleInputSchema,
    "global",
  );

export const setDescription = (input: SetDescriptionInput) =>
  createAction<SetDescriptionAction>(
    "SET_DESCRIPTION",
    { ...input },
    undefined,
    SetDescriptionInputSchema,
    "global",
  );

export const setSurveyKind = (input: SetSurveyKindInput) =>
  createAction<SetSurveyKindAction>(
    "SET_SURVEY_KIND",
    { ...input },
    undefined,
    SetSurveyKindInputSchema,
    "global",
  );

export const setRecipient = (input: SetRecipientInput) =>
  createAction<SetRecipientAction>(
    "SET_RECIPIENT",
    { ...input },
    undefined,
    SetRecipientInputSchema,
    "global",
  );

export const addSection = (input: AddSectionInput) =>
  createAction<AddSectionAction>(
    "ADD_SECTION",
    { ...input },
    undefined,
    AddSectionInputSchema,
    "global",
  );

export const updateSection = (input: UpdateSectionInput) =>
  createAction<UpdateSectionAction>(
    "UPDATE_SECTION",
    { ...input },
    undefined,
    UpdateSectionInputSchema,
    "global",
  );

export const deleteSection = (input: DeleteSectionInput) =>
  createAction<DeleteSectionAction>(
    "DELETE_SECTION",
    { ...input },
    undefined,
    DeleteSectionInputSchema,
    "global",
  );

export const reorderSections = (input: ReorderSectionsInput) =>
  createAction<ReorderSectionsAction>(
    "REORDER_SECTIONS",
    { ...input },
    undefined,
    ReorderSectionsInputSchema,
    "global",
  );

export const addQuestion = (input: AddQuestionInput) =>
  createAction<AddQuestionAction>(
    "ADD_QUESTION",
    { ...input },
    undefined,
    AddQuestionInputSchema,
    "global",
  );

export const updateQuestion = (input: UpdateQuestionInput) =>
  createAction<UpdateQuestionAction>(
    "UPDATE_QUESTION",
    { ...input },
    undefined,
    UpdateQuestionInputSchema,
    "global",
  );

export const deleteQuestion = (input: DeleteQuestionInput) =>
  createAction<DeleteQuestionAction>(
    "DELETE_QUESTION",
    { ...input },
    undefined,
    DeleteQuestionInputSchema,
    "global",
  );

export const moveQuestion = (input: MoveQuestionInput) =>
  createAction<MoveQuestionAction>(
    "MOVE_QUESTION",
    { ...input },
    undefined,
    MoveQuestionInputSchema,
    "global",
  );

export const reorderQuestions = (input: ReorderQuestionsInput) =>
  createAction<ReorderQuestionsAction>(
    "REORDER_QUESTIONS",
    { ...input },
    undefined,
    ReorderQuestionsInputSchema,
    "global",
  );
