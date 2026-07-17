"use client";

import { useState } from "react";
import { surveyApi } from "@/lib/api";
import { useRefresh } from "@/lib/hooks";
import { QUESTION_TYPES, uid } from "@/lib/survey-helpers";
import type {
  GridColumn,
  QuestionOption,
  QuestionType,
  RatingScale,
  SurveyDoc,
  SurveyQuestion,
} from "@/lib/types";

interface Draft {
  type: QuestionType;
  title: string;
  helpText: string | null;
  required: boolean;
  options: QuestionOption[];
  ratingScale: RatingScale | null;
  columns: GridColumn[];
}

function fromQuestion(q: SurveyQuestion): Draft {
  return {
    type: q.type,
    title: q.title,
    helpText: q.helpText,
    required: q.required,
    options: q.options,
    ratingScale: q.ratingScale,
    columns: q.columns,
  };
}

export function QuestionEditor({
  survey,
  question,
}: {
  survey: SurveyDoc;
  question: SurveyQuestion;
}) {
  const refresh = useRefresh();
  // Initialized once; not re-synced on poll so in-progress edits aren't clobbered.
  const [draft, setDraft] = useState<Draft>(() => fromQuestion(question));

  function persist(next: Draft) {
    setDraft(next);
    void surveyApi
      .updateQuestion(survey.id, question.id, {
        type: next.type,
        title: next.title,
        helpText: next.helpText,
        required: next.required,
        options: next.options,
        ratingScale: next.ratingScale,
        columns: next.columns,
      })
      .then(refresh);
  }

  function changeType(type: QuestionType) {
    const isSelect = type === "SINGLE_SELECT" || type === "MULTI_SELECT";
    persist({
      ...draft,
      type,
      options: isSelect
        ? draft.options.length > 0
          ? draft.options
          : [{ id: uid(), label: "Option 1" }]
        : [],
      ratingScale:
        type === "RATING"
          ? (draft.ratingScale ?? { min: 1, max: 5, minLabel: null, maxLabel: null })
          : null,
      columns:
        type === "GRID"
          ? draft.columns.length > 0
            ? draft.columns
            : [{ id: uid(), label: "Column 1", type: "TEXT", options: [] }]
          : [],
    });
  }

  return (
    <div className="flex flex-col gap-3 border-t border-ink-600/40 bg-ink-900/40 p-4">
      <div className="flex flex-col gap-3 sm:flex-row">
        <label className="flex flex-1 flex-col gap-1">
          <span className="tt-label">Question</span>
          <input
            className="tt-input"
            placeholder="Question text"
            value={draft.title}
            onChange={(e) => setDraft({ ...draft, title: e.target.value })}
            onBlur={() => persist(draft)}
          />
        </label>
        <label className="flex flex-col gap-1 sm:w-44">
          <span className="tt-label">Type</span>
          <select
            className="tt-input"
            value={draft.type}
            onChange={(e) => changeType(e.target.value as QuestionType)}
          >
            {QUESTION_TYPES.map((t) => (
              <option key={t.type} value={t.type}>
                {t.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <label className="flex flex-col gap-1">
        <span className="tt-label">Help text (optional)</span>
        <input
          className="tt-input"
          placeholder="Guidance shown under the question"
          value={draft.helpText ?? ""}
          onChange={(e) => setDraft({ ...draft, helpText: e.target.value })}
          onBlur={() => persist({ ...draft, helpText: draft.helpText?.trim() || null })}
        />
      </label>

      {(draft.type === "SINGLE_SELECT" || draft.type === "MULTI_SELECT") && (
        <OptionsEditor
          options={draft.options}
          onChange={(options) => persist({ ...draft, options })}
        />
      )}

      {draft.type === "RATING" && draft.ratingScale && (
        <RatingEditor
          scale={draft.ratingScale}
          onChange={(ratingScale) => persist({ ...draft, ratingScale })}
        />
      )}

      {draft.type === "GRID" && (
        <ColumnsEditor
          columns={draft.columns}
          onChange={(columns) => persist({ ...draft, columns })}
        />
      )}

      <label className="flex items-center gap-2 text-sm text-mist-300">
        <input
          type="checkbox"
          checked={draft.required}
          onChange={(e) => persist({ ...draft, required: e.target.checked })}
        />
        Required
      </label>
    </div>
  );
}

function OptionsEditor({
  options,
  onChange,
}: {
  options: QuestionOption[];
  onChange: (options: QuestionOption[]) => void;
}) {
  const [local, setLocal] = useState(options);
  const commit = (next: QuestionOption[]) => {
    setLocal(next);
    onChange(next);
  };
  return (
    <div className="flex flex-col gap-1.5">
      <span className="tt-label">Options</span>
      {local.map((o, i) => (
        <div key={o.id} className="flex items-center gap-2">
          <input
            className="tt-input flex-1"
            value={o.label}
            onChange={(e) =>
              setLocal(local.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)))
            }
            onBlur={() => commit(local)}
          />
          <button
            className="text-mist-500 hover:text-red-400"
            title="Remove option"
            onClick={() => commit(local.filter((_, j) => j !== i))}
          >
            ×
          </button>
        </div>
      ))}
      <button
        className="tt-btn-ghost self-start text-xs"
        onClick={() => commit([...local, { id: uid(), label: `Option ${local.length + 1}` }])}
      >
        + Add option
      </button>
    </div>
  );
}

function RatingEditor({
  scale,
  onChange,
}: {
  scale: RatingScale;
  onChange: (scale: RatingScale) => void;
}) {
  const [local, setLocal] = useState(scale);
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      <label className="flex flex-col gap-1">
        <span className="tt-label">Min</span>
        <input
          type="number"
          className="tt-input"
          value={local.min}
          onChange={(e) => setLocal({ ...local, min: Number(e.target.value) })}
          onBlur={() => onChange(local)}
        />
      </label>
      <label className="flex flex-col gap-1">
        <span className="tt-label">Max</span>
        <input
          type="number"
          className="tt-input"
          value={local.max}
          onChange={(e) => setLocal({ ...local, max: Number(e.target.value) })}
          onBlur={() => onChange(local)}
        />
      </label>
      <label className="flex flex-col gap-1">
        <span className="tt-label">Low label</span>
        <input
          className="tt-input"
          value={local.minLabel ?? ""}
          onChange={(e) => setLocal({ ...local, minLabel: e.target.value })}
          onBlur={() => onChange({ ...local, minLabel: local.minLabel?.trim() || null })}
        />
      </label>
      <label className="flex flex-col gap-1">
        <span className="tt-label">High label</span>
        <input
          className="tt-input"
          value={local.maxLabel ?? ""}
          onChange={(e) => setLocal({ ...local, maxLabel: e.target.value })}
          onBlur={() => onChange({ ...local, maxLabel: local.maxLabel?.trim() || null })}
        />
      </label>
    </div>
  );
}

function ColumnsEditor({
  columns,
  onChange,
}: {
  columns: GridColumn[];
  onChange: (columns: GridColumn[]) => void;
}) {
  const [local, setLocal] = useState(columns);
  const commit = (next: GridColumn[]) => {
    setLocal(next);
    onChange(next);
  };
  return (
    <div className="flex flex-col gap-2">
      <span className="tt-label">Columns</span>
      {local.map((c, i) => (
        <div key={c.id} className="flex flex-col gap-2 rounded-lg border border-ink-600/50 p-2">
          <div className="flex items-center gap-2">
            <input
              className="tt-input flex-1"
              value={c.label}
              onChange={(e) =>
                setLocal(local.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)))
              }
              onBlur={() => commit(local)}
            />
            <select
              className="tt-input w-28"
              value={c.type}
              onChange={(e) =>
                commit(
                  local.map((x, j) =>
                    j === i ? { ...x, type: e.target.value as GridColumn["type"] } : x,
                  ),
                )
              }
            >
              <option value="TEXT">Text</option>
              <option value="SELECT">Choice</option>
            </select>
            <button
              className="text-mist-500 hover:text-red-400"
              title="Remove column"
              onClick={() => commit(local.filter((_, j) => j !== i))}
            >
              ×
            </button>
          </div>
          {c.type === "SELECT" && (
            <div className="pl-2">
              <OptionsEditor
                options={c.options}
                onChange={(options) =>
                  commit(local.map((x, j) => (j === i ? { ...x, options } : x)))
                }
              />
            </div>
          )}
        </div>
      ))}
      <button
        className="tt-btn-ghost self-start text-xs"
        onClick={() =>
          commit([...local, { id: uid(), label: `Column ${local.length + 1}`, type: "TEXT", options: [] }])
        }
      >
        + Add column
      </button>
    </div>
  );
}
