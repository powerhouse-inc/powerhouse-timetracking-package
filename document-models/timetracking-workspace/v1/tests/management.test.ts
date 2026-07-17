import {
  addClient,
  addMember,
  addProject,
  archiveClient,
  archiveMember,
  archiveProject,
  reducer,
  setMemberRole,
  setWorkspaceName,
  updateClient,
  updateMember,
  updateProject,
  utils,
  isTimetrackingWorkspaceDocument,
  SetWorkspaceNameInputSchema,
  AddMemberInputSchema,
  UpdateMemberInputSchema,
  SetMemberRoleInputSchema,
  ArchiveMemberInputSchema,
  AddClientInputSchema,
  UpdateClientInputSchema,
  ArchiveClientInputSchema,
  AddProjectInputSchema,
  UpdateProjectInputSchema,
  ArchiveProjectInputSchema,
} from "document-models/timetracking-workspace/v1";
import { describe, expect, it } from "vitest";

const lastError = (doc: ReturnType<typeof utils.createDocument>) => {
  const ops = doc.operations.global;
  return ops[ops.length - 1].error;
};

describe("TimetrackingWorkspace management reducers", () => {
  it("runs a full management flow", () => {
    let doc = utils.createDocument();

    // name
    doc = reducer(doc, setWorkspaceName({ name: "Powerhouse" }));
    expect(doc.state.global.name).toBe("Powerhouse");

    // clients
    doc = reducer(doc, addClient({ id: "c1", name: "Acme" }));
    doc = reducer(doc, addClient({ id: "c2", name: "Globex" }));
    expect(doc.state.global.clients).toHaveLength(2);
    expect(doc.state.global.clients[0].status).toBe("ACTIVE");

    doc = reducer(doc, updateClient({ id: "c1", name: "Acme Inc" }));
    expect(doc.state.global.clients[0].name).toBe("Acme Inc");
    // no-op update (name absent) leaves it unchanged
    doc = reducer(doc, updateClient({ id: "c1" }));
    expect(doc.state.global.clients[0].name).toBe("Acme Inc");

    doc = reducer(doc, archiveClient({ id: "c2" }));
    expect(doc.state.global.clients[1].status).toBe("ARCHIVED");

    // projects: with a client, and without a client
    doc = reducer(
      doc,
      addProject({
        id: "p1",
        name: "Website",
        clientId: "c1",
        color: "#ff0080",
        billable: true,
        hourlyRate: 120,
      }),
    );
    doc = reducer(
      doc,
      addProject({
        id: "p2",
        name: "Internal",
        color: "#8000ff",
        billable: false,
      }),
    );
    expect(doc.state.global.projects).toHaveLength(2);
    expect(doc.state.global.projects[0].clientId).toBe("c1");
    expect(doc.state.global.projects[1].clientId).toBeNull();
    expect(doc.state.global.projects[0].hourlyRate).toBe(120);
    expect(doc.state.global.projects[1].hourlyRate).toBeNull();

    // update every project field, incl billable:false (falsy but valid)
    doc = reducer(
      doc,
      updateProject({
        id: "p1",
        name: "Marketing Site",
        clientId: "c2",
        color: "#00ff80",
        billable: false,
        hourlyRate: 175,
      }),
    );
    expect(doc.state.global.projects[0]).toMatchObject({
      name: "Marketing Site",
      clientId: "c2",
      color: "#00ff80",
      billable: false,
      hourlyRate: 175,
    });
    // no-op project update (all optional fields absent)
    doc = reducer(doc, updateProject({ id: "p1" }));
    expect(doc.state.global.projects[0].name).toBe("Marketing Site");

    doc = reducer(doc, archiveProject({ id: "p2" }));
    expect(doc.state.global.projects[1].status).toBe("ARCHIVED");

    // members: with full details (incl address), and minimal (no address)
    doc = reducer(
      doc,
      addMember({
        id: "m1",
        address: "0xaaa",
        did: "did:key:zaaa",
        name: "Frank",
        avatarUrl: "https://example.com/a.png",
        role: "ADMIN",
      }),
    );
    doc = reducer(doc, addMember({ id: "m2", name: "Lumen", role: "MEMBER" }));
    expect(doc.state.global.members).toHaveLength(2);
    expect(doc.state.global.members[0].status).toBe("INVITED");
    expect(doc.state.global.members[1].address).toBeNull();
    expect(doc.state.global.members[1].did).toBeNull();
    expect(doc.state.global.members[1].avatarUrl).toBeNull();

    // update every member field
    doc = reducer(
      doc,
      updateMember({
        id: "m2",
        name: "Lumen Dev",
        avatarUrl: "https://example.com/l.png",
        status: "ACTIVE",
      }),
    );
    expect(doc.state.global.members[1]).toMatchObject({
      name: "Lumen Dev",
      avatarUrl: "https://example.com/l.png",
      status: "ACTIVE",
    });
    // no-op member update (all optional fields absent)
    doc = reducer(doc, updateMember({ id: "m2" }));
    expect(doc.state.global.members[1].name).toBe("Lumen Dev");

    doc = reducer(doc, setMemberRole({ id: "m2", role: "MANAGER" }));
    expect(doc.state.global.members[1].role).toBe("MANAGER");

    doc = reducer(doc, archiveMember({ id: "m1" }));
    expect(doc.state.global.members[0].status).toBe("ARCHIVED");
  });

  it("rejects a duplicate client id", () => {
    let doc = utils.createDocument();
    doc = reducer(doc, addClient({ id: "c1", name: "Acme" }));
    doc = reducer(doc, addClient({ id: "c1", name: "Acme 2" }));
    expect(lastError(doc)).toBe("Client id already exists");
    expect(doc.state.global.clients).toHaveLength(1);
  });

  it("rejects updating/archiving a missing client", () => {
    let doc = utils.createDocument();
    doc = reducer(doc, updateClient({ id: "nope", name: "x" }));
    expect(lastError(doc)).toBe("Client not found");
    doc = reducer(doc, archiveClient({ id: "nope" }));
    expect(lastError(doc)).toBe("Client not found");
  });

  it("rejects a duplicate project id", () => {
    let doc = utils.createDocument();
    doc = reducer(
      doc,
      addProject({ id: "p1", name: "A", color: "#fff", billable: true }),
    );
    doc = reducer(
      doc,
      addProject({ id: "p1", name: "B", color: "#000", billable: true }),
    );
    expect(lastError(doc)).toBe("Project id already exists");
    expect(doc.state.global.projects).toHaveLength(1);
  });

  it("rejects a project referencing a missing client", () => {
    let doc = utils.createDocument();
    doc = reducer(
      doc,
      addProject({
        id: "p1",
        name: "A",
        clientId: "ghost",
        color: "#fff",
        billable: true,
      }),
    );
    expect(lastError(doc)).toBe("Client not found");
    expect(doc.state.global.projects).toHaveLength(0);
  });

  it("rejects updating/archiving a missing project", () => {
    let doc = utils.createDocument();
    doc = reducer(doc, updateProject({ id: "nope", name: "x" }));
    expect(lastError(doc)).toBe("Project not found");
    doc = reducer(doc, archiveProject({ id: "nope" }));
    expect(lastError(doc)).toBe("Project not found");
  });

  it("rejects a duplicate member by id and by address", () => {
    let doc = utils.createDocument();
    doc = reducer(
      doc,
      addMember({ id: "m1", address: "0xaaa", name: "Frank", role: "ADMIN" }),
    );
    // duplicate id
    doc = reducer(doc, addMember({ id: "m1", name: "Other", role: "MEMBER" }));
    expect(lastError(doc)).toBe("Member id or address already exists");
    // duplicate address
    doc = reducer(
      doc,
      addMember({ id: "m2", address: "0xaaa", name: "Clone", role: "MEMBER" }),
    );
    expect(lastError(doc)).toBe("Member id or address already exists");
    expect(doc.state.global.members).toHaveLength(1);
  });

  it("rejects updating/role-setting/archiving a missing member", () => {
    let doc = utils.createDocument();
    doc = reducer(doc, updateMember({ id: "nope", name: "x" }));
    expect(lastError(doc)).toBe("Member not found");
    doc = reducer(doc, setMemberRole({ id: "nope", role: "ADMIN" }));
    expect(lastError(doc)).toBe("Member not found");
    doc = reducer(doc, archiveMember({ id: "nope" }));
    expect(lastError(doc)).toBe("Member not found");
  });
});
