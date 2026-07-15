"use client";

import { useState } from "react";
import { Avatar, EmptyState, PageHeader, StatusBadge } from "@/components/ui";
import { workspaceApi } from "@/lib/api";
import { useRefresh, useWorkspace } from "@/lib/hooks";
import type { Role } from "@/lib/types";

const ROLES: Role[] = ["ADMIN", "MANAGER", "MEMBER", "BILLING"];

export default function MembersPage() {
  const { data: workspace } = useWorkspace();
  const refresh = useRefresh();
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [role, setRole] = useState<Role>("MEMBER");

  const wsId = workspace?.id ?? null;
  const members = workspace?.members ?? [];

  const invite = async () => {
    if (!wsId || !name.trim()) return;
    await workspaceApi.addMember(wsId, {
      name: name.trim(),
      address: address.trim() || null,
      role,
    });
    setName("");
    setAddress("");
    setRole("MEMBER");
    refresh();
  };

  return (
    <>
      <PageHeader
        title="Members"
        subtitle="Who can access this workspace, and what they can do."
      />

      <div className="tt-card mb-5 flex flex-wrap items-center gap-2 p-3">
        <input
          className="tt-input flex-1"
          placeholder="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <input
          className="tt-input flex-1 font-mono text-xs"
          placeholder="0x address or DID (optional)"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
        />
        <select
          className="tt-input"
          value={role}
          onChange={(e) => setRole(e.target.value as Role)}
        >
          {ROLES.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
        <button className="tt-btn-primary" onClick={invite}>
          Invite member
        </button>
      </div>

      {members.length === 0 ? (
        <EmptyState>No members yet.</EmptyState>
      ) : (
        <div className="tt-card overflow-x-auto">
          <div className="grid min-w-[620px] grid-cols-[1fr_160px_130px_110px_60px] gap-3 border-b border-ink-600/60 px-5 py-2.5 text-[11px] uppercase tracking-wider text-mist-400">
            <span>Name</span>
            <span>Access rights</span>
            <span>Status</span>
            <span>Address</span>
            <span />
          </div>
          {members.map((m) => (
            <div
              key={m.localId}
              className={`grid min-w-[620px] grid-cols-[1fr_160px_130px_110px_60px] items-center gap-3 border-b border-ink-600/40 px-5 py-2.5 last:border-0 ${
                m.status === "ARCHIVED" ? "opacity-50" : ""
              }`}
            >
              <span className="flex items-center gap-2.5">
                <Avatar seed={m.name} />
                <span className="text-sm text-mist-100">{m.name}</span>
              </span>
              <select
                className="rounded-md border border-ink-600 bg-ink-700/70 px-2 py-1 text-sm text-mist-200 outline-none"
                value={m.role}
                onChange={(e) =>
                  wsId &&
                  workspaceApi
                    .setMemberRole(wsId, m.localId, e.target.value as Role)
                    .then(refresh)
                }
              >
                {ROLES.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
              <StatusBadge status={m.status} />
              <span className="truncate font-mono text-xs text-mist-400">
                {m.address ?? "—"}
              </span>
              {m.status !== "ARCHIVED" && (
                <button
                  className="text-xs text-mist-400 hover:text-red-400"
                  onClick={() =>
                    wsId &&
                    workspaceApi.archiveMember(wsId, m.localId).then(refresh)
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
