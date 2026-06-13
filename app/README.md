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

- **Timer** — live running timer (start/stop/discard), day-grouped entries, inline edit.
- **Reports** — totals, weekly bar chart, project donut, breakdown. Managers get a Team toggle.
- **Projects / Clients / Members** — management tables (managerial roles only). Members shows the Access Rights column.

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
