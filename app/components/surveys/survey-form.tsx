"use client";

import { useState } from "react";
import type { SurveyQuestion } from "@/lib/types";
import {
  type AnswerDraft,
  type ResponseAnswerPayload,
  type SectionWithQuestions,
  emptyAnswer,
  groupBySection,
  missingRequired,
  toResponsePayload,
} from "@/lib/survey-helpers";
import type { SurveyDoc } from "@/lib/types";

export type SurveyDefinition = Pick<
  SurveyDoc,
  "title" | "description" | "sections" | "questions"
>;

interface SurveyFormProps {
  definition: SurveyDefinition;
  /** Preview mode: inputs render but are inert and there is no submit. */
  preview?: boolean;
  submitting?: boolean;
  submitLabel?: string;
  onSubmit?: (answers: ResponseAnswerPayload[]) => void;
}

export function SurveyForm({
  definition,
  preview = false,
  submitting = false,
  submitLabel = "Submit",
  onSubmit,
}: SurveyFormProps) {
  const groups = groupBySection(definition);
  const [answers, setAnswers] = useState<Record<string, AnswerDraft>>({});
  const [missing, setMissing] = useState<string[]>([]);

  const draft = (id: string): AnswerDraft => answers[id] ?? emptyAnswer();
  const setDraft = (id: string, next: AnswerDraft) =>
    setAnswers((prev) => ({ ...prev, [id]: next }));

  function handleSubmit() {
    const gaps = missingRequired(definition.questions, answers);
    setMissing(gaps);
    if (gaps.length > 0) {
      document
        .getElementById(`q-${gaps[0]}`)
        ?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    onSubmit?.(toResponsePayload(definition.questions, answers));
  }

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6">
      <header className="flex flex-col gap-2">
        <h1 className="text-2xl font-extrabold text-mist-100">
          {definition.title || "Untitled survey"}
        </h1>
        {definition.description && (
          <p className="whitespace-pre-wrap text-sm text-mist-300">
            {definition.description}
          </p>
        )}
      </header>

      {groups.map(({ section, questions }) => (
        <SectionBlock
          key={section.id}
          group={{ section, questions }}
          draft={draft}
          setDraft={setDraft}
          preview={preview}
          missing={missing}
        />
      ))}

      {definition.questions.length === 0 && (
        <p className="text-sm text-mist-400">
          This survey has no questions yet.
        </p>
      )}

      {!preview && definition.questions.length > 0 && (
        <div className="flex flex-col gap-2">
          {missing.length > 0 && (
            <p className="text-sm text-red-400">
              Please answer the {missing.length} required question
              {missing.length === 1 ? "" : "s"} highlighted above.
            </p>
          )}
          <button
            className="tt-btn-primary self-start"
            disabled={submitting}
            onClick={handleSubmit}
          >
            {submitting ? "Submitting…" : submitLabel}
          </button>
        </div>
      )}
    </div>
  );
}

function SectionBlock({
  group,
  draft,
  setDraft,
  preview,
  missing,
}: {
  group: SectionWithQuestions;
  draft: (id: string) => AnswerDraft;
  setDraft: (id: string, next: AnswerDraft) => void;
  preview: boolean;
  missing: string[];
}) {
  return (
    <section className="tt-card flex flex-col gap-5 p-5">
      <div>
        <h2 className="text-base font-bold text-mist-100">{group.section.title}</h2>
        {group.section.description && (
          <p className="mt-1 whitespace-pre-wrap text-xs text-mist-400">
            {group.section.description}
          </p>
        )}
      </div>
      {group.questions.map((q) => (
        <QuestionField
          key={q.id}
          question={q}
          value={draft(q.id)}
          onChange={(next) => setDraft(q.id, next)}
          preview={preview}
          invalid={missing.includes(q.id)}
        />
      ))}
      {group.questions.length === 0 && (
        <p className="text-xs text-mist-500">No questions in this section.</p>
      )}
    </section>
  );
}

function QuestionField({
  question,
  value,
  onChange,
  preview,
  invalid,
}: {
  question: SurveyQuestion;
  value: AnswerDraft;
  onChange: (next: AnswerDraft) => void;
  preview: boolean;
  invalid: boolean;
}) {
  const disabled = preview;
  return (
    <div id={`q-${question.id}`} className="flex flex-col gap-2">
      <label className="flex flex-col gap-0.5">
        <span className="text-sm font-medium text-mist-100">
          {question.title}
          {question.required && <span className="ml-1 text-magenta">*</span>}
        </span>
        {question.helpText && (
          <span className="text-xs text-mist-400">{question.helpText}</span>
        )}
      </label>

      {(question.type === "SHORT_TEXT" || question.type === "LONG_TEXT") &&
        (question.type === "SHORT_TEXT" ? (
          <input
            className={`tt-input ${invalid ? "border-red-500" : ""}`}
            disabled={disabled}
            value={value.text}
            onChange={(e) => onChange({ ...value, text: e.target.value })}
          />
        ) : (
          <textarea
            className={`tt-input min-h-24 ${invalid ? "border-red-500" : ""}`}
            disabled={disabled}
            value={value.text}
            onChange={(e) => onChange({ ...value, text: e.target.value })}
          />
        ))}

      {question.type === "SINGLE_SELECT" && (
        <div className="flex flex-col gap-1.5">
          {question.options.map((o) => (
            <label key={o.id} className="flex items-center gap-2 text-sm text-mist-200">
              <input
                type="radio"
                name={question.id}
                disabled={disabled}
                checked={value.optionIds[0] === o.id}
                onChange={() => onChange({ ...value, optionIds: [o.id] })}
              />
              {o.label}
            </label>
          ))}
        </div>
      )}

      {question.type === "MULTI_SELECT" && (
        <div className="flex flex-col gap-1.5">
          {question.options.map((o) => {
            const checked = value.optionIds.includes(o.id);
            return (
              <label key={o.id} className="flex items-center gap-2 text-sm text-mist-200">
                <input
                  type="checkbox"
                  disabled={disabled}
                  checked={checked}
                  onChange={() =>
                    onChange({
                      ...value,
                      optionIds: checked
                        ? value.optionIds.filter((id) => id !== o.id)
                        : [...value.optionIds, o.id],
                    })
                  }
                />
                {o.label}
              </label>
            );
          })}
        </div>
      )}

      {question.type === "RATING" && (
        <RatingField question={question} value={value} onChange={onChange} disabled={disabled} />
      )}

      {question.type === "GRID" && (
        <GridField question={question} value={value} onChange={onChange} disabled={disabled} />
      )}
    </div>
  );
}

function RatingField({
  question,
  value,
  onChange,
  disabled,
}: {
  question: SurveyQuestion;
  value: AnswerDraft;
  onChange: (next: AnswerDraft) => void;
  disabled: boolean;
}) {
  const min = question.ratingScale?.min ?? 1;
  const max = question.ratingScale?.max ?? 5;
  const steps: number[] = [];
  for (let v = min; v <= max; v++) steps.push(v);
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex flex-wrap gap-1.5">
        {steps.map((v) => (
          <button
            key={v}
            type="button"
            disabled={disabled}
            onClick={() => onChange({ ...value, rating: v })}
            className={`h-9 w-9 rounded-lg border text-sm font-semibold transition ${
              value.rating === v
                ? "border-magenta bg-magenta text-ink-950"
                : "border-ink-600 text-mist-300 hover:border-ink-500"
            }`}
          >
            {v}
          </button>
        ))}
      </div>
      {(question.ratingScale?.minLabel || question.ratingScale?.maxLabel) && (
        <div className="flex justify-between text-xs text-mist-500">
          <span>{question.ratingScale?.minLabel}</span>
          <span>{question.ratingScale?.maxLabel}</span>
        </div>
      )}
    </div>
  );
}

function GridField({
  question,
  value,
  onChange,
  disabled,
}: {
  question: SurveyQuestion;
  value: AnswerDraft;
  onChange: (next: AnswerDraft) => void;
  disabled: boolean;
}) {
  const rows = value.rows;
  const setCell = (rowIdx: number, colId: string, cell: { text: string; optionId: string | null }) => {
    const next = rows.map((r, i) => (i === rowIdx ? { ...r, [colId]: cell } : r));
    onChange({ ...value, rows: next });
  };
  const addRow = () => onChange({ ...value, rows: [...rows, {}] });
  const removeRow = (idx: number) =>
    onChange({ ...value, rows: rows.filter((_, i) => i !== idx) });

  return (
    <div className="flex flex-col gap-2 overflow-x-auto">
      <table className="w-full min-w-[28rem] border-collapse text-sm">
        <thead>
          <tr>
            {question.columns.map((c) => (
              <th
                key={c.id}
                className="border-b border-ink-600/60 px-2 py-1.5 text-left text-xs font-semibold uppercase tracking-wide text-mist-400"
              >
                {c.label}
              </th>
            ))}
            <th className="w-8 border-b border-ink-600/60" />
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIdx) => (
            <tr key={rowIdx}>
              {question.columns.map((col) => {
                const cell = row[col.id] ?? { text: "", optionId: null };
                return (
                  <td key={col.id} className="px-1 py-1 align-top">
                    {col.type === "TEXT" ? (
                      <input
                        className="tt-input"
                        disabled={disabled}
                        value={cell.text}
                        onChange={(e) =>
                          setCell(rowIdx, col.id, { text: e.target.value, optionId: null })
                        }
                      />
                    ) : (
                      <select
                        className="tt-input"
                        disabled={disabled}
                        value={cell.optionId ?? ""}
                        onChange={(e) =>
                          setCell(rowIdx, col.id, { text: "", optionId: e.target.value || null })
                        }
                      >
                        <option value="">—</option>
                        {col.options.map((o) => (
                          <option key={o.id} value={o.id}>
                            {o.label}
                          </option>
                        ))}
                      </select>
                    )}
                  </td>
                );
              })}
              <td className="px-1 py-1 text-center align-middle">
                {!disabled && (
                  <button
                    type="button"
                    className="text-mist-500 hover:text-red-400"
                    onClick={() => removeRow(rowIdx)}
                    title="Remove row"
                  >
                    ×
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {!disabled && (
        <button type="button" className="tt-btn-ghost self-start text-xs" onClick={addRow}>
          + Add row
        </button>
      )}
    </div>
  );
}
