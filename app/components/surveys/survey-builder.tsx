"use client";

import { useState } from "react";
import { QuestionEditor } from "@/components/surveys/question-editor";
import { SurveyForm } from "@/components/surveys/survey-form";
import { surveyApi } from "@/lib/api";
import { useRefresh, useWorkspace } from "@/lib/hooks";
import {
  QUESTION_TYPES,
  blankQuestion,
  groupBySection,
  questionTypeLabel,
} from "@/lib/survey-helpers";
import type { QuestionType, SurveyDoc, SurveyQuestion, SurveySection } from "@/lib/types";

export function SurveyBuilder({ survey }: { survey: SurveyDoc }) {
  const refresh = useRefresh();
  const { data: workspace } = useWorkspace();
  const clients = workspace?.clients ?? [];
  const [description, setDescription] = useState(survey.description ?? "");
  const groups = groupBySection(survey);

  const moveSection = (id: string, dir: -1 | 1) => {
    const order = survey.sections.map((s) => s.id);
    const i = order.indexOf(id);
    const j = i + dir;
    if (j < 0 || j >= order.length) return;
    [order[i], order[j]] = [order[j], order[i]];
    void surveyApi.reorderSections(survey.id, order).then(refresh);
  };

  const moveQuestion = (q: SurveyQuestion, dir: -1 | 1) => {
    const inSection = survey.questions.filter((x) => x.sectionId === q.sectionId);
    const idx = inSection.findIndex((x) => x.id === q.id);
    const swap = inSection[idx + dir];
    if (!swap) return;
    const order = survey.questions.map((x) => x.id);
    const a = order.indexOf(q.id);
    const b = order.indexOf(swap.id);
    [order[a], order[b]] = [order[b], order[a]];
    void surveyApi.reorderQuestions(survey.id, order).then(refresh);
  };

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* editor */}
      <div className="flex flex-col gap-4">
        <div className="tt-card flex flex-col gap-3 p-4">
          <label className="flex flex-col gap-1">
            <span className="tt-label">Intro / description</span>
            <textarea
              className="tt-input min-h-20"
              placeholder="Shown at the top of the survey"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              onBlur={() => {
                if (description.trim() !== (survey.description ?? ""))
                  void surveyApi
                    .setDescription(survey.id, description.trim() || null)
                    .then(refresh);
              }}
            />
          </label>
          {survey.kind === "SURVEY" && (
            <label className="flex flex-col gap-1">
              <span className="tt-label">Recipient (optional)</span>
              <select
                className="tt-input"
                value={survey.clientId ?? ""}
                onChange={(e) => {
                  const id = e.target.value || null;
                  const name = clients.find((c) => c.localId === id)?.name ?? null;
                  void surveyApi.setRecipient(survey.id, id, name).then(refresh);
                }}
              >
                <option value="">— None —</option>
                {clients.map((c) => (
                  <option key={c.localId} value={c.localId}>
                    {c.name}
                  </option>
                ))}
              </select>
            </label>
          )}
        </div>

        {groups.map(({ section, questions }, sIdx) => (
          <SectionCard
            key={section.id}
            survey={survey}
            section={section}
            questions={questions}
            canUp={sIdx > 0}
            canDown={sIdx < groups.length - 1}
            onMove={(dir) => moveSection(section.id, dir)}
            onMoveQuestion={moveQuestion}
          />
        ))}

        <button
          className="tt-btn self-start"
          onClick={() =>
            void surveyApi
              .addSection(survey.id, { title: "New section", description: null })
              .then(refresh)
          }
        >
          + Add section
        </button>
      </div>

      {/* live preview */}
      <div className="lg:sticky lg:top-4 lg:self-start">
        <div className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-mist-400">
          Live preview
        </div>
        <div className="tt-card p-5">
          <SurveyForm definition={survey} preview />
        </div>
      </div>
    </div>
  );
}

function SectionCard({
  survey,
  section,
  questions,
  canUp,
  canDown,
  onMove,
  onMoveQuestion,
}: {
  survey: SurveyDoc;
  section: SurveySection;
  questions: SurveyQuestion[];
  canUp: boolean;
  canDown: boolean;
  onMove: (dir: -1 | 1) => void;
  onMoveQuestion: (q: SurveyQuestion, dir: -1 | 1) => void;
}) {
  const refresh = useRefresh();
  const [title, setTitle] = useState(section.title);
  const [desc, setDesc] = useState(section.description ?? "");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);

  const addQuestion = (type: QuestionType) => {
    setAdding(false);
    void surveyApi.addQuestion(survey.id, blankQuestion(section.id, type)).then(refresh);
  };

  return (
    <div className="tt-card flex flex-col gap-3 p-4">
      <div className="flex items-start gap-2">
        <div className="flex flex-1 flex-col gap-2">
          <input
            className="bg-transparent text-base font-bold text-mist-100 outline-none"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={() => {
              if (title.trim() && title.trim() !== section.title)
                void surveyApi
                  .updateSection(survey.id, section.id, { title: title.trim() })
                  .then(refresh);
            }}
          />
          <input
            className="bg-transparent text-xs text-mist-400 outline-none"
            placeholder="Section description (optional)"
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
            onBlur={() => {
              if (desc.trim() !== (section.description ?? ""))
                void surveyApi
                  .updateSection(survey.id, section.id, { description: desc.trim() || null })
                  .then(refresh);
            }}
          />
        </div>
        <div className="flex items-center gap-1 text-mist-500">
          <button disabled={!canUp} className="disabled:opacity-30" title="Move up" onClick={() => onMove(-1)}>
            ↑
          </button>
          <button disabled={!canDown} className="disabled:opacity-30" title="Move down" onClick={() => onMove(1)}>
            ↓
          </button>
          <button
            className="hover:text-red-400"
            title="Delete section"
            onClick={() => {
              if (confirm("Delete this section and its questions?"))
                void surveyApi.deleteSection(survey.id, section.id).then(refresh);
            }}
          >
            ×
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        {questions.map((q, i) => (
          <div key={q.id} className="rounded-lg border border-ink-600/50">
            <div className="flex items-center gap-2 px-3 py-2">
              <button
                className="min-w-0 flex-1 text-left"
                onClick={() => setExpanded(expanded === q.id ? null : q.id)}
              >
                <div className="truncate text-sm text-mist-100">
                  {q.title || "Untitled question"}
                </div>
                <div className="text-[11px] text-mist-500">{questionTypeLabel(q.type)}</div>
              </button>
              <div className="flex items-center gap-1 text-mist-500">
                <button disabled={i === 0} className="disabled:opacity-30" title="Move up" onClick={() => onMoveQuestion(q, -1)}>
                  ↑
                </button>
                <button
                  disabled={i === questions.length - 1}
                  className="disabled:opacity-30"
                  title="Move down"
                  onClick={() => onMoveQuestion(q, 1)}
                >
                  ↓
                </button>
                <button
                  className="hover:text-red-400"
                  title="Delete question"
                  onClick={() => void surveyApi.deleteQuestion(survey.id, q.id).then(refresh)}
                >
                  ×
                </button>
              </div>
            </div>
            {expanded === q.id && <QuestionEditor survey={survey} question={q} />}
          </div>
        ))}
      </div>

      <div className="relative">
        <button className="tt-btn-ghost text-xs" onClick={() => setAdding((a) => !a)}>
          + Add question
        </button>
        {adding && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setAdding(false)} />
            <div className="absolute z-20 mt-1 w-56 rounded-lg border border-ink-600 bg-ink-900 py-1 shadow-xl">
              {QUESTION_TYPES.map((t) => (
                <button
                  key={t.type}
                  className="block w-full px-3 py-1.5 text-left text-sm text-mist-200 hover:bg-ink-800"
                  onClick={() => addQuestion(t.type)}
                >
                  {t.label}
                  <span className="ml-1 text-[11px] text-mist-500">· {t.hint}</span>
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
