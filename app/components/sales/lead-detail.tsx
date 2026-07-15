"use client";

import { useState } from "react";
import { leadApi } from "@/lib/api";
import { PRIORITIES, SOURCES, STAGES, formatMoney } from "@/lib/sales";
import type { Lead } from "@/lib/types";
import { Avatar } from "@/components/ui";

const ACTIVITY_ICON: Record<string, string> = {
  CALL: "☎",
  EMAIL: "✉",
  MEETING: "◷",
  NOTE: "✎",
};

export function LeadDetail({
  lead,
  docId,
  clientNames,
  memberNames,
  onClose,
  onChange,
}: {
  lead: Lead;
  docId: string;
  clientNames: string[];
  memberNames: string[];
  onClose: () => void;
  onChange: () => void;
}) {
  const [note, setNote] = useState("");
  const [activityType, setActivityType] =
    useState<"CALL" | "EMAIL" | "MEETING" | "NOTE">("NOTE");

  const patch = async (p: Parameters<typeof leadApi.updateLead>[2]) => {
    await leadApi.updateLead(docId, lead.id, p);
    onChange();
  };

  const move = async (stage: Lead["stage"]) => {
    await leadApi.moveLead(docId, lead.id, stage);
    onChange();
  };

  const logActivity = async () => {
    await leadApi.addActivity(docId, lead.id, {
      type: activityType,
      note: note.trim() || null,
    });
    setNote("");
    onChange();
  };

  const remove = async () => {
    await leadApi.deleteLead(docId, lead.id);
    onChange();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-40 flex justify-end">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="tt-card relative z-10 flex h-full w-full max-w-md flex-col overflow-y-auto rounded-none border-l border-ink-600/70">
        <div className="flex items-start justify-between gap-3 border-b border-ink-600/60 p-5">
          <div className="flex items-center gap-3">
            <Avatar seed={lead.name} size={40} />
            <div>
              <input
                className="w-full bg-transparent text-lg font-bold text-mist-100 outline-none"
                defaultValue={lead.name}
                onBlur={(e) => {
                  const v = e.target.value.trim();
                  if (v && v !== lead.name) patch({ name: v });
                }}
              />
              <div className="text-xs text-mist-400">
                Updated {new Date(lead.updatedAt).toLocaleString()}
              </div>
            </div>
          </div>
          <button
            className="text-mist-400 hover:text-mist-100"
            onClick={onClose}
          >
            ✕
          </button>
        </div>

        <div className="flex flex-col gap-4 p-5">
          <div>
            <label className="tt-label">Stage</label>
            <div className="flex flex-wrap gap-1.5">
              {STAGES.map((s) => (
                <button
                  key={s.key}
                  className={`tt-chip border ${
                    lead.stage === s.key
                      ? "border-transparent text-ink-950"
                      : "border-ink-600 text-mist-300 hover:text-mist-100"
                  }`}
                  style={
                    lead.stage === s.key ? { background: s.color } : undefined
                  }
                  onClick={() => move(s.key)}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Company">
              <input
                className="tt-input w-full"
                list="lead-clients"
                defaultValue={lead.company ?? ""}
                onBlur={(e) => patch({ company: e.target.value.trim() || null })}
              />
              <datalist id="lead-clients">
                {clientNames.map((c) => (
                  <option key={c} value={c} />
                ))}
              </datalist>
            </Field>
            <Field label="Owner">
              <input
                className="tt-input w-full"
                list="lead-members"
                defaultValue={lead.owner ?? ""}
                onBlur={(e) => patch({ owner: e.target.value.trim() || null })}
              />
              <datalist id="lead-members">
                {memberNames.map((m) => (
                  <option key={m} value={m} />
                ))}
              </datalist>
            </Field>
            <Field label="Email">
              <input
                className="tt-input w-full"
                type="email"
                defaultValue={lead.email ?? ""}
                onBlur={(e) => patch({ email: e.target.value.trim() || null })}
              />
            </Field>
            <Field label="Phone">
              <input
                className="tt-input w-full"
                defaultValue={lead.phone ?? ""}
                onBlur={(e) => patch({ phone: e.target.value.trim() || null })}
              />
            </Field>
            <Field label={`Est. value (${formatMoney(lead.estimatedValue)})`}>
              <input
                className="tt-input w-full"
                type="number"
                defaultValue={lead.estimatedValue ?? ""}
                onBlur={(e) =>
                  patch({
                    estimatedValue:
                      e.target.value.trim() === ""
                        ? null
                        : Number(e.target.value),
                  })
                }
              />
            </Field>
            <Field label="Source">
              <select
                className="tt-input w-full"
                defaultValue={lead.source}
                onChange={(e) =>
                  patch({ source: e.target.value as Lead["source"] })
                }
              >
                {SOURCES.map((s) => (
                  <option key={s.key} value={s.key}>
                    {s.label}
                  </option>
                ))}
              </select>
            </Field>
          </div>

          <Field label="Priority">
            <div className="flex gap-1.5">
              {PRIORITIES.map((p) => (
                <button
                  key={p.key}
                  className={`tt-chip border ${
                    lead.priority === p.key
                      ? "border-transparent text-ink-950"
                      : "border-ink-600 text-mist-300"
                  }`}
                  style={
                    lead.priority === p.key
                      ? { background: p.color }
                      : undefined
                  }
                  onClick={() => patch({ priority: p.key })}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </Field>

          <Field label="Notes">
            <textarea
              className="tt-input min-h-20 w-full resize-y"
              defaultValue={lead.notes ?? ""}
              onBlur={(e) => patch({ notes: e.target.value.trim() || null })}
            />
          </Field>

          <div>
            <label className="tt-label">Activity</label>
            <div className="mb-2 flex gap-2">
              <select
                className="tt-input"
                value={activityType}
                onChange={(e) =>
                  setActivityType(
                    e.target.value as "CALL" | "EMAIL" | "MEETING" | "NOTE",
                  )
                }
              >
                <option value="NOTE">Note</option>
                <option value="CALL">Call</option>
                <option value="EMAIL">Email</option>
                <option value="MEETING">Meeting</option>
              </select>
              <input
                className="tt-input flex-1"
                placeholder="Log activity…"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && logActivity()}
              />
              <button className="tt-btn-ghost" onClick={logActivity}>
                Log
              </button>
            </div>
            <ul className="flex flex-col gap-1.5">
              {[...lead.activities]
                .sort((a, b) => b.timestamp.localeCompare(a.timestamp))
                .map((a) => (
                  <li
                    key={a.id}
                    className="flex items-start gap-2 rounded-lg bg-ink-700/50 px-3 py-2 text-sm"
                  >
                    <span className="text-magenta">
                      {ACTIVITY_ICON[a.type] ?? "•"}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="text-mist-200">{a.note ?? a.type}</div>
                      <div className="text-xs text-mist-400">
                        {new Date(a.timestamp).toLocaleString()}
                      </div>
                    </div>
                  </li>
                ))}
              {lead.activities.length === 0 && (
                <li className="text-sm text-mist-400">No activity yet.</li>
              )}
            </ul>
          </div>

          <button
            className="mt-2 self-start text-xs text-mist-400 hover:text-red-400"
            onClick={remove}
          >
            Delete lead
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="tt-label">{label}</label>
      {children}
    </div>
  );
}
