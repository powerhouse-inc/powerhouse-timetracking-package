import type { LeadPriority, LeadSource } from "document-models/lead-funnel";
import { useState } from "react";
import { labelize, PRIORITIES, SOURCES } from "../lib/stages.js";

export interface NewLead {
  name: string;
  company: string;
  email: string;
  phone: string;
  owner: string;
  source: LeadSource;
  priority: LeadPriority;
  estimatedValue: number | null;
  score: number;
}

interface AddLeadFormProps {
  onSubmit: (lead: NewLead) => void;
  onClose: () => void;
}

export function AddLeadForm({ onSubmit, onClose }: AddLeadFormProps) {
  const [name, setName] = useState("");
  const [company, setCompany] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [owner, setOwner] = useState("");
  const [source, setSource] = useState<LeadSource>("WEBSITE");
  const [priority, setPriority] = useState<LeadPriority>("MEDIUM");
  const [value, setValue] = useState("");
  const [score, setScore] = useState("0");

  const canSubmit = name.trim().length > 0;

  function submit() {
    if (!canSubmit) return;
    onSubmit({
      name: name.trim(),
      company: company.trim(),
      email: email.trim(),
      phone: phone.trim(),
      owner: owner.trim(),
      source,
      priority,
      estimatedValue: value.trim() === "" ? null : Number(value),
      score: Number(score) || 0,
    });
  }

  return (
    <div className="lfnl-modal-backdrop" onClick={onClose}>
      <div className="lfnl-modal" onClick={(e) => e.stopPropagation()}>
        <h2 className="lfnl-modal-title">New lead</h2>

        <label className="lfnl-field">
          <span>Name *</span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoFocus
          />
        </label>
        <div className="lfnl-field-row">
          <label className="lfnl-field">
            <span>Company</span>
            <input
              value={company}
              onChange={(e) => setCompany(e.target.value)}
            />
          </label>
          <label className="lfnl-field">
            <span>Owner</span>
            <input value={owner} onChange={(e) => setOwner(e.target.value)} />
          </label>
        </div>
        <div className="lfnl-field-row">
          <label className="lfnl-field">
            <span>Email</span>
            <input value={email} onChange={(e) => setEmail(e.target.value)} />
          </label>
          <label className="lfnl-field">
            <span>Phone</span>
            <input value={phone} onChange={(e) => setPhone(e.target.value)} />
          </label>
        </div>
        <div className="lfnl-field-row">
          <label className="lfnl-field">
            <span>Source</span>
            <select
              value={source}
              onChange={(e) => setSource(e.target.value as LeadSource)}
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
              value={priority}
              onChange={(e) => setPriority(e.target.value as LeadPriority)}
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
            <span>Est. value (USD)</span>
            <input
              type="number"
              value={value}
              onChange={(e) => setValue(e.target.value)}
            />
          </label>
          <label className="lfnl-field">
            <span>Score</span>
            <input
              type="number"
              value={score}
              onChange={(e) => setScore(e.target.value)}
            />
          </label>
        </div>

        <div className="lfnl-modal-actions">
          <button className="lfnl-btn-ghost" onClick={onClose}>
            Cancel
          </button>
          <button className="lfnl-btn" disabled={!canSubmit} onClick={submit}>
            Add lead
          </button>
        </div>
      </div>
    </div>
  );
}
