"use client";

import { useState } from "react";
import { EmptyState } from "@/components/ui";
import { surveyApi } from "@/lib/api";
import { fmtDate } from "@/lib/format";
import { useRefresh } from "@/lib/hooks";
import type { SurveyAnswer, SurveyDoc, SurveyQuestion } from "@/lib/types";

export function SurveyResponses({ survey }: { survey: SurveyDoc }) {
  const refresh = useRefresh();
  const [openId, setOpenId] = useState<string | null>(null);

  if (survey.responses.length === 0) {
    return <EmptyState>No responses yet. Share the link to start collecting.</EmptyState>;
  }

  // newest first
  const responses = [...survey.responses].sort((a, b) =>
    b.submittedAt.localeCompare(a.submittedAt),
  );

  return (
    <div className="tt-card overflow-hidden">
      {responses.map((r, i) => {
        const open = openId === r.id;
        return (
          <div key={r.id} className="border-b border-ink-600/40 last:border-0">
            <div className="flex items-center gap-3 px-5 py-3">
              <button
                className="min-w-0 flex-1 text-left"
                onClick={() => setOpenId(open ? null : r.id)}
              >
                <span className="text-sm font-medium text-mist-100">
                  Response #{responses.length - i}
                </span>
                <span className="ml-2 text-xs text-mist-400">
                  {fmtDate(r.submittedAt)} · {r.answers.length} answer
                  {r.answers.length === 1 ? "" : "s"}
                </span>
              </button>
              <button
                className="text-mist-500 hover:text-red-400"
                title="Delete response"
                onClick={() => {
                  if (confirm("Delete this response?"))
                    void surveyApi.deleteResponse(survey.id, r.id).then(refresh);
                }}
              >
                ×
              </button>
            </div>
            {open && (
              <div className="flex flex-col gap-3 bg-ink-900/40 px-5 py-4">
                {survey.questions.map((q) => {
                  const answer = r.answers.find((a) => a.questionId === q.id);
                  return (
                    <div key={q.id}>
                      <div className="text-xs font-medium text-mist-300">{q.title}</div>
                      <div className="text-sm text-mist-100">
                        <AnswerValue question={q} answer={answer} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function AnswerValue({
  question,
  answer,
}: {
  question: SurveyQuestion;
  answer: SurveyAnswer | undefined;
}) {
  if (!answer) return <span className="text-mist-500">—</span>;

  if (question.type === "SHORT_TEXT" || question.type === "LONG_TEXT") {
    return answer.text ? (
      <span className="whitespace-pre-wrap">{answer.text}</span>
    ) : (
      <span className="text-mist-500">—</span>
    );
  }

  if (question.type === "SINGLE_SELECT" || question.type === "MULTI_SELECT") {
    const labels = answer.optionIds
      .map((id) => question.options.find((o) => o.id === id)?.label ?? id)
      .join(", ");
    return labels ? <span>{labels}</span> : <span className="text-mist-500">—</span>;
  }

  if (question.type === "RATING") {
    return answer.rating != null ? (
      <span>{answer.rating}</span>
    ) : (
      <span className="text-mist-500">—</span>
    );
  }

  // GRID
  if (answer.rows.length === 0) return <span className="text-mist-500">—</span>;
  return (
    <div className="mt-1 overflow-x-auto">
      <table className="min-w-[20rem] border-collapse text-xs">
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
          {answer.rows.map((row, ri) => (
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
