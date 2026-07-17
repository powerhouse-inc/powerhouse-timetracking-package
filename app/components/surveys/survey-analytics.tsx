"use client";

import { EmptyState } from "@/components/ui";
import { fmtDate } from "@/lib/format";
import {
  completionRate,
  groupBySection,
  optionTallies,
  ratingStats,
  textAnswers,
} from "@/lib/survey-helpers";
import type { SurveyDoc, SurveyQuestion } from "@/lib/types";

export function SurveyAnalytics({ survey }: { survey: SurveyDoc }) {
  if (survey.responses.length === 0) {
    return <EmptyState>No responses to analyze yet.</EmptyState>;
  }

  const total = survey.responses.length;
  const completion = Math.round(completionRate(survey) * 100);
  const groups = groupBySection(survey);

  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <Stat label="Responses" value={`${total}`} />
        <Stat label="Completion" value={`${completion}%`} />
        <Stat
          label="Published"
          value={survey.publishedAt ? fmtDate(survey.publishedAt) : "—"}
        />
      </div>

      {groups.map(({ section, questions }) => (
        <div key={section.id} className="flex flex-col gap-3">
          <h3 className="text-sm font-bold text-mist-200">{section.title}</h3>
          {questions.map((q) => (
            <div key={q.id} className="tt-card flex flex-col gap-3 p-4">
              <div className="text-sm font-medium text-mist-100">{q.title}</div>
              <QuestionAnalytics survey={survey} question={q} />
            </div>
          ))}
          {questions.length === 0 && (
            <p className="text-xs text-mist-500">No questions.</p>
          )}
        </div>
      ))}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="tt-card p-4">
      <div className="text-[11px] uppercase tracking-wider text-mist-400">{label}</div>
      <div className="mt-1 text-2xl font-extrabold text-mist-100">{value}</div>
    </div>
  );
}

function QuestionAnalytics({
  survey,
  question,
}: {
  survey: SurveyDoc;
  question: SurveyQuestion;
}) {
  if (question.type === "SINGLE_SELECT" || question.type === "MULTI_SELECT") {
    const tallies = optionTallies(survey, question);
    const max = Math.max(1, ...tallies.map((t) => t.count));
    return (
      <div className="flex flex-col gap-2">
        {tallies.map((t) => (
          <Bar key={t.id} label={t.label} count={t.count} pct={(t.count / max) * 100} />
        ))}
      </div>
    );
  }

  if (question.type === "RATING") {
    const stats = ratingStats(survey, question);
    const max = Math.max(1, ...stats.distribution.map((d) => d.count));
    return (
      <div className="flex flex-col gap-2">
        <div className="text-sm text-mist-300">
          Average{" "}
          <span className="font-bold text-mist-100">
            {stats.average != null ? stats.average.toFixed(1) : "—"}
          </span>{" "}
          <span className="text-xs text-mist-500">({stats.count} rated)</span>
        </div>
        {stats.distribution.map((d) => (
          <Bar key={d.value} label={`${d.value}`} count={d.count} pct={(d.count / max) * 100} />
        ))}
      </div>
    );
  }

  if (question.type === "GRID") {
    const rows = survey.responses.flatMap(
      (r) => r.answers.find((a) => a.questionId === question.id)?.rows ?? [],
    );
    if (rows.length === 0) return <p className="text-xs text-mist-500">No rows submitted.</p>;
    return (
      <div className="overflow-x-auto">
        <table className="min-w-[24rem] border-collapse text-xs">
          <thead>
            <tr>
              {question.columns.map((c) => (
                <th
                  key={c.id}
                  className="border-b border-ink-600/60 px-2 py-1 text-left font-semibold text-mist-400"
                >
                  {c.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, ri) => (
              <tr key={ri}>
                {question.columns.map((c) => {
                  const cell = row.cells.find((x) => x.columnId === c.id);
                  const value =
                    c.type === "SELECT"
                      ? (c.options.find((o) => o.id === cell?.optionId)?.label ?? "")
                      : (cell?.text ?? "");
                  return (
                    <td key={c.id} className="border-b border-ink-600/30 px-2 py-1 text-mist-200">
                      {value || "—"}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  // TEXT
  const answers = textAnswers(survey, question.id);
  if (answers.length === 0) return <p className="text-xs text-mist-500">No answers.</p>;
  return (
    <div className="flex flex-col gap-1.5">
      <div className="text-xs text-mist-500">{answers.length} answers</div>
      {answers.map((t, i) => (
        <div key={i} className="rounded-lg bg-ink-900/50 px-3 py-2 text-sm text-mist-200">
          {t}
        </div>
      ))}
    </div>
  );
}

function Bar({ label, count, pct }: { label: string; count: number; pct: number }) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-28 shrink-0 truncate text-xs text-mist-300" title={label}>
        {label}
      </div>
      <div className="h-4 flex-1 overflow-hidden rounded bg-ink-800">
        <div className="h-full rounded bg-magenta/70" style={{ width: `${pct}%` }} />
      </div>
      <div className="w-6 shrink-0 text-right text-xs tabular-nums text-mist-300">{count}</div>
    </div>
  );
}
