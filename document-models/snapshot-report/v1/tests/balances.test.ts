import { generateMock } from "document-model";
import {
  addSnapshotAccount,
  isSnapshotReportDocument,
  reducer,
  removeEndingBalance,
  RemoveEndingBalanceInputSchema,
  removeStartingBalance,
  RemoveStartingBalanceInputSchema,
  setEndingBalance,
  SetEndingBalanceInputSchema,
  setStartingBalance,
  SetStartingBalanceInputSchema,
  utils,
} from "document-models/snapshot-report/v1";
import { describe, expect, it } from "vitest";

function docWithAccount(id = "acc-1") {
  return reducer(
    utils.createDocument(),
    addSnapshotAccount({
      id,
      accountId: `aid-${id}`,
      accountAddress: "0x1111111111111111111111111111111111111111",
      accountName: "Treasury",
      type: "Internal",
    }),
  );
}

const usdc = { unit: "USDC", value: "100.00" };
const usdc2 = { unit: "USDC", value: "250.00" };
const dai = { unit: "DAI", value: "50.00" };

describe("BalancesOperations", () => {
  it("should handle setStartingBalance operation", () => {
    const document = utils.createDocument();
    const input = generateMock(SetStartingBalanceInputSchema());

    const updatedDocument = reducer(document, setStartingBalance(input));

    expect(isSnapshotReportDocument(updatedDocument)).toBe(true);
    expect(updatedDocument.operations.global).toHaveLength(1);
    expect(updatedDocument.operations.global[0].action.type).toBe(
      "SET_STARTING_BALANCE",
    );
    expect(updatedDocument.operations.global[0].action.input).toStrictEqual(
      input,
    );
    expect(updatedDocument.operations.global[0].index).toEqual(0);
  });

  it("should handle setEndingBalance operation", () => {
    const document = utils.createDocument();
    const input = generateMock(SetEndingBalanceInputSchema());

    const updatedDocument = reducer(document, setEndingBalance(input));

    expect(isSnapshotReportDocument(updatedDocument)).toBe(true);
    expect(updatedDocument.operations.global).toHaveLength(1);
    expect(updatedDocument.operations.global[0].action.type).toBe(
      "SET_ENDING_BALANCE",
    );
    expect(updatedDocument.operations.global[0].action.input).toStrictEqual(
      input,
    );
    expect(updatedDocument.operations.global[0].index).toEqual(0);
  });

  it("should handle removeStartingBalance operation", () => {
    const document = utils.createDocument();
    const input = generateMock(RemoveStartingBalanceInputSchema());

    const updatedDocument = reducer(document, removeStartingBalance(input));

    expect(isSnapshotReportDocument(updatedDocument)).toBe(true);
    expect(updatedDocument.operations.global).toHaveLength(1);
    expect(updatedDocument.operations.global[0].action.type).toBe(
      "REMOVE_STARTING_BALANCE",
    );
    expect(updatedDocument.operations.global[0].action.input).toStrictEqual(
      input,
    );
    expect(updatedDocument.operations.global[0].index).toEqual(0);
  });

  it("should handle removeEndingBalance operation", () => {
    const document = utils.createDocument();
    const input = generateMock(RemoveEndingBalanceInputSchema());

    const updatedDocument = reducer(document, removeEndingBalance(input));

    expect(isSnapshotReportDocument(updatedDocument)).toBe(true);
    expect(updatedDocument.operations.global).toHaveLength(1);
    expect(updatedDocument.operations.global[0].action.type).toBe(
      "REMOVE_ENDING_BALANCE",
    );
    expect(updatedDocument.operations.global[0].action.input).toStrictEqual(
      input,
    );
    expect(updatedDocument.operations.global[0].index).toEqual(0);
  });

  it("should add, update by id, and update by token for starting balances", () => {
    const doc = docWithAccount();
    // new push
    const added = reducer(
      doc,
      setStartingBalance({
        accountId: "acc-1",
        balanceId: "bal-1",
        token: "USDC",
        amount: usdc,
      }),
    );
    expect(
      added.state.global.snapshotAccounts[0].startingBalances,
    ).toHaveLength(1);

    // same balanceId -> update by id branch
    const byId = reducer(
      added,
      setStartingBalance({
        accountId: "acc-1",
        balanceId: "bal-1",
        token: "DAI",
        amount: dai,
      }),
    );
    const balById = byId.state.global.snapshotAccounts[0].startingBalances;
    expect(balById).toHaveLength(1);
    expect(balById[0].token).toBe("DAI");
    expect(balById[0].amount).toStrictEqual(dai);

    // different balanceId but same token -> update by token branch
    const byToken = reducer(
      byId,
      setStartingBalance({
        accountId: "acc-1",
        balanceId: "bal-2",
        token: "DAI",
        amount: usdc2,
      }),
    );
    const balByToken =
      byToken.state.global.snapshotAccounts[0].startingBalances;
    expect(balByToken).toHaveLength(1);
    expect(balByToken[0].id).toBe("bal-2");
    expect(balByToken[0].amount).toStrictEqual(usdc2);
  });

  it("should add, update by id, and update by token for ending balances", () => {
    const doc = docWithAccount();
    const added = reducer(
      doc,
      setEndingBalance({
        accountId: "acc-1",
        balanceId: "eb-1",
        token: "USDC",
        amount: usdc,
      }),
    );
    const byId = reducer(
      added,
      setEndingBalance({
        accountId: "acc-1",
        balanceId: "eb-1",
        token: "DAI",
        amount: dai,
      }),
    );
    expect(byId.state.global.snapshotAccounts[0].endingBalances[0].token).toBe(
      "DAI",
    );
    const byToken = reducer(
      byId,
      setEndingBalance({
        accountId: "acc-1",
        balanceId: "eb-2",
        token: "DAI",
        amount: usdc2,
      }),
    );
    const bal = byToken.state.global.snapshotAccounts[0].endingBalances;
    expect(bal).toHaveLength(1);
    expect(bal[0].id).toBe("eb-2");
    expect(bal[0].amount).toStrictEqual(usdc2);
  });

  it("should error when setting balances on a missing account", () => {
    const doc = docWithAccount();
    const s = reducer(
      doc,
      setStartingBalance({
        accountId: "missing",
        balanceId: "b",
        token: "USDC",
        amount: usdc,
      }),
    );
    expect(s.operations.global[1].error).toBe(
      "Account with ID missing not found",
    );
    const e = reducer(
      s,
      setEndingBalance({
        accountId: "missing",
        balanceId: "b",
        token: "USDC",
        amount: usdc,
      }),
    );
    expect(e.operations.global[2].error).toBe(
      "Account with ID missing not found",
    );
  });

  it("should remove starting balances and error on missing account/balance", () => {
    let doc = docWithAccount();
    doc = reducer(
      doc,
      setStartingBalance({
        accountId: "acc-1",
        balanceId: "bal-1",
        token: "USDC",
        amount: usdc,
      }),
    );

    // missing account
    const missAcc = reducer(
      doc,
      removeStartingBalance({ accountId: "nope", balanceId: "bal-1" }),
    );
    expect(missAcc.operations.global[2].error).toBe(
      "Account with ID nope not found",
    );

    // missing balance
    const missBal = reducer(
      missAcc,
      removeStartingBalance({ accountId: "acc-1", balanceId: "nope" }),
    );
    expect(missBal.operations.global[3].error).toBe(
      "Balance with ID nope not found",
    );

    // success
    const removed = reducer(
      missBal,
      removeStartingBalance({ accountId: "acc-1", balanceId: "bal-1" }),
    );
    expect(
      removed.state.global.snapshotAccounts[0].startingBalances,
    ).toHaveLength(0);
  });

  it("should remove ending balances and error on missing account/balance", () => {
    let doc = docWithAccount();
    doc = reducer(
      doc,
      setEndingBalance({
        accountId: "acc-1",
        balanceId: "eb-1",
        token: "USDC",
        amount: usdc,
      }),
    );

    const missAcc = reducer(
      doc,
      removeEndingBalance({ accountId: "nope", balanceId: "eb-1" }),
    );
    expect(missAcc.operations.global[2].error).toBe(
      "Account with ID nope not found",
    );

    const missBal = reducer(
      missAcc,
      removeEndingBalance({ accountId: "acc-1", balanceId: "nope" }),
    );
    expect(missBal.operations.global[3].error).toBe(
      "Balance with ID nope not found",
    );

    const removed = reducer(
      missBal,
      removeEndingBalance({ accountId: "acc-1", balanceId: "eb-1" }),
    );
    expect(
      removed.state.global.snapshotAccounts[0].endingBalances,
    ).toHaveLength(0);
  });
});
