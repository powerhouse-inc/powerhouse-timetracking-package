"use client";

import { useEffect, useState } from "react";
import { surveyApi, surveyShareLink } from "@/lib/api";
import { useRefresh } from "@/lib/hooks";
import { toast } from "@/lib/toast";
import type { SurveyDoc } from "@/lib/types";

export function SurveyShare({ survey }: { survey: SurveyDoc }) {
  const refresh = useRefresh();
  const [origin, setOrigin] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => setOrigin(window.location.origin), []);

  const link = origin ? surveyShareLink(origin, survey) : null;
  const noQuestions = survey.questions.length === 0;

  const run = async (fn: () => Promise<void>) => {
    setBusy(true);
    try {
      await fn();
      refresh();
    } catch {
      toast("Action failed", "error");
    } finally {
      setBusy(false);
    }
  };

  const copy = async () => {
    if (!link) return;
    await navigator.clipboard.writeText(link);
    toast("Link copied", "success");
  };

  return (
    <div className="mx-auto flex max-w-xl flex-col gap-5">
      <div className="tt-card flex flex-col gap-3 p-5">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-semibold text-mist-100">Status</div>
            <div className="text-xs text-mist-400">
              {survey.status === "DRAFT" && "Not published — no one can respond yet."}
              {survey.status === "OPEN" && "Open — anyone with the link can respond."}
              {survey.status === "CLOSED" && "Closed — the link no longer accepts responses."}
            </div>
          </div>
          {survey.status === "DRAFT" && (
            <button
              className="tt-btn-primary"
              disabled={busy || noQuestions}
              title={noQuestions ? "Add at least one question first" : undefined}
              onClick={() => run(() => surveyApi.publish(survey.id))}
            >
              Publish
            </button>
          )}
          {survey.status === "OPEN" && (
            <button className="tt-btn" disabled={busy} onClick={() => run(() => surveyApi.close(survey.id))}>
              Close
            </button>
          )}
          {survey.status === "CLOSED" && (
            <button className="tt-btn-primary" disabled={busy} onClick={() => run(() => surveyApi.reopen(survey.id))}>
              Reopen
            </button>
          )}
        </div>
        {noQuestions && survey.status === "DRAFT" && (
          <p className="text-xs text-amber-400">Add at least one question before publishing.</p>
        )}
      </div>

      {link && (
        <div className="tt-card flex flex-col gap-3 p-5">
          <div className="text-sm font-semibold text-mist-100">Public link</div>
          <div className="flex items-center gap-2">
            <input readOnly className="tt-input flex-1 font-mono text-xs" value={link} />
            <button className="tt-btn" onClick={copy}>
              Copy
            </button>
          </div>
          <p className="text-xs text-mist-500">
            Share this with respondents — no login required. Anyone with the link can
            submit while the survey is open.
          </p>
          <button
            className="tt-btn-ghost self-start text-xs text-mist-400"
            disabled={busy}
            onClick={() => {
              if (
                confirm(
                  "Regenerate the link? The current link will stop working immediately.",
                )
              )
                void run(() => surveyApi.regenerateToken(survey.id));
            }}
          >
            Regenerate link (revokes the old one)
          </button>
        </div>
      )}
    </div>
  );
}
