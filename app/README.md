# Powerhouse Time — web app

A Toggl-style time-tracking UI for the `ph-timetracking-package` reactor. Dark,
Manrope-typed, magenta-accented. Self-contained Next.js 15 (App Router) project;
it is intentionally excluded from the package build (`tsconfig.json` /
`eslint.config.js` ignore `app/`).

## Run it

```bash
# 1. From the package root, start the reactor (Switchboard + Studio)
ph vetra            # Switchboard at http://localhost:4001/graphql

# 2. In another terminal, run the app
cd app
cp .env.example .env.local   # adjust NEXT_PUBLIC_DRIVE_ID if your drive differs
npm install
npm run dev         # http://localhost:3030
```

`NEXT_PUBLIC_DRIVE_ID` must point at the drive that holds your
`TimetrackingWorkspace` + `Timesheet` documents (the Vetra drive slug, e.g.
`vetra-690b7ba0`).

## Pages

This is the Powerhouse team's **operations app** — time, sales, delivery and
billing in one place. The `TimetrackingWorkspace` document is the shared
directory of clients/projects/members that the other sections link to.

- **Dashboard** (`/`) — at-a-glance operations overview: open pipeline, won value,
  outstanding/collected invoices (with overdue flagging), tracked hours, active
  deliverables, clients/projects and team; top-deals and overdue-invoice panels.
- **My Work** — the signed-in user's tracked hours, open leads, assigned
  deliverables and billing statement in one place.
- **Timer** — live running timer (start/stop/discard), day-grouped entries, inline edit.
- **Calendar** — drag-and-drop day/week/month time tracking.
- **Reports** — totals, weekly bar chart, project donut, breakdown. Managers get a Team toggle.
- **Sales › Pipeline** — lead-funnel kanban with drag-to-move stages, deal-value
  summaries, an add-lead form and a detail drawer (fields, priority, activity log).
  Company/owner autocomplete from workspace clients/members.
- **Delivery › Scopes of Work** — scope-of-work documents with deliverables
  (status, progress, budgeted hours) and projects. Flagship view: **budgeted
  hours vs. tracked hours** per project (tracked hours summed from timesheets,
  matched by project name/code).
- **Billing › Invoices / Statements** — invoices (parties, line items, status
  lifecycle, payments, overdue aging, prefill from tracked hours) and contributor
  billing statements (cash + POWT, prefill from tracked hours). Billing roles only.
- **Billing › Finance** — read-only view of the account registry, per-account
  transaction ledgers, expense reports (budget vs actuals) and snapshot reports.
- **Analyze › Profitability** — tracked value (billable hours × rate) vs invoiced
  by client, exposing unbilled work-in-progress.
- **Projects / Clients / Members** — management tables (managerial roles only). Members shows the Access Rights column.

### Connected lifecycle

The sections are wired into one operating loop, not four silos: a **won lead
converts** to a workspace client + project; **tracked time** on that project
flows into **invoices** and **billing statements** via "Prefill from tracked
hours"; and leads / SoW projects carry real workspace **id links** (not just
name matches), with the delivery hours view flagging unlinked projects. Reactor
read/write failures surface as toasts rather than silent empty states.

Each section talks to its document model over the same GraphQL namespace
pattern (`<Model> { documents }` reads, `<Model>_<Op>Input` mutations) via
`lib/api.ts`, polled with React Query in `lib/hooks.ts`.

## Auth

`Sign in with Renown` redirects to `NEXT_PUBLIC_RENOWN_URL` and captures the
returned `?user=<DID>`. When Renown is not configured, sign in as any workspace
member (or create a fresh workspace) — handy for local development. The current
identity's address selects that member's `Timesheet`; their workspace `role`
drives which navigation and reports are visible.

## Data layer

- **Reads** go through the per-model GraphQL query namespaces
  (`Timesheet { documents }`, `TimetrackingWorkspace { documents }`) and are
  aggregated client-side (`lib/api.ts`, React Query in `lib/hooks.ts`). This
  keeps the app correct even before the read-model processor has indexed.
- **Writes** use the per-model mutation namespaces (`Timesheet { startTimer … }`,
  `TimetrackingWorkspace { addProject … }`) and `createDocument`.
- The package also ships a `timetracking-read` subgraph (`tt_*` queries) that
  serves the same summaries server-side; it is the scalable alternative to
  client-side aggregation once datasets grow. Swap the `lib/api.ts` read helpers
  to those queries to use it.

> Note: this app talks to the reactor purely over GraphQL — it does not import
> the package's TypeScript, so it stays decoupled from codegen output.
