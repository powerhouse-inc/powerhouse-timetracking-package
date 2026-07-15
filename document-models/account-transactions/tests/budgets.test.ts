import { generateMock } from "document-model";
import { describe, expect, it } from "vitest";
import {
  reducer,
  utils,
  isAccountTransactionsDocument,
  addBudget,
  updateBudget,
  deleteBudget,
  AddBudgetInputSchema,
  UpdateBudgetInputSchema,
  DeleteBudgetInputSchema,
} from "document-models/account-transactions";

describe("BudgetsOperations", () => {
  it("should handle addBudget operation", () => {
    const document = utils.createDocument();
    const input = generateMock(AddBudgetInputSchema());

    const updatedDocument = reducer(document, addBudget(input));

    expect(isAccountTransactionsDocument(updatedDocument)).toBe(true);
    expect(updatedDocument.operations.global).toHaveLength(1);
    expect(updatedDocument.operations.global[0].action.type).toBe("ADD_BUDGET");
    expect(updatedDocument.operations.global[0].action.input).toStrictEqual(
      input,
    );
    expect(updatedDocument.operations.global[0].index).toEqual(0);
  });

  it("should handle updateBudget operation", () => {
    const document = utils.createDocument();
    const input = generateMock(UpdateBudgetInputSchema());

    const updatedDocument = reducer(document, updateBudget(input));

    expect(isAccountTransactionsDocument(updatedDocument)).toBe(true);
    expect(updatedDocument.operations.global).toHaveLength(1);
    expect(updatedDocument.operations.global[0].action.type).toBe(
      "UPDATE_BUDGET",
    );
    expect(updatedDocument.operations.global[0].action.input).toStrictEqual(
      input,
    );
    expect(updatedDocument.operations.global[0].index).toEqual(0);
  });

  it("should handle deleteBudget operation", () => {
    const document = utils.createDocument();
    const input = generateMock(DeleteBudgetInputSchema());

    const updatedDocument = reducer(document, deleteBudget(input));

    expect(isAccountTransactionsDocument(updatedDocument)).toBe(true);
    expect(updatedDocument.operations.global).toHaveLength(1);
    expect(updatedDocument.operations.global[0].action.type).toBe(
      "DELETE_BUDGET",
    );
    expect(updatedDocument.operations.global[0].action.input).toStrictEqual(
      input,
    );
    expect(updatedDocument.operations.global[0].index).toEqual(0);
  });
});
