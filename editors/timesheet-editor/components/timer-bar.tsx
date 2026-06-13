import type { Project } from "document-models/timetracking-workspace";
import { useEffect, useState } from "react";
import { durationSeconds, formatClock } from "../../shared/time.js";

export interface StartValues {
  description: string;
  projectId: string | null;
  billable: boolean;
}

interface RunningLike {
  description: string;
  projectId?: string | null;
  start: string;
  billable: boolean;
}

interface TimerBarProps {
  running: RunningLike | null;
  projects: Project[];
  onStart: (values: StartValues) => void;
  onStop: () => void;
  onDiscard: () => void;
}

export function TimerBar({
  running,
  projects,
  onStart,
  onStop,
  onDiscard,
}: TimerBarProps) {
  const [description, setDescription] = useState("");
  const [projectId, setProjectId] = useState<string>("");
  const [billable, setBillable] = useState(true);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [running]);

  const elapsed = running
    ? durationSeconds(running.start, new Date(now).toISOString())
    : 0;

  const start = () => {
    onStart({
      description: description.trim() || "(no description)",
      projectId: projectId || null,
      billable,
    });
  };

  return (
    <div className="tt-timerbar">
      <input
        className="tt-timerbar__desc"
        placeholder="What are you working on?"
        value={running ? running.description : description}
        disabled={!!running}
        onChange={(e) => setDescription(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !running) start();
        }}
      />

      <select
        className="tt-timerbar__project"
        value={running ? (running.projectId ?? "") : projectId}
        disabled={!!running}
        onChange={(e) => setProjectId(e.target.value)}
      >
        <option value="">No project</option>
        {projects.map((p) => (
          <option key={p.id} value={p.id}>
            {p.name}
          </option>
        ))}
      </select>

      <button
        type="button"
        className={`tt-timerbar__billable ${
          (running ? running.billable : billable) ? "is-on" : ""
        }`}
        disabled={!!running}
        onClick={() => setBillable((b) => !b)}
        title="Billable"
      >
        $
      </button>

      <span className="tt-timerbar__clock">{formatClock(elapsed)}</span>

      {running ? (
        <>
          <button
            type="button"
            className="tt-btn tt-btn--stop"
            onClick={onStop}
          >
            Stop
          </button>
          <button
            type="button"
            className="tt-btn tt-btn--ghost"
            onClick={onDiscard}
            title="Discard running timer"
          >
            ✕
          </button>
        </>
      ) : (
        <button type="button" className="tt-btn tt-btn--start" onClick={start}>
          Start
        </button>
      )}
    </div>
  );
}
