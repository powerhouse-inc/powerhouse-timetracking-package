"use client";

import { useMemo, useState } from "react";
import { convertLeadToProject, ensureLeadFunnel, leadApi } from "@/lib/api";
import { useLeadFunnel, useRefresh, useWorkspace } from "@/lib/hooks";
import { toast } from "@/lib/toast";
import { plural } from "@/lib/format";
import { PRIORITIES, STAGES, formatMoney, priorityColor } from "@/lib/sales";
import type { Lead, LeadStage } from "@/lib/types";
import { EmptyState, PageHeader } from "@/components/ui";
import { LeadDetail } from "./lead-detail";

export function SalesBoard() {
  const { data: funnel, isLoading } = useLeadFunnel();
  const { data: workspace } = useWorkspace();
  const refresh = useRefresh();

  const [openId, setOpenId] = useState<string | null>(null);
  const [dragId, setDragId] = useState<string | null>(null);
  const [dropStage, setDropStage] = useState<LeadStage | null>(null);
  const [adding, setAdding] = useState(false);
  const [creating, setCreating] = useState(false);

  const docId = funnel?.id ?? null;
  const leads = funnel?.leads ?? [];

  const clients = useMemo(() => workspace?.clients ?? [], [workspace]);
  const clientNames = useMemo(() => clients.map((c) => c.name), [clients]);
  const clientIdByName = useMemo(
    () => new Map(clients.map((c) => [c.name.toLowerCase(), c.localId])),
    [clients],
  );
  const memberNames = useMemo(
    () => (workspace?.members ?? []).map((m) => m.name),
    [workspace],
  );

  const byStage = useMemo(() => {
    const map = new Map<LeadStage, Lead[]>();
    for (const s of STAGES) map.set(s.key, []);
    for (const l of leads) map.get(l.stage)?.push(l);
    return map;
  }, [leads]);

  const openLead = openId ? leads.find((l) => l.id === openId) ?? null : null;

  const wonValue = leads
    .filter((l) => l.stage === "WON")
    .reduce((s, l) => s + (l.estimatedValue ?? 0), 0);
  const openValue = leads
    .filter((l) => !["WON", "LOST"].includes(l.stage))
    .reduce((s, l) => s + (l.estimatedValue ?? 0), 0);

  const ensureDoc = async (): Promise<string> => {
    if (docId) return docId;
    setCreating(true);
    const id = await ensureLeadFunnel("Sales Pipeline");
    refresh();
    setCreating(false);
    return id;
  };

  const convert = async (lead: Lead) => {
    const wsId = workspace?.id;
    if (!wsId) {
      toast("Create a workspace first (add a project or member).", "error");
      return;
    }
    const { clientId } = await convertLeadToProject(wsId, {
      clientId: lead.clientId,
      clientName: lead.company,
      projectName: lead.name,
    });
    if (docId) {
      if (clientId && clientId !== lead.clientId)
        await leadApi.updateLead(docId, lead.id, { clientId });
      if (lead.stage !== "WON") await leadApi.moveLead(docId, lead.id, "WON");
    }
    refresh();
    toast(`Created workspace project “${lead.name}”`, "success");
  };

  const drop = async (stage: LeadStage) => {
    setDropStage(null);
    if (!dragId || !docId) return;
    const lead = leads.find((l) => l.id === dragId);
    setDragId(null);
    if (!lead || lead.stage === stage) return;
    await leadApi.moveLead(docId, lead.id, stage);
    refresh();
  };

  return (
    <>
      <PageHeader
        title="Sales Pipeline"
        subtitle={`${plural(leads.length, "lead")} · ${formatMoney(openValue)} open · ${formatMoney(wonValue)} won`}
        action={
          <button
            className="tt-btn-primary"
            onClick={() => setAdding((v) => !v)}
            disabled={creating}
          >
            + New lead
          </button>
        }
      />

      {adding && (
        <AddLeadForm
          clientNames={clientNames}
          memberNames={memberNames}
          onCancel={() => setAdding(false)}
          onCreate={async (input) => {
            const id = await ensureDoc();
            await leadApi.addLead(id, {
              ...input,
              clientId:
                clientIdByName.get((input.company ?? "").toLowerCase()) ?? null,
            });
            refresh();
            setAdding(false);
          }}
        />
      )}

      {isLoading ? (
        <EmptyState>Loading pipeline…</EmptyState>
      ) : leads.length === 0 && !adding ? (
        <EmptyState>
          No leads yet. Click <span className="text-magenta">+ New lead</span> to
          start your pipeline.
        </EmptyState>
      ) : (
        <div className="flex min-h-[calc(100vh-13rem)] gap-3 overflow-x-auto pb-4">
          {STAGES.map((s) => {
            const items = byStage.get(s.key) ?? [];
            const total = items.reduce(
              (sum, l) => sum + (l.estimatedValue ?? 0),
              0,
            );
            return (
              <div
                key={s.key}
                className={`flex w-64 flex-none flex-col rounded-xl border transition ${
                  dropStage === s.key
                    ? "border-magenta/70 bg-ink-800"
                    : "border-ink-600/50 bg-ink-800/40"
                }`}
                onDragOver={(e) => {
                  e.preventDefault();
                  setDropStage(s.key);
                }}
                onDragLeave={() =>
                  setDropStage((cur) => (cur === s.key ? null : cur))
                }
                onDrop={() => drop(s.key)}
              >
                <div className="flex items-center justify-between gap-2 px-3 py-2.5">
                  <span className="flex items-center gap-2 text-sm font-semibold text-mist-200">
                    <span
                      className="size-2.5 rounded-full"
                      style={{ background: s.color }}
                    />
                    {s.label}
                    <span className="text-mist-400">{items.length}</span>
                  </span>
                  <span className="text-xs text-mist-400">
                    {total > 0 ? formatMoney(total) : ""}
                  </span>
                </div>
                <div className="flex flex-1 flex-col gap-2 px-2 pb-2">
                  {items.map((l) => (
                    <LeadCard
                      key={l.id}
                      lead={l}
                      onOpen={() => setOpenId(l.id)}
                      onDragStart={() => setDragId(l.id)}
                      onDragEnd={() => setDragId(null)}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {openLead && docId && (
        <LeadDetail
          lead={openLead}
          docId={docId}
          clientNames={clientNames}
          clientIdByName={clientIdByName}
          memberNames={memberNames}
          onClose={() => setOpenId(null)}
          onChange={refresh}
          onConvert={() => convert(openLead)}
        />
      )}
    </>
  );
}

function LeadCard({
  lead,
  onOpen,
  onDragStart,
  onDragEnd,
}: {
  lead: Lead;
  onOpen: () => void;
  onDragStart: () => void;
  onDragEnd: () => void;
}) {
  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onClick={onOpen}
      className="tt-card cursor-pointer rounded-lg p-3 transition hover:border-magenta/50"
    >
      <div className="flex items-start justify-between gap-2">
        <span className="text-sm font-semibold text-mist-100">{lead.name}</span>
        <span
          className="mt-1 size-2 flex-none rounded-full"
          style={{ background: priorityColor(lead.priority) }}
          title={`${lead.priority} priority`}
        />
      </div>
      {lead.company && (
        <div className="truncate text-xs text-mist-400">{lead.company}</div>
      )}
      <div className="mt-2 flex items-center justify-between text-xs">
        <span className="font-medium text-mist-200">
          {formatMoney(lead.estimatedValue)}
        </span>
        {lead.owner && <span className="text-mist-400">{lead.owner}</span>}
      </div>
    </div>
  );
}

function AddLeadForm({
  clientNames,
  memberNames,
  onCreate,
  onCancel,
}: {
  clientNames: string[];
  memberNames: string[];
  onCreate: (input: Parameters<typeof leadApi.addLead>[1]) => Promise<void>;
  onCancel: () => void;
}) {
  const [name, setName] = useState("");
  const [company, setCompany] = useState("");
  const [value, setValue] = useState("");
  const [owner, setOwner] = useState("");
  const [priority, setPriority] = useState<Lead["priority"]>("MEDIUM");
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!name.trim() || busy) return;
    setBusy(true);
    await onCreate({
      name: name.trim(),
      company: company.trim() || null,
      clientId: null,
      email: null,
      phone: null,
      source: "OTHER",
      priority,
      estimatedValue: value.trim() === "" ? null : Number(value),
      owner: owner.trim() || null,
      notes: null,
    });
    setBusy(false);
  };

  return (
    <div className="tt-card mb-5 flex flex-wrap items-center gap-2 p-3">
      <input
        className="tt-input flex-1"
        placeholder="Lead name"
        autoFocus
        value={name}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && submit()}
      />
      <input
        className="tt-input"
        placeholder="Company"
        list="add-lead-clients"
        value={company}
        onChange={(e) => setCompany(e.target.value)}
      />
      <datalist id="add-lead-clients">
        {clientNames.map((c) => (
          <option key={c} value={c} />
        ))}
      </datalist>
      <input
        className="tt-input w-28"
        placeholder="Value"
        type="number"
        value={value}
        onChange={(e) => setValue(e.target.value)}
      />
      <input
        className="tt-input w-32"
        placeholder="Owner"
        list="add-lead-members"
        value={owner}
        onChange={(e) => setOwner(e.target.value)}
      />
      <datalist id="add-lead-members">
        {memberNames.map((m) => (
          <option key={m} value={m} />
        ))}
      </datalist>
      <select
        className="tt-input"
        value={priority}
        onChange={(e) => setPriority(e.target.value as Lead["priority"])}
      >
        {PRIORITIES.map((p) => (
          <option key={p.key} value={p.key}>
            {p.label}
          </option>
        ))}
      </select>
      <button className="tt-btn-primary" onClick={submit} disabled={busy}>
        Add
      </button>
      <button className="tt-btn-ghost" onClick={onCancel}>
        Cancel
      </button>
    </div>
  );
}
