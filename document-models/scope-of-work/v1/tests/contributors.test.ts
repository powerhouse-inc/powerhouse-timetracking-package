import {
  addAgent,
  editAgent,
  isScopeOfWorkDocument,
  reducer,
  removeAgent,
  utils,
} from "document-models/scope-of-work/v1";
import { describe, expect, it } from "vitest";

describe("Contributors operations", () => {
  it("adds agents with and without optional icon/description", () => {
    const document = utils.createDocument();

    const withOptional = reducer(
      document,
      addAgent({
        id: "agent-1",
        name: "Alice",
        icon: "https://example.com/a.png",
        description: "Lead",
      }),
    );
    const both = reducer(
      withOptional,
      // omit icon/description -> `|| null` fallback branch
      addAgent({ id: "agent-2", name: "Bob" }),
    );

    expect(isScopeOfWorkDocument(both)).toBe(true);
    expect(both.state.global.contributors).toHaveLength(2);
    expect(both.state.global.contributors[0]).toMatchObject({
      id: "agent-1",
      name: "Alice",
      icon: "https://example.com/a.png",
      description: "Lead",
    });
    expect(both.state.global.contributors[1]).toMatchObject({
      id: "agent-2",
      name: "Bob",
      icon: null,
      description: null,
    });
  });

  it("rejects duplicate agent ids and does not mutate state", () => {
    const document = utils.createDocument();
    const seeded = reducer(document, addAgent({ id: "dup", name: "First" }));

    const next = reducer(seeded, addAgent({ id: "dup", name: "Second" }));

    expect(next.operations.global[1].error).toBe(
      "Agent with ID dup already exists",
    );
    expect(next.state.global.contributors).toHaveLength(1);
    expect(next.state.global.contributors[0].name).toBe("First");
  });

  it("edits an agent, covering both present and omitted optional fields", () => {
    const document = utils.createDocument();
    const seeded = reducer(
      document,
      addAgent({
        id: "a",
        name: "Alice",
        icon: "https://example.com/a.png",
        description: "Lead",
      }),
    );

    // Provide every field (all !== undefined branches).
    const fullEdit = reducer(
      seeded,
      editAgent({
        id: "a",
        name: "Alicia",
        icon: "https://example.com/b.png",
        description: "Manager",
      }),
    );
    expect(fullEdit.state.global.contributors[0]).toMatchObject({
      name: "Alicia",
      icon: "https://example.com/b.png",
      description: "Manager",
    });

    // Omit all optional fields -> keep existing values (=== undefined branches).
    const noopEdit = reducer(fullEdit, editAgent({ id: "a" }));
    expect(noopEdit.state.global.contributors[0]).toMatchObject({
      name: "Alicia",
      icon: "https://example.com/b.png",
      description: "Manager",
    });
  });

  it("removes an agent", () => {
    const document = utils.createDocument();
    const seeded = reducer(document, addAgent({ id: "a", name: "Alice" }));

    const next = reducer(seeded, removeAgent({ id: "a" }));

    expect(next.state.global.contributors).toHaveLength(0);
  });

  it("returns AgentNotFound errors for edit/remove of missing agents", () => {
    const document = utils.createDocument();

    const removed = reducer(document, removeAgent({ id: "missing" }));
    expect(removed.operations.global[0].error).toBe(
      "Agent with ID missing not found",
    );

    const edited = reducer(document, editAgent({ id: "missing", name: "X" }));
    expect(edited.operations.global[0].error).toBe(
      "Agent with ID missing not found",
    );
  });
});
