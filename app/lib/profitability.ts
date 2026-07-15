import type { TimesheetDoc } from "./api";
import type { InvoiceDoc, WorkspaceClient, WorkspaceProject } from "./types";

export interface ProjectProfit {
  projectId: string;
  name: string;
  hours: number;
  billableHours: number;
  rate: number;
  trackedValue: number;
}

export interface ClientProfit {
  clientId: string;
  name: string;
  trackedValue: number;
  invoiced: number;
  unbilled: number;
  projects: ProjectProfit[];
}

export interface ProfitTotals {
  trackedValue: number;
  invoiced: number;
  unbilled: number;
}

const DEAD_INVOICE = ["CANCELLED", "REJECTED"];

interface ProjectHours {
  hours: number;
  billableHours: number;
}

function hoursByProject(timesheets: TimesheetDoc[]): Map<string, ProjectHours> {
  const map = new Map<string, ProjectHours>();
  for (const s of timesheets) {
    for (const e of s.entries) {
      if (!e.projectId) continue;
      const h =
        (new Date(e.end).getTime() - new Date(e.start).getTime()) / 3_600_000;
      if (!Number.isFinite(h) || h <= 0) continue;
      const cur = map.get(e.projectId) ?? { hours: 0, billableHours: 0 };
      cur.hours += h;
      if (e.billable) cur.billableHours += h;
      map.set(e.projectId, cur);
    }
  }
  return map;
}

/**
 * Revenue/WIP by client: tracked value (billable hours × the project's hourly
 * rate) vs. what's already been invoiced to that client, exposing unbilled
 * work-in-progress. Note this is revenue-side only — contributor cost isn't
 * modelled, so it is WIP/utilisation rather than true net margin.
 */
export function computeProfitability(
  clients: WorkspaceClient[],
  projects: WorkspaceProject[],
  timesheets: TimesheetDoc[],
  invoices: InvoiceDoc[],
): { clients: ClientProfit[]; totals: ProfitTotals } {
  const hours = hoursByProject(timesheets);

  const invoicedByClientName = new Map<string, number>();
  for (const inv of invoices) {
    if (DEAD_INVOICE.includes(inv.status)) continue;
    const key = (inv.payerName ?? "").toLowerCase();
    if (!key) continue;
    invoicedByClientName.set(
      key,
      (invoicedByClientName.get(key) ?? 0) + inv.totalPriceTaxIncl,
    );
  }

  const rows: ClientProfit[] = clients.map((c) => {
    const clientProjects = projects.filter((p) => p.clientId === c.localId);
    const projectRows: ProjectProfit[] = clientProjects.map((p) => {
      const h = hours.get(p.localId) ?? { hours: 0, billableHours: 0 };
      const rate = p.hourlyRate ?? 0;
      return {
        projectId: p.localId,
        name: p.name,
        hours: h.hours,
        billableHours: h.billableHours,
        rate,
        trackedValue: h.billableHours * rate,
      };
    });
    const trackedValue = projectRows.reduce((s, r) => s + r.trackedValue, 0);
    const invoiced = invoicedByClientName.get(c.name.toLowerCase()) ?? 0;
    return {
      clientId: c.localId,
      name: c.name,
      trackedValue,
      invoiced,
      unbilled: Math.max(0, trackedValue - invoiced),
      projects: projectRows,
    };
  });

  const totals = rows.reduce<ProfitTotals>(
    (acc, r) => ({
      trackedValue: acc.trackedValue + r.trackedValue,
      invoiced: acc.invoiced + r.invoiced,
      unbilled: acc.unbilled + r.unbilled,
    }),
    { trackedValue: 0, invoiced: 0, unbilled: 0 },
  );

  return { clients: rows, totals };
}
