# ph-timetracking-package — Design Spec

**Date:** 2026-06-13
**Status:** Approved for planning
**Author:** Frank Pfeift (with Claude)

## Goal

Replace Toggl for Powerhouse with a Powerhouse-native time-tracking suite: document
models for time tracking + project/team management with role-based access gating, a
relational read-model (processor + subgraph) for week/month/report views, in-package
editors (document + drive), and a polished Next.js app with Renown login that feels like
Toggl. Invoicing is deferred to a later phase but the data model leaves room for it.

## References (patterns to mirror)

- **dtbau-package** (`/home/f/projects/dtbau-package`) — package structure: `document-models/<name>/v1/{gen,src,upgrades}`, `RelationalDbProcessor` read-model processors (Kysely, per-drive namespaced tables, `project()`→`upsert()`), `BaseSubgraph` subgraphs reading those tables, document editors + a drive editor (`documentTypes: ["powerhouse/document-drive"]`).
- **vetra.to** (`/home/f/projects/vetra.to`) — Next.js 16 App Router auth blueprint: `<Renown>` from `@powerhousedao/reactor-browser`, `useRenownAuth`/`useRenown`/`useCanSign`, bearer-token bridge into reactor `createClient`, signed actions via `RemoteDocumentController.pull/push`, read-model via plain GraphQL queries to Switchboard, per-user drives.
- **contributor-billing** (`@powerhousedao/contributor-billing@dev`) — its `billing-statement` model (line items with `HOUR/MINUTE/DAY/UNIT` units + dual cash/token pricing) is the adaptation target for the **deferred** invoicing phase. Do NOT install the package as a dependency (standalone AGPL app, dev-pinned, no peer deps).

## Decisions (locked)

| Decision | Choice |
| --- | --- |
| Invoicing | **Deferred** — Phase 5, adapt `billing-statement` later |
| Access roles | **Admin / Manager / Member / Billing** |
| Build sequencing | Spec whole package now; build phase-by-phase autonomously ("one shot until done") |
| Next.js app location | **Inside this repo** (`app/`) |
| Timer | **Live running timer + manual entries** (Toggl parity) |
| Doc-type org prefix | `powerhouse/...` |

## Environment baseline

`@powerhousedao/* 6.2.0-dev.13`, `document-model 6.2.0-dev.13`, React 19, Tailwind v4,
Vite 8, `@electric-sql/pglite` available for processor dev. **Manrope** font asset exists
in `~/Downloads/2_Manrope.zip` — use it for brand-matched typography.

---

## 1. Document Models

Both created via `reactor-mcp` (requires `ph vetra` running). Reducers are pure: all IDs
and timestamps come from action input. Each operation defines named errors; reducer tests
target ≥95% coverage on lines/branches/functions/statements.

### 1.A `TimetrackingWorkspace` — `powerhouse/timetracking-workspace`, ext `.phtw`

The single management + access-gating document (one per drive). Edited by Admins/Managers.
This is the source of truth for who-can-do-what and for projects/clients.

```graphql
type TimetrackingWorkspaceState {
  name: String!
  members:  [Member!]!
  clients:  [Client!]!
  projects: [Project!]!
}

type Member {
  id: OID!
  address: String        # eth address (lowercased) from Renown
  did: String
  name: String!
  avatarUrl: URL
  role: MemberRole!
  status: MemberStatus!
}

type Client {
  id: OID!
  name: String!
  status: EntityStatus!
}

type Project {
  id: OID!
  name: String!
  clientId: OID          # FK -> Client.id
  color: String!         # hex, drives calendar block color
  billable: Boolean!
  hourlyRate: Amount_Money
  status: EntityStatus!
}

enum MemberRole   { ADMIN MANAGER MEMBER BILLING }
enum MemberStatus { ACTIVE INVITED ARCHIVED }
enum EntityStatus { ACTIVE ARCHIVED }
```

**Operations (module: management):**
`SET_WORKSPACE_NAME`, `ADD_MEMBER`, `UPDATE_MEMBER`, `SET_MEMBER_ROLE`, `ARCHIVE_MEMBER`,
`ADD_CLIENT`, `UPDATE_CLIENT`, `ARCHIVE_CLIENT`, `ADD_PROJECT`, `UPDATE_PROJECT`,
`ARCHIVE_PROJECT`.

**Representative errors:** `MemberNotFoundError`, `DuplicateMemberAddressError`,
`ClientNotFoundError`, `ProjectNotFoundError`, `InvalidColorError`.

### 1.B `Timesheet` — `powerhouse/timesheet`, ext `.phts`

One document per member; holds that member's entries and live timer. Access gating is
natural: a member signs actions on their own Timesheet; the Workspace `role` governs who
may read/aggregate others' timesheets and edit the Workspace.

```graphql
type TimesheetState {
  ownerAddress: String           # member eth address (lowercased)
  entries:      [TimeEntry!]!
  running:      RunningEntry      # nullable; the active timer (max one)
}

type TimeEntry {
  id: OID!
  description: String!
  projectId: OID                 # FK -> Project.id in the Workspace
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

**Operations (module: tracking):**
`SET_OWNER`, `START_TIMER` (sets `running`; errors if one already runs),
`STOP_TIMER` (moves `running` → `entries` with `end` from input; clears `running`),
`DISCARD_TIMER`, `ADD_ENTRY` (manual), `UPDATE_ENTRY`, `DELETE_ENTRY`.

**Representative errors:** `TimerAlreadyRunningError`, `NoRunningTimerError`,
`EntryNotFoundError`, `InvalidTimeRangeError` (end < start).

---

## 2. Read-Model Processor (relational, Kysely)

`RelationalDbProcessor`-based, following dtbau's base/factory/projection split. Subscribes
to **both** doc types in a drive and writes per-drive namespaced tables:

- `tt_time_entries` — denormalized rows: `entryId, driveId, timesheetNodeId, ownerAddress, projectId, projectName, clientId, clientName, color, description, start, end, durationSeconds, billable, tags(text), day, week, month, year`.
- `tt_members` — projected from Workspace: `memberId, driveId, address, did, name, avatarUrl, role, status`.
- `tt_projects` — `projectId, driveId, name, clientId, clientName, color, billable, hourlyRate, status`.
- `tt_clients` — `clientId, driveId, name, status`.

Tables created via `createTable().ifNotExists()` + indexes on `driveId`, `ownerAddress`,
`projectId`, `day`. Projection recomputes denormalized project/client names by joining
against the latest Workspace projection. `getNamespace(driveId)` follows the
`tt_<table>_<driveId_with_underscores>` convention.

---

## 3. Subgraph (read API)

`BaseSubgraph` named `timetracking-read`. Queries the app consumes:

- `myEntries(driveId, address, from, to): [TimeEntryRow!]!`
- `summaryByDay(driveId, address, from, to): [DaySummary!]!` — bar chart
- `summaryByProject(driveId, address, from, to): [ProjectSummary!]!` — donut + breakdown
- `summaryByClient(driveId, address, from, to): [ClientSummary!]!`
- `teamReport(driveId, from, to, memberAddresses): [MemberSummary!]!` — **manager/admin/billing only**; resolver checks caller's role from `tt_members` using the authenticated address.
- `workspaceProjects(driveId)`, `workspaceClients(driveId)`, `workspaceMembers(driveId)` — for app dropdowns/management views.

Filtering/sorting in-memory after fetch (dtbau pattern), intersected with drive node IDs.
Role gating reads the authenticated caller address (bearer token) against `tt_members`.

---

## 4. Editors (in-package)

All include `<DocumentToolbar />` from `@powerhousedao/design-system/connect/index`,
styled with Tailwind v4 + design-system / document-engineering primitives. Created via the
two-phase MCP editor flow (create editor document → codegen → implement UI).

**Document editors:**
- `timesheet-editor` (`powerhouse/timesheet`) — day/week timer view + entry list; start/stop timer; add/edit manual entries.
- `workspace-editor` (`powerhouse/timetracking-workspace`) — projects / clients / members tables with role controls.

**Drive editors** (`documentTypes: ["powerhouse/document-drive"]`):
- **Manager drive editor** (`tt-manager`) — full Toggl nav: Timer · Reports · Projects · Clients · Members. Reads/writes Workspace + all Timesheets in the drive.
- **Member drive editor** (`tt-member`) — slimmed: Timer · My Reports. Operates on the caller's own Timesheet.

Registered in `editors/editors.ts` and `powerhouse.manifest.json`.

---

## 5. Next.js App (`app/`) — the showpiece

App Router, following the vetra.to blueprint precisely:

- **Auth**: `<Renown appName="timetracking" url={NEXT_PUBLIC_RENOWN_URL} />`, login guard for `?user=<DID>`, `useRenownAuth`/`useCanSign`, post-login redirect.
- **Reactor client**: `createClient(endpoint, withAuth)` with a bearer-token bridge from `renown.getBearerToken()`.
- **Mutations** (signed): `RemoteDocumentController.pull/push` — members edit their own `Timesheet`; managers edit the `Workspace`. Each member's timesheet lives in the workspace drive; bootstrap-on-first-login creates the member's Timesheet doc + adds them to the Workspace as `MEMBER` (status `INVITED` until an Admin promotes).
- **Reads**: GraphQL queries to the `timetracking-read` subgraph on Switchboard for all reports/charts.

**Pages (mirror the screenshots):**
1. **Timer** — week calendar with color-coded project blocks + a live running-timer bar (start/stop, project picker, billable toggle, tags). Manual entry create/edit.
2. **Reports** — date-range picker; total/billable hours, average daily; bar chart (duration by day), donut (project distribution), and a project/description breakdown table.
3. **Projects** — list with client, total tracked time, billable status, color.
4. **Clients** — list with status.
5. **Members** — list with avatar + **Access Rights** column (role); Admin can change roles, archive, invite.

**Look & feel:** dark theme, purple/magenta accent, gradient circular avatars, **Manrope**
font. Charts via a lightweight lib (e.g. Recharts) or design-system charts if available.
Role-aware nav: Members/Projects/Clients management hidden for `MEMBER`; Reports team view
visible to `MANAGER/ADMIN/BILLING`.

**Env:** `NEXT_PUBLIC_RENOWN_URL`, `NEXT_PUBLIC_SWITCHBOARD_URL`, `NEXT_PUBLIC_DRIVE_ID`.

---

## 6. Phasing (autonomous execution)

Each phase ends with `npm run tsc`, `npm run lint:fix`, and (for reducers) `npm run test:coverage` green before moving on.

1. **Document models** — both models via reactor-mcp, `src/` reducers, named errors, scenario + error tests ≥95%. *(Requires `ph vetra` running.)*
2. **Read model** — processor (tables/projections/upserts) + `timetracking-read` subgraph.
3. **Editors** — two document editors + two drive editors via the two-phase MCP flow.
4. **Next.js app** — auth → Timer → Reports → management pages; Manrope theme; role-aware nav.
5. **(Deferred) Invoicing** — adapt `billing-statement` into a `powerhouse/billing-statement` model fed by tracked billable entries.

## Risks / Notes

- **reactor-mcp dependency**: Phases 1 & 3 require `ph vetra` running locally. If the MCP is unavailable, pause and ask the user to start it.
- **Cross-document FK integrity**: `projectId`/`clientId` are soft references across documents; the processor must tolerate dangling refs (project archived/deleted) by falling back to stored denormalized names.
- **Role enforcement** is advisory at the read layer (subgraph checks caller role) and enforced for writes by reactor signature auth (you can only sign your own timesheet). True cross-member write control depends on drive ACLs.
- **Charts library**: confirm whether design-system ships charts before adding Recharts.
- Keep `running` timer single-instance per Timesheet; the app must `STOP_TIMER` before `START_TIMER`.
