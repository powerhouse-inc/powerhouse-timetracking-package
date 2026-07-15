import { generateMock } from "document-model";
import {
  addSnapshotAccount,
  addTransaction,
  AddTransactionInputSchema,
  isSnapshotReportDocument,
  recalculateFlowTypes,
  RecalculateFlowTypesInputSchema,
  reducer,
  removeTransaction,
  RemoveTransactionInputSchema,
  updateTransactionFlowType,
  UpdateTransactionFlowTypeInputSchema,
  utils,
} from "document-models/snapshot-report/v1";
import type {
  AccountTypeInput,
  AddTransactionInput,
} from "document-models/snapshot-report/v1";
import { describe, expect, it } from "vitest";

const ADDR = {
  source: "0x1111111111111111111111111111111111111111",
  internal: "0x2222222222222222222222222222222222222222",
  internal2: "0x3333333333333333333333333333333333333333",
  destination: "0x4444444444444444444444444444444444444444",
  external: "0x5555555555555555555555555555555555555555",
};

const amount = { unit: "USDC", value: "100.00" };

/** Build a document populated with one account of each type. */
function docWithAllAccounts() {
  let doc = utils.createDocument();
  const accounts: Array<[string, string, AccountTypeInput]> = [
    ["src", ADDR.source, "Source"],
    ["int", ADDR.internal, "Internal"],
    ["int2", ADDR.internal2, "Internal"],
    ["dst", ADDR.destination, "Destination"],
    ["ext", ADDR.external, "External"],
  ];
  for (const [id, accountAddress, type] of accounts) {
    doc = reducer(
      doc,
      addSnapshotAccount({
        id,
        accountId: `aid-${id}`,
        accountAddress,
        accountName: id,
        type,
      }),
    );
  }
  return doc;
}

function tx(overrides: Partial<AddTransactionInput>): AddTransactionInput {
  return {
    accountId: "src",
    id: "tx",
    transactionId: "t-1",
    amount,
    datetime: "2026-05-01T00:00:00.000Z",
    txHash: "0xhash",
    token: "USDC",
    direction: "OUTFLOW",
    ...overrides,
  };
}

describe("TransactionsOperations", () => {
  it("should handle addTransaction operation", () => {
    const document = utils.createDocument();
    const input = generateMock(AddTransactionInputSchema());

    const updatedDocument = reducer(document, addTransaction(input));

    expect(isSnapshotReportDocument(updatedDocument)).toBe(true);
    expect(updatedDocument.operations.global).toHaveLength(1);
    expect(updatedDocument.operations.global[0].action.type).toBe(
      "ADD_TRANSACTION",
    );
    expect(updatedDocument.operations.global[0].action.input).toStrictEqual(
      input,
    );
    expect(updatedDocument.operations.global[0].index).toEqual(0);
  });

  it("should handle removeTransaction operation", () => {
    const document = utils.createDocument();
    const input = generateMock(RemoveTransactionInputSchema());

    const updatedDocument = reducer(document, removeTransaction(input));

    expect(isSnapshotReportDocument(updatedDocument)).toBe(true);
    expect(updatedDocument.operations.global).toHaveLength(1);
    expect(updatedDocument.operations.global[0].action.type).toBe(
      "REMOVE_TRANSACTION",
    );
    expect(updatedDocument.operations.global[0].action.input).toStrictEqual(
      input,
    );
    expect(updatedDocument.operations.global[0].index).toEqual(0);
  });

  it("should handle updateTransactionFlowType operation", () => {
    const document = utils.createDocument();
    const input = generateMock(UpdateTransactionFlowTypeInputSchema());

    const updatedDocument = reducer(document, updateTransactionFlowType(input));

    expect(isSnapshotReportDocument(updatedDocument)).toBe(true);
    expect(updatedDocument.operations.global).toHaveLength(1);
    expect(updatedDocument.operations.global[0].action.type).toBe(
      "UPDATE_TRANSACTION_FLOW_TYPE",
    );
    expect(updatedDocument.operations.global[0].action.input).toStrictEqual(
      input,
    );
    expect(updatedDocument.operations.global[0].index).toEqual(0);
  });

  it("should handle recalculateFlowTypes operation", () => {
    const document = utils.createDocument();
    const input = generateMock(RecalculateFlowTypesInputSchema());

    const updatedDocument = reducer(document, recalculateFlowTypes(input));

    expect(isSnapshotReportDocument(updatedDocument)).toBe(true);
    expect(updatedDocument.operations.global).toHaveLength(1);
    expect(updatedDocument.operations.global[0].action.type).toBe(
      "RECALCULATE_FLOW_TYPES",
    );
    expect(updatedDocument.operations.global[0].action.input).toStrictEqual(
      input,
    );
    expect(updatedDocument.operations.global[0].index).toEqual(0);
  });

  it("should add transactions with and without optional fields", () => {
    const doc = docWithAllAccounts();
    // all optionals provided (truthy branches)
    const withOpts = reducer(
      doc,
      addTransaction(
        tx({
          id: "tx-full",
          counterParty: ADDR.internal,
          blockNumber: 123,
          flowType: "TopUp",
          counterPartyAccountId: "int",
        }),
      ),
    );
    const t1 = withOpts.state.global.snapshotAccounts.find(
      (a) => a.id === "src",
    )!.transactions[0];
    expect(t1.counterParty).toBe(ADDR.internal);
    expect(t1.blockNumber).toBe(123);
    expect(t1.flowType).toBe("TopUp");
    expect(t1.counterPartyAccountId).toBe("int");

    // all optionals omitted (null fallback branches)
    const withoutOpts = reducer(withOpts, addTransaction(tx({ id: "tx-min" })));
    const t2 = withoutOpts.state.global.snapshotAccounts.find(
      (a) => a.id === "src",
    )!.transactions[1];
    expect(t2.counterParty).toBeNull();
    expect(t2.blockNumber).toBeNull();
    expect(t2.flowType).toBeNull();
    expect(t2.counterPartyAccountId).toBeNull();
  });

  it("should error adding a transaction to a missing account", () => {
    const doc = docWithAllAccounts();
    const next = reducer(
      doc,
      addTransaction(tx({ accountId: "missing", id: "x" })),
    );
    expect(next.operations.global[5].error).toBe(
      "Account with ID missing not found",
    );
  });

  it("should error adding a duplicate transaction", () => {
    let doc = docWithAllAccounts();
    doc = reducer(doc, addTransaction(tx({ id: "dup" })));
    const next = reducer(doc, addTransaction(tx({ id: "dup" })));
    expect(next.operations.global[6].error).toBe(
      "Transaction with ID dup already exists",
    );
  });

  it("should remove a transaction and error when not found", () => {
    let doc = docWithAllAccounts();
    doc = reducer(doc, addTransaction(tx({ id: "rem" })));

    const notFound = reducer(doc, removeTransaction({ id: "nope" }));
    expect(notFound.operations.global[6].error).toBe(
      "Transaction with ID nope not found",
    );

    const removed = reducer(notFound, removeTransaction({ id: "rem" }));
    expect(
      removed.state.global.snapshotAccounts.find((a) => a.id === "src")!
        .transactions,
    ).toHaveLength(0);
  });

  it("should update a transaction flow type and error when not found", () => {
    let doc = docWithAllAccounts();
    doc = reducer(doc, addTransaction(tx({ id: "flow" })));

    const updated = reducer(
      doc,
      updateTransactionFlowType({ id: "flow", flowType: "Swap" }),
    );
    expect(
      updated.state.global.snapshotAccounts.find((a) => a.id === "src")!
        .transactions[0].flowType,
    ).toBe("Swap");

    const notFound = reducer(
      updated,
      updateTransactionFlowType({ id: "missing", flowType: "Return" }),
    );
    expect(notFound.operations.global[7].error).toBe(
      "Transaction with ID missing not found",
    );
  });

  function flowOf(doc: ReturnType<typeof utils.createDocument>, id: string) {
    for (const acc of doc.state.global.snapshotAccounts) {
      const found = acc.transactions.find((t) => t.id === id);
      if (found) return found;
    }
    return undefined;
  }

  it("should recalculate flow types across all categorization rules", () => {
    let doc = docWithAllAccounts();

    // OUTFLOW from Source -> TopUp; counterPartyAccountId missing -> auto-linked
    doc = reducer(
      doc,
      addTransaction(
        tx({ accountId: "src", id: "r1", counterParty: ADDR.internal }),
      ),
    );
    // OUTFLOW Internal -> Source => Return
    doc = reducer(
      doc,
      addTransaction(
        tx({ accountId: "int", id: "r2", counterParty: ADDR.source }),
      ),
    );
    // OUTFLOW Internal -> Destination => TopUp
    doc = reducer(
      doc,
      addTransaction(
        tx({ accountId: "int", id: "r3", counterParty: ADDR.destination }),
      ),
    );
    // OUTFLOW External -> Internal => External (fromType External)
    doc = reducer(
      doc,
      addTransaction(
        tx({ accountId: "ext", id: "r4", counterParty: ADDR.internal }),
      ),
    );
    // OUTFLOW Internal -> Internal => Internal
    doc = reducer(
      doc,
      addTransaction(
        tx({ accountId: "int", id: "r5", counterParty: ADDR.internal2 }),
      ),
    );
    // OUTFLOW Internal -> External => External
    doc = reducer(
      doc,
      addTransaction(
        tx({ accountId: "int", id: "r6", counterParty: ADDR.external }),
      ),
    );
    // OUTFLOW Destination -> Internal => else branch => External
    doc = reducer(
      doc,
      addTransaction(
        tx({ accountId: "dst", id: "r7", counterParty: ADDR.internal }),
      ),
    );
    // INFLOW: from = counterParty type, to = account type.
    // INFLOW into Source from Internal => toType Source => Return (exercises INFLOW ternary)
    doc = reducer(
      doc,
      addTransaction(
        tx({
          accountId: "src",
          id: "r8",
          direction: "INFLOW",
          counterParty: ADDR.internal,
        }),
      ),
    );
    // counterParty falsy -> skipped (continue branch)
    doc = reducer(doc, addTransaction(tx({ accountId: "int", id: "r9" })));
    // counterParty set but no matching account -> skipped
    doc = reducer(
      doc,
      addTransaction(
        tx({
          accountId: "int",
          id: "r10",
          counterParty: "0x9999999999999999999999999999999999999999",
        }),
      ),
    );
    // counterPartyAccountId already set -> not overwritten
    doc = reducer(
      doc,
      addTransaction(
        tx({
          accountId: "src",
          id: "r11",
          counterParty: ADDR.internal,
          counterPartyAccountId: "preset",
        }),
      ),
    );

    const recalced = reducer(doc, recalculateFlowTypes({ _: null }));

    expect(flowOf(recalced, "r1")!.flowType).toBe("TopUp");
    expect(flowOf(recalced, "r1")!.counterPartyAccountId).toBe("int");
    expect(flowOf(recalced, "r2")!.flowType).toBe("Return");
    expect(flowOf(recalced, "r3")!.flowType).toBe("TopUp");
    expect(flowOf(recalced, "r4")!.flowType).toBe("External");
    expect(flowOf(recalced, "r5")!.flowType).toBe("Internal");
    expect(flowOf(recalced, "r6")!.flowType).toBe("External");
    expect(flowOf(recalced, "r7")!.flowType).toBe("External");
    expect(flowOf(recalced, "r8")!.flowType).toBe("Return");
    // r9: no counterParty -> flowType untouched (null)
    expect(flowOf(recalced, "r9")!.flowType).toBeNull();
    // r10: no matching counterparty account -> untouched
    expect(flowOf(recalced, "r10")!.flowType).toBeNull();
    // r11: preset counterPartyAccountId preserved
    expect(flowOf(recalced, "r11")!.counterPartyAccountId).toBe("preset");
    expect(flowOf(recalced, "r11")!.flowType).toBe("TopUp");
  });
});
