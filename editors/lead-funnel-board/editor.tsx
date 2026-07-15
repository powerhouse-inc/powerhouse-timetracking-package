import { DocumentToolbar } from "@powerhousedao/design-system/connect";
import type { ActivityType, LeadStage } from "document-models/lead-funnel";
import {
  actions,
  useSelectedLeadFunnelDocument,
} from "document-models/lead-funnel";
import { generateId } from "document-model";
import { useMemo, useState } from "react";
import { AddLeadForm, type NewLead } from "./components/add-lead-form.js";
import { Column } from "./components/column.js";
import { LeadDetail, type LeadPatch } from "./components/lead-detail.js";
import { formatMoney } from "./lib/format.js";
import { STAGES } from "./lib/stages.js";
import { EDITOR_STYLES } from "./styles.js";

const now = () => new Date().toISOString();

export default function Editor() {
  const [document, dispatch] = useSelectedLeadFunnelDocument();
  const { name, leads } = document.state.global;

  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dropTarget, setDropTarget] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);

  const byStage = useMemo(() => {
    const map = new Map<string, typeof leads>();
    for (const stage of STAGES) map.set(stage.id, []);
    for (const lead of leads) map.get(lead.stage)?.push(lead);
    return map;
  }, [leads]);

  const stats = useMemo(() => {
    let open = 0;
    let won = 0;
    let wonCount = 0;
    for (const lead of leads) {
      const value = lead.estimatedValue ?? 0;
      if (lead.stage === "WON") {
        won += value;
        wonCount += 1;
      } else if (lead.stage !== "LOST") {
        open += value;
      }
    }
    return { open, won, wonCount };
  }, [leads]);

  const selected = selectedId
    ? (leads.find((l) => l.id === selectedId) ?? null)
    : null;

  function handleAdd(lead: NewLead) {
    dispatch(
      actions.addLead({
        id: generateId(),
        name: lead.name,
        company: lead.company || undefined,
        email: lead.email || undefined,
        phone: lead.phone || undefined,
        owner: lead.owner || undefined,
        source: lead.source,
        priority: lead.priority,
        estimatedValue: lead.estimatedValue ?? undefined,
        score: lead.score,
        createdAt: now(),
      }),
    );
    setShowAdd(false);
  }

  function handleDrop(stageId: string) {
    const id = draggingId;
    setDropTarget(null);
    setDraggingId(null);
    if (!id) return;
    const lead = leads.find((l) => l.id === id);
    if (!lead || lead.stage === stageId) return;
    dispatch(
      actions.moveLead({ id, stage: stageId as LeadStage, updatedAt: now() }),
    );
  }

  function handleUpdate(id: string, patch: LeadPatch) {
    dispatch(actions.updateLead({ id, ...patch, updatedAt: now() }));
  }

  return (
    <div className="lfnl-root">
      <style>{EDITOR_STYLES}</style>
      <DocumentToolbar />

      <header className="lfnl-header">
        <div className="lfnl-header-main">
          <input
            className="lfnl-title"
            defaultValue={name}
            onBlur={(e) => {
              const v = e.target.value.trim();
              if (v && v !== name) dispatch(actions.setFunnelName({ name: v }));
            }}
          />
          <button className="lfnl-btn" onClick={() => setShowAdd(true)}>
            + Add lead
          </button>
        </div>
        <div className="lfnl-stats">
          <Stat label="Leads" value={String(leads.length)} />
          <Stat label="Open pipeline" value={formatMoney(stats.open)} />
          <Stat
            label="Won"
            value={`${formatMoney(stats.won)} · ${stats.wonCount}`}
          />
        </div>
      </header>

      <div className="lfnl-board">
        {STAGES.map((stage) => (
          <Column
            key={stage.id}
            stage={stage}
            leads={byStage.get(stage.id) ?? []}
            draggingId={draggingId}
            isDropTarget={dropTarget === stage.id}
            onOpen={setSelectedId}
            onDragStart={setDraggingId}
            onDragEnd={() => {
              setDraggingId(null);
              setDropTarget(null);
            }}
            onDragOver={setDropTarget}
            onDrop={handleDrop}
          />
        ))}
      </div>

      {showAdd ? (
        <AddLeadForm onSubmit={handleAdd} onClose={() => setShowAdd(false)} />
      ) : null}

      {selected ? (
        <LeadDetail
          lead={selected}
          onClose={() => setSelectedId(null)}
          onUpdate={(patch) => handleUpdate(selected.id, patch)}
          onMove={(stage) =>
            dispatch(
              actions.moveLead({ id: selected.id, stage, updatedAt: now() }),
            )
          }
          onAddTag={(tag) =>
            dispatch(actions.addTag({ leadId: selected.id, tag }))
          }
          onRemoveTag={(tag) =>
            dispatch(actions.removeTag({ leadId: selected.id, tag }))
          }
          onAddActivity={(type: ActivityType, note: string) =>
            dispatch(
              actions.addActivity({
                leadId: selected.id,
                id: generateId(),
                type,
                note: note || undefined,
                timestamp: now(),
              }),
            )
          }
          onDeleteActivity={(id) =>
            dispatch(
              actions.deleteActivity({
                leadId: selected.id,
                id,
                timestamp: now(),
              }),
            )
          }
          onDelete={() => {
            dispatch(actions.deleteLead({ id: selected.id }));
            setSelectedId(null);
          }}
        />
      ) : null}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="lfnl-stat">
      <span className="lfnl-stat-value">{value}</span>
      <span className="lfnl-stat-label">{label}</span>
    </div>
  );
}
