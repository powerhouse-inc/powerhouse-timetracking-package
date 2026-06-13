"use client";

import { useEffect, useRef, useState } from "react";
import { EntryList, type EntryPatch } from "@/components/entry-list";
import { StartValues, TimerBar } from "@/components/timer-bar";
import { PageHeader } from "@/components/ui";
import { ensureTimesheet, timesheetApi } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useMyTimesheet, useRefresh, useWorkspace } from "@/lib/hooks";
import { durationSeconds, formatDurationShort, startOfWeek } from "@/lib/time";

export default function TimerPage() {
  const { user } = useAuth();
  const { data: workspace } = useWorkspace();
  const { timesheet } = useMyTimesheet(user?.address);
  const refresh = useRefresh();
  const [busy, setBusy] = useState(false);
  const ensuring = useRef(false);

  useEffect(() => {
    if (!user || timesheet || ensuring.current) return;
    ensuring.current = true;
    void ensureTimesheet(user.address, user.name)
      .then(refresh)
      .finally(() => {
        ensuring.current = false;
      });
  }, [user, timesheet, refresh]);

  const projects = (workspace?.projects ?? []).filter(
    (p) => p.status === "ACTIVE",
  );
  const docId = timesheet?.id ?? null;

  const run = async (fn: () => Promise<void>) => {
    if (!docId) return;
    setBusy(true);
    try {
      await fn();
      refresh();
    } finally {
      setBusy(false);
    }
  };

  const weekStart = startOfWeek().toISOString();
  const weekSeconds = (timesheet?.entries ?? [])
    .filter((e) => e.start >= weekStart)
    .reduce((s, e) => s + durationSeconds(e.start, e.end), 0);

  return (
    <>
      <PageHeader
        title="Timer"
        subtitle="Track what you're working on, live."
        action={
          <div className="tt-card px-4 py-2 text-right">
            <div className="text-[11px] uppercase tracking-wider text-mist-400">
              This week
            </div>
            <div className="font-mono text-lg tabular-nums text-mist-100">
              {formatDurationShort(weekSeconds)}
            </div>
          </div>
        }
      />

      <TimerBar
        running={timesheet?.running ?? null}
        projects={projects}
        busy={busy || !docId}
        onStart={(v: StartValues) =>
          run(() => timesheetApi.startTimer(docId!, v))
        }
        onStop={() => run(() => timesheetApi.stopTimer(docId!))}
        onDiscard={() => run(() => timesheetApi.discardTimer(docId!))}
      />

      <EntryList
        entries={timesheet?.entries ?? []}
        projects={projects}
        onUpdate={(id: string, patch: EntryPatch) =>
          run(() => timesheetApi.updateEntry(docId!, id, patch))
        }
        onDelete={(id: string) =>
          run(() => timesheetApi.deleteEntry(docId!, id))
        }
      />
    </>
  );
}
