import { generateMock } from "document-model";
import {
  addSnapshotAccount,
  AddSnapshotAccountInputSchema,
  isSnapshotReportDocument,
  reducer,
  removeSnapshotAccount,
  RemoveSnapshotAccountInputSchema,
  updateSnapshotAccountType,
  UpdateSnapshotAccountTypeInputSchema,
  utils,
} from "document-models/snapshot-report/v1";
import { describe, expect, it } from "vitest";

describe("AccountsOperations", () => {
  it("should handle addSnapshotAccount operation", () => {
    const document = utils.createDocument();
    const input = generateMock(AddSnapshotAccountInputSchema());

    const updatedDocument = reducer(document, addSnapshotAccount(input));

    expect(isSnapshotReportDocument(updatedDocument)).toBe(true);
    expect(updatedDocument.operations.global).toHaveLength(1);
    expect(updatedDocument.operations.global[0].action.type).toBe(
      "ADD_SNAPSHOT_ACCOUNT",
    );
    expect(updatedDocument.operations.global[0].action.input).toStrictEqual(
      input,
    );
    expect(updatedDocument.operations.global[0].index).toEqual(0);
  });

  it("should handle updateSnapshotAccountType operation", () => {
    const document = utils.createDocument();
    const input = generateMock(UpdateSnapshotAccountTypeInputSchema());

    const updatedDocument = reducer(document, updateSnapshotAccountType(input));

    expect(isSnapshotReportDocument(updatedDocument)).toBe(true);
    expect(updatedDocument.operations.global).toHaveLength(1);
    expect(updatedDocument.operations.global[0].action.type).toBe(
      "UPDATE_SNAPSHOT_ACCOUNT_TYPE",
    );
    expect(updatedDocument.operations.global[0].action.input).toStrictEqual(
      input,
    );
    expect(updatedDocument.operations.global[0].index).toEqual(0);
  });

  it("should handle removeSnapshotAccount operation", () => {
    const document = utils.createDocument();
    const input = generateMock(RemoveSnapshotAccountInputSchema());

    const updatedDocument = reducer(document, removeSnapshotAccount(input));

    expect(isSnapshotReportDocument(updatedDocument)).toBe(true);
    expect(updatedDocument.operations.global).toHaveLength(1);
    expect(updatedDocument.operations.global[0].action.type).toBe(
      "REMOVE_SNAPSHOT_ACCOUNT",
    );
    expect(updatedDocument.operations.global[0].action.input).toStrictEqual(
      input,
    );
    expect(updatedDocument.operations.global[0].index).toEqual(0);
  });

  it("should add accounts with and without accountTransactionsId", () => {
    const document = utils.createDocument();
    const withTx = reducer(
      document,
      addSnapshotAccount({
        id: "acc-1",
        accountId: "aid-1",
        accountAddress: "0x1111111111111111111111111111111111111111",
        accountName: "Treasury",
        type: "Source",
        accountTransactionsId: "phd:tx-doc-1",
      }),
    );
    const withoutTx = reducer(
      withTx,
      addSnapshotAccount({
        id: "acc-2",
        accountId: "aid-2",
        accountAddress: "0x2222222222222222222222222222222222222222",
        accountName: "Ops",
        type: "Internal",
        // accountTransactionsId omitted -> `|| null` fallback branch
      }),
    );

    expect(withoutTx.state.global.snapshotAccounts).toHaveLength(2);
    const [a1, a2] = withoutTx.state.global.snapshotAccounts;
    expect(a1.accountTransactionsId).toBe("phd:tx-doc-1");
    expect(a1.type).toBe("Source");
    expect(a1.startingBalances).toStrictEqual([]);
    expect(a1.endingBalances).toStrictEqual([]);
    expect(a1.transactions).toStrictEqual([]);
    expect(a2.accountTransactionsId).toBeNull();
  });

  it("should record an error when adding a duplicate account", () => {
    const document = utils.createDocument();
    const added = reducer(
      document,
      addSnapshotAccount({
        id: "dup",
        accountId: "aid",
        accountAddress: "0x3333333333333333333333333333333333333333",
        accountName: "Dup",
        type: "Internal",
      }),
    );
    const next = reducer(
      added,
      addSnapshotAccount({
        id: "dup",
        accountId: "aid",
        accountAddress: "0x3333333333333333333333333333333333333333",
        accountName: "Dup",
        type: "Internal",
      }),
    );
    expect(next.operations.global[1].error).toBe(
      "Account with ID dup already exists",
    );
    expect(next.state.global.snapshotAccounts).toHaveLength(1);
  });

  it("should update an account type and error when not found", () => {
    const document = utils.createDocument();
    const added = reducer(
      document,
      addSnapshotAccount({
        id: "acc-x",
        accountId: "aid-x",
        accountAddress: "0x4444444444444444444444444444444444444444",
        accountName: "X",
        type: "Internal",
      }),
    );
    const updated = reducer(
      added,
      updateSnapshotAccountType({ id: "acc-x", type: "Destination" }),
    );
    expect(updated.state.global.snapshotAccounts[0].type).toBe("Destination");

    const notFound = reducer(
      updated,
      updateSnapshotAccountType({ id: "missing", type: "External" }),
    );
    expect(notFound.operations.global[2].error).toBe(
      "Account with ID missing not found",
    );
  });

  it("should remove an account and error when not found", () => {
    const document = utils.createDocument();
    const added = reducer(
      document,
      addSnapshotAccount({
        id: "acc-del",
        accountId: "aid-del",
        accountAddress: "0x5555555555555555555555555555555555555555",
        accountName: "Del",
        type: "Internal",
      }),
    );
    const notFound = reducer(added, removeSnapshotAccount({ id: "nope" }));
    expect(notFound.operations.global[1].error).toBe(
      "Account with ID nope not found",
    );
    expect(notFound.state.global.snapshotAccounts).toHaveLength(1);

    const removed = reducer(notFound, removeSnapshotAccount({ id: "acc-del" }));
    expect(removed.state.global.snapshotAccounts).toHaveLength(0);
  });
});
