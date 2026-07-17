"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { EmptyState, PageHeader } from "@/components/ui";
import { SurveyStatusPill } from "@/components/surveys/survey-status-pill";
import { createSurvey, createSurveyFromTemplate } from "@/lib/api";
import { useSurveys } from "@/lib/hooks";
import { toast } from "@/lib/toast";
import type { SurveyDoc } from "@/lib/types";

type Tab = "surveys" | "templates";

export default function SurveysPage() {
  const { data: surveys } = useSurveys();
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("surveys");
  const [busy, setBusy] = useState(false);

  const templates = useMemo(
    () => (surveys ?? []).filter((s) => s.kind === "TEMPLATE"),
    [surveys],
  );
  const live = useMemo(
    () => (surveys ?? []).filter((s) => s.kind === "SURVEY"),
    [surveys],
  );

  async function newSurvey(kind: "SURVEY" | "TEMPLATE") {
    setBusy(true);
    try {
      const id = await createSurvey("", kind);
      router.push(`/surveys/${id}`);
    } catch {
      toast("Could not create survey", "error");
      setBusy(false);
    }
  }

  async function fromTemplate(template: SurveyDoc) {
    setBusy(true);
    try {
      const id = await createSurveyFromTemplate(template, {
        title: `${template.title || "Survey"} — copy`,
        clientId: null,
        clientName: null,
      });
      router.push(`/surveys/${id}`);
    } catch {
      toast("Could not create from template", "error");
      setBusy(false);
    }
  }

  return (
    <>
      <PageHeader
        title="Surveys"
        subtitle="Build questionnaires, share a link, collect responses."
      />

      <div className="mb-5 flex items-center justify-between gap-3">
        <div className="flex gap-1 rounded-lg bg-ink-800 p-1">
          <TabButton active={tab === "surveys"} onClick={() => setTab("surveys")}>
            Surveys
          </TabButton>
          <TabButton active={tab === "templates"} onClick={() => setTab("templates")}>
            Templates
          </TabButton>
        </div>
        <div className="flex gap-2">
          {tab === "surveys" ? (
            <>
              {templates.length > 0 && (
                <FromTemplateMenu templates={templates} onPick={fromTemplate} disabled={busy} />
              )}
              <button className="tt-btn-primary" disabled={busy} onClick={() => newSurvey("SURVEY")}>
                New survey
              </button>
            </>
          ) : (
            <button className="tt-btn-primary" disabled={busy} onClick={() => newSurvey("TEMPLATE")}>
              New template
            </button>
          )}
        </div>
      </div>

      {tab === "surveys" ? (
        <SurveyList
          surveys={live}
          empty="No surveys yet. Create one, or start from a template."
        />
      ) : (
        <SurveyList
          surveys={templates}
          empty="No templates yet. Build one to reuse across clients."
          templates
        />
      )}
    </>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${
        active ? "bg-ink-700 text-mist-100" : "text-mist-400 hover:text-mist-200"
      }`}
    >
      {children}
    </button>
  );
}

function SurveyList({
  surveys,
  empty,
  templates = false,
}: {
  surveys: SurveyDoc[];
  empty: string;
  templates?: boolean;
}) {
  if (surveys.length === 0) return <EmptyState>{empty}</EmptyState>;
  return (
    <div className="tt-card overflow-hidden">
      {surveys.map((s) => (
        <Link
          key={s.id}
          href={`/surveys/${s.id}`}
          className="flex items-center gap-3 border-b border-ink-600/40 px-5 py-3 transition last:border-0 hover:bg-ink-800"
        >
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-medium text-mist-100">
              {s.title || "Untitled survey"}
            </div>
            <div className="truncate text-xs text-mist-400">
              {s.clientName ? `${s.clientName} · ` : ""}
              {s.questions.length} question{s.questions.length === 1 ? "" : "s"}
            </div>
          </div>
          {!templates && (
            <div className="text-xs text-mist-400">
              {s.responses.length} response{s.responses.length === 1 ? "" : "s"}
            </div>
          )}
          {!templates && <SurveyStatusPill status={s.status} />}
        </Link>
      ))}
    </div>
  );
}

function FromTemplateMenu({
  templates,
  onPick,
  disabled,
}: {
  templates: SurveyDoc[];
  onPick: (t: SurveyDoc) => void;
  disabled: boolean;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button className="tt-btn" disabled={disabled} onClick={() => setOpen((o) => !o)}>
        From template ▾
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 z-20 mt-1 max-h-72 w-64 overflow-auto rounded-lg border border-ink-600 bg-ink-900 py-1 shadow-xl">
            {templates.map((t) => (
              <button
                key={t.id}
                className="block w-full truncate px-3 py-2 text-left text-sm text-mist-200 hover:bg-ink-800"
                onClick={() => {
                  setOpen(false);
                  onPick(t);
                }}
              >
                {t.title || "Untitled template"}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
