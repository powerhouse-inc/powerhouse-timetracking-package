import {
  addBudget,
  deleteBudget,
  isAccountTransactionsDocument,
  reducer,
  updateBudget,
  utils,
} from "document-models/account-transactions/v1";
import { describe, expect, it } from "vitest";

describe("BudgetsOperations", () => {
  it("should add a budget with a name and one without (null branch)", () => {
    const document = utils.createDocument();
    const withNamed = reducer(document, addBudget({ id: "b1", name: "Ops" }));
    const next = reducer(withNamed, addBudget({ id: "b2" }));

    expect(isAccountTransactionsDocument(next)).toBe(true);
    expect(next.operations.global[0].action.type).toBe("ADD_BUDGET");
    expect(next.state.global.budgets).toHaveLength(2);
    expect(next.state.global.budgets[0]).toStrictEqual({
      id: "b1",
      name: "Ops",
    });
    expect(next.state.global.budgets[1]).toStrictEqual({
      id: "b2",
      name: null,
    });
  });

  it("should update the name of an existing budget", () => {
    const document = utils.createDocument();
    const withBudget = reducer(document, addBudget({ id: "b1", name: "Ops" }));

    const next = reducer(
      withBudget,
      updateBudget({ id: "b1", name: "Ops v2" }),
    );

    expect(next.operations.global[1].error).toBeUndefined();
    expect(next.state.global.budgets[0].name).toBe("Ops v2");
  });

  it("should leave the name untouched when update omits it", () => {
    const document = utils.createDocument();
    const withBudget = reducer(document, addBudget({ id: "b1", name: "Ops" }));

    const next = reducer(withBudget, updateBudget({ id: "b1" }));

    expect(next.operations.global[1].error).toBeUndefined();
    expect(next.state.global.budgets[0].name).toBe("Ops");
  });

  it("should return error when updating a non-existent budget", () => {
    const document = utils.createDocument();

    const next = reducer(document, updateBudget({ id: "missing", name: "x" }));

    expect(next.operations.global[0].error).toBe(
      "Budget with id missing not found",
    );
    expect(next.state.global.budgets).toHaveLength(0);
  });

  it("should delete an existing budget and keep the rest", () => {
    const document = utils.createDocument();
    const withA = reducer(document, addBudget({ id: "b1", name: "Ops" }));
    const withB = reducer(withA, addBudget({ id: "b2", name: "Marketing" }));

    const next = reducer(withB, deleteBudget({ id: "b1" }));

    expect(next.operations.global[2].error).toBeUndefined();
    expect(next.state.global.budgets).toHaveLength(1);
    expect(next.state.global.budgets[0].id).toBe("b2");
  });
});
