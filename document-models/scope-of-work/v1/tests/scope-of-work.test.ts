import {
  editScopeOfWork,
  isScopeOfWorkDocument,
  reducer,
  utils,
} from "document-models/scope-of-work/v1";
import { describe, expect, it } from "vitest";

describe("ScopeOfWork header operations", () => {
  it("updates title, description and status when provided", () => {
    const document = utils.createDocument();

    const next = reducer(
      document,
      editScopeOfWork({
        title: "Q3 Scope",
        description: "The plan for Q3",
        status: "IN_PROGRESS",
      }),
    );

    expect(isScopeOfWorkDocument(next)).toBe(true);
    expect(next.operations.global[0].action.type).toBe("EDIT_SCOPE_OF_WORK");
    expect(next.state.global.title).toBe("Q3 Scope");
    expect(next.state.global.description).toBe("The plan for Q3");
    expect(next.state.global.status).toBe("IN_PROGRESS");
  });

  it("keeps previous values when fields are omitted (?? fallback)", () => {
    const document = utils.createDocument();

    const seeded = reducer(
      document,
      editScopeOfWork({
        title: "Seed",
        description: "Seed desc",
        status: "SUBMITTED",
      }),
    );

    // Omit every optional field -> should fall back to existing state.
    const next = reducer(seeded, editScopeOfWork({}));

    expect(next.state.global.title).toBe("Seed");
    expect(next.state.global.description).toBe("Seed desc");
    expect(next.state.global.status).toBe("SUBMITTED");
  });
});
