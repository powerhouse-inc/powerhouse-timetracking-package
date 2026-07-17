# Surveys — design spec

**Date:** 2026-07-17
**Author:** Frank Pfeift (with Claude)
**Status:** Implemented (model + app + public path); rollout to prod pending a go/no-go.

## Goal

A generic **survey / questionnaire** feature for the operations app (phop). Members
build surveys (and reusable templates), publish them to get a secret shareable
link, send that link to a client/lead who answers it **without logging in**, and
view individual responses plus an analytics dashboard.

Driven by a real artifact: a client "Discovery Questionnaire" (parts/sections,
free-text, a tools-per-department table, grouped questions with an attached
severity/time rating, help text, examples, required-vs-optional).

## Decisions (locked)

- **Public access:** secret unguessable link, **anonymous** submit (no PII gate, no OTP).
- **Question types (v1):** `SHORT_TEXT, LONG_TEXT, SINGLE_SELECT, MULTI_SELECT, RATING, GRID`
  (grid = author-defined columns, respondent-added rows).
- **Response viewing:** individual list + per-response detail **and** a full analytics dashboard.
- **Templates:** a template is a `Survey` with `kind = TEMPLATE` (same model, not a second one).
- **Storage:** responses embedded in the Survey document (`responses[]`), not separate docs.
- **UI delivery:** ops-app Next.js pages (like sales/clients/members), **not** a Connect editor
  (Connect isn't deployed here; the public form can't be a Connect editor anyway).
- **Rollout:** `surveys` module **disabled by default**; public `/s/...` route is not module-gated.

## Document model — `Survey`

- Type id `powerhouse-ops/survey`, extension `.svy`, name `Survey`.
- Created via reactor-mcp; the reactor validates every operation. Added to
  `ph-timetracking-package` so the switchboard loads it.

### State (`SurveyState`)

```graphql
enum SurveyKind { SURVEY TEMPLATE }        # default SURVEY
enum SurveyStatus { DRAFT OPEN CLOSED }    # default DRAFT
enum QuestionType { SHORT_TEXT LONG_TEXT SINGLE_SELECT MULTI_SELECT RATING GRID }
enum GridColumnType { TEXT SELECT }

type SurveyState {
  title: String!               # default ""
  description: String
  kind: SurveyKind!            # default SURVEY
  status: SurveyStatus!        # default DRAFT
  shareToken: String           # secret guard for the public link; null until published
  clientId: PHID               # optional recipient (client/lead) reference
  clientName: String           # cached recipient name
  sections: [SurveySection!]!  # order = array index
  questions: [SurveyQuestion!]! # flat list; sectionId groups; order = array index
  responses: [SurveyResponse!]!
  createdAt: DateTime
  publishedAt: DateTime
  closedAt: DateTime
}

type SurveySection { id: OID! title: String! description: String }

type SurveyQuestion {
  id: OID! sectionId: OID! type: QuestionType!
  title: String! helpText: String required: Boolean!   # default false
  options: [QuestionOption!]!    # SINGLE/MULTI_SELECT
  ratingScale: RatingScale       # RATING
  columns: [GridColumn!]!        # GRID
}
type QuestionOption { id: OID! label: String! }
type RatingScale { min: Int! max: Int! minLabel: String maxLabel: String }
type GridColumn { id: OID! label: String! type: GridColumnType! options: [QuestionOption!]! }

type SurveyResponse { id: OID! submittedAt: DateTime! answers: [Answer!]! }
type Answer {
  questionId: OID!
  text: String            # short/long text
  optionIds: [OID!]!      # single(len 1)/multi select
  rating: Int             # rating
  rows: [GridRow!]!       # grid
}
type GridRow { cells: [GridCell!]! }
type GridCell { columnId: OID! text: String optionId: OID }
```

State-type name is exactly `SurveyState` (no "Global" suffix). All collections
`[T!]!`. Objects in arrays carry `OID!`.

### Operations (modules)

- **definition:** `SET_TITLE`, `SET_DESCRIPTION`, `SET_SURVEY_KIND`, `SET_RECIPIENT`,
  `ADD_SECTION`, `UPDATE_SECTION`, `DELETE_SECTION`, `REORDER_SECTIONS`,
  `ADD_QUESTION`, `UPDATE_QUESTION`, `DELETE_QUESTION`, `MOVE_QUESTION` (reorder / change section).
- **publishing:** `PUBLISH_SURVEY` (status→OPEN, stores client-generated `shareToken` + `publishedAt`;
  rejects if `kind==TEMPLATE`), `CLOSE_SURVEY`, `REOPEN_SURVEY`, `REGENERATE_SHARE_TOKEN`.
- **responses:** `ADD_RESPONSE` (reducer enforces `status==OPEN` and known `questionId`s),
  `DELETE_RESPONSE` (admin, spam removal).

### Errors

`SectionNotFoundError`, `QuestionNotFoundError`, `SurveyNotOpenError`,
`CannotPublishTemplateError`, `ResponseNotFoundError`, `InvalidResponseError`.

All dynamic values (ids, timestamps, `shareToken`) come from operation **input** —
reducers stay pure/synchronous.

## App surfaces

### Members-only (module `surveys`; edit gated to ADMIN/MANAGER at proxy + UI)

- `/surveys` — list of live surveys (title, recipient, status pill, response count) + **Templates** tab.
  - New: blank, or **"from template"** (copies a template's definition into a fresh `SURVEY`/`DRAFT`).
- `/surveys/[id]` — tabs:
  - **Build** — sections + questions editor with live preview.
  - **Share** — publish toggle, copy-link, regenerate token (revokes old link).
  - **Responses** — individual list + per-response detail.
  - **Analytics** — per-question aggregation (select/rating distributions & averages, grid roll-ups,
    text-answer lists), completion rate, responses-over-time.

Reads/writes go through the existing gated `/api/graphql` proxy via new `lib/api.ts`
functions + hooks, following the sales/clients pattern.

### Public respondent path (outside the `(app)` auth group — the members gate never touches it)

- `app/s/[link]/page.tsx` — renders the form and submits. `link` is one opaque
  string = `docId` + secret `shareToken`.
- `app/api/survey/[link]/route.ts` — a **narrow, purpose-built** endpoint (runtime
  nodejs; talks straight to `SWITCHBOARD_INTERNAL_URL`, **not** the gated proxy):
  - `GET` → sanitized definition (title/description/sections/questions only; never
    `responses`, never other surveys) **and only while `status==OPEN`**.
  - `POST` → validates answers against the definition, then dispatches exactly `ADD_RESPONSE`.
  - Nothing else is reachable through it.

## Security of the public surface

- Unguessable `shareToken`; served only when `status==OPEN`; sanitized GET (zero data leakage).
- Origin check + basic per-IP rate limit + a max-responses cap on POST.
- Reducer re-enforces `status==OPEN` (defense-in-depth even though the endpoint already checks).
- CSP unchanged (`connect-src 'self'`; the public page is same-origin).
- Recorded as an intentional public surface in the auth security memory.
- Residuals: no draft/resume; no captcha (rate-limit + cap only); embedded-responses
  storage revisited only if a survey needs thousands of responses.

## Build sequence

1. Document model + reducers + tests (≥95% reducer coverage).
2. App read/write plumbing (`lib/api.ts` + hooks + types).
3. Members pages: list/templates → builder → responses → analytics.
4. Public page + narrow endpoint.
5. Module wiring + rollout (ship disabled; publish package, bump switchboard + app when ready).

## Notes / prerequisites

- Model creation + hook codegen needs **Vetra running** (`ph vetra`) for reactor-mcp —
  do not start it automatically; ask the user if it's down.
- Deployed reactor loads `ph-timetracking-package` from the registry, so shipping to
  prod requires publishing a new package version and bumping the switchboard's
  `PH_REGISTRY_PACKAGES` — part of step 5, done after local verification.
