import type {
  ActivityType,
  Lead,
  LeadPriority,
  LeadSource,
  LeadStage,
} from "document-models/lead-funnel";
import { useEffect, useState } from "react";
import { formatDate, formatMoney } from "../lib/format.js";
import {
  ACTIVITY_TYPES,
  labelize,
  PRIORITIES,
  SOURCES,
  STAGES,
} from "../lib/stages.js";

export interface LeadPatch {
  name?: string;
  company?: string;
  email?: string;
  phone?: string;
  owner?: string;
  notes?: string;
  source?: LeadSource;
  priority?: LeadPriority;
  estimatedValue?: number | null;
  score?: number;
}

interface LeadDetailProps {
  lead: Lead;
  onClose: () => void;
  onUpdate: (patch: LeadPatch) => void;
  onMove: (stage: LeadStage) => void;
  onAddTag: (tag: string) => void;
  onRemoveTag: (tag: string) => void;
  onAddActivity: (type: ActivityType, note: string) => void;
  onDeleteActivity: (id: string) => void;
  onDelete: () => void;
}

export function LeadDetail({
  lead,
  onClose,
  onUpdate,
  onMove,
  onAddTag,
  onRemoveTag,
  onAddActivity,
  onDeleteActivity,
  onDelete,
}: LeadDetailProps) {
  const [notes, setNotes] = useState(lead.notes ?? "");
  const [newTag, setNewTag] = useState("");
  const [activityType, setActivityType] = useState<ActivityType>("CALL");
  const [activityNote, setActivityNote] = useState("");

  useEffect(() => {
    setNotes(lead.notes ?? "");
  }, [lead.id, lead.notes]);

  const activities = [...lead.activities].sort((a, b) =>
    b.timestamp.localeCompare(a.timestamp),
  );

  return (
    <div className="lfnl-drawer-backdrop" onClick={onClose}>
      <aside className="lfnl-drawer" onClick={(e) => e.stopPropagation()}>
        <header className="lfnl-drawer-head">
          <input
            className="lfnl-drawer-name"
            defaultValue={lead.name}
            onBlur={(e) => {
              const v = e.target.value.trim();
              if (v && v !== lead.name) onUpdate({ name: v });
            }}
          />
          <button
            className="lfnl-btn-ghost"
            onClick={onClose}
            aria-label="Close"
          >
            ✕
          </button>
        </header>

        <div className="lfnl-drawer-body">
          <label className="lfnl-field">
            <span>Stage</span>
            <select
              value={lead.stage}
              onChange={(e) => onMove(e.target.value as LeadStage)}
            >
              {STAGES.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label}
                </option>
              ))}
            </select>
          </label>

          <div className="lfnl-field-row">
            <TextField
              label="Company"
              value={lead.company}
              onCommit={(v) => onUpdate({ company: v })}
            />
            <TextField
              label="Owner"
              value={lead.owner}
              onCommit={(v) => onUpdate({ owner: v })}
            />
          </div>
          <div className="lfnl-field-row">
            <TextField
              label="Email"
              value={lead.email}
              onCommit={(v) => onUpdate({ email: v })}
            />
            <TextField
              label="Phone"
              value={lead.phone}
              onCommit={(v) => onUpdate({ phone: v })}
            />
          </div>

          <div className="lfnl-field-row">
            <label className="lfnl-field">
              <span>Source</span>
              <select
                value={lead.source}
                onChange={(e) =>
                  onUpdate({ source: e.target.value as LeadSource })
                }
              >
                {SOURCES.map((s) => (
                  <option key={s} value={s}>
                    {labelize(s)}
                  </option>
                ))}
              </select>
            </label>
            <label className="lfnl-field">
              <span>Priority</span>
              <select
                value={lead.priority}
                onChange={(e) =>
                  onUpdate({ priority: e.target.value as LeadPriority })
                }
              >
                {PRIORITIES.map((p) => (
                  <option key={p} value={p}>
                    {labelize(p)}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="lfnl-field-row">
            <label className="lfnl-field">
              <span>Est. value ({formatMoney(lead.estimatedValue)})</span>
              <input
                type="number"
                defaultValue={lead.estimatedValue ?? ""}
                onBlur={(e) =>
                  onUpdate({
                    estimatedValue:
                      e.target.value.trim() === ""
                        ? null
                        : Number(e.target.value),
                  })
                }
              />
            </label>
            <label className="lfnl-field">
              <span>Score</span>
              <input
                type="number"
                defaultValue={lead.score}
                onBlur={(e) => onUpdate({ score: Number(e.target.value) || 0 })}
              />
            </label>
          </div>

          <label className="lfnl-field">
            <span>Notes</span>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              onBlur={() => {
                if (notes !== (lead.notes ?? "")) onUpdate({ notes });
              }}
            />
          </label>

          <div className="lfnl-section">
            <h3>Tags</h3>
            <div className="lfnl-tags">
              {lead.tags.map((tag) => (
                <span key={tag} className="lfnl-tag lfnl-tag-removable">
                  {tag}
                  <button
                    onClick={() => onRemoveTag(tag)}
                    aria-label={`Remove ${tag}`}
                  >
                    ×
                  </button>
                </span>
              ))}
              {lead.tags.length === 0 ? (
                <span className="lfnl-muted">No tags</span>
              ) : null}
            </div>
            <div className="lfnl-inline-add">
              <input
                placeholder="Add tag…"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && newTag.trim()) {
                    onAddTag(newTag.trim());
                    setNewTag("");
                  }
                }}
              />
              <button
                className="lfnl-btn-sm"
                onClick={() => {
                  if (newTag.trim()) {
                    onAddTag(newTag.trim());
                    setNewTag("");
                  }
                }}
              >
                Add
              </button>
            </div>
          </div>

          <div className="lfnl-section">
            <h3>Activity</h3>
            <div className="lfnl-inline-add">
              <select
                value={activityType}
                onChange={(e) =>
                  setActivityType(e.target.value as ActivityType)
                }
              >
                {ACTIVITY_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {labelize(t)}
                  </option>
                ))}
              </select>
              <input
                placeholder="Log a note…"
                value={activityNote}
                onChange={(e) => setActivityNote(e.target.value)}
              />
              <button
                className="lfnl-btn-sm"
                onClick={() => {
                  onAddActivity(activityType, activityNote.trim());
                  setActivityNote("");
                }}
              >
                Log
              </button>
            </div>
            <ul className="lfnl-timeline">
              {activities.map((a) => (
                <li key={a.id}>
                  <span className="lfnl-timeline-type">{labelize(a.type)}</span>
                  <span className="lfnl-timeline-note">{a.note ?? ""}</span>
                  <span className="lfnl-timeline-time">
                    {formatDate(a.timestamp)}
                  </span>
                  <button
                    className="lfnl-link-danger"
                    onClick={() => onDeleteActivity(a.id)}
                    aria-label="Delete activity"
                  >
                    delete
                  </button>
                </li>
              ))}
              {activities.length === 0 ? (
                <li className="lfnl-muted">No activity yet</li>
              ) : null}
            </ul>
          </div>

          <button className="lfnl-btn-danger" onClick={onDelete}>
            Delete lead
          </button>
        </div>
      </aside>
    </div>
  );
}

interface TextFieldProps {
  label: string;
  value: string | null | undefined;
  onCommit: (value: string) => void;
}

function TextField({ label, value, onCommit }: TextFieldProps) {
  return (
    <label className="lfnl-field">
      <span>{label}</span>
      <input
        defaultValue={value ?? ""}
        key={value ?? ""}
        onBlur={(e) => {
          const v = e.target.value.trim();
          if (v !== (value ?? "")) onCommit(v);
        }}
      />
    </label>
  );
}
