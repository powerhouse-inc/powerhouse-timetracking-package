# ph-timetracking-package Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a Powerhouse-native Toggl replacement: two document models, a relational read-model (processor + subgraph), in-package document & drive editors, and a Renown-authenticated Next.js app.

**Architecture:** `TimetrackingWorkspace` (members/clients/projects + roles) and `Timesheet` (per-member entries + live timer) document models feed a `RelationalDbProcessor` that projects denormalized rows into per-drive Kysely tables; a `BaseSubgraph` exposes report/summary queries; editors and a Next.js app consume them. Mutations are signed via `RemoteDocumentController`; reads go through the subgraph.

**Tech Stack:** `@powerhousedao/* 6.2.0-dev.13`, `document-model 6.2.0-dev.13`, React 19, Tailwind v4, Vite 8, Kysely + pglite (processor), Next.js 16 App Router + Renown (app).

**Spec:** `docs/superpowers/specs/2026-06-13-ph-timetracking-package-design.md`

**Reactor/MCP:** Local Vetra drive `vetra-690b7ba0`, reactor-mcp at `http://localhost:4001/mcp`, Switchboard `http://localhost:4001/graphql`, Connect `http://localhost:3001`. `ph vetra` must be running for Phases 1 & 3.

---

## Conventions for every phase

- After code changes: `npm run tsc` and `npm run lint:fix` must be clean.
- After any reducer change: `npm run test:coverage` must be ≥95% lines/branches/functions/statements.
- Document models are created/edited **only** via reactor-mcp on drive `vetra-690b7ba0`; never hand-edit `gen/`.
- For each operation reducer: update **both** the model via `SET_OPERATION_REDUCER` (MCP) **and** the generated `src/reducers/<module>.ts` file.
- Commit after each task with a Conventional Commit message ending in the Co-Authored-By trailer.
- MCP `addActions` on a document-model document use `scope: "global"`; batch related actions in one call.

---

## Phase 1 — Document Models

### Task 1.1: Create the `Timesheet` document model shell via MCP

**Files:** none yet (created via reactor-mcp; codegen writes `document-models/timesheet/`).

- [ ] **Step 1: Create the document-model document**

Call `mcp__reactor-mcp__createDocument`:
```json
{ "documentType": "powerhouse/document-model", "driveId": "vetra-690b7ba0", "name": "Timesheet" }
```
Record the returned `documentId` as `<TS_DOC_ID>`.

- [ ] **Step 2: Set header fields**

Call `mcp__reactor-mcp__addActions` with `documentId: <TS_DOC_ID>` and these actions (all `scope: "global"`):
```json
[
  { "type": "SET_MODEL_NAME",        "scope": "global", "input": { "name": "Timesheet" } },
  { "type": "SET_MODEL_ID",          "scope": "global", "input": { "id": "powerhouse/timesheet" } },
  { "type": "SET_MODEL_EXTENSION",   "scope": "global", "input": { "extension": "phts" } },
  { "type": "SET_MODEL_DESCRIPTION", "scope": "global", "input": { "description": "A single member's time entries and live running timer." } },
  { "type": "SET_AUTHOR_NAME",       "scope": "global", "input": { "authorName": "Powerhouse" } },
  { "type": "SET_AUTHOR_WEBSITE",    "scope": "global", "input": { "authorWebsite": "https://www.powerhouse.inc/" } }
]
```

- [ ] **Step 3: Set the state schema**

Call `addActions` with one `SET_STATE_SCHEMA` action (`scope: "global"`, input.scope `"global"`), `input.schema`:
```graphql
type TimesheetState {
  ownerAddress: String
  entries: [TimeEntry!]!
  running: RunningEntry
}
type TimeEntry {
  id: OID!
  description: String!
  projectId: OID
  start: DateTime!
  end: DateTime!
  billable: Boolean!
  tags: [String!]!
}
type RunningEntry {
  id: OID!
  description: String!
  projectId: OID
  start: DateTime!
  billable: Boolean!
  tags: [String!]!
}
```

- [ ] **Step 4: Set initial state**

Call `addActions` with `SET_INITIAL_STATE` (`scope: "global"`, input.scope `"global"`), `input.initialValue` = the JSON string:
```json
{ "ownerAddress": null, "entries": [], "running": null }
```

- [ ] **Step 5: Verify**

Call `mcp__reactor-mcp__getDocument` with `{ "id": "<TS_DOC_ID>" }`; confirm name/id/extension and state schema are set. No commit yet (codegen output committed in Task 1.3).

### Task 1.2: Add the `tracking` module and its operations via MCP

**Files:** none (MCP).

- [ ] **Step 1: Add the module**

`addActions` on `<TS_DOC_ID>`:
```json
[{ "type": "ADD_MODULE", "scope": "global", "input": { "id": "tracking", "name": "tracking", "description": "Time entry tracking and the live timer." } }]
```

- [ ] **Step 2: Add operations (schemas)**

For each operation below, `addActions` with an `ADD_OPERATION` (`input: { moduleId: "tracking", id: "<op-id>", name: "<OP_NAME>", scope: "global" }`) followed by `SET_OPERATION_SCHEMA` (`input: { id: "<op-id>", schema: "<input type>" }`). Use these input schemas:

```graphql
input SetOwnerInput      { ownerAddress: String! }
input StartTimerInput    { id: OID!  description: String!  projectId: OID  start: DateTime!  billable: Boolean!  tags: [String!]! }
input StopTimerInput     { end: DateTime! }
input DiscardTimerInput  { _: Boolean }
input AddEntryInput      { id: OID!  description: String!  projectId: OID  start: DateTime!  end: DateTime!  billable: Boolean!  tags: [String!]! }
input UpdateEntryInput   { id: OID!  description: String  projectId: OID  start: DateTime  end: DateTime  billable: Boolean  tags: [String!] }
input DeleteEntryInput   { id: OID! }
```

- [ ] **Step 3: Add operation errors**

`addActions` with `ADD_OPERATION_ERROR` per error (`input: { operationId: "<op-id>", id: "<err-id>", errorName: "<Name>Error", errorCode: "<CODE>", errorDescription: "<desc>" }`):
- START_TIMER → `TimerAlreadyRunningError` / `TIMER_ALREADY_RUNNING`
- STOP_TIMER → `NoRunningTimerError` / `NO_RUNNING_TIMER`; `InvalidTimeRangeError` / `INVALID_TIME_RANGE`
- DISCARD_TIMER → `NoRunningTimerError` / `NO_RUNNING_TIMER` (use a distinct error id)
- ADD_ENTRY → `DuplicateEntryIdError` / `DUPLICATE_ENTRY_ID`; `InvalidTimeRangeError` / `INVALID_TIME_RANGE`
- UPDATE_ENTRY → `EntryNotFoundError` / `ENTRY_NOT_FOUND`; `InvalidTimeRangeError` / `INVALID_TIME_RANGE`
- DELETE_ENTRY → `EntryNotFoundError` / `ENTRY_NOT_FOUND`

- [ ] **Step 4: Set operation reducers**

`addActions` with `SET_OPERATION_REDUCER` per op (`input: { id: "<op-id>", reducer: "<code>" }`). Reducer bodies (no function header; Mutative — mutate `state` directly):

```typescript
// SET_OWNER
state.ownerAddress = action.input.ownerAddress;
```
```typescript
// START_TIMER
if (state.running) {
  throw new TimerAlreadyRunningError("A timer is already running");
}
state.running = {
  id: action.input.id,
  description: action.input.description,
  projectId: action.input.projectId ?? null,
  start: action.input.start,
  billable: action.input.billable,
  tags: action.input.tags,
};
```
```typescript
// STOP_TIMER
if (!state.running) {
  throw new NoRunningTimerError("No timer is running");
}
if (new Date(action.input.end).getTime() < new Date(state.running.start).getTime()) {
  throw new InvalidTimeRangeError("End must be after start");
}
state.entries.push({
  id: state.running.id,
  description: state.running.description,
  projectId: state.running.projectId ?? null,
  start: state.running.start,
  end: action.input.end,
  billable: state.running.billable,
  tags: state.running.tags,
});
state.running = null;
```
```typescript
// DISCARD_TIMER
if (!state.running) {
  throw new NoRunningTimerError("No timer is running");
}
state.running = null;
```
```typescript
// ADD_ENTRY
if (state.entries.some((e) => e.id === action.input.id)) {
  throw new DuplicateEntryIdError("Entry id already exists");
}
if (new Date(action.input.end).getTime() < new Date(action.input.start).getTime()) {
  throw new InvalidTimeRangeError("End must be after start");
}
state.entries.push({
  id: action.input.id,
  description: action.input.description,
  projectId: action.input.projectId ?? null,
  start: action.input.start,
  end: action.input.end,
  billable: action.input.billable,
  tags: action.input.tags,
});
```
```typescript
// UPDATE_ENTRY
const entry = state.entries.find((e) => e.id === action.input.id);
if (!entry) {
  throw new EntryNotFoundError("Entry not found");
}
const nextStart = action.input.start ?? entry.start;
const nextEnd = action.input.end ?? entry.end;
if (new Date(nextEnd).getTime() < new Date(nextStart).getTime()) {
  throw new InvalidTimeRangeError("End must be after start");
}
if (action.input.description) entry.description = action.input.description;
if (action.input.projectId !== undefined && action.input.projectId !== null) entry.projectId = action.input.projectId;
if (action.input.start) entry.start = action.input.start;
if (action.input.end) entry.end = action.input.end;
if (action.input.billable !== undefined && action.input.billable !== null) entry.billable = action.input.billable;
if (action.input.tags) entry.tags = action.input.tags;
```
```typescript
// DELETE_ENTRY
const index = state.entries.findIndex((e) => e.id === action.input.id);
if (index === -1) {
  throw new EntryNotFoundError("Entry not found");
}
state.entries.splice(index, 1);
```

- [ ] **Step 5: Verify model via getDocument**

`getDocument` `<TS_DOC_ID>` → confirm `tracking` module has 7 operations each with schema, reducer, and errors.

### Task 1.3: Generate code & implement `src/reducers/tracking.ts`

**Files:**
- Generated: `document-models/timesheet/**` (via codegen)
- Modify: `document-models/timesheet/v1/src/reducers/tracking.ts`

- [ ] **Step 1: Run codegen**

Vetra auto-runs codegen on save; if `document-models/timesheet/` is absent, run `npm run generate`. Verify the folder exists with `gen/` and `src/reducers/tracking.ts`.

- [ ] **Step 2: Mirror reducer bodies into `src/reducers/tracking.ts`**

Ensure each reducer function body matches the code from Task 1.2 Step 4 exactly (codegen should have populated them from `SET_OPERATION_REDUCER`; fix any drift). Do not import error classes — they are auto-imported.

- [ ] **Step 3: tsc + lint**

Run `npm run tsc` then `npm run lint:fix`. Expected: clean.

- [ ] **Step 4: Commit**
```bash
git add document-models/timesheet
git commit -m "feat: add Timesheet document model"
```

### Task 1.4: Timesheet reducer tests (≥95% coverage)

**Files:**
- Test: `document-models/timesheet/v1/tests/tracking.test.ts`

- [ ] **Step 1: Write a full-flow scenario test + error tests**

Cover: setOwner; startTimer; startTimer-while-running → `operations.global[n].error === "A timer is already running"`; stopTimer (entry appended, running cleared); stopTimer with no timer → `NoRunningTimerError`; stopTimer with end<start → `InvalidTimeRangeError`; addEntry; addEntry duplicate id → error; addEntry end<start → error; updateEntry (each field incl. falsy `billable: false`); updateEntry not found; updateEntry invalid range; deleteEntry; deleteEntry not found; discardTimer (happy + no-timer). Use the operation-index pattern from CLAUDE.md (never `.toThrow()`). Use fixed ISO timestamp strings from input.

- [ ] **Step 2: Run coverage**

Run `npm run test:coverage`. Expected: PASS, Timesheet reducer ≥95% all metrics. If a branch is uncovered, categorize per the CLAUDE.md strategy (fix type / add validation / fix operator / add scenario) — do not lower the threshold.

- [ ] **Step 3: Commit**
```bash
git add document-models/timesheet/v1/tests
git commit -m "test: cover Timesheet reducers"
```

### Task 1.5: Create the `TimetrackingWorkspace` document model via MCP

**Files:** none (MCP); codegen writes `document-models/timetracking-workspace/`.

- [ ] **Step 1: createDocument** `{ "documentType": "powerhouse/document-model", "driveId": "vetra-690b7ba0", "name": "TimetrackingWorkspace" }` → `<WS_DOC_ID>`.

- [ ] **Step 2: Header actions** (like Task 1.1 Step 2) with `name: "TimetrackingWorkspace"`, `id: "powerhouse/timetracking-workspace"`, `extension: "phtw"`, description "Members, clients, and projects with role-based access for time tracking.", author Powerhouse.

- [ ] **Step 3: SET_STATE_SCHEMA** (global):
```graphql
type TimetrackingWorkspaceState {
  name: String!
  members: [Member!]!
  clients: [Client!]!
  projects: [Project!]!
}
type Member { id: OID!  address: String  did: String  name: String!  avatarUrl: URL  role: MemberRole!  status: MemberStatus! }
type Client { id: OID!  name: String!  status: EntityStatus! }
type Project { id: OID!  name: String!  clientId: OID  color: String!  billable: Boolean!  hourlyRate: Amount_Money  status: EntityStatus! }
enum MemberRole   { ADMIN MANAGER MEMBER BILLING }
enum MemberStatus { ACTIVE INVITED ARCHIVED }
enum EntityStatus { ACTIVE ARCHIVED }
```

- [ ] **Step 4: SET_INITIAL_STATE** (global): `{ "name": "", "members": [], "clients": [], "projects": [] }`.

- [ ] **Step 5: ADD_MODULE** `management`.

- [ ] **Step 6: Operations** — `ADD_OPERATION` + `SET_OPERATION_SCHEMA` for each, input schemas:
```graphql
input SetWorkspaceNameInput { name: String! }
input AddMemberInput     { id: OID!  address: String  did: String  name: String!  avatarUrl: URL  role: MemberRole! }
input UpdateMemberInput  { id: OID!  name: String  avatarUrl: URL  status: MemberStatus }
input SetMemberRoleInput { id: OID!  role: MemberRole! }
input ArchiveMemberInput { id: OID! }
input AddClientInput     { id: OID!  name: String! }
input UpdateClientInput  { id: OID!  name: String }
input ArchiveClientInput { id: OID! }
input AddProjectInput    { id: OID!  name: String!  clientId: OID  color: String!  billable: Boolean! }
input UpdateProjectInput { id: OID!  name: String  clientId: OID  color: String  billable: Boolean }
input ArchiveProjectInput { id: OID! }
```
Note: `MemberRole`/`MemberStatus` are state enums referenced directly (allowed). `hourlyRate` is set via a later phase if needed; omit from inputs for now to keep scope tight.

- [ ] **Step 7: Operation errors** — `ADD_OPERATION_ERROR`:
- ADD_MEMBER → `DuplicateMemberError` / `DUPLICATE_MEMBER` (duplicate id or address)
- UPDATE_MEMBER, SET_MEMBER_ROLE, ARCHIVE_MEMBER → `MemberNotFoundError` / `MEMBER_NOT_FOUND` (distinct ids)
- ADD_CLIENT → `DuplicateClientError` / `DUPLICATE_CLIENT`
- UPDATE_CLIENT, ARCHIVE_CLIENT → `ClientNotFoundError` / `CLIENT_NOT_FOUND`
- ADD_PROJECT → `DuplicateProjectError` / `DUPLICATE_PROJECT`; `ClientNotFoundError` / `CLIENT_NOT_FOUND` (when clientId given but absent)
- UPDATE_PROJECT, ARCHIVE_PROJECT → `ProjectNotFoundError` / `PROJECT_NOT_FOUND`

- [ ] **Step 8: SET_OPERATION_REDUCER** per op. Reducer bodies:
```typescript
// SET_WORKSPACE_NAME
state.name = action.input.name;
```
```typescript
// ADD_MEMBER
if (state.members.some((m) => m.id === action.input.id || (action.input.address && m.address === action.input.address))) {
  throw new DuplicateMemberError("Member id or address already exists");
}
state.members.push({
  id: action.input.id,
  address: action.input.address ?? null,
  did: action.input.did ?? null,
  name: action.input.name,
  avatarUrl: action.input.avatarUrl ?? null,
  role: action.input.role,
  status: "INVITED",
});
```
```typescript
// UPDATE_MEMBER
const member = state.members.find((m) => m.id === action.input.id);
if (!member) throw new MemberNotFoundError("Member not found");
if (action.input.name) member.name = action.input.name;
if (action.input.avatarUrl) member.avatarUrl = action.input.avatarUrl;
if (action.input.status) member.status = action.input.status;
```
```typescript
// SET_MEMBER_ROLE
const member = state.members.find((m) => m.id === action.input.id);
if (!member) throw new MemberNotFoundError("Member not found");
member.role = action.input.role;
```
```typescript
// ARCHIVE_MEMBER
const member = state.members.find((m) => m.id === action.input.id);
if (!member) throw new MemberNotFoundError("Member not found");
member.status = "ARCHIVED";
```
```typescript
// ADD_CLIENT
if (state.clients.some((c) => c.id === action.input.id)) {
  throw new DuplicateClientError("Client id already exists");
}
state.clients.push({ id: action.input.id, name: action.input.name, status: "ACTIVE" });
```
```typescript
// UPDATE_CLIENT
const client = state.clients.find((c) => c.id === action.input.id);
if (!client) throw new ClientNotFoundError("Client not found");
if (action.input.name) client.name = action.input.name;
```
```typescript
// ARCHIVE_CLIENT
const client = state.clients.find((c) => c.id === action.input.id);
if (!client) throw new ClientNotFoundError("Client not found");
client.status = "ARCHIVED";
```
```typescript
// ADD_PROJECT
if (state.projects.some((p) => p.id === action.input.id)) {
  throw new DuplicateProjectError("Project id already exists");
}
if (action.input.clientId && !state.clients.some((c) => c.id === action.input.clientId)) {
  throw new ClientNotFoundError("Client not found");
}
state.projects.push({
  id: action.input.id,
  name: action.input.name,
  clientId: action.input.clientId ?? null,
  color: action.input.color,
  billable: action.input.billable,
  hourlyRate: null,
  status: "ACTIVE",
});
```
```typescript
// UPDATE_PROJECT
const project = state.projects.find((p) => p.id === action.input.id);
if (!project) throw new ProjectNotFoundError("Project not found");
if (action.input.name) project.name = action.input.name;
if (action.input.clientId) project.clientId = action.input.clientId;
if (action.input.color) project.color = action.input.color;
if (action.input.billable !== undefined && action.input.billable !== null) project.billable = action.input.billable;
```
```typescript
// ARCHIVE_PROJECT
const project = state.projects.find((p) => p.id === action.input.id);
if (!project) throw new ProjectNotFoundError("Project not found");
project.status = "ARCHIVED";
```

- [ ] **Step 9: getDocument verify** then **codegen** (`npm run generate` if needed), mirror reducers into `document-models/timetracking-workspace/v1/src/reducers/management.ts`, run `npm run tsc` + `npm run lint:fix`, commit `feat: add TimetrackingWorkspace document model`.

### Task 1.6: TimetrackingWorkspace reducer tests (≥95%)

**Files:** `document-models/timetracking-workspace/v1/tests/management.test.ts`

- [ ] **Step 1: Scenario + error tests** — setWorkspaceName; addClient; addClient dup; addProject (with & without clientId); addProject dup; addProject with missing clientId → `ClientNotFoundError`; updateProject (incl. `billable: false`); updateProject not found; archiveProject; archiveProject not found; addMember (status defaults INVITED); addMember dup id; addMember dup address; updateMember (each field); updateMember not found; setMemberRole; setMemberRole not found; archiveMember; archiveMember not found; updateClient; updateClient not found; archiveClient; archiveClient not found. Operation-index error pattern.

- [ ] **Step 2:** `npm run test:coverage` ≥95%. **Step 3:** commit `test: cover TimetrackingWorkspace reducers`.

### Task 1.7: Phase 1 verification gate

- [ ] Run `npm run tsc`, `npm run lint:fix`, `npm run test:coverage` — all green, both reducers ≥95%.
- [ ] Confirm `index.ts` / `document-models/index.ts` barrels export both models (codegen handles this; verify).

---

## Phase 2 — Read-Model Processor + Subgraph

> Detailed steps authored just-in-time after Phase 1 codegen, because exact generated type import paths (`document-models/timesheet`, `document-models/timetracking-workspace`) and `RelationalDbProcessor` signatures must be read from the installed `@powerhousedao/reactor` version and dtbau reference. Task-level breakdown:

### Task 2.1: Scaffold processor via `ph generate`
- [ ] Generate a relational processor (e.g. `npx ph generate --processor timetracking-read --processor-type relationalDb` or the project's documented command); confirm `processors/timetracking-read/` exists. Commit scaffold.

### Task 2.2: Define schema + row types
- [ ] Create `processors/timetracking-read/schema.ts` (`TimetrackingReadSchema` interface) and `types.ts` (row interfaces) for `tt_time_entries`, `tt_members`, `tt_projects`, `tt_clients` per spec §2. Modeled on `/home/f/projects/dtbau-package/processors/dtbau-read/{schema,types}.ts`.

### Task 2.3: Implement per-table processors (createTable/upsert/project)
- [ ] One processor class per table extending the relational base; `getNamespace`, `createTable().ifNotExists()` + indexes, `project()` (denormalize project/client names + compute `durationSeconds`, `day/week/month/year` buckets from `start`/`end`), `upsert()` with `onConflict`. Subscribe `timesheet` docs → entries; `timetracking-workspace` docs → members/projects/clients.

### Task 2.4: Factory + registration
- [ ] `processors/timetracking-read/factory.ts` builds namespaces per drive; wire into `processors/index.ts` (+ `connect.ts`/`switchboard.ts` if present, per dtbau).

### Task 2.5: Subgraph
- [ ] `subgraphs/timetracking-read/{index.ts,schema.graphql}` extending `BaseSubgraph`; queries `myEntries`, `summaryByDay`, `summaryByProject`, `summaryByClient`, `teamReport` (role-gated via authenticated caller address against `tt_members`), `workspaceProjects/Clients/Members`. Register in `subgraphs/index.ts`.

### Task 2.6: Verification
- [ ] `npm run tsc` + `npm run lint:fix` clean. Manually create a Timesheet + Workspace instance on the `preview-*` drive (or `vetra-690b7ba0`) via MCP, add entries, and query the subgraph over `http://localhost:4001/graphql` to confirm rows + summaries return. Commit.

---

## Phase 3 — Editors (document + drive)

> Detailed steps authored just-in-time after the two-phase MCP editor codegen runs (generated component shells must be read before implementing UI). Task-level breakdown:

### Task 3.1: Create editor documents via MCP (Phase-1 flow of the editor spec)
- [ ] `getDocumentModelSchema` type `powerhouse/document-editor`; create + confirm (not DRAFT) four editor documents on `vetra-690b7ba0`: `timesheet-editor` (→ `powerhouse/timesheet`), `workspace-editor` (→ `powerhouse/timetracking-workspace`), `tt-manager` (→ `powerhouse/document-drive`), `tt-member` (→ `powerhouse/document-drive`). Confirm codegen produced shells under `editors/`.

### Task 3.2: Implement `timesheet-editor`
- [ ] Day/week list + live timer bar (start/stop/discard, project picker, billable, tags), manual add/edit/delete. Uses `useSelectedTimesheetDocument` + `actions.*` from `document-models/timesheet`. Includes `<DocumentToolbar />`. Modular components in `editors/timesheet-editor/components/`.

### Task 3.3: Implement `workspace-editor`
- [ ] Projects/clients/members tables with role controls; `useSelectedTimetrackingWorkspaceDocument` + `actions.*`. `<DocumentToolbar />`.

### Task 3.4: Implement `tt-manager` drive editor
- [ ] Full Toggl nav (Timer · Reports · Projects · Clients · Members) reading the drive's Workspace + Timesheets; reuses components from 3.2/3.3.

### Task 3.5: Implement `tt-member` drive editor
- [ ] Slimmed nav (Timer · My Reports) on the caller's own Timesheet.

### Task 3.6: Registration + verification
- [ ] Confirm `editors/editors.ts` lists all four and `powerhouse.manifest.json` updated. `npm run tsc` + `npm run lint:fix`. Open Connect (`:3001`), exercise each editor against a preview document. Commit per editor.

---

## Phase 4 — Next.js App (`app/`) — the showpiece

> Detailed steps authored just-in-time. Built on the vetra.to blueprint (`/home/f/projects/vetra.to`). Task-level breakdown:

### Task 4.1: Scaffold Next.js 16 App Router app under `app/`
- [ ] Init Next app (App Router, TS, Tailwind v4), add Manrope font (from `~/Downloads/2_Manrope.zip`), dark Toggl-like theme tokens (purple/magenta accent, gradient avatars). Wire `package.json` scripts (`dev`/`build`) so it coexists with the package build.

### Task 4.2: Renown auth layer
- [ ] Port vetra.to's `RenownProvider` (dynamic `<Renown>`, login guard for `?user=`), `useRenownAuth`/`useCanSign`, `CloudAuthBridge` bearer-token bridge, post-login redirect, `RequireSigner` gate. Env: `NEXT_PUBLIC_RENOWN_URL`, `NEXT_PUBLIC_SWITCHBOARD_URL`, `NEXT_PUBLIC_DRIVE_ID`.

### Task 4.3: Reactor client + controllers
- [ ] `createClient(endpoint, withAuth)`; `RemoteDocumentController` controllers for `Timesheet` (own) and `Workspace` (managers). Bootstrap-on-login: create the member's Timesheet doc + add to Workspace as MEMBER/INVITED.

### Task 4.4: GraphQL read layer
- [ ] Typed query helpers hitting the `timetracking-read` subgraph; react-query hooks for entries/summaries/team-report/workspace lists.

### Task 4.5: Timer page
- [ ] Week calendar with color-coded blocks + live running-timer bar; create/edit entries via signed actions; optimistic UI.

### Task 4.6: Reports page
- [ ] Date-range picker; totals (total/billable/avg daily); bar chart (by day) + donut (by project) + breakdown table. Confirm whether design-system ships charts; else add Recharts.

### Task 4.7: Projects / Clients / Members pages
- [ ] Management tables mirroring screenshots; Members shows Access Rights (role) with Admin role/invite/archive controls. Role-aware nav (hide management for MEMBER; team Reports for MANAGER/ADMIN/BILLING).

### Task 4.8: Polish + verification
- [ ] Responsive, dark theme parity with screenshots, empty/loading states. `npm run tsc` + lint clean in the app. Manual end-to-end: login → start/stop timer → see entry → reports update. Commit per page.

---

## Phase 5 — Invoicing (DEFERRED)

Out of scope for this build. Future spec: adapt contributor-billing's `billing-statement` into a `powerhouse/billing-statement` model fed by tracked billable entries + project `hourlyRate`.

---

## Self-Review notes

- **Spec coverage:** §1 models → Phase 1; §2 processor → Phase 2.1–2.4; §3 subgraph → Phase 2.5; §4 editors → Phase 3; §5 app → Phase 4; §6 phasing → mirrored. Invoicing deferred per decision.
- **Type consistency:** state field names (`ownerAddress`, `entries`, `running`, `members`, `clients`, `projects`) and enums (`MemberRole`, `MemberStatus`, `EntityStatus`) used identically across schemas, reducers, processor rows, and subgraph. Error names match between Task 1.2/1.5 definitions and reducer `throw`s.
- **Phases 2–4** are intentionally task-level (not bite-sized) because their exact file contents depend on generated code from earlier phases; each task's detailed steps are produced at execution time after reading the relevant codegen output and reference files.
