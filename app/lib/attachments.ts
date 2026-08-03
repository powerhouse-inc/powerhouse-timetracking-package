/**
 * Browser-side client for the reactor attachment system, talking to the
 * same-origin `/api/attachments` proxy (which forwards to the switchboard's
 * `/attachments/*` REST surface). Flow: hash → reserve → PUT bytes.
 */

const BASE = "/api/attachments";

export interface UploadedAttachment {
  ref: string; // attachment://v1:<hash>
  fileName: string;
  mimeType: string;
  sizeBytes: number;
}

interface ReserveResponse {
  reservationId?: string;
  ref?: string;
  error?: string;
}

async function sha256Hex(buffer: ArrayBuffer): Promise<string> {
  const digest = await globalThis.crypto.subtle.digest("SHA-256", buffer);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function extensionOf(fileName: string): string | null {
  const dot = fileName.lastIndexOf(".");
  if (dot <= 0 || dot === fileName.length - 1) return null;
  return fileName.slice(dot + 1).toLowerCase();
}

/**
 * Upload a file and return its content-addressed ref. Content-addressed +
 * deduplicated: if the switchboard already has these bytes, the reservation
 * step returns the existing ref and no upload happens.
 */
export async function uploadAttachment(file: File): Promise<UploadedAttachment> {
  const bytes = await file.arrayBuffer();
  const clientHash = await sha256Hex(bytes);
  const mimeType = file.type || "application/octet-stream";
  const meta = {
    ref: "",
    fileName: file.name || "file",
    mimeType,
    sizeBytes: file.size,
  };

  const reserveRes = await fetch(`${BASE}/reservations`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      mimeType,
      fileName: meta.fileName,
      extension: extensionOf(meta.fileName),
      clientHash,
      sizeBytes: file.size,
    }),
  });

  // Dedup fast path: the bytes already exist server-side.
  if (reserveRes.status === 409) {
    const body = (await reserveRes.json()) as ReserveResponse;
    if (!body.ref) throw new Error("Attachment already exists but no ref returned");
    return { ...meta, ref: body.ref };
  }
  if (!reserveRes.ok) {
    throw new Error(`Could not reserve upload (${reserveRes.status})`);
  }

  const reservation = (await reserveRes.json()) as ReserveResponse;
  if (!reservation.reservationId) {
    throw new Error("Reservation did not return an id");
  }

  const uploadRes = await fetch(
    `${BASE}/reservations/${encodeURIComponent(reservation.reservationId)}`,
    {
      method: "PUT",
      headers: { "Content-Type": "application/octet-stream" },
      body: bytes,
    },
  );
  if (!uploadRes.ok) {
    throw new Error(`Upload failed (${uploadRes.status})`);
  }
  const done = (await uploadRes.json()) as { ref?: string };
  const ref = done.ref ?? reservation.ref;
  if (!ref) throw new Error("Upload succeeded but no ref returned");
  return { ...meta, ref };
}

/** The <hash> from an attachment://v<n>:<hash> ref. */
export function attachmentHash(ref: string): string | null {
  const m = /^attachment:\/\/v\d+:(.+)$/.exec(ref);
  return m ? m[1] : null;
}

/** Same-origin URL to fetch/download an attachment by ref (via the proxy). */
export function attachmentHref(ref: string | null): string | null {
  if (!ref) return null;
  const hash = attachmentHash(ref);
  return hash ? `${BASE}/${hash}` : null;
}

export function isImageMime(mime: string | null): boolean {
  return !!mime && mime.startsWith("image/");
}

/** Human-readable file size. */
export function formatBytes(bytes: number | null): string {
  if (bytes == null) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
