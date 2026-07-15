"use client";

import { useEffect, useState } from "react";
import { createScopeOfWork } from "@/lib/api";
import { SOW_STATUS, statusColor } from "@/lib/delivery";
import { useRefresh, useScopesOfWork } from "@/lib/hooks";
import { EmptyState, PageHeader } from "@/components/ui";
import { SowDetail } from "./sow-detail";

export function DeliveryView() {
  const { data: scopes, isLoading } = useScopesOfWork();
  const refresh = useRefresh();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [title, setTitle] = useState("");
  const [busy, setBusy] = useState(false);

  const list = scopes ?? [];
  useEffect(() => {
    if (!selectedId && list.length > 0) setSelectedId(list[0].id);
  }, [list, selectedId]);

  const selected = list.find((s) => s.id === selectedId) ?? null;

  const create = async () => {
    if (!title.trim() || busy) return;
    setBusy(true);
    const id = await createScopeOfWork(title.trim(), "");
    refresh();
    setSelectedId(id);
    setTitle("");
    setAdding(false);
    setBusy(false);
  };

  return (
    <>
      <PageHeader
        title="Delivery"
        subtitle="Scopes of work, deliverables, and budget vs tracked hours."
        action={
          <button className="tt-btn-primary" onClick={() => setAdding((v) => !v)}>
            + New scope
          </button>
        }
      />

      {adding && (
        <div className="tt-card mb-5 flex items-center gap-2 p-3">
          <input
            className="tt-input flex-1"
            placeholder="Scope of work title"
            autoFocus
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && create()}
          />
          <button className="tt-btn-primary" onClick={create} disabled={busy}>
            Create
          </button>
          <button className="tt-btn-ghost" onClick={() => setAdding(false)}>
            Cancel
          </button>
        </div>
      )}

      {isLoading ? (
        <EmptyState>Loading…</EmptyState>
      ) : list.length === 0 && !adding ? (
        <EmptyState>
          No scopes of work yet. Click{" "}
          <span className="text-magenta">+ New scope</span> to start.
        </EmptyState>
      ) : (
        <div className="flex flex-col gap-4 lg:flex-row lg:gap-6">
          <div className="flex flex-none flex-col gap-1.5 lg:w-56">
            {list.map((s) => {
              const active = s.id === selectedId;
              return (
                <button
                  key={s.id}
                  onClick={() => setSelectedId(s.id)}
                  className={`tt-card px-3 py-2.5 text-left transition ${
                    active ? "border-magenta/60" : "hover:border-ink-500"
                  }`}
                >
                  <div className="truncate text-sm font-medium text-mist-100">
                    {s.title || "Untitled"}
                  </div>
                  <div className="mt-1 flex items-center gap-1.5 text-xs text-mist-400">
                    <span
                      className="size-2 rounded-full"
                      style={{ background: statusColor(SOW_STATUS, s.status) }}
                    />
                    {SOW_STATUS.find((x) => x.key === s.status)?.label ??
                      s.status}
                    <span>· {s.deliverables.length} deliverables</span>
                  </div>
                </button>
              );
            })}
          </div>
          <div className="min-w-0 flex-1">
            {selected && <SowDetail sow={selected} />}
          </div>
        </div>
      )}
    </>
  );
}
