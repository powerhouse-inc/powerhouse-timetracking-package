import {
  addTransaction,
  deleteTransaction,
  isAccountTransactionsDocument,
  reducer,
  updateTransaction,
  updateTransactionPeriod,
  utils,
} from "document-models/account-transactions/v1";
import type { AddTransactionInput } from "document-models/account-transactions/v1";
import { describe, expect, it } from "vitest";

const fullTx: AddTransactionInput = {
  id: "tx-1",
  counterParty: "0x1111111111111111111111111111111111111111",
  amount: { unit: "USD", value: "100" },
  datetime: "2026-01-01T00:00:00.000Z",
  txHash: "0xhash1",
  token: "USD",
  blockNumber: 123,
  uniqueId: "unique-1",
  budget: "budget-1",
  accountingPeriod: "2026-01",
  direction: "INFLOW",
};

describe("TransactionsOperations", () => {
  it("should handle addTransaction operation with all fields", () => {
    const document = utils.createDocument();

    const next = reducer(document, addTransaction(fullTx));

    expect(isAccountTransactionsDocument(next)).toBe(true);
    expect(next.operations.global).toHaveLength(1);
    expect(next.operations.global[0].action.type).toBe("ADD_TRANSACTION");
    expect(next.state.global.transactions).toHaveLength(1);
    const tx = next.state.global.transactions[0];
    expect(tx.id).toBe("tx-1");
    expect(tx.counterParty).toBe("0x1111111111111111111111111111111111111111");
    expect(tx.details.txHash).toBe("0xhash1");
    expect(tx.details.token).toBe("USD");
    expect(tx.details.blockNumber).toBe(123);
    expect(tx.details.uniqueId).toBe("unique-1");
    expect(tx.budget).toBe("budget-1");
    expect(tx.direction).toBe("INFLOW");
  });

  it("should handle addTransaction with only required fields (falsy optionals -> null)", () => {
    const document = utils.createDocument();

    const next = reducer(
      document,
      addTransaction({
        id: "tx-min",
        amount: { unit: "USD", value: "5" },
        datetime: "2026-02-01T00:00:00.000Z",
        txHash: "0xhashmin",
        token: "USD",
        accountingPeriod: "2026-02",
        direction: "OUTFLOW",
      }),
    );

    expect(next.operations.global[0].error).toBeUndefined();
    const tx = next.state.global.transactions[0];
    expect(tx.counterParty).toBeNull();
    expect(tx.details.blockNumber).toBeNull();
    expect(tx.details.uniqueId).toBeNull();
    expect(tx.budget).toBeNull();
    expect(tx.direction).toBe("OUTFLOW");
  });

  it("should reject a duplicate uniqueId and not mutate state", () => {
    const document = utils.createDocument();
    const withFirst = reducer(document, addTransaction(fullTx));

    const next = reducer(withFirst, addTransaction({ ...fullTx, id: "tx-2" }));

    // Duplicate is dispatched as the 2nd operation (index 1)
    expect(next.operations.global[1].error).toBe(
      "Transaction with uniqueId unique-1 already exists",
    );
    // State not mutated: still only the first transaction
    expect(next.state.global.transactions).toHaveLength(1);
  });

  it("should update every field of an existing transaction", () => {
    const document = utils.createDocument();
    const withTx = reducer(document, addTransaction(fullTx));

    const next = reducer(
      withTx,
      updateTransaction({
        id: "tx-1",
        counterParty: "0x2222222222222222222222222222222222222222",
        amount: { unit: "EUR", value: "200" },
        datetime: "2026-03-01T00:00:00.000Z",
        txHash: "0xhash2",
        token: "EUR",
        blockNumber: 456,
        uniqueId: "unique-2",
        direction: "OUTFLOW",
      }),
    );

    expect(next.operations.global[1].error).toBeUndefined();
    const tx = next.state.global.transactions[0];
    expect(tx.counterParty).toBe("0x2222222222222222222222222222222222222222");
    expect(tx.amount).toStrictEqual({ unit: "EUR", value: "200" });
    expect(tx.datetime).toBe("2026-03-01T00:00:00.000Z");
    expect(tx.details.txHash).toBe("0xhash2");
    expect(tx.details.token).toBe("EUR");
    expect(tx.details.blockNumber).toBe(456);
    expect(tx.details.uniqueId).toBe("unique-2");
    expect(tx.direction).toBe("OUTFLOW");
  });

  it("should leave fields untouched when update omits them (undefined branches)", () => {
    const document = utils.createDocument();
    const withTx = reducer(document, addTransaction(fullTx));

    // Only id provided -> every optional `if` guard is false
    const next = reducer(withTx, updateTransaction({ id: "tx-1" }));

    expect(next.operations.global[1].error).toBeUndefined();
    const tx = next.state.global.transactions[0];
    expect(tx.counterParty).toBe("0x1111111111111111111111111111111111111111");
    expect(tx.details.blockNumber).toBe(123);
    expect(tx.details.uniqueId).toBe("unique-1");
    expect(tx.direction).toBe("INFLOW");
  });

  it("should clear blockNumber and uniqueId when explicitly set to null", () => {
    const document = utils.createDocument();
    const withTx = reducer(document, addTransaction(fullTx));

    const next = reducer(
      withTx,
      updateTransaction({ id: "tx-1", blockNumber: null, uniqueId: null }),
    );

    expect(next.operations.global[1].error).toBeUndefined();
    const tx = next.state.global.transactions[0];
    expect(tx.details.blockNumber).toBeNull();
    expect(tx.details.uniqueId).toBeNull();
  });

  it("should return error when updating a non-existent transaction", () => {
    const document = utils.createDocument();

    const next = reducer(
      document,
      updateTransaction({ id: "missing", amount: { unit: "USD", value: "1" } }),
    );

    expect(next.operations.global[0].error).toBe(
      "Transaction with id missing not found",
    );
    expect(next.state.global.transactions).toHaveLength(0);
  });

  it("should update the accounting period of an existing transaction", () => {
    const document = utils.createDocument();
    const withTx = reducer(document, addTransaction(fullTx));

    const next = reducer(
      withTx,
      updateTransactionPeriod({ id: "tx-1", accountingPeriod: "2026-Q1" }),
    );

    expect(next.operations.global[1].error).toBeUndefined();
    expect(next.state.global.transactions[0].accountingPeriod).toBe("2026-Q1");
  });

  it("should coerce an empty accounting period to an empty string", () => {
    const document = utils.createDocument();
    const withTx = reducer(document, addTransaction(fullTx));

    const next = reducer(
      withTx,
      updateTransactionPeriod({ id: "tx-1", accountingPeriod: "" }),
    );

    expect(next.operations.global[1].error).toBeUndefined();
    expect(next.state.global.transactions[0].accountingPeriod).toBe("");
  });

  it("should return error when updating the period of a non-existent transaction", () => {
    const document = utils.createDocument();

    const next = reducer(
      document,
      updateTransactionPeriod({ id: "missing", accountingPeriod: "2026-01" }),
    );

    expect(next.operations.global[0].error).toBe(
      "Transaction with id missing not found",
    );
  });

  it("should delete an existing transaction and keep the rest", () => {
    const document = utils.createDocument();
    const withA = reducer(document, addTransaction(fullTx));
    const withB = reducer(
      withA,
      addTransaction({ ...fullTx, id: "tx-2", uniqueId: "unique-9" }),
    );

    const next = reducer(withB, deleteTransaction({ id: "tx-1" }));

    expect(next.operations.global[2].error).toBeUndefined();
    expect(next.state.global.transactions).toHaveLength(1);
    expect(next.state.global.transactions[0].id).toBe("tx-2");
  });
});
