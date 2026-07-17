"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { SurveyBuilder } from "@/components/surveys/survey-builder";
import { SurveyShare } from "@/components/surveys/survey-share";
import { SurveyResponses } from "@/components/surveys/survey-responses";
import { SurveyAnalytics } from "@/components/surveys/survey-analytics";
import { SurveyStatusPill } from "@/components/surveys/survey-status-pill";
import { surveyApi } from "@/lib/api";
import { useRefresh, useSurveys } from "@/lib/hooks";
import type { SurveyDoc } from "@/lib/types";

type Tab = "build" | "share" | "responses" | "analytics";

export default function SurveyDetailPage() {
  const params = useParams<{ id: string }>();
  const { data: surveys, isLoading } = useSurveys();
  const [tab, setTab] = useState<Tab>("build");

  const survey = (surveys ?? []).find((s) => s.id === params.id) ?? null;

  if (!survey) {
    return (
      <div className="py-16 text-center text-sm text-mist-400">
        {isLoading ? "Loading…" : "Survey not found."}
        {!isLoading && (
          <div className="mt-3">
            <Link href="/surveys" className="text-magenta hover:underline">
              ← Back to surveys
            </Link>
          </div>
        )}
      </div>
    );
  }

  const isTemplate = survey.kind === "TEMPLATE";
  const tabs: { key: Tab; label: string }[] = isTemplate
    ? [{ key: "build", label: "Build" }]
    : [
        { key: "build", label: "Build" },
        { key: "share", label: "Share" },
        { key: "responses", label: `Responses (${survey.responses.length})` },
        { key: "analytics", label: "Analytics" },
      ];
  const active = tabs.some((t) => t.key === tab) ? tab : "build";

  return (
    <>
      <SurveyHeader survey={survey} isTemplate={isTemplate} />

      <div className="mb-5 flex gap-1 border-b border-ink-600/60">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`-mb-px border-b-2 px-3 py-2 text-sm font-medium transition ${
              active === t.key
                ? "border-magenta text-mist-100"
                : "border-transparent text-mist-400 hover:text-mist-200"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {active === "build" && <SurveyBuilder survey={survey} />}
      {active === "share" && <SurveyShare survey={survey} />}
      {active === "responses" && <SurveyResponses survey={survey} />}
      {active === "analytics" && <SurveyAnalytics survey={survey} />}
    </>
  );
}

function SurveyHeader({
  survey,
  isTemplate,
}: {
  survey: SurveyDoc;
  isTemplate: boolean;
}) {
  const refresh = useRefresh();
  const [title, setTitle] = useState(survey.title);

  return (
    <div className="mb-5">
      <Link href="/surveys" className="text-xs text-mist-400 hover:text-mist-200">
        ← Surveys
      </Link>
      <div className="mt-2 flex items-center gap-3">
        <input
          className="min-w-0 flex-1 bg-transparent text-2xl font-extrabold text-mist-100 outline-none placeholder:text-mist-600"
          placeholder="Untitled survey"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onBlur={() => {
            const v = title.trim();
            if (v !== survey.title) void surveyApi.setTitle(survey.id, v).then(refresh);
          }}
        />
        {isTemplate ? (
          <span className="rounded-full bg-magenta/15 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-magenta">
            Template
          </span>
        ) : (
          <SurveyStatusPill status={survey.status} />
        )}
      </div>
    </div>
  );
}
