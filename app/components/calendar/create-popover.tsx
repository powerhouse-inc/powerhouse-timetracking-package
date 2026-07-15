"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { WorkspaceProject } from "@/lib/types";
import {
  formatTime24,
  durationSeconds,
  formatDurationShort,
} from "@/lib/calendar/time";

interface CreatePopoverProps {
  position: { top: number; left: number };
  startDate: Date;
  endDate: Date;
  projects: WorkspaceProject[];
  onSubmit: (data: {
    description: string;
    projectId: string | null;
    billable: boolean;
    start: string;
    end: string;
  }) => Promise<void>;
  onCancel: () => void;
}

export function CreatePopover({
  position,
  startDate,
  endDate,
  projects,
  onSubmit,
  onCancel,
}: CreatePopoverProps) {
  const [description, setDescription] = useState("");
  const [projectId, setProjectId] = useState("");
  const [billable, setBillable] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSubmit = useCallback(
    async (e?: React.FormEvent) => {
      e?.preventDefault();
      if (submitting) return;
      setSubmitting(true);
      try {
        await onSubmit({
          description: description.trim() || "(no description)",
          projectId: projectId || null,
          billable,
          start: startDate.toISOString(),
          end: endDate.toISOString(),
        });
      } finally {
        setSubmitting(false);
      }
    },
    [description, projectId, billable, startDate, endDate, onSubmit, submitting],
  );

  const duration = durationSeconds(startDate.toISOString(), endDate.toISOString());
  const durStr = formatDurationShort(duration);

  return (
    <div
      className="absolute z-40 w-72"
      style={{ top: position.top, left: position.left }}
    >
      <div className="tt-card p-3">
        <form onSubmit={handleSubmit}>
          <div className="mb-2 flex items-center justify-between">
            <span className="text-[11px] text-mist-400">
              {formatTime24(startDate.toISOString())} – {formatTime24(endDate.toISOString())}
            </span>
            <span className="text-[10px] font-mono text-mist-500">{durStr}</span>
          </div>

          <input
            ref={inputRef}
            className="tt-input mb-2 w-full"
            placeholder="What are you working on?"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />

          <select
            className="tt-input mb-2 w-full"
            value={projectId}
            onChange={(e) => setProjectId(e.target.value)}
          >
            <option value="">No project</option>
            {projects.map((p) => (
              <option key={p.localId} value={p.localId}>
                {p.name}
              </option>
            ))}
          </select>

          <div className="flex items-center gap-3">
            <label className="flex cursor-pointer items-center gap-1.5 text-xs text-mist-300">
              <input
                type="checkbox"
                checked={billable}
                onChange={() => setBillable((b) => !b)}
                className="accent-magenta"
              />
              Billable
            </label>
            <div className="ml-auto flex items-center gap-2">
              <button
                type="button"
                className="tt-btn tt-btn-ghost text-xs"
                onClick={onCancel}
                disabled={submitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="tt-btn-primary text-xs"
                disabled={submitting}
              >
                {submitting ? "…" : "Create"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
