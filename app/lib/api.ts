import { DRIVE_ID } from "./config";
import { gql } from "./gql";
import type {
  DeliverableStatus,
  Lead,
  LeadPriority,
  LeadSource,
  LeadStage,
  Role,
  ScopeOfWorkDoc,
  SowDeliverable,
  SowProject,
  SowStatus,
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
              projects { id name clientId color billable status }
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
      members: WorkspaceMember[];
      clients: { id: string; name: string; status: WorkspaceClient["status"] }[];
      projects: {
        id: string;
        name: string;
        clientId: string | null;
        color: string;
        billable: boolean;
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
    members: g.members,
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
    patch: { name?: string; clientId?: string | null; color?: string; billable?: boolean },
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
                id name company email phone source stage priority
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

/* ============================== delivery =============================== */

interface RawProgress {
  __typename: "StoryPoint" | "Percentage" | "Binary";
  total?: number;
  completed?: number;
  value?: number;
  done?: boolean | null;
}

function normalizeProgress(p: RawProgress | null): number | null {
  if (!p) return null;
  if (p.__typename === "Percentage") return p.value ?? 0;
  if (p.__typename === "Binary") return p.done ? 100 : 0;
  if (p.__typename === "StoryPoint") {
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
              projects { id code title budget currency budgetType }
              deliverables {
                id title code description status
                budgetAnchor { project unit unitCost quantity margin }
                workProgress {
                  __typename
                  ... on StoryPoint { total completed }
                  ... on Percentage { value }
                  ... on Binary { done }
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
    patch: { title?: string; status?: DeliverableStatus },
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
