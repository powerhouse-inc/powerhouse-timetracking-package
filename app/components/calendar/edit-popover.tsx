"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { RawEntry } from "@/lib/api";
import type { WorkspaceProject } from "@/lib/types";
import {
  formatTime24,
  durationSeconds,
  formatDurationShort,
} from "@/lib/calendar/time"

interface EditPopoverProps {
  position: { top: number; left: number };
  entry: RawEntry;
  running: boolean;
  projects: WorkspaceProject[];
  onSubmit: (data: {
    description?: string;
    projectId?: string | null;
    billable?: boolean;
  }) => Promise<void>;
  onDelete: () => Promise<void>;
  onCancel: () => void;
}

export function EditPopover({
  position,
  entry,
  running,
  projects,
  onSubmit,
  onDelete,
  onCancel,
}: EditPopoverProps) {
  const [description, setDescription] = useState(entry.description);
  const [projectId, setProjectId] = useState(entry.projectId ?? "");
  const [billable, setBillable] = useState(entry.billable);
  const [submitting, setSubmitting] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
    inputRef.current?.select();
  }, []);

  const handleSubmit = useCallback(
    async (e?: React.FormEvent) => {
      e?.preventDefault();
      if (submitting) return;
      setSubmitting(true);
      try {
        await onSubmit({
          description: description.trim(),
          projectId: projectId || null,
          billable,
        });
      } finally {
        setSubmitting(false);
      }
    },
    [description, projectId, billable, onSubmit, submitting],
  );

  const handleDelete = useCallback(async () => {
    await onDelete();
  }, [onDelete]);

  const duration = durationSeconds(entry.start, entry.end);

  return (
    <div
      className="absolute z-40 w-72"
      style={{ top: position.top, left: position.left }}
    >
      <div className="tt-card p-3">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-[11px] text-mist-400">
            {formatTime24(entry.start)} – {formatTime24(entry.end)}
          </span>
          <span className="text-[10px] font-mono text-mist-500">
            {formatDurationShort(duration)}
          </span>
        </div>

        <form onSubmit={handleSubmit}>
          <input
            ref={inputRef}
            className="tt-input mb-2 w-full"
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
              {showDelete && (
                <button
                  type="button"
                  className="text-xs text-red-400 hover:text-red-300"
                  onClick={handleDelete}
                  disabled={submitting}
                >
                  Delete entry
                </button>
              )}
              {!showDelete && (
                <button
                  type="button"
                  className="text-xs text-mist-500 hover:text-red-400"
                  onClick={() => setShowDelete(true)}
                  disabled={submitting}
                >
                  🗑
                </button>
              )}
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
                disabled={submitting || running}
              >
                {submitting ? "…" : "Save"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
