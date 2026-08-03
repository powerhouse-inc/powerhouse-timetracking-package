# Content asset uploads via the reactor attachment system (v1)

**Date:** 2026-08-03 · **Status:** Approved (Option 1: switchboard PVC + build live)
**Builds on:** [content-pipeline-feature] — `powerhouse-ops/content`

## Goal

Let content items carry **uploaded** files (images, PDFs, etc.), not just external
links, using the reactor's built-in attachment system.

## How the reactor attachment system works (researched)

- Separate REST surface on the switchboard (NOT GraphQL), top-level `/attachments/*`:
  - `POST /attachments/reservations` `{mimeType,fileName,extension,clientHash(sha256 hex),sizeBytes}` → `201 {reservationId, ref, expiresAtUtc}` or `409 {already_exists, ref}` (dedup).
  - `PUT /attachments/reservations/:id` (body `application/octet-stream`) → `200 {hash, ref, header}`.
  - `GET /attachments/:hash` → streams bytes (`Content-Type`, `Content-Disposition`, `Attachment-Metadata`); `202` pending; `404` missing. `HEAD` = metadata.
- Ref format: `attachment://v1:<sha256-hex>` (content-addressed).
- Auth: `Authorization: Bearer <jwt>` only when the switchboard has auth enabled; phop's switchboard has auth disabled (GraphQL proxy already forwards unauthenticated), so in-cluster calls are open.
- **Storage:** metadata → postgres (persists); **blob bytes → `os.tmpdir()/reactor-attachments`** on the pod. `attachmentStoragePath` is NOT wired through the switchboard build (hardcoded off), so the only way to persist is a **persistent volume mounted at `/tmp/reactor-attachments`**.

## Design

### 1. Persistence (platform) — `powerhouse-chart`

The shared switchboard deployment gains **optional** volume support (guarded by
`switchboard.persistence.enabled`, default **false** → other tenants unchanged):
- new `templates/switchboard-pvc.yaml` (mirrors `registry-pvc.yaml`),
- `volumeMounts`/`volumes` blocks in `switchboard-deployment.yaml`,
- `switchboard.persistence` defaults in `values.yaml` (`enabled:false, storageClass:hcloud-volumes, size:5Gi, mountPath:/tmp/reactor-attachments`).

phop tenant enables it: `switchboard.persistence.enabled: true` (RWO PVC, single
switchboard replica). The switchboard runs as root in phop, so writes to the
mounted path succeed. Blobs then survive pod restarts/deploys.

### 2. Model — `powerhouse-ops/content`

`AssetLink` becomes either an external link OR an uploaded attachment:

```graphql
type AssetLink {
  id: OID!
  label: String
  url: URL              # external link (now optional)
  attachmentRef: String # "attachment://v1:<hash>" for uploaded files
  fileName: String
  mimeType: String
  sizeBytes: Int
}
```

- `ADD_ASSET_LINK` input gains `attachmentRef, fileName, mimeType, sizeBytes` (all
  optional) and `url` becomes optional. Reducer requires **at least one of**
  `url` / `attachmentRef` → new error `AssetSourceRequiredError`.
- `UPDATE_ASSET_LINK` / `REMOVE_ASSET_LINK` unchanged.
- Reducer tests updated; coverage stays 100%.

### 3. App

- **Proxy** `app/app/api/attachments/[...path]/route.ts` — session-gated (mirrors
  `/api/graphql`: verify session cookie, re-check membership), forwards
  method/body/headers to `${SWITCHBOARD_BASE}/attachments/<path>` (base =
  `SWITCHBOARD_INTERNAL_URL` minus `/graphql`). Streams the PUT body and relays
  response headers for downloads. GET (download) does not require managerial role.
- **Upload client** `app/lib/attachments.ts` — `uploadAttachment(file)`:
  sha256 (Web Crypto) → `POST /api/attachments/attachments/reservations` →
  `PUT /api/attachments/attachments/reservations/:id` → returns
  `{ref, fileName, mimeType, sizeBytes}`. Handles the 409 dedup fast path.
  `attachmentHref(ref)` → `/api/attachments/attachments/<hash>` for `<img>`/download.
- **UI** in the content item drawer (`item-detail.tsx`): a file picker/drop in the
  Asset links section → upload → `contentApi.addAssetLink({attachmentRef,...})`.
  Uploaded assets render as a download link (image thumbnail when mimeType is an
  image); external links keep working.

### 4. Deploy & verify

Standard `deploy-phop.yml` (models_changed → package republish). Enable the PVC in
the phop tenant. Verify end-to-end on the live switchboard: upload a file through
the proxy, confirm `GET` returns the bytes, and confirm the blob path is on the
mounted PVC (survives a pod restart).

## Out of scope (v1)

Image resizing/thumбnail generation server-side; virus scanning; per-file access
control beyond the members-only session gate; deleting the underlying blob when an
AssetLink is removed (blobs are content-addressed + dedup'd; GC is a later concern).
