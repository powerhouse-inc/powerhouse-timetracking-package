import type { Lead } from "document-models/lead-funnel";
import { formatMoney, initials } from "../lib/format.js";
import { PRIORITY_ACCENT } from "../lib/stages.js";

interface LeadCardProps {
  lead: Lead;
  onOpen: (id: string) => void;
  onDragStart: (id: string) => void;
  onDragEnd: () => void;
  dragging: boolean;
}

export function LeadCard({
  lead,
  onOpen,
  onDragStart,
  onDragEnd,
  dragging,
}: LeadCardProps) {
  return (
    <div
      className="lfnl-card"
      style={{
        borderLeftColor: PRIORITY_ACCENT[lead.priority],
        opacity: dragging ? 0.4 : 1,
      }}
      draggable
      onDragStart={() => onDragStart(lead.id)}
      onDragEnd={onDragEnd}
      onClick={() => onOpen(lead.id)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter") onOpen(lead.id);
      }}
    >
      <div className="lfnl-card-top">
        <span className="lfnl-avatar">{initials(lead.name)}</span>
        <div className="lfnl-card-id">
          <span className="lfnl-card-name">{lead.name}</span>
          {lead.company ? (
            <span className="lfnl-card-company">{lead.company}</span>
          ) : null}
        </div>
        <span className="lfnl-score" title="Lead score">
          {lead.score}
        </span>
      </div>

      <div className="lfnl-card-meta">
        <span className="lfnl-value">{formatMoney(lead.estimatedValue)}</span>
        {lead.owner ? <span className="lfnl-owner">@{lead.owner}</span> : null}
      </div>

      {lead.tags.length > 0 ? (
        <div className="lfnl-tags">
          {lead.tags.map((tag) => (
            <span key={tag} className="lfnl-tag">
              {tag}
            </span>
          ))}
        </div>
      ) : null}
    </div>
  );
}
