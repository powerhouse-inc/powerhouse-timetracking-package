import {
  isAccountTransactionsDocument,
  reducer,
  setAccount,
  utils,
} from "document-models/account-transactions/v1";
import { describe, expect, it } from "vitest";

describe("AccountOperations", () => {
  it("should set the account with all optional fields present (truthy branches)", () => {
    const document = utils.createDocument();

    const next = reducer(
      document,
      setAccount({
        id: "acc-1",
        account: "0xabcabcabcabcabcabcabcabcabcabcabcabcabca",
        name: "Treasury",
        budgetPath: "/budgets/treasury",
        accountTransactionsId: "phd:tx-doc",
        chain: ["ethereum", "base"],
        type: "multisig",
        owners: ["0xowner1", "0xowner2"],
        KycAmlStatus: "PASSED",
      }),
    );

    expect(isAccountTransactionsDocument(next)).toBe(true);
    expect(next.operations.global).toHaveLength(1);
    expect(next.operations.global[0].action.type).toBe("SET_ACCOUNT");
    expect(next.operations.global[0].error).toBeUndefined();
    const account = next.state.global.account;
    expect(account.account).toBe("0xabcabcabcabcabcabcabcabcabcabcabcabcabca");
    expect(account.name).toBe("Treasury");
    expect(account.budgetPath).toBe("/budgets/treasury");
    expect(account.accountTransactionsId).toBe("phd:tx-doc");
    expect(account.chain).toStrictEqual(["ethereum", "base"]);
    expect(account.type).toBe("multisig");
    expect(account.owners).toStrictEqual(["0xowner1", "0xowner2"]);
    expect(account.KycAmlStatus).toBe("PASSED");
  });

  it("should set the account with only required fields (falsy optionals -> null)", () => {
    const document = utils.createDocument();

    const next = reducer(
      document,
      setAccount({
        id: "acc-2",
        account: "0xdefdefdefdefdefdefdefdefdefdefdefdefdefd",
        name: "Bare",
      }),
    );

    expect(next.operations.global[0].error).toBeUndefined();
    const account = next.state.global.account;
    expect(account.account).toBe("0xdefdefdefdefdefdefdefdefdefdefdefdefdefd");
    expect(account.name).toBe("Bare");
    expect(account.budgetPath).toBeNull();
    expect(account.accountTransactionsId).toBeNull();
    expect(account.chain).toBeNull();
    expect(account.type).toBeNull();
    expect(account.owners).toBeNull();
    expect(account.KycAmlStatus).toBeNull();
  });
});
