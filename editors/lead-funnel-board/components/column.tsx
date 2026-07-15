import type { Lead } from "document-models/lead-funnel";
import { formatMoney } from "../lib/format.js";
import type { StageConfig } from "../lib/stages.js";
import { LeadCard } from "./lead-card.js";

interface ColumnProps {
  stage: StageConfig;
  leads: Lead[];
  draggingId: string | null;
  isDropTarget: boolean;
  onOpen: (id: string) => void;
  onDragStart: (id: string) => void;
  onDragEnd: () => void;
  onDragOver: (stageId: string) => void;
  onDrop: (stageId: string) => void;
}

export function Column({
  stage,
  leads,
  draggingId,
  isDropTarget,
  onOpen,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDrop,
}: ColumnProps) {
  const total = leads.reduce((sum, l) => sum + (l.estimatedValue ?? 0), 0);

  return (
    <section
      className={`lfnl-col${isDropTarget ? " lfnl-col-over" : ""}`}
      onDragOver={(e) => {
        e.preventDefault();
        onDragOver(stage.id);
      }}
      onDrop={(e) => {
        e.preventDefault();
        onDrop(stage.id);
      }}
    >
      <header
        className="lfnl-col-head"
        style={{ borderTopColor: stage.accent }}
      >
        <div className="lfnl-col-title">
          <span className="lfnl-dot" style={{ background: stage.accent }} />
          <span>{stage.label}</span>
          <span className="lfnl-count">{leads.length}</span>
        </div>
        <span className="lfnl-col-sum">{formatMoney(total)}</span>
      </header>

      <div className="lfnl-col-body">
        {leads.map((lead) => (
          <LeadCard
            key={lead.id}
            lead={lead}
            onOpen={onOpen}
            onDragStart={onDragStart}
            onDragEnd={onDragEnd}
            dragging={draggingId === lead.id}
          />
        ))}
        {leads.length === 0 ? (
          <p className="lfnl-empty">Drop leads here</p>
        ) : null}
      </div>
    </section>
  );
}
