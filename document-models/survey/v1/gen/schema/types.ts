export type Maybe<T> = T | null | undefined;
export type InputMaybe<T> = T | null | undefined;
export type Exact<T extends { [key: string]: unknown }> = {
  [K in keyof T]: T[K];
};
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & {
  [SubKey in K]?: Maybe<T[SubKey]>;
};
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & {
  [SubKey in K]: Maybe<T[SubKey]>;
};
export type MakeEmpty<
  T extends { [key: string]: unknown },
  K extends keyof T,
> = { [_ in K]?: never };
export type Incremental<T> =
  | T
  | {
      [P in keyof T]?: P extends " $fragmentName" | "__typename" ? T[P] : never;
    };
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: { input: string; output: string };
  String: { input: string; output: string };
  Boolean: { input: boolean; output: boolean };
  Int: { input: number; output: number };
  Float: { input: number; output: number };
  Address: { input: `${string}:0x${string}`; output: `${string}:0x${string}` };
  Amount: {
    input: { unit?: string; value?: number };
    output: { unit?: string; value?: number };
  };
  Amount_Crypto: {
    input: { unit: string; value: string };
    output: { unit: string; value: string };
  };
  Amount_Currency: {
    input: { unit: string; value: string };
    output: { unit: string; value: string };
  };
  Amount_Fiat: {
    input: { unit: string; value: number };
    output: { unit: string; value: number };
  };
  Amount_Money: { input: number; output: number };
  Amount_Percentage: { input: number; output: number };
  Amount_Tokens: { input: number; output: number };
  AttachmentRef: {
    input: `attachment://v${number}:${string}`;
    output: `attachment://v${number}:${string}`;
  };
  Currency: { input: string; output: string };
  Date: { input: string; output: string };
  DateTime: { input: string; output: string };
  EmailAddress: { input: string; output: string };
  EthereumAddress: { input: string; output: string };
  OID: { input: string; output: string };
  OLabel: { input: string; output: string };
  PHID: { input: string; output: string };
  URL: { input: string; output: string };
  Unknown: { input: unknown; output: unknown };
  Upload: { input: File; output: File };
};

export type AddQuestionColumnInput = {
  id: Scalars["OID"]["input"];
  label: Scalars["String"]["input"];
  options?: InputMaybe<Array<AddQuestionOptionInput>>;
  type: GridColumnType;
};

export type AddQuestionInput = {
  columns?: InputMaybe<Array<AddQuestionColumnInput>>;
  helpText?: InputMaybe<Scalars["String"]["input"]>;
  id: Scalars["OID"]["input"];
  options?: InputMaybe<Array<AddQuestionOptionInput>>;
  ratingScale?: InputMaybe<AddQuestionRatingScaleInput>;
  required?: InputMaybe<Scalars["Boolean"]["input"]>;
  sectionId: Scalars["OID"]["input"];
  title: Scalars["String"]["input"];
  type: QuestionType;
};

export type AddQuestionOptionInput = {
  id: Scalars["OID"]["input"];
  label: Scalars["String"]["input"];
};

export type AddQuestionRatingScaleInput = {
  max: Scalars["Int"]["input"];
  maxLabel?: InputMaybe<Scalars["String"]["input"]>;
  min: Scalars["Int"]["input"];
  minLabel?: InputMaybe<Scalars["String"]["input"]>;
};

export type AddResponseAnswerInput = {
  optionIds?: InputMaybe<Array<Scalars["OID"]["input"]>>;
  questionId: Scalars["OID"]["input"];
  rating?: InputMaybe<Scalars["Int"]["input"]>;
  rows?: InputMaybe<Array<AddResponseRowInput>>;
  text?: InputMaybe<Scalars["String"]["input"]>;
};

export type AddResponseCellInput = {
  columnId: Scalars["OID"]["input"];
  optionId?: InputMaybe<Scalars["OID"]["input"]>;
  text?: InputMaybe<Scalars["String"]["input"]>;
};

export type AddResponseInput = {
  answers: Array<AddResponseAnswerInput>;
  id: Scalars["OID"]["input"];
  submittedAt: Scalars["DateTime"]["input"];
};

export type AddResponseRowInput = {
  cells: Array<AddResponseCellInput>;
};

export type AddSectionInput = {
  description?: InputMaybe<Scalars["String"]["input"]>;
  id: Scalars["OID"]["input"];
  title: Scalars["String"]["input"];
};

export type Answer = {
  optionIds: Array<Scalars["OID"]["output"]>;
  questionId: Scalars["OID"]["output"];
  rating: Maybe<Scalars["Int"]["output"]>;
  rows: Array<GridRow>;
  text: Maybe<Scalars["String"]["output"]>;
};

export type CloseSurveyInput = {
  closedAt: Scalars["DateTime"]["input"];
};

export type DeleteQuestionInput = {
  id: Scalars["OID"]["input"];
};

export type DeleteResponseInput = {
  id: Scalars["OID"]["input"];
};

export type DeleteSectionInput = {
  id: Scalars["OID"]["input"];
};

export type GridCell = {
  columnId: Scalars["OID"]["output"];
  optionId: Maybe<Scalars["OID"]["output"]>;
  text: Maybe<Scalars["String"]["output"]>;
};

export type GridColumn = {
  id: Scalars["OID"]["output"];
  label: Scalars["String"]["output"];
  options: Array<QuestionOption>;
  type: GridColumnType;
};

export type GridColumnType = "SELECT" | "TEXT";

export type GridRow = {
  cells: Array<GridCell>;
};

export type MoveQuestionInput = {
  id: Scalars["OID"]["input"];
  sectionId: Scalars["OID"]["input"];
};

export type PublishSurveyInput = {
  publishedAt: Scalars["DateTime"]["input"];
  shareToken: Scalars["String"]["input"];
};

export type QuestionOption = {
  id: Scalars["OID"]["output"];
  label: Scalars["String"]["output"];
};

export type QuestionType =
  | "GRID"
  | "LONG_TEXT"
  | "MULTI_SELECT"
  | "RATING"
  | "SHORT_TEXT"
  | "SINGLE_SELECT";

export type RatingScale = {
  max: Scalars["Int"]["output"];
  maxLabel: Maybe<Scalars["String"]["output"]>;
  min: Scalars["Int"]["output"];
  minLabel: Maybe<Scalars["String"]["output"]>;
};

export type RegenerateShareTokenInput = {
  shareToken: Scalars["String"]["input"];
};

export type ReopenSurveyInput = {
  _?: InputMaybe<Scalars["Boolean"]["input"]>;
};

export type ReorderQuestionsInput = {
  order: Array<Scalars["OID"]["input"]>;
};

export type ReorderSectionsInput = {
  order: Array<Scalars["OID"]["input"]>;
};

export type SetDescriptionInput = {
  description?: InputMaybe<Scalars["String"]["input"]>;
};

export type SetRecipientInput = {
  clientId?: InputMaybe<Scalars["PHID"]["input"]>;
  clientName?: InputMaybe<Scalars["String"]["input"]>;
};

export type SetSurveyKindInput = {
  kind: SurveyKind;
};

export type SetTitleInput = {
  title: Scalars["String"]["input"];
};

export type SurveyKind = "SURVEY" | "TEMPLATE";

export type SurveyQuestion = {
  columns: Array<GridColumn>;
  helpText: Maybe<Scalars["String"]["output"]>;
  id: Scalars["OID"]["output"];
  options: Array<QuestionOption>;
  ratingScale: Maybe<RatingScale>;
  required: Scalars["Boolean"]["output"];
  sectionId: Scalars["OID"]["output"];
  title: Scalars["String"]["output"];
  type: QuestionType;
};

export type SurveyResponse = {
  answers: Array<Answer>;
  id: Scalars["OID"]["output"];
  submittedAt: Scalars["DateTime"]["output"];
};

export type SurveySection = {
  description: Maybe<Scalars["String"]["output"]>;
  id: Scalars["OID"]["output"];
  title: Scalars["String"]["output"];
};

export type SurveyState = {
  clientId: Maybe<Scalars["PHID"]["output"]>;
  clientName: Maybe<Scalars["String"]["output"]>;
  closedAt: Maybe<Scalars["DateTime"]["output"]>;
  createdAt: Maybe<Scalars["DateTime"]["output"]>;
  description: Maybe<Scalars["String"]["output"]>;
  kind: SurveyKind;
  publishedAt: Maybe<Scalars["DateTime"]["output"]>;
  questions: Array<SurveyQuestion>;
  responses: Array<SurveyResponse>;
  sections: Array<SurveySection>;
  shareToken: Maybe<Scalars["String"]["output"]>;
  status: SurveyStatus;
  title: Scalars["String"]["output"];
};

export type SurveyStatus = "CLOSED" | "DRAFT" | "OPEN";

export type UpdateQuestionColumnInput = {
  id: Scalars["OID"]["input"];
  label: Scalars["String"]["input"];
  options?: InputMaybe<Array<UpdateQuestionOptionInput>>;
  type: GridColumnType;
};

export type UpdateQuestionInput = {
  columns?: InputMaybe<Array<UpdateQuestionColumnInput>>;
  helpText?: InputMaybe<Scalars["String"]["input"]>;
  id: Scalars["OID"]["input"];
  options?: InputMaybe<Array<UpdateQuestionOptionInput>>;
  ratingScale?: InputMaybe<UpdateQuestionRatingScaleInput>;
  required?: InputMaybe<Scalars["Boolean"]["input"]>;
  title: Scalars["String"]["input"];
  type: QuestionType;
};

export type UpdateQuestionOptionInput = {
  id: Scalars["OID"]["input"];
  label: Scalars["String"]["input"];
};

export type UpdateQuestionRatingScaleInput = {
  max: Scalars["Int"]["input"];
  maxLabel?: InputMaybe<Scalars["String"]["input"]>;
  min: Scalars["Int"]["input"];
  minLabel?: InputMaybe<Scalars["String"]["input"]>;
};

export type UpdateSectionInput = {
  description?: InputMaybe<Scalars["String"]["input"]>;
  id: Scalars["OID"]["input"];
  title?: InputMaybe<Scalars["String"]["input"]>;
};
