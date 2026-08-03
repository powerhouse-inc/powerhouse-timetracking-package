"use client";

import { useMemo, useState } from "react";
import { createContentItem, contentApi } from "@/lib/api";
import { useContentItems, useRefresh, useWorkspace } from "@/lib/hooks";
import { toast } from "@/lib/toast";
import { plural } from "@/lib/format";
import {
  CONTENT_CHANNELS,
  CONTENT_STAGES,
  channelLabel,
  formatLabel,
  shortDate,
} from "@/lib/content";
import type { ContentChannel, ContentDoc } from "@/lib/types";
import { EmptyState, PageHeader } from "@/components/ui";
import { ContentItemDetail } from "./item-detail";

export function ContentBoard() {
  const { data: items, isLoading } = useContentItems();
  const { data: workspace } = useWorkspace();
  const refresh = useRefresh();

  const [openId, setOpenId] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [creating, setCreating] = useState(false);
  const [ownerFilter, setOwnerFilter] = useState("");
  const [channelFilter, setChannelFilter] = useState<ContentChannel | "">("");

  const all = useMemo(() => items ?? [], [items]);

  const memberNames = useMemo(
    () => (workspace?.members ?? []).map((m) => m.name),
    [workspace],
  );
  const owners = useMemo(() => {
    const set = new Set<string>();
    for (const i of all) if (i.owner) set.add(i.owner);
    for (const m of memberNames) set.add(m);
    return [...set].sort((a, b) => a.localeCompare(b));
  }, [all, memberNames]);

  const filtered = useMemo(
    () =>
      all.filter((i) => {
        if (ownerFilter && i.owner !== ownerFilter) return false;
        if (channelFilter && !i.channels.includes(channelFilter)) return false;
        return true;
      }),
    [all, ownerFilter, channelFilter],
  );

  const active = useMemo(
    () => filtered.filter((i) => i.status === "ACTIVE"),
    [filtered],
  );
  const disposed = useMemo(
    () => filtered.filter((i) => i.status !== "ACTIVE"),
    [filtered],
  );

  const byStage = useMemo(() => {
    const map = new Map<string, ContentDoc[]>();
    for (const s of CONTENT_STAGES) map.set(s.key, []);
    for (const i of active) map.get(i.currentStage)?.push(i);
    return map;
  }, [active]);

  const openItem = openId ? all.find((i) => i.id === openId) ?? null : null;
  const publishedCount = all.filter((i) => i.currentStage === "PUBLISHED").length;

  const create = async (title: string, owner: string) => {
    setCreating(true);
    try {
      const id = await createContentItem(title);
      if (owner.trim()) await contentApi.assignOwner(id, owner.trim());
      refresh();
      setAdding(false);
      setOpenId(id);
    } catch {
      toast("Could not create content item", "error");
    } finally {
      setCreating(false);
    }
  };

  return (
    <>
      <PageHeader
        title="Content"
        subtitle={`${plural(all.length, "item")} · ${active.length} in flight · ${publishedCount} published`}
        action={
          <button
            className="tt-btn-primary"
            onClick={() => setAdding((v) => !v)}
            disabled={creating}
          >
            + New item
          </button>
        }
      />

      {adding && (
        <AddItemForm
          memberNames={owners}
          onCancel={() => setAdding(false)}
          onCreate={create}
          busy={creating}
        />
      )}

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <select
          className="tt-input"
          value={ownerFilter}
          onChange={(e) => setOwnerFilter(e.target.value)}
        >
          <option value="">All owners</option>
          {owners.map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>
        <select
          className="tt-input"
          value={channelFilter}
          onChange={(e) => setChannelFilter(e.target.value as ContentChannel | "")}
        >
          <option value="">All channels</option>
          {CONTENT_CHANNELS.map((c) => (
            <option key={c.key} value={c.key}>
              {c.label}
            </option>
          ))}
        </select>
        {(ownerFilter || channelFilter) && (
          <button
            className="tt-btn-ghost"
            onClick={() => {
              setOwnerFilter("");
              setChannelFilter("");
            }}
          >
            Clear
          </button>
        )}
      </div>

      {isLoading ? (
        <EmptyState>Loading pipeline…</EmptyState>
      ) : all.length === 0 && !adding ? (
        <EmptyState>
          No content yet. Click{" "}
          <span className="text-magenta">+ New item</span> to start the pipeline.
        </EmptyState>
      ) : (
        <div className="flex min-h-[calc(100vh-15rem)] gap-3 overflow-x-auto pb-4">
          {CONTENT_STAGES.map((s) => {
            const stageItems = byStage.get(s.key) ?? [];
            return (
              <div
                key={s.key}
                className="flex min-w-[13rem] flex-1 flex-col rounded-xl border border-ink-600/50 bg-ink-800/40"
              >
                <div className="flex items-center justify-between gap-2 px-3 py-2.5">
                  <span className="flex items-center gap-2 text-sm font-semibold text-mist-200">
                    <span
                      className="size-2.5 rounded-full"
                      style={{ background: s.color }}
                    />
                    {s.label}
                    <span className="text-mist-400">{stageItems.length}</span>
                  </span>
                </div>
                <div className="flex flex-1 flex-col gap-2 px-2 pb-2">
                  {stageItems.map((i) => (
                    <ContentCard
                      key={i.id}
                      item={i}
                      onOpen={() => setOpenId(i.id)}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {disposed.length > 0 && (
        <div className="mt-4">
          <div className="tt-label mb-2">
            Parked &amp; killed ({disposed.length})
          </div>
          <div className="flex flex-wrap gap-2">
            {disposed.map((i) => (
              <button
                key={i.id}
                onClick={() => setOpenId(i.id)}
                className="tt-card flex items-center gap-2 rounded-lg px-3 py-2 text-left opacity-60 transition hover:opacity-100"
              >
                <span
                  className={`size-2 rounded-full ${
                    i.status === "KILLED" ? "bg-red-500" : "bg-yellow-500"
                  }`}
                />
                <span className="text-sm text-mist-200">
                  {i.title || "Untitled"}
                </span>
                <span className="text-xs text-mist-400">
                  {i.status === "KILLED" ? "Killed" : "Parked"}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {openItem && (
        <ContentItemDetail
          item={openItem}
          memberNames={owners}
          onClose={() => setOpenId(null)}
          onChange={refresh}
        />
      )}
    </>
  );
}

function ContentCard({
  item,
  onOpen,
}: {
  item: ContentDoc;
  onOpen: () => void;
}) {
  return (
    <div
      onClick={onOpen}
      className="tt-card cursor-pointer rounded-lg p-3 transition hover:border-magenta/50"
    >
      <div className="flex items-start justify-between gap-2">
        <span className="text-sm font-semibold text-mist-100">
          {item.title || "Untitled"}
        </span>
      </div>
      <div className="mt-1 text-xs text-mist-400">{formatLabel(item.format)}</div>
      {item.channels.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {item.channels.slice(0, 3).map((c) => (
            <span key={c} className="tt-chip border border-ink-600 text-mist-300">
              {channelLabel(c)}
            </span>
          ))}
          {item.channels.length > 3 && (
            <span className="text-xs text-mist-400">
              +{item.channels.length - 3}
            </span>
          )}
        </div>
      )}
      <div className="mt-2 flex items-center justify-between text-xs">
        <span className="text-mist-400">
          {item.targetDate ? shortDate(item.targetDate) : ""}
        </span>
        {item.owner && <span className="text-mist-200">{item.owner}</span>}
      </div>
    </div>
  );
}

function AddItemForm({
  memberNames,
  onCreate,
  onCancel,
  busy,
}: {
  memberNames: string[];
  onCreate: (title: string, owner: string) => Promise<void>;
  onCancel: () => void;
  busy: boolean;
}) {
  const [title, setTitle] = useState("");
  const [owner, setOwner] = useState("");

  const submit = async () => {
    if (!title.trim() || busy) return;
    await onCreate(title.trim(), owner);
  };

  return (
    <div className="tt-card mb-4 flex flex-wrap items-center gap-2 p-3">
      <input
        className="tt-input flex-1"
        placeholder="Content title"
        autoFocus
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && submit()}
      />
      <input
        className="tt-input w-40"
        placeholder="Owner (optional)"
        list="content-owners"
        value={owner}
        onChange={(e) => setOwner(e.target.value)}
      />
      <datalist id="content-owners">
        {memberNames.map((m) => (
          <option key={m} value={m} />
        ))}
      </datalist>
      <button className="tt-btn-primary" onClick={submit} disabled={busy}>
        Add
      </button>
      <button className="tt-btn-ghost" onClick={onCancel}>
        Cancel
      </button>
    </div>
  );
}
