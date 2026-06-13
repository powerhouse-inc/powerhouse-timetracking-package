"use client";

import { useState } from "react";
import { EmptyState, PageHeader, StatusBadge } from "@/components/ui";
import { workspaceApi } from "@/lib/api";
import { useRefresh, useWorkspace } from "@/lib/hooks";

export default function ClientsPage() {
  const { data: workspace } = useWorkspace();
  const refresh = useRefresh();
  const [name, setName] = useState("");
  const wsId = workspace?.id ?? null;
  const clients = workspace?.clients ?? [];
  const projectCount = (clientId: string) =>
    (workspace?.projects ?? []).filter((p) => p.clientId === clientId).length;

  const add = async () => {
    if (!wsId || !name.trim()) return;
    await workspaceApi.addClient(wsId, name.trim());
    setName("");
    refresh();
  };

  return (
    <>
      <PageHeader title="Clients" subtitle="Who the work is for." />

      <div className="tt-card mb-5 flex items-center gap-2 p-3">
        <input
          className="tt-input flex-1"
          placeholder="New client name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && add()}
        />
        <button className="tt-btn-primary" onClick={add}>
          Add client
        </button>
      </div>

      {clients.length === 0 ? (
        <EmptyState>No clients yet.</EmptyState>
      ) : (
        <div className="tt-card overflow-hidden">
          {clients.map((c) => (
            <div
              key={c.localId}
              className={`flex items-center gap-3 border-b border-ink-600/40 px-5 py-3 last:border-0 ${
                c.status === "ARCHIVED" ? "opacity-50" : ""
              }`}
            >
              <input
                className="flex-1 bg-transparent text-sm text-mist-100 outline-none"
                defaultValue={c.name}
                onBlur={(e) => {
                  const v = e.target.value.trim();
                  if (wsId && v && v !== c.name)
                    workspaceApi.updateClient(wsId, c.localId, v).then(refresh);
                }}
              />
              <span className="text-xs text-mist-400">
                {projectCount(c.localId)} projects
              </span>
              <StatusBadge status={c.status} />
              {c.status === "ACTIVE" && (
                <button
                  className="text-xs text-mist-400 hover:text-red-400"
                  onClick={() =>
                    wsId &&
                    workspaceApi.archiveClient(wsId, c.localId).then(refresh)
                  }
                >
                  Archive
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </>
  );
}
