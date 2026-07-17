import type {
  QuestionType,
  SurveyDoc,
  SurveyQuestion,
  SurveySection,
} from "./types";

export const QUESTION_TYPES: { type: QuestionType; label: string; hint: string }[] =
  [
    { type: "SHORT_TEXT", label: "Short text", hint: "A single line" },
    { type: "LONG_TEXT", label: "Long text", hint: "A paragraph" },
    { type: "SINGLE_SELECT", label: "Single choice", hint: "Pick one option" },
    { type: "MULTI_SELECT", label: "Multiple choice", hint: "Pick any" },
    { type: "RATING", label: "Rating", hint: "A numeric scale" },
    { type: "GRID", label: "Grid / table", hint: "Rows the respondent fills in" },
  ];

export function questionTypeLabel(type: QuestionType): string {
  return QUESTION_TYPES.find((t) => t.type === type)?.label ?? type;
}

/** Client-side id for new options/columns (never used inside a reducer). */
export function uid(): string {
  return (
    globalThis.crypto?.randomUUID?.() ??
    `id-${Math.random().toString(36).slice(2)}`
  );
}

/** A blank question config of the given type, ready for ADD_QUESTION. */
export function blankQuestion(
  sectionId: string,
  type: QuestionType,
): {
  sectionId: string;
  type: QuestionType;
  title: string;
  helpText: string | null;
  required: boolean;
  options: { id: string; label: string }[];
  ratingScale: { min: number; max: number; minLabel: string | null; maxLabel: string | null } | null;
  columns: {
    id: string;
    label: string;
    type: "TEXT" | "SELECT";
    options: { id: string; label: string }[];
  }[];
} {
  const isSelect = type === "SINGLE_SELECT" || type === "MULTI_SELECT";
  return {
    sectionId,
    type,
    title: "",
    helpText: null,
    required: false,
    options: isSelect ? [{ id: uid(), label: "Option 1" }] : [],
    ratingScale:
      type === "RATING" ? { min: 1, max: 5, minLabel: null, maxLabel: null } : null,
    columns:
      type === "GRID"
        ? [{ id: uid(), label: "Column 1", type: "TEXT", options: [] }]
        : [],
  };
}

export interface SectionWithQuestions {
  section: SurveySection;
  questions: SurveyQuestion[];
}

/** Group questions under their section, preserving the flat-array order of both. */
export function groupBySection(
  survey: Pick<SurveyDoc, "sections" | "questions">,
): SectionWithQuestions[] {
  return survey.sections.map((section) => ({
    section,
    questions: survey.questions.filter((q) => q.sectionId === section.id),
  }));
}

/* --------------------------- answer draft model --------------------------- */

export interface AnswerDraft {
  text: string;
  optionIds: string[];
  rating: number | null;
  // grid: one entry per row, keyed by columnId
  rows: Record<string, { text: string; optionId: string | null }>[];
}

export function emptyAnswer(): AnswerDraft {
  return { text: "", optionIds: [], rating: null, rows: [] };
}

/** The answer payload shape accepted by ADD_RESPONSE (and the public endpoint). */
export interface ResponseAnswerPayload {
  questionId: string;
  text: string | null;
  optionIds: string[];
  rating: number | null;
  rows: { cells: { columnId: string; text: string | null; optionId: string | null }[] }[];
}

function answerHasContent(q: SurveyQuestion, a: AnswerDraft): boolean {
  switch (q.type) {
    case "SHORT_TEXT":
    case "LONG_TEXT":
      return a.text.trim().length > 0;
    case "SINGLE_SELECT":
    case "MULTI_SELECT":
      return a.optionIds.length > 0;
    case "RATING":
      return a.rating != null;
    case "GRID":
      return a.rows.some((row) =>
        Object.values(row).some((c) => c.text.trim() || c.optionId),
      );
  }
}

/** Question ids that are required but left empty. */
export function missingRequired(
  questions: SurveyQuestion[],
  answers: Record<string, AnswerDraft>,
): string[] {
  return questions
    .filter((q) => q.required)
    .filter((q) => !answerHasContent(q, answers[q.id] ?? emptyAnswer()))
    .map((q) => q.id);
}

/** Convert the local draft map into the ADD_RESPONSE answers array. */
export function toResponsePayload(
  questions: SurveyQuestion[],
  answers: Record<string, AnswerDraft>,
): ResponseAnswerPayload[] {
  const payload: ResponseAnswerPayload[] = [];
  for (const q of questions) {
    const a = answers[q.id];
    if (!a || !answerHasContent(q, a)) continue;
    payload.push({
      questionId: q.id,
      text: q.type === "SHORT_TEXT" || q.type === "LONG_TEXT" ? a.text.trim() : null,
      optionIds:
        q.type === "SINGLE_SELECT" || q.type === "MULTI_SELECT" ? a.optionIds : [],
      rating: q.type === "RATING" ? a.rating : null,
      rows:
        q.type === "GRID"
          ? a.rows
              .map((row) => ({
                cells: q.columns.map((col) => ({
                  columnId: col.id,
                  text: row[col.id]?.text.trim() || null,
                  optionId: row[col.id]?.optionId || null,
                })),
              }))
              // drop fully-empty rows
              .filter((row) => row.cells.some((c) => c.text || c.optionId))
          : [],
    });
  }
  return payload;
}

/* ------------------------------- analytics -------------------------------- */

export function answersFor(survey: SurveyDoc, questionId: string) {
  return survey.responses
    .map((r) => r.answers.find((a) => a.questionId === questionId))
    .filter((a): a is NonNullable<typeof a> => a != null);
}

export interface OptionTally {
  id: string;
  label: string;
  count: number;
}

export function optionTallies(
  survey: SurveyDoc,
  question: SurveyQuestion,
): OptionTally[] {
  const counts = new Map<string, number>();
  for (const a of answersFor(survey, question.id)) {
    for (const id of a.optionIds) counts.set(id, (counts.get(id) ?? 0) + 1);
  }
  return question.options.map((o) => ({
    id: o.id,
    label: o.label,
    count: counts.get(o.id) ?? 0,
  }));
}

export interface RatingStats {
  count: number;
  average: number | null;
  distribution: { value: number; count: number }[];
}

export function ratingStats(
  survey: SurveyDoc,
  question: SurveyQuestion,
): RatingStats {
  const values = answersFor(survey, question.id)
    .map((a) => a.rating)
    .filter((r): r is number => r != null);
  const scale = question.ratingScale;
  const min = scale?.min ?? 1;
  const max = scale?.max ?? 5;
  const distribution: { value: number; count: number }[] = [];
  for (let v = min; v <= max; v++) {
    distribution.push({ value: v, count: values.filter((x) => x === v).length });
  }
  const average =
    values.length > 0 ? values.reduce((s, v) => s + v, 0) / values.length : null;
  return { count: values.length, average, distribution };
}

export function textAnswers(survey: SurveyDoc, questionId: string): string[] {
  return answersFor(survey, questionId)
    .map((a) => a.text)
    .filter((t): t is string => !!t && t.trim().length > 0);
}

/** Share of responses that answered every required question. */
export function completionRate(survey: SurveyDoc): number {
  const required = survey.questions.filter((q) => q.required);
  if (survey.responses.length === 0) return 0;
  if (required.length === 0) return 1;
  const complete = survey.responses.filter((r) =>
    required.every((q) => {
      const a = r.answers.find((x) => x.questionId === q.id);
      if (!a) return false;
      return (
        (a.text && a.text.trim()) ||
        a.optionIds.length > 0 ||
        a.rating != null ||
        a.rows.length > 0
      );
    }),
  ).length;
  return complete / survey.responses.length;
}
