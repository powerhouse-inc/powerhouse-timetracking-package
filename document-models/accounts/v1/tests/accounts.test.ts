import {
  addAccount,
  deleteAccount,
  isAccountsDocument,
  reducer,
  updateAccount,
  updateKycStatus,
  utils,
} from "document-models/accounts/v1";
import type {
  AccountsGlobalState,
  AddAccountAction,
  AddAccountInput,
  UpdateKycStatusAction,
} from "document-models/accounts/v1";
import { describe, expect, it } from "vitest";
// The operation functions are only reachable directly for the two purely
// defensive branches below: the generated reducer wrapper runs
// `<Op>InputSchema().parse(action.input)` first, so an invalid/missing enum
// value is rejected before the operation body ever executes.
import { accountsAccountsOperations } from "../src/reducers/accounts.js";

describe("Accounts reducer", () => {
  it("adds an account with every optional field populated (truthy branches)", () => {
    const document = utils.createDocument();
    const input: AddAccountInput = {
      id: "acc-1",
      account: "0xabc",
      name: "Treasury",
      budgetPath: "budget/treasury",
      accountTransactionsId: "txn-1",
      chain: ["ethereum", "gnosis"],
      type: "Source",
      owners: ["alice", "bob"],
      KycAmlStatus: "PASSED",
    };

    const next = reducer(document, addAccount(input));

    expect(isAccountsDocument(next)).toBe(true);
    expect(next.operations.global).toHaveLength(1);
    expect(next.operations.global[0].error).toBeUndefined();
    expect(next.state.global.accounts).toHaveLength(1);
    expect(next.state.global.accounts[0]).toMatchObject({
      id: "acc-1",
      account: "0xabc",
      name: "Treasury",
      budgetPath: "budget/treasury",
      accountTransactionsId: "txn-1",
      chain: ["ethereum", "gnosis"],
      type: "Source",
      owners: ["alice", "bob"],
      KycAmlStatus: "PASSED",
    });
  });

  it("adds an account omitting every optional field and empty required strings (falsy branches)", () => {
    const document = utils.createDocument();
    const input: AddAccountInput = {
      id: "acc-2",
      account: "",
      name: "",
      type: "Internal",
    };

    const next = reducer(document, addAccount(input));

    expect(next.operations.global[0].error).toBeUndefined();
    const acc = next.state.global.accounts[0];
    expect(acc.account).toBe("");
    expect(acc.name).toBe("");
    expect(acc.budgetPath).toBe("");
    expect(acc.accountTransactionsId).toBe("");
    expect(acc.chain).toEqual([]);
    expect(acc.owners).toEqual([]);
    expect(acc.KycAmlStatus).toBe("PENDING");
    expect(acc.type).toBe("Internal");
  });

  it("supports all account types across a multi-account scenario", () => {
    let doc = utils.createDocument();

    doc = reducer(
      doc,
      addAccount({ id: "s", account: "s", name: "Src", type: "Source" }),
    );
    doc = reducer(
      doc,
      addAccount({ id: "i", account: "i", name: "Int", type: "Internal" }),
    );
    doc = reducer(
      doc,
      addAccount({
        id: "d",
        account: "d",
        name: "Dst",
        type: "Destination",
      }),
    );
    doc = reducer(
      doc,
      addAccount({ id: "e", account: "e", name: "Ext", type: "External" }),
    );

    expect(doc.state.global.accounts.map((a) => a.type)).toEqual([
      "Source",
      "Internal",
      "Destination",
      "External",
    ]);
  });

  it("updates every field of an existing account (all if-branches truthy)", () => {
    let doc = utils.createDocument();
    doc = reducer(
      doc,
      addAccount({ id: "acc-1", account: "old", name: "Old", type: "Source" }),
    );

    doc = reducer(
      doc,
      updateAccount({
        id: "acc-1",
        account: "new",
        name: "New",
        budgetPath: "b/new",
        accountTransactionsId: "txn-9",
        chain: ["base"],
        type: "Destination",
        owners: ["carol"],
        KycAmlStatus: "FAILED",
      }),
    );

    expect(doc.operations.global[1].error).toBeUndefined();
    expect(doc.state.global.accounts[0]).toMatchObject({
      id: "acc-1",
      account: "new",
      name: "New",
      budgetPath: "b/new",
      accountTransactionsId: "txn-9",
      chain: ["base"],
      type: "Destination",
      owners: ["carol"],
      KycAmlStatus: "FAILED",
    });
  });

  it("leaves fields unchanged when update input omits them (all if-branches falsy)", () => {
    let doc = utils.createDocument();
    doc = reducer(
      doc,
      addAccount({
        id: "acc-1",
        account: "orig",
        name: "Orig",
        budgetPath: "b/orig",
        accountTransactionsId: "txn-orig",
        chain: ["eth"],
        type: "Source",
        owners: ["owner1"],
        KycAmlStatus: "PASSED",
      }),
    );

    // Only id provided => no field-level if should trigger.
    doc = reducer(doc, updateAccount({ id: "acc-1" }));

    expect(doc.operations.global[1].error).toBeUndefined();
    expect(doc.state.global.accounts[0]).toMatchObject({
      account: "orig",
      name: "Orig",
      budgetPath: "b/orig",
      accountTransactionsId: "txn-orig",
      chain: ["eth"],
      type: "Source",
      owners: ["owner1"],
      KycAmlStatus: "PASSED",
    });
  });

  it("records an error and does not mutate state when updating a missing account", () => {
    let doc = utils.createDocument();
    doc = reducer(
      doc,
      addAccount({ id: "acc-1", account: "a", name: "A", type: "Source" }),
    );

    const next = reducer(doc, updateAccount({ id: "missing", name: "Nope" }));

    expect(next.operations.global[1].error).toBe(
      "Account with id missing not found",
    );
    expect(next.state.global.accounts).toHaveLength(1);
    expect(next.state.global.accounts[0].name).toBe("A");
  });

  it("deletes an existing account", () => {
    let doc = utils.createDocument();
    doc = reducer(
      doc,
      addAccount({ id: "keep", account: "k", name: "Keep", type: "Source" }),
    );
    doc = reducer(
      doc,
      addAccount({ id: "drop", account: "d", name: "Drop", type: "Internal" }),
    );

    doc = reducer(doc, deleteAccount({ id: "drop" }));

    expect(doc.operations.global[2].error).toBeUndefined();
    expect(doc.state.global.accounts.map((a) => a.id)).toEqual(["keep"]);
  });

  it("deleting a non-existent account is a no-op without error", () => {
    let doc = utils.createDocument();
    doc = reducer(
      doc,
      addAccount({ id: "keep", account: "k", name: "Keep", type: "Source" }),
    );

    doc = reducer(doc, deleteAccount({ id: "ghost" }));

    expect(doc.operations.global[1].error).toBeUndefined();
    expect(doc.state.global.accounts).toHaveLength(1);
  });

  it("updates KYC status to each valid value", () => {
    let doc = utils.createDocument();
    doc = reducer(
      doc,
      addAccount({ id: "acc-1", account: "a", name: "A", type: "Source" }),
    );

    doc = reducer(
      doc,
      updateKycStatus({ id: "acc-1", KycAmlStatus: "PASSED" }),
    );
    expect(doc.state.global.accounts[0].KycAmlStatus).toBe("PASSED");

    doc = reducer(
      doc,
      updateKycStatus({ id: "acc-1", KycAmlStatus: "PENDING" }),
    );
    expect(doc.state.global.accounts[0].KycAmlStatus).toBe("PENDING");

    doc = reducer(
      doc,
      updateKycStatus({ id: "acc-1", KycAmlStatus: "FAILED" }),
    );
    expect(doc.state.global.accounts[0].KycAmlStatus).toBe("FAILED");
  });

  it("records an error when updating KYC status of a missing account", () => {
    let doc = utils.createDocument();
    doc = reducer(
      doc,
      addAccount({ id: "acc-1", account: "a", name: "A", type: "Source" }),
    );

    const next = reducer(
      doc,
      updateKycStatus({ id: "missing", KycAmlStatus: "PASSED" }),
    );

    expect(next.operations.global[1].error).toBe(
      "Account with id missing not found",
    );
    expect(next.state.global.accounts[0].KycAmlStatus).toBe("PENDING");
  });
});

describe("Accounts operations (defensive branches)", () => {
  it("addAccountOperation throws when type is falsy and does not push", () => {
    const state: AccountsGlobalState = { accounts: [] };
    const action = {
      input: { id: "x", account: "a", name: "n", type: undefined },
    } as unknown as AddAccountAction;

    let message = "";
    try {
      accountsAccountsOperations.addAccountOperation(state, action);
    } catch (error) {
      message = (error as Error).message;
    }

    expect(message).toBe("Account type is required");
    expect(state.accounts).toHaveLength(0);
  });

  it("updateKycStatusOperation falls back to PENDING when status is falsy", () => {
    const state: AccountsGlobalState = {
      accounts: [
        {
          id: "acc-1",
          account: "a",
          name: "A",
          budgetPath: "",
          accountTransactionsId: "",
          chain: [],
          type: "Source",
          owners: [],
          KycAmlStatus: "PASSED",
        },
      ],
    };
    const action = {
      input: { id: "acc-1", KycAmlStatus: undefined },
    } as unknown as UpdateKycStatusAction;

    accountsAccountsOperations.updateKycStatusOperation(state, action);

    expect(state.accounts[0].KycAmlStatus).toBe("PENDING");
  });
});
