"use client";

import { use, useCallback, useEffect, useState, type ReactNode } from "react";
import { SurveyForm, type SurveyDefinition } from "@/components/surveys/survey-form";
import type { ResponseAnswerPayload } from "@/lib/survey-helpers";

type Phase = "loading" | "open" | "closed" | "notfound" | "error" | "done";

interface LoadResult {
  status: "DRAFT" | "OPEN" | "CLOSED";
  title: string;
  definition: SurveyDefinition | null;
}

export default function PublicSurveyPage({
  params,
}: {
  params: Promise<{ link: string }>;
}) {
  const { link } = use(params);
  const [phase, setPhase] = useState<Phase>("loading");
  const [definition, setDefinition] = useState<SurveyDefinition | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/survey/${encodeURIComponent(link)}`, {
          cache: "no-store",
        });
        if (res.status === 404) return cancelled || setPhase("notfound");
        if (!res.ok) return cancelled || setPhase("error");
        const data = (await res.json()) as LoadResult;
        if (cancelled) return;
        if (data.status === "OPEN" && data.definition) {
          setDefinition(data.definition);
          setPhase("open");
        } else {
          setPhase("closed");
        }
      } catch {
        if (!cancelled) setPhase("error");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [link]);

  const submit = useCallback(
    async (answers: ResponseAnswerPayload[]) => {
      setSubmitting(true);
      try {
        const res = await fetch(`/api/survey/${encodeURIComponent(link)}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ answers }),
        });
        if (res.ok) {
          setPhase("done");
        } else if (res.status === 409) {
          setPhase("closed");
        } else {
          const body = (await res.json().catch(() => ({}))) as { message?: string };
          alert(body.message ?? "Could not submit your response. Please try again.");
        }
      } catch {
        alert("Could not submit your response. Please try again.");
      } finally {
        setSubmitting(false);
      }
    },
    [link],
  );

  return (
    <main className="min-h-screen bg-ink-950 px-4 py-10 text-mist-100">
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-8">
        <div className="flex items-center gap-2.5">
          <span className="grid size-7 place-items-center rounded-lg bg-magenta text-ink-950">
            ⬡
          </span>
          <span className="text-sm font-bold tracking-tight text-mist-200">Powerhouse</span>
        </div>

        {phase === "loading" && <Centered>Loading…</Centered>}
        {phase === "notfound" && (
          <Centered>
            This link isn’t valid. It may have expired or been replaced — please ask
            whoever shared it for an up-to-date link.
          </Centered>
        )}
        {phase === "error" && (
          <Centered>Something went wrong. Please try again in a moment.</Centered>
        )}
        {phase === "closed" && (
          <Centered>This survey is closed and is no longer accepting responses.</Centered>
        )}
        {phase === "done" && (
          <Centered>
            <div className="text-4xl">✓</div>
            <div className="mt-3 text-lg font-semibold text-mist-100">Thank you!</div>
            <div className="mt-1 text-sm text-mist-400">
              Your response has been recorded.
            </div>
          </Centered>
        )}
        {phase === "open" && definition && (
          <SurveyForm definition={definition} submitting={submitting} onSubmit={submit} />
        )}
      </div>
    </main>
  );
}

function Centered({ children }: { children: ReactNode }) {
  return (
    <div className="tt-card flex flex-col items-center gap-1 px-6 py-16 text-center text-sm text-mist-300">
      {children}
    </div>
  );
}
