import { DRIVE_ID } from "./config";
import { gql } from "./gql";
import type {
  Role,
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
  namespace: "Timesheet" | "TimetrackingWorkspace",
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
