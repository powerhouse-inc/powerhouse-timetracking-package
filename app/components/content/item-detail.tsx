"use client";

import { useRef, useState } from "react";
import { contentApi } from "@/lib/api";
import {
  attachmentHref,
  formatBytes,
  isImageMime,
  uploadAttachment,
} from "@/lib/attachments";
import {
  CONTENT_CHANNELS,
  CONTENT_FORMATS,
  canPublish,
  channelLabel,
  formatLabel,
  fromDateInput,
  nextStages,
  shortDate,
  stageMeta,
  toDateInput,
} from "@/lib/content";
import { toast } from "@/lib/toast";
import type {
  ContentAssetLink,
  ContentDoc,
  ContentFormat,
} from "@/lib/types";

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
  const [editing, setEditing] = useState(false);
  const [reason, setReason] = useState("");
  const [pubUrl, setPubUrl] = useState(item.draftUrl ?? "");
  const [pubDate, setPubDate] = useState(toDateInput(item.targetDate));

  const run = async (fn: () => Promise<void>) => {
    await fn();
    onChange();
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
      <div className="tt-card relative z-10 flex h-full w-full max-w-lg flex-col overflow-y-auto rounded-none border-l border-ink-600/70">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-start justify-between gap-3 border-b border-ink-600/60 bg-ink-900/95 p-5 backdrop-blur">
          <div className="min-w-0 flex-1">
            <div className="mb-2 flex flex-wrap items-center gap-1.5">
              <span
                className="rounded-full px-2 py-0.5 text-xs font-semibold text-ink-950"
                style={{ background: stage.color }}
              >
                {stage.label}
              </span>
              {item.status !== "ACTIVE" && (
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                    item.status === "KILLED"
                      ? "bg-red-500/20 text-red-300"
                      : "bg-yellow-500/20 text-yellow-300"
                  }`}
                >
                  {item.status === "KILLED" ? "Killed" : "Parked"}
                </span>
              )}
              <span className="tt-chip border border-ink-600 text-mist-300">
                {formatLabel(item.format)}
              </span>
            </div>
            {editing ? (
              <input
                className="w-full bg-transparent text-xl font-bold text-mist-100 outline-none"
                defaultValue={item.title}
                placeholder="Untitled content"
                onBlur={(e) => {
                  const v = e.target.value.trim();
                  if (v !== item.title)
                    void run(() => contentApi.setTitle(item.id, v));
                }}
              />
            ) : (
              <h2 className="text-xl font-bold text-balance text-mist-100">
                {item.title || "Untitled content"}
              </h2>
            )}
            <div className="mt-1 text-xs text-mist-400">
              {item.channels.length > 0
                ? item.channels.map(channelLabel).join(" · ")
                : "No channels"}
              {item.updatedAt &&
                ` · updated ${new Date(item.updatedAt).toLocaleDateString()}`}
            </div>
          </div>
          <div className="flex flex-none items-center gap-2">
            <button
              className={`rounded-md px-2 py-1 text-xs font-medium transition ${
                editing
                  ? "bg-magenta/20 text-magenta"
                  : "text-mist-400 hover:text-mist-100"
              }`}
              onClick={() => setEditing((v) => !v)}
            >
              {editing ? "Done" : "Edit"}
            </button>
            <button
              className="text-mist-400 hover:text-mist-100"
              onClick={onClose}
            >
              ✕
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-5 p-5">
          {editing ? (
            <EditFields item={item} memberNames={memberNames} run={run} />
          ) : (
            <Preview item={item} />
          )}

          {/* Assets */}
          <section>
            <h3 className="tt-label">Assets</h3>
            {item.assetLinks.length > 0 ? (
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {item.assetLinks.map((a) => (
                  <AssetTile
                    key={a.id}
                    asset={a}
                    editing={editing}
                    onRemove={() =>
                      void run(() => contentApi.removeAssetLink(item.id, a.id))
                    }
                  />
                ))}
              </div>
            ) : (
              <p className="text-sm text-mist-400">No assets yet.</p>
            )}
            {editing && <AssetControls item={item} onChange={onChange} />}
          </section>

          {/* Stage actions */}
          {!terminal && (
            <section>
              <h3 className="tt-label">Move to</h3>
              <div className="flex flex-wrap gap-1.5">
                {nexts.map((s) => (
                  <button
                    key={s}
                    className="tt-chip border border-ink-600 text-mist-300 hover:border-magenta/60 hover:text-mist-100"
                    disabled={item.status !== "ACTIVE"}
                    onClick={() =>
                      void run(() => contentApi.advanceStage(item.id, s))
                    }
                  >
                    → {stageMeta(s).label}
                  </button>
                ))}
                {nexts.length === 0 && !canPublish(item) && (
                  <span className="text-xs text-mist-400">
                    {item.status === "ACTIVE"
                      ? "No further stage from here."
                      : "Resume to change stage."}
                  </span>
                )}
              </div>
              {canPublish(item) && (
                <div className="mt-3 rounded-lg border border-ink-600/60 bg-ink-800/50 p-3">
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
            </section>
          )}

          <Disposition
            item={item}
            reason={reason}
            setReason={setReason}
            run={run}
          />

          <History item={item} />
        </div>
      </div>
    </div>
  );
}

/* ------------------------------ preview ------------------------------ */

function Preview({ item }: { item: ContentDoc }) {
  return (
    <>
      {item.brief ? (
        <p className="whitespace-pre-wrap text-sm leading-relaxed text-mist-200">
          {item.brief}
        </p>
      ) : (
        <p className="text-sm text-mist-400">No brief yet.</p>
      )}
      <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
        <MetaRow label="Owner" value={item.owner} />
        <MetaRow label="Target" value={shortDate(item.targetDate)} muted={!item.targetDate} />
        {item.publishedUrl && (
          <MetaRow
            label="Published"
            value={
              <a
                className="truncate text-magenta hover:underline"
                href={item.publishedUrl}
                target="_blank"
                rel="noreferrer"
              >
                {item.publishedDate ? shortDate(item.publishedDate) : item.publishedUrl}
              </a>
            }
          />
        )}
        {item.campaignName && <MetaRow label="Campaign" value={item.campaignName} />}
        {item.draftUrl && (
          <MetaRow
            label="Draft"
            value={
              <a
                className="truncate text-magenta hover:underline"
                href={item.draftUrl}
                target="_blank"
                rel="noreferrer"
              >
                Open draft
              </a>
            }
          />
        )}
      </dl>
    </>
  );
}

function MetaRow({
  label,
  value,
  muted = false,
}: {
  label: string;
  value: React.ReactNode;
  muted?: boolean;
}) {
  return (
    <>
      <dt className="text-mist-400">{label}</dt>
      <dd className={`min-w-0 truncate ${muted ? "text-mist-500" : "text-mist-200"}`}>
        {value ?? "—"}
      </dd>
    </>
  );
}

/* ------------------------------ assets ------------------------------ */

function AssetTile({
  asset,
  editing,
  onRemove,
}: {
  asset: ContentAssetLink;
  editing: boolean;
  onRemove: () => void;
}) {
  const isUpload = !!asset.attachmentRef;
  const href = isUpload ? attachmentHref(asset.attachmentRef) : asset.url;
  const name = asset.label || asset.fileName || asset.url || "asset";
  const image = isUpload && isImageMime(asset.mimeType) ? attachmentHref(asset.attachmentRef) : null;

  return (
    <div className="group relative overflow-hidden rounded-lg border border-ink-600/60 bg-ink-800/50">
      <a
        href={href ?? undefined}
        target="_blank"
        rel="noreferrer"
        download={isUpload ? (asset.fileName ?? undefined) : undefined}
        className="block"
        title={name}
      >
        <div className="flex aspect-video items-center justify-center bg-ink-900/60">
          {image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={image}
              alt={name}
              loading="lazy"
              className="size-full object-cover"
            />
          ) : (
            <span className="text-2xl">{isUpload ? "📎" : "🔗"}</span>
          )}
        </div>
        <div className="px-2 py-1.5">
          <div className="truncate text-xs font-medium text-mist-200">{name}</div>
          <div className="truncate text-[11px] text-mist-400">
            {isUpload
              ? [asset.mimeType, formatBytes(asset.sizeBytes)].filter(Boolean).join(" · ")
              : "Link"}
          </div>
        </div>
      </a>
      {editing && (
        <button
          className="absolute right-1 top-1 rounded bg-ink-950/70 px-1.5 py-0.5 text-xs text-mist-300 opacity-0 transition hover:text-red-400 group-hover:opacity-100"
          onClick={onRemove}
          title="Remove"
        >
          ✕
        </button>
      )}
    </div>
  );
}

function AssetControls({
  item,
  onChange,
}: {
  item: ContentDoc;
  onChange: () => void;
}) {
  const [label, setLabel] = useState("");
  const [url, setUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const addLink = async () => {
    if (!url.trim()) return;
    await contentApi.addAssetLink(item.id, {
      label: label.trim() || null,
      url: url.trim(),
    });
    setLabel("");
    setUrl("");
    onChange();
  };

  const onFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        const a = await uploadAttachment(file);
        await contentApi.addAssetLink(item.id, {
          label: a.fileName,
          attachmentRef: a.ref,
          fileName: a.fileName,
          mimeType: a.mimeType,
          sizeBytes: a.sizeBytes,
        });
      }
      onChange();
    } catch (e) {
      toast(e instanceof Error ? e.message : "Upload failed", "error");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  return (
    <div className="mt-2 flex flex-wrap gap-2">
      <input
        className="tt-input w-24"
        placeholder="Label"
        value={label}
        onChange={(e) => setLabel(e.target.value)}
      />
      <input
        className="tt-input flex-1"
        placeholder="https://…"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && addLink()}
      />
      <button className="tt-btn-ghost" onClick={addLink} disabled={!url.trim()}>
        Add link
      </button>
      <button
        className="tt-btn-ghost"
        onClick={() => fileRef.current?.click()}
        disabled={uploading}
      >
        {uploading ? "Uploading…" : "Upload"}
      </button>
      <input
        ref={fileRef}
        type="file"
        multiple
        className="hidden"
        onChange={(e) => onFiles(e.target.files)}
      />
    </div>
  );
}

/* ------------------------------ edit form ------------------------------ */

function EditFields({
  item,
  memberNames,
  run,
}: {
  item: ContentDoc;
  memberNames: string[];
  run: (fn: () => Promise<void>) => Promise<void>;
}) {
  return (
    <>
      <Field label="Brief">
        <textarea
          className="tt-input min-h-24 w-full resize-y"
          defaultValue={item.brief ?? ""}
          onBlur={(e) =>
            void run(() =>
              contentApi.setBrief(item.id, e.target.value.trim() || null),
            )
          }
        />
      </Field>

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
                onClick={() => {
                  const next = on
                    ? item.channels.filter((x) => x !== c.key)
                    : [...item.channels, c.key];
                  void run(() => contentApi.setChannels(item.id, next));
                }}
              >
                {c.label}
              </button>
            );
          })}
        </div>
      </Field>

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
    </>
  );
}

/* --------------------------- disposition + history --------------------------- */

function Disposition({
  item,
  reason,
  setReason,
  run,
}: {
  item: ContentDoc;
  reason: string;
  setReason: (v: string) => void;
  run: (fn: () => Promise<void>) => Promise<void>;
}) {
  return (
    <section className="rounded-lg border border-ink-600/60 p-3">
      <h3 className="tt-label">Disposition</h3>
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
    </section>
  );
}

function History({ item }: { item: ContentDoc }) {
  return (
    <section>
      <h3 className="tt-label">History</h3>
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
                  {h.note ?? `${h.fromStage ?? "—"} → ${h.toStage}`}
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
    </section>
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
