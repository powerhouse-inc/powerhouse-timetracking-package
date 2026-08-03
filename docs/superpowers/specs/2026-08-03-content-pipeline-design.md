# Content Pipeline — `powerhouse-ops/content` (v1)

**Date:** 2026-08-03 · **Status:** Approved, building
**Source:** BA requirements "`leadgen/content` Content Management (v1)" (2026-07-21)
**Target:** the phop operations app (`powerhouse-timetracking-package`), enabled at phop.vetra.io

## Context & deviations from the BA doc

The BA doc was written against an `apeiron/leadgen` ecosystem (`leadgen/lead`,
`leadgen/campaign`, an "isolated lead-acquisition reactor") that does **not**
exist in this repo. The in-repo precedents are:

- **`lead-funnel`** (the `sales` module) — one document holding a *collection*
  of leads, with `stage` + an append-only `activities[]` history and a
  `LeadSource` enum. This is the "existing lead model" the BA refers to.
- **`survey`** — one document *per item*, listed via the switchboard's
  auto-generated per-type query (`Survey.documents.items`). No subgraph.

Resolved architect decisions (BA §11 handoff):

1. **Granularity:** one document per content item (BA FR1), matching the survey
   pattern. Pipeline list = fetch all `content` docs, filter client-side.
2. **Subgraph:** not needed — the switchboard already lists documents by type.
3. **Channel enum:** a dedicated `ContentChannel` (the BA's publish-channel
   list), *not* a reuse of `LeadSource` (which describes how a lead arrived, a
   different taxonomy). Reporting can map the two later.
4. **PARKED/KILLED:** a `status` field with a `dispositionReason`, orthogonal to
   `currentStage` (follows the lead precedent where `disqualified` is a reason).
5. **Campaign reference:** optional soft `campaignId: PHID` + cached
   `campaignName` — degrades gracefully before the campaign model exists.
6. **Reactor:** the "isolated reactor" dependency does not apply here; content
   docs live in the same phop switchboard/drive as everything else.

**Deferred (YAGNI for v1):** the optional lead/segment reference; a separate
owner-change log (owner changes just update `owner` + `updatedAt`).

## Document model

- **Type ID:** `powerhouse-ops/content` · **Name:** `Content Item` · **Ext:** `cnt`
- **Author:** Powerhouse (https://powerhouse.inc)

### State (`ContentState`, global)

```graphql
enum ContentStage   { IDEA DRAFTING REVIEW SCHEDULED PUBLISHED REPURPOSE }
enum ContentStatus  { ACTIVE PARKED KILLED }
enum ContentFormat  { POST ARTICLE VIDEO ONE_PAGER DM_SCRIPT LEAD_MAGNET OTHER }
enum ContentChannel { LINKEDIN REDDIT DISCORD TELEGRAM FACEBOOK_GROUP FORUM DIRECTORY EMAIL WEB OTHER }

type StageEvent { id: OID!  fromStage: ContentStage  toStage: ContentStage!  actor: String  timestamp: DateTime!  note: String }
type AssetLink  { id: OID!  label: String  url: URL! }

type ContentState {
  title: String!                 # default ""
  brief: String
  format: ContentFormat!         # default POST
  channels: [ContentChannel!]!   # default []
  currentStage: ContentStage!    # default IDEA
  status: ContentStatus!         # default ACTIVE
  dispositionReason: String
  owner: String
  targetDate: Date
  publishedUrl: URL
  publishedDate: Date
  draftUrl: URL
  assetLinks: [AssetLink!]!      # default []
  campaignId: PHID
  campaignName: String
  history: [StageEvent!]!        # default []; append-only, never edited/deleted
  createdAt: DateTime
  updatedAt: DateTime
}
```

Initial value: `title:""`, `format:"POST"`, `channels:[]`, `currentStage:"IDEA"`,
`status:"ACTIVE"`, `assetLinks:[]`, `history:[]`, everything else `null`.

### Operations

**`definition` module** (content, targeting, links):
`SET_TITLE`, `SET_BRIEF`, `SET_FORMAT`, `SET_CHANNELS`, `SET_TARGET_DATE`,
`SET_DRAFT_URL`, `SET_CAMPAIGN`, `ADD_ASSET_LINK`, `UPDATE_ASSET_LINK`,
`REMOVE_ASSET_LINK`.

**`lifecycle` module** (stage machine, ownership, disposition):
`ASSIGN_OWNER`, `ADVANCE_STAGE`, `PUBLISH`, `PARK`, `KILL`, `RESUME`.

History-appending ops (`ADVANCE_STAGE`, `PUBLISH`, `PARK`, `KILL`) take an
`eventId: OID!` in their input (pure reducers can't generate ids).

### Stage machine (enforced in the reducers)

Allowed via `ADVANCE_STAGE`:
`IDEA→DRAFTING`, `DRAFTING→REVIEW`, `REVIEW→SCHEDULED`, `REVIEW→DRAFTING`
(send-back), `PUBLISHED→REPURPOSE`, `REPURPOSE→IDEA`, `REPURPOSE→DRAFTING`.
`PUBLISH` is the **only** path into `PUBLISHED` (from `SCHEDULED`); it requires
`publishedUrl` + `publishedDate` inputs, so "published needs a URL and date" is
guaranteed by the schema.

### Errors (each covered by a test)

- `lifecycle` module: `InvalidStageTransitionError` (ADVANCE_STAGE, PUBLISH),
  `OwnerRequiredError` (can't leave IDEA with no owner), `EmptyOwnerError`
  (ASSIGN_OWNER rejects blank), `DispositionReasonRequiredError` (PARK, KILL),
  `CannotResumeKilledError` (RESUME), `ItemNotActiveError` (advance/publish
  require ACTIVE; park/kill reject an already-KILLED item).
- `definition` module: `AssetLinkNotFoundError` (UPDATE/REMOVE_ASSET_LINK).

## App integration (Next.js app)

- **Module:** new `content` key + `/content` route (`app/lib/modules.ts`); nav
  item under the **Sales** group next to "Pipeline" (`app/components/sidebar.tsx`).
- **Data layer:** `fetchContentItems`, `createContentItem`, and a `contentApi`
  object (one method per operation) in `app/lib/api.ts`; TS types in
  `app/lib/types.ts`; `useContentItems` hook wired into `useRefresh`
  (`app/lib/hooks.ts`); a `content-helpers.ts` (allowed-transition map, enum
  labels, filtering).
- **Pages/components** (`app/components/content/`):
  - `/content` — a Kanban pipeline board (columns = stages, styled like the lead
    Pipeline) with owner + channel filter chips and a "New item" action;
    parked/killed shown muted.
  - `/content/[id]` — item detail: editable fields, stage controls offering only
    allowed next stages, a history timeline, park/kill/resume with a reason.

## Deployment & testing

- **CI:** unchanged. A `document-models/` change flips `models_changed`, so
  `deploy-phop.yml` publishes a new `powerhouse-operations-package` version
  (switchboard reload) + builds the app image + bumps the phop tenant.
- **Enable in prod:** add `content` to `NEXT_PUBLIC_MODULES` in
  `tenants/phop/powerhouse-values.yaml` →
  `dashboard,sales,clients,members,surveys,content`.
- **Reducer tests:** ≥95% (target 100%) in `document-models/content/v1/tests/` —
  one full-lifecycle scenario test plus one test per error code, using the
  operation-index error pattern (no `.toThrow()`).
