/* eslint-disable @typescript-eslint/no-empty-object-type */
/* eslint-disable @typescript-eslint/no-unused-vars */
import * as z from "zod";
import type {
  AddQuestionColumnInput,
  AddQuestionInput,
  AddQuestionOptionInput,
  AddQuestionRatingScaleInput,
  AddResponseAnswerInput,
  AddResponseCellInput,
  AddResponseInput,
  AddResponseRowInput,
  AddSectionInput,
  Answer,
  CloseSurveyInput,
  DeleteQuestionInput,
  DeleteResponseInput,
  DeleteSectionInput,
  GridCell,
  GridColumn,
  GridColumnType,
  GridRow,
  MoveQuestionInput,
  PublishSurveyInput,
  QuestionOption,
  QuestionType,
  RatingScale,
  RegenerateShareTokenInput,
  ReopenSurveyInput,
  ReorderQuestionsInput,
  ReorderSectionsInput,
  SetDescriptionInput,
  SetRecipientInput,
  SetSurveyKindInput,
  SetTitleInput,
  SurveyKind,
  SurveyQuestion,
  SurveyResponse,
  SurveySection,
  SurveyState,
  SurveyStatus,
  UpdateQuestionColumnInput,
  UpdateQuestionInput,
  UpdateQuestionOptionInput,
  UpdateQuestionRatingScaleInput,
  UpdateSectionInput,
} from "./types.js";

type Properties<T> = Required<{
  [K in keyof T]: z.ZodType<T[K]>;
}>;

type definedNonNullAny = {};

export const isDefinedNonNullAny = (v: any): v is definedNonNullAny =>
  v !== undefined && v !== null;

export const definedNonNullAnySchema = z
  .any()
  .refine((v) => isDefinedNonNullAny(v));

export const GridColumnTypeSchema = z.enum(["SELECT", "TEXT"]);

export const QuestionTypeSchema = z.enum([
  "GRID",
  "LONG_TEXT",
  "MULTI_SELECT",
  "RATING",
  "SHORT_TEXT",
  "SINGLE_SELECT",
]);

export const SurveyKindSchema = z.enum(["SURVEY", "TEMPLATE"]);

export const SurveyStatusSchema = z.enum(["CLOSED", "DRAFT", "OPEN"]);

export function AddQuestionColumnInputSchema(): z.ZodObject<
  Properties<AddQuestionColumnInput>
> {
  return z.object({
    id: z.string(),
    label: z.string(),
    options: z.array(z.lazy(() => AddQuestionOptionInputSchema())).nullish(),
    type: GridColumnTypeSchema,
  });
}

export function AddQuestionInputSchema(): z.ZodObject<
  Properties<AddQuestionInput>
> {
  return z.object({
    columns: z.array(z.lazy(() => AddQuestionColumnInputSchema())).nullish(),
    helpText: z.string().nullish(),
    id: z.string(),
    options: z.array(z.lazy(() => AddQuestionOptionInputSchema())).nullish(),
    ratingScale: z.lazy(() => AddQuestionRatingScaleInputSchema().nullish()),
    required: z.boolean().nullish(),
    sectionId: z.string(),
    title: z.string(),
    type: QuestionTypeSchema,
  });
}

export function AddQuestionOptionInputSchema(): z.ZodObject<
  Properties<AddQuestionOptionInput>
> {
  return z.object({
    id: z.string(),
    label: z.string(),
  });
}

export function AddQuestionRatingScaleInputSchema(): z.ZodObject<
  Properties<AddQuestionRatingScaleInput>
> {
  return z.object({
    max: z.number(),
    maxLabel: z.string().nullish(),
    min: z.number(),
    minLabel: z.string().nullish(),
  });
}

export function AddResponseAnswerInputSchema(): z.ZodObject<
  Properties<AddResponseAnswerInput>
> {
  return z.object({
    optionIds: z.array(z.string()).nullish(),
    questionId: z.string(),
    rating: z.number().nullish(),
    rows: z.array(z.lazy(() => AddResponseRowInputSchema())).nullish(),
    text: z.string().nullish(),
  });
}

export function AddResponseCellInputSchema(): z.ZodObject<
  Properties<AddResponseCellInput>
> {
  return z.object({
    columnId: z.string(),
    optionId: z.string().nullish(),
    text: z.string().nullish(),
  });
}

export function AddResponseInputSchema(): z.ZodObject<
  Properties<AddResponseInput>
> {
  return z.object({
    answers: z.array(z.lazy(() => AddResponseAnswerInputSchema())),
    id: z.string(),
    submittedAt: z.iso.datetime(),
  });
}

export function AddResponseRowInputSchema(): z.ZodObject<
  Properties<AddResponseRowInput>
> {
  return z.object({
    cells: z.array(z.lazy(() => AddResponseCellInputSchema())),
  });
}

export function AddSectionInputSchema(): z.ZodObject<
  Properties<AddSectionInput>
> {
  return z.object({
    description: z.string().nullish(),
    id: z.string(),
    title: z.string(),
  });
}

export function AnswerSchema(): z.ZodObject<Properties<Answer>> {
  return z.object({
    __typename: z.literal("Answer").optional(),
    optionIds: z.array(z.string()),
    questionId: z.string(),
    rating: z.number().nullish(),
    rows: z.array(z.lazy(() => GridRowSchema())),
    text: z.string().nullish(),
  });
}

export function CloseSurveyInputSchema(): z.ZodObject<
  Properties<CloseSurveyInput>
> {
  return z.object({
    closedAt: z.iso.datetime(),
  });
}

export function DeleteQuestionInputSchema(): z.ZodObject<
  Properties<DeleteQuestionInput>
> {
  return z.object({
    id: z.string(),
  });
}

export function DeleteResponseInputSchema(): z.ZodObject<
  Properties<DeleteResponseInput>
> {
  return z.object({
    id: z.string(),
  });
}

export function DeleteSectionInputSchema(): z.ZodObject<
  Properties<DeleteSectionInput>
> {
  return z.object({
    id: z.string(),
  });
}

export function GridCellSchema(): z.ZodObject<Properties<GridCell>> {
  return z.object({
    __typename: z.literal("GridCell").optional(),
    columnId: z.string(),
    optionId: z.string().nullish(),
    text: z.string().nullish(),
  });
}

export function GridColumnSchema(): z.ZodObject<Properties<GridColumn>> {
  return z.object({
    __typename: z.literal("GridColumn").optional(),
    id: z.string(),
    label: z.string(),
    options: z.array(z.lazy(() => QuestionOptionSchema())),
    type: GridColumnTypeSchema,
  });
}

export function GridRowSchema(): z.ZodObject<Properties<GridRow>> {
  return z.object({
    __typename: z.literal("GridRow").optional(),
    cells: z.array(z.lazy(() => GridCellSchema())),
  });
}

export function MoveQuestionInputSchema(): z.ZodObject<
  Properties<MoveQuestionInput>
> {
  return z.object({
    id: z.string(),
    sectionId: z.string(),
  });
}

export function PublishSurveyInputSchema(): z.ZodObject<
  Properties<PublishSurveyInput>
> {
  return z.object({
    publishedAt: z.iso.datetime(),
    shareToken: z.string(),
  });
}

export function QuestionOptionSchema(): z.ZodObject<
  Properties<QuestionOption>
> {
  return z.object({
    __typename: z.literal("QuestionOption").optional(),
    id: z.string(),
    label: z.string(),
  });
}

export function RatingScaleSchema(): z.ZodObject<Properties<RatingScale>> {
  return z.object({
    __typename: z.literal("RatingScale").optional(),
    max: z.number(),
    maxLabel: z.string().nullish(),
    min: z.number(),
    minLabel: z.string().nullish(),
  });
}

export function RegenerateShareTokenInputSchema(): z.ZodObject<
  Properties<RegenerateShareTokenInput>
> {
  return z.object({
    shareToken: z.string(),
  });
}

export function ReopenSurveyInputSchema(): z.ZodObject<
  Properties<ReopenSurveyInput>
> {
  return z.object({
    _: z.boolean().nullish(),
  });
}

export function ReorderQuestionsInputSchema(): z.ZodObject<
  Properties<ReorderQuestionsInput>
> {
  return z.object({
    order: z.array(z.string()),
  });
}

export function ReorderSectionsInputSchema(): z.ZodObject<
  Properties<ReorderSectionsInput>
> {
  return z.object({
    order: z.array(z.string()),
  });
}

export function SetDescriptionInputSchema(): z.ZodObject<
  Properties<SetDescriptionInput>
> {
  return z.object({
    description: z.string().nullish(),
  });
}

export function SetRecipientInputSchema(): z.ZodObject<
  Properties<SetRecipientInput>
> {
  return z.object({
    clientId: z.string().nullish(),
    clientName: z.string().nullish(),
  });
}

export function SetSurveyKindInputSchema(): z.ZodObject<
  Properties<SetSurveyKindInput>
> {
  return z.object({
    kind: SurveyKindSchema,
  });
}

export function SetTitleInputSchema(): z.ZodObject<Properties<SetTitleInput>> {
  return z.object({
    title: z.string(),
  });
}

export function SurveyQuestionSchema(): z.ZodObject<
  Properties<SurveyQuestion>
> {
  return z.object({
    __typename: z.literal("SurveyQuestion").optional(),
    columns: z.array(z.lazy(() => GridColumnSchema())),
    helpText: z.string().nullish(),
    id: z.string(),
    options: z.array(z.lazy(() => QuestionOptionSchema())),
    ratingScale: z.lazy(() => RatingScaleSchema().nullish()),
    required: z.boolean(),
    sectionId: z.string(),
    title: z.string(),
    type: QuestionTypeSchema,
  });
}

export function SurveyResponseSchema(): z.ZodObject<
  Properties<SurveyResponse>
> {
  return z.object({
    __typename: z.literal("SurveyResponse").optional(),
    answers: z.array(z.lazy(() => AnswerSchema())),
    id: z.string(),
    submittedAt: z.iso.datetime(),
  });
}

export function SurveySectionSchema(): z.ZodObject<Properties<SurveySection>> {
  return z.object({
    __typename: z.literal("SurveySection").optional(),
    description: z.string().nullish(),
    id: z.string(),
    title: z.string(),
  });
}

export function SurveyStateSchema(): z.ZodObject<Properties<SurveyState>> {
  return z.object({
    __typename: z.literal("SurveyState").optional(),
    clientId: z.string().nullish(),
    clientName: z.string().nullish(),
    closedAt: z.iso.datetime().nullish(),
    createdAt: z.iso.datetime().nullish(),
    description: z.string().nullish(),
    kind: SurveyKindSchema,
    publishedAt: z.iso.datetime().nullish(),
    questions: z.array(z.lazy(() => SurveyQuestionSchema())),
    responses: z.array(z.lazy(() => SurveyResponseSchema())),
    sections: z.array(z.lazy(() => SurveySectionSchema())),
    shareToken: z.string().nullish(),
    status: SurveyStatusSchema,
    title: z.string(),
  });
}

export function UpdateQuestionColumnInputSchema(): z.ZodObject<
  Properties<UpdateQuestionColumnInput>
> {
  return z.object({
    id: z.string(),
    label: z.string(),
    options: z.array(z.lazy(() => UpdateQuestionOptionInputSchema())).nullish(),
    type: GridColumnTypeSchema,
  });
}

export function UpdateQuestionInputSchema(): z.ZodObject<
  Properties<UpdateQuestionInput>
> {
  return z.object({
    columns: z.array(z.lazy(() => UpdateQuestionColumnInputSchema())).nullish(),
    helpText: z.string().nullish(),
    id: z.string(),
    options: z.array(z.lazy(() => UpdateQuestionOptionInputSchema())).nullish(),
    ratingScale: z.lazy(() => UpdateQuestionRatingScaleInputSchema().nullish()),
    required: z.boolean().nullish(),
    title: z.string(),
    type: QuestionTypeSchema,
  });
}

export function UpdateQuestionOptionInputSchema(): z.ZodObject<
  Properties<UpdateQuestionOptionInput>
> {
  return z.object({
    id: z.string(),
    label: z.string(),
  });
}

export function UpdateQuestionRatingScaleInputSchema(): z.ZodObject<
  Properties<UpdateQuestionRatingScaleInput>
> {
  return z.object({
    max: z.number(),
    maxLabel: z.string().nullish(),
    min: z.number(),
    minLabel: z.string().nullish(),
  });
}

export function UpdateSectionInputSchema(): z.ZodObject<
  Properties<UpdateSectionInput>
> {
  return z.object({
    description: z.string().nullish(),
    id: z.string(),
    title: z.string().nullish(),
  });
}
