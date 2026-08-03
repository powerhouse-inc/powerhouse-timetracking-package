"use client";

import { useState } from "react";
import { contentApi } from "@/lib/api";
import {
  CONTENT_CHANNELS,
  CONTENT_FORMATS,
  canPublish,
  channelLabel,
  fromDateInput,
  nextStages,
  stageMeta,
  toDateInput,
} from "@/lib/content";
import type { ContentChannel, ContentDoc, ContentFormat } from "@/lib/types";

export function ContentItemDetail({
  item,
  memberNames,
  onClose,
  onChange,
}: {
  item: ContentDoc;
  memberNames: string[];
  onClose: () => void;
  onChange: () => void;
}) {
  const [reason, setReason] = useState("");
  const [pubUrl, setPubUrl] = useState(item.draftUrl ?? "");
  const [pubDate, setPubDate] = useState(toDateInput(item.targetDate));

  const run = async (fn: () => Promise<void>) => {
    await fn();
    onChange();
  };

  const toggleChannel = (channel: ContentChannel) => {
    const next = item.channels.includes(channel)
      ? item.channels.filter((c) => c !== channel)
      : [...item.channels, channel];
    void run(() => contentApi.setChannels(item.id, next));
  };

  const stage = stageMeta(item.currentStage);
  const nexts = nextStages(item.currentStage);
  const terminal = item.status === "KILLED";

  const publish = async () => {
    const iso = fromDateInput(pubDate);
    if (!pubUrl.trim() || !iso) return;
    await run(() => contentApi.publish(item.id, pubUrl.trim(), iso));
  };

  return (
    <div className="fixed inset-0 z-40 flex justify-end">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="tt-card relative z-10 flex h-full w-full max-w-md flex-col overflow-y-auto rounded-none border-l border-ink-600/70">
        <div className="flex items-start justify-between gap-3 border-b border-ink-600/60 p-5">
          <div className="min-w-0 flex-1">
            <input
              className="w-full bg-transparent text-lg font-bold text-mist-100 outline-none"
              defaultValue={item.title}
              placeholder="Untitled content"
              onBlur={(e) => {
                const v = e.target.value.trim();
                if (v !== item.title) void run(() => contentApi.setTitle(item.id, v));
              }}
            />
            <div className="mt-1 flex items-center gap-2 text-xs text-mist-400">
              <span
                className="rounded-full px-2 py-0.5 font-medium text-ink-950"
                style={{ background: stage.color }}
              >
                {stage.label}
              </span>
              {item.status !== "ACTIVE" && (
                <span
                  className={
                    item.status === "KILLED" ? "text-red-400" : "text-yellow-400"
                  }
                >
                  {item.status === "KILLED" ? "Killed" : "Parked"}
                </span>
              )}
              {item.updatedAt && (
                <span>Updated {new Date(item.updatedAt).toLocaleDateString()}</span>
              )}
            </div>
          </div>
          <button className="text-mist-400 hover:text-mist-100" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="flex flex-col gap-4 p-5">
          {/* Stage machine */}
          {!terminal && (
            <div>
              <label className="tt-label">Move to</label>
              <div className="flex flex-wrap gap-1.5">
                {nexts.map((s) => {
                  const meta = stageMeta(s);
                  return (
                    <button
                      key={s}
                      className="tt-chip border border-ink-600 text-mist-300 hover:text-mist-100"
                      disabled={item.status !== "ACTIVE"}
                      onClick={() =>
                        void run(() => contentApi.advanceStage(item.id, s))
                      }
                    >
                      → {meta.label}
                    </button>
                  );
                })}
                {nexts.length === 0 && !canPublish(item) && (
                  <span className="text-xs text-mist-400">
                    {item.status === "ACTIVE"
                      ? "No further stage from here."
                      : "Resume to change stage."}
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Publish */}
          {canPublish(item) && (
            <div className="rounded-lg border border-ink-600/60 bg-ink-800/50 p-3">
              <label className="tt-label">Publish</label>
              <div className="flex flex-col gap-2">
                <input
                  className="tt-input w-full"
                  placeholder="Published URL"
                  value={pubUrl}
                  onChange={(e) => setPubUrl(e.target.value)}
                />
                <div className="flex gap-2">
                  <input
                    className="tt-input flex-1"
                    type="date"
                    value={pubDate}
                    onChange={(e) => setPubDate(e.target.value)}
                  />
                  <button
                    className="tt-btn-primary"
                    disabled={!pubUrl.trim() || !pubDate}
                    onClick={publish}
                  >
                    Publish
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <Field label="Format">
              <select
                className="tt-input w-full"
                defaultValue={item.format}
                onChange={(e) =>
                  void run(() =>
                    contentApi.setFormat(item.id, e.target.value as ContentFormat),
                  )
                }
              >
                {CONTENT_FORMATS.map((f) => (
                  <option key={f.key} value={f.key}>
                    {f.label}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Owner">
              <input
                className="tt-input w-full"
                list="content-detail-owners"
                defaultValue={item.owner ?? ""}
                onBlur={(e) => {
                  const v = e.target.value.trim();
                  if (v && v !== item.owner)
                    void run(() => contentApi.assignOwner(item.id, v));
                }}
              />
              <datalist id="content-detail-owners">
                {memberNames.map((m) => (
                  <option key={m} value={m} />
                ))}
              </datalist>
            </Field>
            <Field label="Target date">
              <input
                className="tt-input w-full"
                type="date"
                defaultValue={toDateInput(item.targetDate)}
                onBlur={(e) =>
                  void run(() =>
                    contentApi.setTargetDate(item.id, fromDateInput(e.target.value)),
                  )
                }
              />
            </Field>
            <Field label="Draft link">
              <input
                className="tt-input w-full"
                defaultValue={item.draftUrl ?? ""}
                onBlur={(e) =>
                  void run(() =>
                    contentApi.setDraftUrl(item.id, e.target.value.trim() || null),
                  )
                }
              />
            </Field>
          </div>

          <Field label="Brief">
            <textarea
              className="tt-input min-h-20 w-full resize-y"
              defaultValue={item.brief ?? ""}
              onBlur={(e) =>
                void run(() =>
                  contentApi.setBrief(item.id, e.target.value.trim() || null),
                )
              }
            />
          </Field>

          <Field label="Channels">
            <div className="flex flex-wrap gap-1.5">
              {CONTENT_CHANNELS.map((c) => {
                const on = item.channels.includes(c.key);
                return (
                  <button
                    key={c.key}
                    className={`tt-chip border ${
                      on
                        ? "border-magenta bg-magenta/20 text-mist-100"
                        : "border-ink-600 text-mist-300 hover:text-mist-100"
                    }`}
                    onClick={() => toggleChannel(c.key)}
                  >
                    {c.label}
                  </button>
                );
              })}
            </div>
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Campaign">
              <input
                className="tt-input w-full"
                placeholder="Campaign name"
                defaultValue={item.campaignName ?? ""}
                onBlur={(e) =>
                  void run(() =>
                    contentApi.setCampaign(
                      item.id,
                      item.campaignId,
                      e.target.value.trim() || null,
                    ),
                  )
                }
              />
            </Field>
            {item.publishedUrl && (
              <Field label="Published">
                <a
                  className="tt-input block w-full truncate text-magenta hover:underline"
                  href={item.publishedUrl}
                  target="_blank"
                  rel="noreferrer"
                >
                  {item.publishedUrl}
                </a>
              </Field>
            )}
          </div>

          <AssetLinks item={item} onChange={onChange} />

          {/* Disposition */}
          <div className="rounded-lg border border-ink-600/60 p-3">
            <label className="tt-label">Disposition</label>
            {item.status === "KILLED" ? (
              <div className="text-sm text-mist-300">
                Killed{item.dispositionReason ? `: ${item.dispositionReason}` : ""}
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {item.status === "PARKED" && (
                  <div className="text-sm text-yellow-400">
                    Parked{item.dispositionReason ? `: ${item.dispositionReason}` : ""}
                  </div>
                )}
                <input
                  className="tt-input w-full"
                  placeholder="Reason"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                />
                <div className="flex gap-2">
                  {item.status === "PARKED" ? (
                    <button
                      className="tt-btn"
                      onClick={() => void run(() => contentApi.resume(item.id))}
                    >
                      Resume
                    </button>
                  ) : (
                    <button
                      className="tt-btn"
                      disabled={!reason.trim()}
                      onClick={() =>
                        void run(async () => {
                          await contentApi.park(item.id, reason.trim());
                          setReason("");
                        })
                      }
                    >
                      Park
                    </button>
                  )}
                  <button
                    className="text-xs text-mist-400 hover:text-red-400"
                    disabled={!reason.trim()}
                    onClick={() =>
                      void run(async () => {
                        await contentApi.kill(item.id, reason.trim());
                        setReason("");
                      })
                    }
                  >
                    Kill
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* History */}
          <div>
            <label className="tt-label">History</label>
            <ul className="flex flex-col gap-1.5">
              {[...item.history]
                .sort((a, b) => b.timestamp.localeCompare(a.timestamp))
                .map((h) => (
                  <li
                    key={h.id}
                    className="flex items-start gap-2 rounded-lg bg-ink-700/50 px-3 py-2 text-sm"
                  >
                    <span className="text-magenta">◇</span>
                    <div className="min-w-0 flex-1">
                      <div className="text-mist-200">
                        {h.note ??
                          `${h.fromStage ?? "—"} → ${h.toStage}`}
                      </div>
                      <div className="text-xs text-mist-400">
                        {new Date(h.timestamp).toLocaleString()}
                        {h.actor ? ` · ${h.actor}` : ""}
                      </div>
                    </div>
                  </li>
                ))}
              {item.history.length === 0 && (
                <li className="text-sm text-mist-400">No history yet.</li>
              )}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

function AssetLinks({
  item,
  onChange,
}: {
  item: ContentDoc;
  onChange: () => void;
}) {
  const [label, setLabel] = useState("");
  const [url, setUrl] = useState("");

  const add = async () => {
    if (!url.trim()) return;
    await contentApi.addAssetLink(item.id, {
      label: label.trim() || null,
      url: url.trim(),
    });
    setLabel("");
    setUrl("");
    onChange();
  };

  return (
    <div>
      <label className="tt-label">Asset links</label>
      <ul className="mb-2 flex flex-col gap-1.5">
        {item.assetLinks.map((a) => (
          <li
            key={a.id}
            className="flex items-center gap-2 rounded-lg bg-ink-700/50 px-3 py-2 text-sm"
          >
            <a
              className="min-w-0 flex-1 truncate text-magenta hover:underline"
              href={a.url}
              target="_blank"
              rel="noreferrer"
            >
              {a.label || a.url}
            </a>
            <button
              className="text-xs text-mist-400 hover:text-red-400"
              onClick={async () => {
                await contentApi.removeAssetLink(item.id, a.id);
                onChange();
              }}
            >
              ✕
            </button>
          </li>
        ))}
        {item.assetLinks.length === 0 && (
          <li className="text-sm text-mist-400">No links yet.</li>
        )}
      </ul>
      <div className="flex gap-2">
        <input
          className="tt-input w-28"
          placeholder="Label"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
        />
        <input
          className="tt-input flex-1"
          placeholder="https://…"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && add()}
        />
        <button className="tt-btn-ghost" onClick={add} disabled={!url.trim()}>
          Add
        </button>
      </div>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="tt-label">{label}</label>
      {children}
    </div>
  );
}
