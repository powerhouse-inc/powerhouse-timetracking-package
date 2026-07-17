import { DRIVE_ID } from "./config";
import { gql } from "./gql";
import { amountToNumber } from "./finance";
import type {
  AccountEntry,
  AccountTransaction,
  AccountTransactionsDoc,
  BillingLineItem,
  BillingStatementDoc,
  BillingStatementStatus,
  BillingUnit,
  DeliverableStatus,
  ExpenseReportDoc,
  ExpenseReportStatus,
  InvoiceDoc,
  InvoiceLineItem,
  InvoiceStatus,
  Lead,
  LeadPriority,
  LeadSource,
  LeadStage,
  Role,
  ScopeOfWorkDoc,
  SnapshotReportDoc,
  SowDeliverable,
  SowProject,
  SowStatus,
  SurveyDoc,
  SurveyKind,
  SurveyQuestion,
  SurveySection,
  TransactionDirection,
  WorkspaceClient,
  WorkspaceMember,
  WorkspaceProject,
} from "./types";

/* ----------------------------- read models ----------------------------- */

export interface RawEntry {
  id: string;
  description: string;
  projectId: string | null;
  start: string;
  end: string;
  billable: boolean;
  tags: string[];
}

export interface RawRunning {
  id: string;
  description: string;
  projectId: string | null;
  start: string;
  billable: boolean;
  tags: string[];
}

export interface TimesheetDoc {
  id: string;
  name: string;
  ownerAddress: string | null;
  entries: RawEntry[];
  running: RawRunning | null;
}

export interface WorkspaceDoc {
  id: string;
  name: string;
  members: WorkspaceMember[];
  clients: WorkspaceClient[];
  projects: WorkspaceProject[];
}

const TIMESHEETS_QUERY = `
  query {
    Timesheet {
      documents {
        items {
          id
          name
          state {
            global {
              ownerAddress
              entries { id description projectId start end billable tags }
              running { id description projectId start billable tags }
            }
          }
        }
      }
    }
  }
`;

const WORKSPACES_QUERY = `
  query {
    TimetrackingWorkspace {
      documents {
        items {
          id
          name
          state {
            global {
              name
              members { id address did name avatarUrl role status }
              clients { id name status }
              projects { id name clientId color billable hourlyRate status }
            }
          }
        }
      }
    }
  }
`;

interface TimesheetItem {
  id: string;
  name: string;
  state: { global: { ownerAddress: string | null; entries: RawEntry[]; running: RawRunning | null } };
}
interface WorkspaceItem {
  id: string;
  name: string;
  state: {
    global: {
      name: string;
      members: {
        id: string;
        address: string | null;
        did: string | null;
        name: string;
        avatarUrl: string | null;
        role: WorkspaceMember["role"];
        status: WorkspaceMember["status"];
      }[];
      clients: { id: string; name: string; status: WorkspaceClient["status"] }[];
      projects: {
        id: string;
        name: string;
        clientId: string | null;
        color: string;
        billable: boolean;
        hourlyRate: number | null;
        status: WorkspaceProject["status"];
      }[];
    };
  };
}

export async function fetchTimesheets(): Promise<TimesheetDoc[]> {
  const data = await gql<{ Timesheet: { documents: { items: TimesheetItem[] } } }>(
    TIMESHEETS_QUERY,
  );
  return data.Timesheet.documents.items.map((d) => ({
    id: d.id,
    name: d.name,
    ownerAddress: d.state.global.ownerAddress,
    entries: d.state.global.entries,
    running: d.state.global.running,
  }));
}

export async function fetchWorkspace(): Promise<WorkspaceDoc | null> {
  const data = await gql<{
    TimetrackingWorkspace: { documents: { items: WorkspaceItem[] } };
  }>(WORKSPACES_QUERY);
  const item = data.TimetrackingWorkspace.documents.items[0];
  if (!item) return null;
  const g = item.state.global;
  const clientName = (id: string | null) =>
    g.clients.find((c) => c.id === id)?.name ?? null;
  return {
    id: item.id,
    name: g.name,
    // Remap the member's document `id` to `localId` (as clients/projects do) —
    // the Members UI and mutations key off `localId`, so passing the raw shape
    // through left it undefined and every role/archive change silently failed.
    members: g.members.map((m) => ({
      localId: m.id,
      address: m.address,
      did: m.did,
      name: m.name,
      avatarUrl: m.avatarUrl,
      role: m.role,
      status: m.status,
    })),
    clients: g.clients.map((c) => ({
      localId: c.id,
      name: c.name,
      status: c.status,
    })),
    projects: g.projects.map((p) => ({
      localId: p.id,
      name: p.name,
      clientId: p.clientId,
      clientName: clientName(p.clientId),
      color: p.color,
      billable: p.billable,
      hourlyRate: p.hourlyRate,
      status: p.status,
    })),
  };
}

/* ------------------------------ mutations ------------------------------- */

function randomId(): string {
  // RFC4122-ish; crypto.randomUUID is available in modern browsers.
  return globalThis.crypto?.randomUUID?.() ?? `id-${Date.now()}-${Math.round(Math.random() * 1e9)}`;
}

async function mutate(
  namespace: string,
  field: string,
  args: string,
  vars: Record<string, unknown>,
): Promise<void> {
  const inputType = `${namespace}_${field[0].toUpperCase()}${field.slice(1)}Input`;
  await gql(
    `mutation($docId: PHID!, $input: ${inputType}!) {
      ${namespace} { ${field}(${args}) { __typename } }
    }`,
    vars,
  );
}

/* ---- workspace document bootstrap ---- */

export async function ensureWorkspace(name: string): Promise<string> {
  const existing = await fetchWorkspace();
  if (existing) return existing.id;
  const data = await gql<{
    TimetrackingWorkspace: { createDocument: { id: string } };
  }>(
    `mutation($name: String!, $parent: String) {
      TimetrackingWorkspace { createDocument(name: $name, parentIdentifier: $parent) { id } }
    }`,
    { name, parent: DRIVE_ID },
  );
  const id = data.TimetrackingWorkspace.createDocument.id;
  await mutate("TimetrackingWorkspace", "setWorkspaceName", "docId: $docId, input: $input", {
    docId: id,
    input: { name },
  });
  return id;
}

export async function ensureTimesheet(
  address: string,
  displayName: string,
): Promise<string> {
  const sheets = await fetchTimesheets();
  const mine = sheets.find((s) => s.ownerAddress === address);
  if (mine) return mine.id;
  const data = await gql<{ Timesheet: { createDocument: { id: string } } }>(
    `mutation($name: String!, $parent: String) {
      Timesheet { createDocument(name: $name, parentIdentifier: $parent) { id } }
    }`,
    { name: `Timesheet — ${displayName}`, parent: DRIVE_ID },
  );
  const id = data.Timesheet.createDocument.id;
  await mutate("Timesheet", "setOwner", "docId: $docId, input: $input", {
    docId: id,
    input: { ownerAddress: address },
  });
  return id;
}

/* ---- timer + entries ---- */

export const timesheetApi = {
  startTimer: (
    docId: string,
    input: { description: string; projectId: string | null; billable: boolean },
  ) =>
    mutate("Timesheet", "startTimer", "docId: $docId, input: $input", {
      docId,
      input: { id: randomId(), start: new Date().toISOString(), tags: [], ...input },
    }),
  stopTimer: (docId: string) =>
    mutate("Timesheet", "stopTimer", "docId: $docId, input: $input", {
      docId,
      input: { end: new Date().toISOString() },
    }),
  discardTimer: (docId: string) =>
    mutate("Timesheet", "discardTimer", "docId: $docId, input: $input", {
      docId,
      input: { _: true },
    }),
  addEntry: (
    docId: string,
    input: {
      description: string;
      projectId: string | null;
      start: string;
      end: string;
      billable: boolean;
    },
  ) =>
    mutate("Timesheet", "addEntry", "docId: $docId, input: $input", {
      docId,
      input: { id: randomId(), tags: [], ...input },
    }),
  updateEntry: (
    docId: string,
    id: string,
    patch: {
      description?: string;
      projectId?: string | null;
      billable?: boolean;
      start?: string;
      end?: string;
    },
  ) =>
    mutate("Timesheet", "updateEntry", "docId: $docId, input: $input", {
      docId,
      input: { id, ...patch },
    }),
  deleteEntry: (docId: string, id: string) =>
    mutate("Timesheet", "deleteEntry", "docId: $docId, input: $input", {
      docId,
      input: { id },
    }),
};

/* ---- projects / clients / members ---- */

export const workspaceApi = {
  addProject: (
    docId: string,
    input: { name: string; clientId: string | null; color: string; billable: boolean },
  ) =>
    mutate("TimetrackingWorkspace", "addProject", "docId: $docId, input: $input", {
      docId,
      input: { id: randomId(), ...input },
    }),
  updateProject: (
    docId: string,
    id: string,
    patch: {
      name?: string;
      clientId?: string | null;
      color?: string;
      billable?: boolean;
      hourlyRate?: number;
    },
  ) =>
    mutate("TimetrackingWorkspace", "updateProject", "docId: $docId, input: $input", {
      docId,
      input: { id, ...patch },
    }),
  archiveProject: (docId: string, id: string) =>
    mutate("TimetrackingWorkspace", "archiveProject", "docId: $docId, input: $input", {
      docId,
      input: { id },
    }),
  addClient: (docId: string, name: string) =>
    mutate("TimetrackingWorkspace", "addClient", "docId: $docId, input: $input", {
      docId,
      input: { id: randomId(), name },
    }),
  updateClient: (docId: string, id: string, name: string) =>
    mutate("TimetrackingWorkspace", "updateClient", "docId: $docId, input: $input", {
      docId,
      input: { id, name },
    }),
  archiveClient: (docId: string, id: string) =>
    mutate("TimetrackingWorkspace", "archiveClient", "docId: $docId, input: $input", {
      docId,
      input: { id },
    }),
  addMember: (
    docId: string,
    input: { name: string; address: string | null; role: Role },
  ) =>
    mutate("TimetrackingWorkspace", "addMember", "docId: $docId, input: $input", {
      docId,
      input: { id: randomId(), ...input },
    }),
  setMemberRole: (docId: string, id: string, role: Role) =>
    mutate("TimetrackingWorkspace", "setMemberRole", "docId: $docId, input: $input", {
      docId,
      input: { id, role },
    }),
  archiveMember: (docId: string, id: string) =>
    mutate("TimetrackingWorkspace", "archiveMember", "docId: $docId, input: $input", {
      docId,
      input: { id },
    }),
};

/* ================================ sales ================================= */

export interface LeadFunnelDoc {
  id: string;
  name: string;
  leads: Lead[];
}

const LEAD_FUNNELS_QUERY = `
  query {
    LeadFunnel {
      documents {
        items {
          id
          name
          state {
            global {
              name
              leads {
                id name company clientId email phone source stage priority
                estimatedValue owner score tags notes createdAt updatedAt
                activities { id type note timestamp }
              }
            }
          }
        }
      }
    }
  }
`;

interface LeadFunnelItem {
  id: string;
  name: string;
  state: { global: { name: string; leads: Lead[] } };
}

export async function fetchLeadFunnel(): Promise<LeadFunnelDoc | null> {
  const data = await gql<{ LeadFunnel: { documents: { items: LeadFunnelItem[] } } }>(
    LEAD_FUNNELS_QUERY,
  );
  const item = data.LeadFunnel.documents.items[0];
  if (!item) return null;
  return { id: item.id, name: item.state.global.name, leads: item.state.global.leads };
}

export async function ensureLeadFunnel(name: string): Promise<string> {
  const existing = await fetchLeadFunnel();
  if (existing) return existing.id;
  const data = await gql<{ LeadFunnel: { createDocument: { id: string } } }>(
    `mutation($name: String!, $parent: String) {
      LeadFunnel { createDocument(name: $name, parentIdentifier: $parent) { id } }
    }`,
    { name, parent: DRIVE_ID },
  );
  const id = data.LeadFunnel.createDocument.id;
  await mutate("LeadFunnel", "setFunnelName", "docId: $docId, input: $input", {
    docId: id,
    input: { name },
  });
  return id;
}

export interface NewLeadInput {
  name: string;
  company: string | null;
  clientId: string | null;
  email: string | null;
  phone: string | null;
  source: LeadSource;
  priority: LeadPriority;
  estimatedValue: number | null;
  owner: string | null;
  notes: string | null;
}

export const leadApi = {
  addLead: (docId: string, input: NewLeadInput) =>
    mutate("LeadFunnel", "addLead", "docId: $docId, input: $input", {
      docId,
      input: { id: randomId(), createdAt: new Date().toISOString(), ...input },
    }),
  updateLead: (
    docId: string,
    id: string,
    patch: Partial<Omit<NewLeadInput, never>> & { score?: number },
  ) =>
    mutate("LeadFunnel", "updateLead", "docId: $docId, input: $input", {
      docId,
      input: { id, updatedAt: new Date().toISOString(), ...patch },
    }),
  moveLead: (docId: string, id: string, stage: LeadStage) =>
    mutate("LeadFunnel", "moveLead", "docId: $docId, input: $input", {
      docId,
      input: { id, stage, updatedAt: new Date().toISOString() },
    }),
  deleteLead: (docId: string, id: string) =>
    mutate("LeadFunnel", "deleteLead", "docId: $docId, input: $input", {
      docId,
      input: { id },
    }),
  addActivity: (
    docId: string,
    leadId: string,
    input: { type: "CALL" | "EMAIL" | "MEETING" | "NOTE"; note: string | null },
  ) =>
    mutate("LeadFunnel", "addActivity", "docId: $docId, input: $input", {
      docId,
      input: { leadId, id: randomId(), timestamp: new Date().toISOString(), ...input },
    }),
};

/**
 * Lifecycle: turn a won lead into billable work — ensure a workspace client
 * exists, then create a workspace project linked to it (so time can be tracked
 * against it). Returns the ids so the caller can link the lead back.
 */
export async function convertLeadToProject(
  wsId: string,
  input: { clientId: string | null; clientName: string | null; projectName: string },
): Promise<{ clientId: string | null; projectId: string }> {
  let clientId = input.clientId;
  if (!clientId && input.clientName) {
    clientId = randomId();
    await mutate("TimetrackingWorkspace", "addClient", "docId: $docId, input: $input", {
      docId: wsId,
      input: { id: clientId, name: input.clientName },
    });
  }
  const projectId = randomId();
  await mutate("TimetrackingWorkspace", "addProject", "docId: $docId, input: $input", {
    docId: wsId,
    input: {
      id: projectId,
      name: input.projectName,
      clientId: clientId || null,
      color: "#e57cd8",
      billable: true,
    },
  });
  return { clientId, projectId };
}

/* ============================== delivery =============================== */

interface RawProgress {
  __typename: string;
  total?: number;
  completed?: number;
  value?: number;
  done?: boolean | null;
}

function normalizeProgress(p: RawProgress | null): number | null {
  if (!p) return null;
  const t = p.__typename;
  if (t.endsWith("Percentage")) return p.value ?? 0;
  if (t.endsWith("Binary")) return p.done ? 100 : 0;
  if (t.endsWith("StoryPoint")) {
    const total = p.total ?? 0;
    return total > 0 ? Math.round(((p.completed ?? 0) / total) * 100) : 0;
  }
  return null;
}

interface SowItem {
  id: string;
  name: string;
  state: {
    global: {
      title: string;
      description: string;
      status: SowStatus;
      projects: SowProject[];
      deliverables: (Omit<SowDeliverable, "progressPercent"> & {
        workProgress: RawProgress | null;
      })[];
    };
  };
}

const SCOPES_QUERY = `
  query {
    ScopeOfWork {
      documents {
        items {
          id
          name
          state {
            global {
              title description status
              projects { id code title workspaceProjectId budget currency budgetType }
              deliverables {
                id title code description owner status
                budgetAnchor { project unit unitCost quantity margin }
                workProgress {
                  __typename
                  ... on ScopeOfWork_StoryPoint { total completed }
                  ... on ScopeOfWork_Percentage { value }
                  ... on ScopeOfWork_Binary { done }
                }
              }
            }
          }
        }
      }
    }
  }
`;

export async function fetchScopesOfWork(): Promise<ScopeOfWorkDoc[]> {
  const data = await gql<{ ScopeOfWork: { documents: { items: SowItem[] } } }>(
    SCOPES_QUERY,
  );
  return data.ScopeOfWork.documents.items.map((d) => {
    const g = d.state.global;
    return {
      id: d.id,
      name: d.name,
      title: g.title,
      description: g.description,
      status: g.status,
      projects: g.projects,
      deliverables: g.deliverables.map((dl) => ({
        id: dl.id,
        title: dl.title,
        code: dl.code,
        description: dl.description,
        owner: dl.owner,
        status: dl.status,
        budgetAnchor: dl.budgetAnchor,
        progressPercent: normalizeProgress(dl.workProgress),
      })),
    };
  });
}

export async function createScopeOfWork(
  title: string,
  description: string,
): Promise<string> {
  const data = await gql<{ ScopeOfWork: { createDocument: { id: string } } }>(
    `mutation($name: String!, $parent: String) {
      ScopeOfWork { createDocument(name: $name, parentIdentifier: $parent) { id } }
    }`,
    { name: title, parent: DRIVE_ID },
  );
  const id = data.ScopeOfWork.createDocument.id;
  await mutate("ScopeOfWork", "editScopeOfWork", "docId: $docId, input: $input", {
    docId: id,
    input: { title, description },
  });
  return id;
}

export const sowApi = {
  editScopeOfWork: (
    docId: string,
    patch: { title?: string; description?: string; status?: SowStatus },
  ) =>
    mutate("ScopeOfWork", "editScopeOfWork", "docId: $docId, input: $input", {
      docId,
      input: patch,
    }),
  addProject: (docId: string, input: { code: string; title: string }) =>
    mutate("ScopeOfWork", "addProject", "docId: $docId, input: $input", {
      docId,
      input: { id: randomId(), ...input },
    }),
  linkProject: (docId: string, projectId: string, workspaceProjectId: string | null) =>
    mutate("ScopeOfWork", "updateProject", "docId: $docId, input: $input", {
      docId,
      input: { id: projectId, workspaceProjectId },
    }),
  setProjectTotalBudget: (docId: string, projectId: string, totalBudget: number) =>
    mutate("ScopeOfWork", "setProjectTotalBudget", "docId: $docId, input: $input", {
      docId,
      input: { projectId, totalBudget },
    }),
  addDeliverable: (
    docId: string,
    input: { title: string; code: string; description: string },
  ) =>
    mutate("ScopeOfWork", "addDeliverable", "docId: $docId, input: $input", {
      docId,
      input: { id: randomId(), status: "TODO", ...input },
    }),
  editDeliverable: (
    docId: string,
    id: string,
    patch: { title?: string; status?: DeliverableStatus; owner?: string },
  ) =>
    mutate("ScopeOfWork", "editDeliverable", "docId: $docId, input: $input", {
      docId,
      input: { id, ...patch },
    }),
  setDeliverableProgress: (docId: string, id: string, percentage: number) =>
    mutate("ScopeOfWork", "setDeliverableProgress", "docId: $docId, input: $input", {
      docId,
      input: { id, workProgress: { percentage } },
    }),
  setDeliverableHours: (
    docId: string,
    deliverableId: string,
    input: { project: string | null; quantity: number; unitCost: number },
  ) =>
    mutate(
      "ScopeOfWork",
      "setDeliverableBudgetAnchorProject",
      "docId: $docId, input: $input",
      {
        docId,
        input: { deliverableId, unit: "Hours", margin: 0, ...input },
      },
    ),
};

/* ============================== billing =============================== */

const INVOICES_QUERY = `
  query {
    Invoice {
      documents {
        items {
          id name
          state {
            global {
              status invoiceNo currency dateIssued dateDue notes
              totalPriceTaxExcl totalPriceTaxIncl
              issuer { name }
              payer { name }
              lineItems {
                id description taxPercent quantity currency
                unitPriceTaxExcl unitPriceTaxIncl totalPriceTaxExcl totalPriceTaxIncl
              }
              payments { id paymentDate txnRef confirmed amount }
            }
          }
        }
      }
    }
  }
`;

interface InvoiceItem {
  id: string;
  name: string;
  state: {
    global: {
      status: InvoiceStatus;
      invoiceNo: string;
      currency: string;
      dateIssued: string | null;
      dateDue: string | null;
      notes: string | null;
      totalPriceTaxExcl: number;
      totalPriceTaxIncl: number;
      issuer: { name: string | null } | null;
      payer: { name: string | null } | null;
      lineItems: InvoiceLineItem[];
      payments: InvoiceDoc["payments"];
    };
  };
}

export async function fetchInvoices(): Promise<InvoiceDoc[]> {
  const data = await gql<{ Invoice: { documents: { items: InvoiceItem[] } } }>(
    INVOICES_QUERY,
  );
  return data.Invoice.documents.items.map((d) => {
    const g = d.state.global;
    return {
      id: d.id,
      name: d.name,
      status: g.status,
      invoiceNo: g.invoiceNo,
      currency: g.currency,
      dateIssued: g.dateIssued,
      dateDue: g.dateDue,
      issuerName: g.issuer?.name ?? null,
      payerName: g.payer?.name ?? null,
      lineItems: g.lineItems,
      payments: g.payments,
      totalPriceTaxExcl: g.totalPriceTaxExcl,
      totalPriceTaxIncl: g.totalPriceTaxIncl,
      notes: g.notes,
    };
  });
}

export async function createInvoice(input: {
  invoiceNo: string;
  currency: string;
  issuerName: string;
  payerName: string;
}): Promise<string> {
  const data = await gql<{ Invoice: { createDocument: { id: string } } }>(
    `mutation($name: String!, $parent: String) {
      Invoice { createDocument(name: $name, parentIdentifier: $parent) { id } }
    }`,
    { name: input.invoiceNo || "Invoice", parent: DRIVE_ID },
  );
  const id = data.Invoice.createDocument.id;
  await mutate("Invoice", "editInvoice", "docId: $docId, input: $input", {
    docId: id,
    input: { invoiceNo: input.invoiceNo, currency: input.currency },
  });
  await mutate("Invoice", "editIssuer", "docId: $docId, input: $input", {
    docId: id,
    input: { name: input.issuerName },
  });
  await mutate("Invoice", "editPayer", "docId: $docId, input: $input", {
    docId: id,
    input: { name: input.payerName },
  });
  return id;
}

export const invoiceApi = {
  editInvoice: (
    docId: string,
    patch: {
      invoiceNo?: string;
      currency?: string;
      dateIssued?: string;
      dateDue?: string;
      notes?: string;
    },
  ) =>
    mutate("Invoice", "editInvoice", "docId: $docId, input: $input", {
      docId,
      input: patch,
    }),
  editParty: (docId: string, side: "issuer" | "payer", name: string) =>
    mutate(
      "Invoice",
      side === "issuer" ? "editIssuer" : "editPayer",
      "docId: $docId, input: $input",
      { docId, input: { name } },
    ),
  setStatus: (docId: string, status: InvoiceStatus) =>
    mutate("Invoice", "editStatus", "docId: $docId, input: $input", {
      docId,
      input: { status },
    }),
  addLineItem: (
    docId: string,
    input: {
      description: string;
      quantity: number;
      unitPriceTaxExcl: number;
      taxPercent: number;
      currency: string;
    },
  ) => {
    const unitPriceTaxIncl = input.unitPriceTaxExcl * (1 + input.taxPercent / 100);
    return mutate("Invoice", "addLineItem", "docId: $docId, input: $input", {
      docId,
      input: {
        id: randomId(),
        description: input.description,
        taxPercent: input.taxPercent,
        quantity: input.quantity,
        currency: input.currency,
        unitPriceTaxExcl: input.unitPriceTaxExcl,
        unitPriceTaxIncl,
        totalPriceTaxExcl: input.unitPriceTaxExcl * input.quantity,
        totalPriceTaxIncl: unitPriceTaxIncl * input.quantity,
      },
    });
  },
  deleteLineItem: (docId: string, id: string) =>
    mutate("Invoice", "deleteLineItem", "docId: $docId, input: $input", {
      docId,
      input: { id },
    }),
  /** Record a confirmed payment and mark the invoice received. */
  recordPayment: async (docId: string, txnRef: string) => {
    await mutate("Invoice", "addPayment", "docId: $docId, input: $input", {
      docId,
      input: {
        id: randomId(),
        paymentDate: new Date().toISOString(),
        txnRef: txnRef || null,
        confirmed: true,
      },
    });
    await mutate("Invoice", "editStatus", "docId: $docId, input: $input", {
      docId,
      input: { status: "PAYMENTRECEIVED" },
    });
  },
};

const STATEMENTS_QUERY = `
  query {
    BillingStatement {
      documents {
        items {
          id name
          state {
            global {
              contributor status currency dateIssued dateDue notes totalCash totalPowt
              lineItems {
                id description quantity unit
                unitPriceCash unitPricePwt totalPriceCash totalPricePwt
              }
            }
          }
        }
      }
    }
  }
`;

interface StatementItem {
  id: string;
  name: string;
  state: {
    global: {
      contributor: string | null;
      status: BillingStatementStatus;
      currency: string;
      dateIssued: string | null;
      dateDue: string | null;
      notes: string | null;
      totalCash: number;
      totalPowt: number;
      lineItems: BillingLineItem[];
    };
  };
}

export async function fetchBillingStatements(): Promise<BillingStatementDoc[]> {
  const data = await gql<{
    BillingStatement: { documents: { items: StatementItem[] } };
  }>(STATEMENTS_QUERY);
  return data.BillingStatement.documents.items.map((d) => ({
    id: d.id,
    name: d.name,
    ...d.state.global,
  }));
}

export async function createBillingStatement(input: {
  contributor: string;
  currency: string;
}): Promise<string> {
  const data = await gql<{
    BillingStatement: { createDocument: { id: string } };
  }>(
    `mutation($name: String!, $parent: String) {
      BillingStatement { createDocument(name: $name, parentIdentifier: $parent) { id } }
    }`,
    { name: input.contributor || "Billing Statement", parent: DRIVE_ID },
  );
  const id = data.BillingStatement.createDocument.id;
  await mutate("BillingStatement", "editContributor", "docId: $docId, input: $input", {
    docId: id,
    input: { contributor: input.contributor },
  });
  await mutate(
    "BillingStatement",
    "editBillingStatement",
    "docId: $docId, input: $input",
    { docId: id, input: { currency: input.currency } },
  );
  return id;
}

export const statementApi = {
  setStatus: (docId: string, status: BillingStatementStatus) =>
    mutate("BillingStatement", "editStatus", "docId: $docId, input: $input", {
      docId,
      input: { status },
    }),
  editStatement: (
    docId: string,
    patch: { currency?: string; notes?: string },
  ) =>
    mutate(
      "BillingStatement",
      "editBillingStatement",
      "docId: $docId, input: $input",
      { docId, input: patch },
    ),
  addLineItem: (
    docId: string,
    input: {
      description: string;
      quantity: number;
      unit: BillingUnit;
      unitPriceCash: number;
      unitPricePwt: number;
    },
  ) =>
    mutate("BillingStatement", "addLineItem", "docId: $docId, input: $input", {
      docId,
      input: {
        id: randomId(),
        description: input.description,
        quantity: input.quantity,
        unit: input.unit,
        unitPriceCash: input.unitPriceCash,
        unitPricePwt: input.unitPricePwt,
        totalPriceCash: input.unitPriceCash * input.quantity,
        totalPricePwt: input.unitPricePwt * input.quantity,
      },
    }),
  deleteLineItem: (docId: string, id: string) =>
    mutate("BillingStatement", "deleteLineItem", "docId: $docId, input: $input", {
      docId,
      input: { id },
    }),
};

/* ===================== contributor invoice workflow ==================== */

export interface NewInvoiceLine {
  description: string;
  quantity: number;
  unitPriceTaxExcl: number;
  taxPercent: number;
}

/**
 * A worker submits an invoice to the org: issuer = the member, payer = the
 * workspace. Sets a placeholder issuer wallet so the invoice can leave DRAFT,
 * then issues it. Returns the new document id.
 */
export async function submitInvoice(input: {
  invoiceNo: string;
  currency: string;
  issuerName: string;
  issuerAddress?: string | null;
  payerName: string;
  notes?: string;
  lines: NewInvoiceLine[];
}): Promise<string> {
  const id = await createInvoice({
    invoiceNo: input.invoiceNo,
    currency: input.currency,
    issuerName: input.issuerName,
    payerName: input.payerName,
  });
  if (input.notes) await invoiceApi.editInvoice(id, { notes: input.notes });
  for (const l of input.lines) {
    await invoiceApi.addLineItem(id, { ...l, currency: input.currency });
  }
  // Wallet is required before an invoice can leave DRAFT.
  await mutate("Invoice", "editIssuerWallet", "docId: $docId, input: $input", {
    docId: id,
    input: {
      address: input.issuerAddress || "contributor",
      chainName: "ethereum",
      chainId: "1",
    },
  });
  await invoiceApi.setStatus(id, "ISSUED");
  return id;
}

interface ImportedInvoice {
  invoiceNo: string;
  currency: string;
  issuerName: string;
  payerName: string;
  notes: string;
  lines: NewInvoiceLine[];
}

/**
 * Best-effort parse of an exported Powerhouse invoice document (JSON) into the
 * fields we need to re-create it. Tolerates the common export shapes
 * (getDocument output, a bare state, or state.global).
 */
export function parseInvoiceDocFile(text: string): ImportedInvoice {
  const parsed = JSON.parse(text) as Record<string, unknown>;
  const g = ((parsed.state as { global?: unknown })?.global ??
    (parsed as { global?: unknown }).global ??
    parsed) as Record<string, unknown>;
  const li = Array.isArray(g.lineItems) ? (g.lineItems as Record<string, unknown>[]) : [];
  const name = (v: unknown) =>
    v && typeof v === "object" ? String((v as { name?: unknown }).name ?? "") : "";
  return {
    invoiceNo: String(g.invoiceNo ?? ""),
    currency: String(g.currency ?? "USD"),
    issuerName: name(g.issuer),
    payerName: name(g.payer),
    notes: typeof g.notes === "string" ? g.notes : "",
    lines: li.map((l) => ({
      description: String(l.description ?? "Line item"),
      quantity: Number(l.quantity ?? 1),
      unitPriceTaxExcl: Number(l.unitPriceTaxExcl ?? l.unitPriceTaxIncl ?? 0),
      taxPercent: Number(l.taxPercent ?? 0),
    })),
  };
}

/**
 * Finance marks a submitted invoice paid, producing the billing-statement
 * record of that payment (contributor = the invoice's issuer). Returns the
 * statement id.
 */
export async function markInvoicePaidAsStatement(
  invoice: InvoiceDoc,
): Promise<string> {
  await invoiceApi.setStatus(invoice.id, "PAYMENTRECEIVED");
  const stmtId = await createBillingStatement({
    contributor: invoice.issuerName ?? "Contributor",
    currency: invoice.currency,
  });
  for (const li of invoice.lineItems) {
    await statementApi.addLineItem(stmtId, {
      description: li.description,
      quantity: li.quantity,
      unit: "UNIT",
      unitPriceCash: li.unitPriceTaxIncl,
      unitPricePwt: 0,
    });
  }
  await statementApi.setStatus(stmtId, "PAID");
  return stmtId;
}

/* ============================== finance =============================== */
/* Read-only surfacing of the billing/accounting document models. */

const ACCOUNTS_QUERY = `
  query {
    Accounts {
      documents {
        items {
          id name
          state {
            global {
              accounts {
                id account name budgetPath accountTransactionsId
                chain type owners KycAmlStatus
              }
            }
          }
        }
      }
    }
  }
`;

interface AccountEntryRaw {
  id: string;
  account: string;
  name: string;
  budgetPath: string | null;
  accountTransactionsId: string | null;
  chain: string[] | null;
  type: AccountEntry["type"];
  owners: string[] | null;
  KycAmlStatus: AccountEntry["kycAmlStatus"];
}

interface AccountsItem {
  id: string;
  name: string;
  state: { global: { accounts: AccountEntryRaw[] } };
}

/** Flatten every AccountEntry across all Accounts registry documents. */
export async function fetchAccounts(): Promise<AccountEntry[]> {
  const data = await gql<{ Accounts: { documents: { items: AccountsItem[] } } }>(
    ACCOUNTS_QUERY,
  );
  return data.Accounts.documents.items.flatMap((d) =>
    d.state.global.accounts.map((a) => ({
      id: a.id,
      account: a.account,
      name: a.name,
      budgetPath: a.budgetPath ?? null,
      accountTransactionsId: a.accountTransactionsId ?? null,
      chain: a.chain ?? [],
      type: a.type,
      owners: a.owners ?? [],
      kycAmlStatus: a.KycAmlStatus ?? null,
    })),
  );
}

const ACCOUNT_TRANSACTIONS_QUERY = `
  query {
    AccountTransactions {
      documents {
        items {
          id name
          state {
            global {
              account { id account name type chain owners KycAmlStatus }
              transactions {
                id counterParty amount datetime budget accountingPeriod direction
                details { txHash token blockNumber }
              }
            }
          }
        }
      }
    }
  }
`;

interface AccountTransactionRaw {
  id: string;
  counterParty: string | null;
  amount: unknown;
  datetime: string;
  budget: string | null;
  accountingPeriod: string;
  direction: TransactionDirection;
  details: { txHash: string; token: string | null; blockNumber: number | null } | null;
}

interface AccountTransactionsItem {
  id: string;
  name: string;
  state: {
    global: {
      account: {
        id: string;
        account: string;
        name: string;
        type: string | null;
        chain: string[] | null;
        owners: string[] | null;
        KycAmlStatus: string | null;
      };
      transactions: AccountTransactionRaw[];
    };
  };
}

export async function fetchAccountTransactions(): Promise<AccountTransactionsDoc[]> {
  const data = await gql<{
    AccountTransactions: { documents: { items: AccountTransactionsItem[] } };
  }>(ACCOUNT_TRANSACTIONS_QUERY);
  return data.AccountTransactions.documents.items.map((d) => {
    const g = d.state.global;
    const transactions: AccountTransaction[] = g.transactions.map((t) => ({
      id: t.id,
      counterParty: t.counterParty ?? null,
      amount: t.amount,
      datetime: t.datetime,
      txHash: t.details?.txHash ?? "",
      token: t.details?.token ?? null,
      blockNumber: t.details?.blockNumber ?? null,
      budget: t.budget ?? null,
      accountingPeriod: t.accountingPeriod,
      direction: t.direction,
    }));
    return {
      id: d.id,
      name: d.name,
      account: {
        id: g.account.id,
        account: g.account.account,
        name: g.account.name,
        type: g.account.type ?? null,
        chain: g.account.chain ?? [],
        owners: g.account.owners ?? [],
        kycAmlStatus: g.account.KycAmlStatus ?? null,
      },
      transactions,
    };
  });
}

const EXPENSE_REPORTS_QUERY = `
  query {
    ExpenseReport {
      documents {
        items {
          id name
          state {
            global {
              status periodStart periodEnd
              wallets {
                wallet
                totals { group totalBudget totalForecast totalActuals totalPayments }
              }
            }
          }
        }
      }
    }
  }
`;

interface GroupTotalsRaw {
  group: string | null;
  totalBudget: number | null;
  totalForecast: number | null;
  totalActuals: number | null;
  totalPayments: number | null;
}

interface ExpenseReportItem {
  id: string;
  name: string;
  state: {
    global: {
      status: ExpenseReportStatus;
      periodStart: string | null;
      periodEnd: string | null;
      wallets: { wallet: string | null; totals: (GroupTotalsRaw | null)[] | null }[];
    };
  };
}

export async function fetchExpenseReports(): Promise<ExpenseReportDoc[]> {
  const data = await gql<{
    ExpenseReport: { documents: { items: ExpenseReportItem[] } };
  }>(EXPENSE_REPORTS_QUERY);
  return data.ExpenseReport.documents.items.map((d) => {
    const g = d.state.global;
    let totalBudget = 0;
    let totalActuals = 0;
    let totalForecast = 0;
    let totalPayments = 0;
    for (const w of g.wallets) {
      for (const t of w.totals ?? []) {
        if (!t) continue;
        totalBudget += t.totalBudget ?? 0;
        totalActuals += t.totalActuals ?? 0;
        totalForecast += t.totalForecast ?? 0;
        totalPayments += t.totalPayments ?? 0;
      }
    }
    return {
      id: d.id,
      name: d.name,
      status: g.status,
      periodStart: g.periodStart ?? null,
      periodEnd: g.periodEnd ?? null,
      walletCount: g.wallets.length,
      totalBudget,
      totalActuals,
      totalForecast,
      totalPayments,
    };
  });
}

const SNAPSHOT_REPORTS_QUERY = `
  query {
    SnapshotReport {
      documents {
        items {
          id name
          state {
            global {
              reportName reportPeriodStart reportPeriodEnd
              snapshotAccounts {
                id
                transactions { id amount direction }
              }
            }
          }
        }
      }
    }
  }
`;

interface SnapshotReportItem {
  id: string;
  name: string;
  state: {
    global: {
      reportName: string | null;
      reportPeriodStart: string | null;
      reportPeriodEnd: string | null;
      snapshotAccounts: {
        id: string;
        transactions: { id: string; amount: unknown; direction: TransactionDirection }[];
      }[];
    };
  };
}

export async function fetchSnapshotReports(): Promise<SnapshotReportDoc[]> {
  const data = await gql<{
    SnapshotReport: { documents: { items: SnapshotReportItem[] } };
  }>(SNAPSHOT_REPORTS_QUERY);
  return data.SnapshotReport.documents.items.map((d) => {
    const g = d.state.global;
    let netInflow = 0;
    let netOutflow = 0;
    for (const acc of g.snapshotAccounts) {
      for (const t of acc.transactions) {
        const n = amountToNumber(t.amount);
        if (t.direction === "INFLOW") netInflow += n;
        else netOutflow += n;
      }
    }
    return {
      id: d.id,
      name: d.name,
      reportName: g.reportName ?? null,
      periodStart: g.reportPeriodStart ?? null,
      periodEnd: g.reportPeriodEnd ?? null,
      accountCount: g.snapshotAccounts.length,
      netInflow,
      netOutflow,
    };
  });
}

/* -------------------------------- surveys -------------------------------- */

const SURVEYS_QUERY = `
  query {
    Survey {
      documents {
        items {
          id
          name
          state {
            global {
              title
              description
              kind
              status
              shareToken
              clientId
              clientName
              sections { id title description }
              questions {
                id sectionId type title helpText required
                options { id label }
                ratingScale { min max minLabel maxLabel }
                columns { id label type options { id label } }
              }
              responses {
                id submittedAt
                answers {
                  questionId text optionIds rating
                  rows { cells { columnId text optionId } }
                }
              }
              createdAt
              publishedAt
              closedAt
            }
          }
        }
      }
    }
  }
`;

interface SurveyItem {
  id: string;
  name: string;
  state: { global: Omit<SurveyDoc, "id" | "name"> };
}

export async function fetchSurveys(): Promise<SurveyDoc[]> {
  const data = await gql<{ Survey: { documents: { items: SurveyItem[] } } }>(
    SURVEYS_QUERY,
  );
  return data.Survey.documents.items.map((item) => ({
    id: item.id,
    name: item.name,
    ...item.state.global,
  }));
}

/** 128-bit unguessable token for the public share link. */
function randomToken(): string {
  const bytes = new Uint8Array(16);
  globalThis.crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

/** The opaque link handed to a respondent: `<docId>~<shareToken>`. */
export function surveyShareLink(origin: string, survey: SurveyDoc): string | null {
  if (!survey.shareToken) return null;
  return `${origin}/s/${survey.id}~${survey.shareToken}`;
}

async function createSurveyDocument(name: string): Promise<string> {
  const data = await gql<{ Survey: { createDocument: { id: string } } }>(
    `mutation($name: String!, $parent: String) {
      Survey { createDocument(name: $name, parentIdentifier: $parent) { id } }
    }`,
    { name, parent: DRIVE_ID },
  );
  return data.Survey.createDocument.id;
}

export async function createSurvey(
  title: string,
  kind: SurveyKind = "SURVEY",
): Promise<string> {
  const id = await createSurveyDocument(title || "Untitled survey");
  await surveyApi.setTitle(id, title);
  if (kind === "TEMPLATE") await surveyApi.setKind(id, "TEMPLATE");
  return id;
}

export interface FromTemplateInput {
  title: string;
  clientId: string | null;
  clientName: string | null;
}

/**
 * Instantiate a live survey from a template: copy the whole definition into a
 * fresh SURVEY document (reusing the template's section/question/option ids,
 * which are safe to reuse in a new document).
 */
export async function createSurveyFromTemplate(
  template: SurveyDoc,
  input: FromTemplateInput,
): Promise<string> {
  const id = await createSurveyDocument(input.title || "Untitled survey");
  await surveyApi.setTitle(id, input.title);
  if (template.description) await surveyApi.setDescription(id, template.description);
  if (input.clientId || input.clientName)
    await surveyApi.setRecipient(id, input.clientId, input.clientName);
  for (const section of template.sections) {
    await surveyApi.addSection(id, {
      id: section.id,
      title: section.title,
      description: section.description,
    });
  }
  for (const q of template.questions) {
    await surveyApi.addQuestion(id, {
      id: q.id,
      sectionId: q.sectionId,
      type: q.type,
      title: q.title,
      helpText: q.helpText,
      required: q.required,
      options: q.options,
      ratingScale: q.ratingScale,
      columns: q.columns,
    });
  }
  return id;
}

export interface NewSectionInput {
  id?: string;
  title: string;
  description: string | null;
}

export interface QuestionInput {
  id?: string;
  sectionId: string;
  type: SurveyQuestion["type"];
  title: string;
  helpText: string | null;
  required: boolean;
  options: SurveyQuestion["options"];
  ratingScale: SurveyQuestion["ratingScale"];
  columns: SurveyQuestion["columns"];
}

export const surveyApi = {
  setTitle: (docId: string, title: string) =>
    mutate("Survey", "setTitle", "docId: $docId, input: $input", {
      docId,
      input: { title },
    }),
  setDescription: (docId: string, description: string | null) =>
    mutate("Survey", "setDescription", "docId: $docId, input: $input", {
      docId,
      input: { description },
    }),
  setKind: (docId: string, kind: SurveyKind) =>
    mutate("Survey", "setSurveyKind", "docId: $docId, input: $input", {
      docId,
      input: { kind },
    }),
  setRecipient: (docId: string, clientId: string | null, clientName: string | null) =>
    mutate("Survey", "setRecipient", "docId: $docId, input: $input", {
      docId,
      input: { clientId, clientName },
    }),
  addSection: (docId: string, input: NewSectionInput) =>
    mutate("Survey", "addSection", "docId: $docId, input: $input", {
      docId,
      input: { id: input.id ?? randomId(), title: input.title, description: input.description },
    }),
  updateSection: (
    docId: string,
    id: string,
    patch: { title?: string; description?: string | null },
  ) =>
    mutate("Survey", "updateSection", "docId: $docId, input: $input", {
      docId,
      input: { id, ...patch },
    }),
  deleteSection: (docId: string, id: string) =>
    mutate("Survey", "deleteSection", "docId: $docId, input: $input", {
      docId,
      input: { id },
    }),
  reorderSections: (docId: string, order: string[]) =>
    mutate("Survey", "reorderSections", "docId: $docId, input: $input", {
      docId,
      input: { order },
    }),
  addQuestion: (docId: string, input: QuestionInput) =>
    mutate("Survey", "addQuestion", "docId: $docId, input: $input", {
      docId,
      input: { ...input, id: input.id ?? randomId() },
    }),
  updateQuestion: (
    docId: string,
    id: string,
    config: Omit<QuestionInput, "id" | "sectionId">,
  ) =>
    mutate("Survey", "updateQuestion", "docId: $docId, input: $input", {
      docId,
      input: { id, ...config },
    }),
  deleteQuestion: (docId: string, id: string) =>
    mutate("Survey", "deleteQuestion", "docId: $docId, input: $input", {
      docId,
      input: { id },
    }),
  moveQuestion: (docId: string, id: string, sectionId: string) =>
    mutate("Survey", "moveQuestion", "docId: $docId, input: $input", {
      docId,
      input: { id, sectionId },
    }),
  reorderQuestions: (docId: string, order: string[]) =>
    mutate("Survey", "reorderQuestions", "docId: $docId, input: $input", {
      docId,
      input: { order },
    }),
  publish: (docId: string) =>
    mutate("Survey", "publishSurvey", "docId: $docId, input: $input", {
      docId,
      input: { shareToken: randomToken(), publishedAt: new Date().toISOString() },
    }),
  close: (docId: string) =>
    mutate("Survey", "closeSurvey", "docId: $docId, input: $input", {
      docId,
      input: { closedAt: new Date().toISOString() },
    }),
  reopen: (docId: string) =>
    mutate("Survey", "reopenSurvey", "docId: $docId, input: $input", {
      docId,
      input: { _: true },
    }),
  regenerateToken: (docId: string) =>
    mutate("Survey", "regenerateShareToken", "docId: $docId, input: $input", {
      docId,
      input: { shareToken: randomToken() },
    }),
  deleteResponse: (docId: string, id: string) =>
    mutate("Survey", "deleteResponse", "docId: $docId, input: $input", {
      docId,
      input: { id },
    }),
};
