import { generateMock } from "document-model";
import {
  addOwnerId,
  AddOwnerIdInputSchema,
  isSnapshotReportDocument,
  reducer,
  removeOwnerId,
  RemoveOwnerIdInputSchema,
  setAccountsDocument,
  SetAccountsDocumentInputSchema,
  setPeriod,
  setPeriodEnd,
  SetPeriodEndInputSchema,
  SetPeriodInputSchema,
  setPeriodStart,
  SetPeriodStartInputSchema,
  setReportConfig,
  SetReportConfigInputSchema,
  utils,
} from "document-models/snapshot-report/v1";
import { describe, expect, it } from "vitest";

describe("ConfigurationOperations", () => {
  it("should handle setReportConfig operation", () => {
    const document = utils.createDocument();
    const input = generateMock(SetReportConfigInputSchema());

    const updatedDocument = reducer(document, setReportConfig(input));

    expect(isSnapshotReportDocument(updatedDocument)).toBe(true);
    expect(updatedDocument.operations.global).toHaveLength(1);
    expect(updatedDocument.operations.global[0].action.type).toBe(
      "SET_REPORT_CONFIG",
    );
    expect(updatedDocument.operations.global[0].action.input).toStrictEqual(
      input,
    );
    expect(updatedDocument.operations.global[0].index).toEqual(0);
  });

  it("should handle setAccountsDocument operation", () => {
    const document = utils.createDocument();
    const input = generateMock(SetAccountsDocumentInputSchema());

    const updatedDocument = reducer(document, setAccountsDocument(input));

    expect(isSnapshotReportDocument(updatedDocument)).toBe(true);
    expect(updatedDocument.operations.global).toHaveLength(1);
    expect(updatedDocument.operations.global[0].action.type).toBe(
      "SET_ACCOUNTS_DOCUMENT",
    );
    expect(updatedDocument.operations.global[0].action.input).toStrictEqual(
      input,
    );
    expect(updatedDocument.operations.global[0].index).toEqual(0);
  });

  it("should handle setPeriod operation", () => {
    const document = utils.createDocument();
    const input = generateMock(SetPeriodInputSchema());

    const updatedDocument = reducer(document, setPeriod(input));

    expect(isSnapshotReportDocument(updatedDocument)).toBe(true);
    expect(updatedDocument.operations.global).toHaveLength(1);
    expect(updatedDocument.operations.global[0].action.type).toBe("SET_PERIOD");
    expect(updatedDocument.operations.global[0].action.input).toStrictEqual(
      input,
    );
    expect(updatedDocument.operations.global[0].index).toEqual(0);
  });

  it("should handle addOwnerId operation", () => {
    const document = utils.createDocument();
    const input = generateMock(AddOwnerIdInputSchema());

    const updatedDocument = reducer(document, addOwnerId(input));

    expect(isSnapshotReportDocument(updatedDocument)).toBe(true);
    expect(updatedDocument.operations.global).toHaveLength(1);
    expect(updatedDocument.operations.global[0].action.type).toBe(
      "ADD_OWNER_ID",
    );
    expect(updatedDocument.operations.global[0].action.input).toStrictEqual(
      input,
    );
    expect(updatedDocument.operations.global[0].index).toEqual(0);
  });

  it("should handle setPeriodStart operation", () => {
    const document = utils.createDocument();
    const input = generateMock(SetPeriodStartInputSchema());

    const updatedDocument = reducer(document, setPeriodStart(input));

    expect(isSnapshotReportDocument(updatedDocument)).toBe(true);
    expect(updatedDocument.operations.global).toHaveLength(1);
    expect(updatedDocument.operations.global[0].action.type).toBe(
      "SET_PERIOD_START",
    );
    expect(updatedDocument.operations.global[0].action.input).toStrictEqual(
      input,
    );
    expect(updatedDocument.operations.global[0].index).toEqual(0);
  });

  it("should handle setPeriodEnd operation", () => {
    const document = utils.createDocument();
    const input = generateMock(SetPeriodEndInputSchema());

    const updatedDocument = reducer(document, setPeriodEnd(input));

    expect(isSnapshotReportDocument(updatedDocument)).toBe(true);
    expect(updatedDocument.operations.global).toHaveLength(1);
    expect(updatedDocument.operations.global[0].action.type).toBe(
      "SET_PERIOD_END",
    );
    expect(updatedDocument.operations.global[0].action.input).toStrictEqual(
      input,
    );
    expect(updatedDocument.operations.global[0].index).toEqual(0);
  });

  it("should handle removeOwnerId operation", () => {
    const document = utils.createDocument();
    const input = generateMock(RemoveOwnerIdInputSchema());

    const updatedDocument = reducer(document, removeOwnerId(input));

    expect(isSnapshotReportDocument(updatedDocument)).toBe(true);
    expect(updatedDocument.operations.global).toHaveLength(1);
    expect(updatedDocument.operations.global[0].action.type).toBe(
      "REMOVE_OWNER_ID",
    );
    expect(updatedDocument.operations.global[0].action.input).toStrictEqual(
      input,
    );
    expect(updatedDocument.operations.global[0].index).toEqual(0);
  });

  it("should apply every field in setReportConfig", () => {
    const document = utils.createDocument();
    const next = reducer(
      document,
      setReportConfig({
        reportName: "Q1 Report",
        startDate: "2026-01-01T00:00:00.000Z",
        endDate: "2026-03-31T00:00:00.000Z",
        accountsDocumentId: "phd:accounts-doc",
      }),
    );

    expect(next.state.global.reportName).toBe("Q1 Report");
    expect(next.state.global.startDate).toBe("2026-01-01T00:00:00.000Z");
    expect(next.state.global.endDate).toBe("2026-03-31T00:00:00.000Z");
    expect(next.state.global.accountsDocumentId).toBe("phd:accounts-doc");
  });

  it("should leave state untouched when setReportConfig has no fields set", () => {
    const document = utils.createDocument();
    const before = { ...document.state.global };

    const next = reducer(
      document,
      setReportConfig({
        reportName: null,
        startDate: null,
        endDate: null,
        accountsDocumentId: null,
      }),
    );

    expect(next.state.global.reportName).toBe(before.reportName);
    expect(next.state.global.startDate).toBe(before.startDate);
    expect(next.state.global.endDate).toBe(before.endDate);
    expect(next.state.global.accountsDocumentId).toBe(
      before.accountsDocumentId,
    );
  });

  it("should set the accounts document id", () => {
    const document = utils.createDocument();
    const next = reducer(
      document,
      setAccountsDocument({ accountsDocumentId: "phd:doc-1" }),
    );
    expect(next.state.global.accountsDocumentId).toBe("phd:doc-1");
  });

  it("should set the report period start and end", () => {
    const document = utils.createDocument();
    const withStart = reducer(
      document,
      setPeriodStart({ periodStart: "2026-01-01T00:00:00.000Z" }),
    );
    const withEnd = reducer(
      withStart,
      setPeriodEnd({ periodEnd: "2026-12-31T00:00:00.000Z" }),
    );
    expect(withEnd.state.global.reportPeriodStart).toBe(
      "2026-01-01T00:00:00.000Z",
    );
    expect(withEnd.state.global.reportPeriodEnd).toBe(
      "2026-12-31T00:00:00.000Z",
    );
  });

  it("should set the period start and end together", () => {
    const document = utils.createDocument();
    const next = reducer(
      document,
      setPeriod({
        startDate: "2026-02-01T00:00:00.000Z",
        endDate: "2026-02-28T00:00:00.000Z",
      }),
    );
    expect(next.state.global.startDate).toBe("2026-02-01T00:00:00.000Z");
    expect(next.state.global.endDate).toBe("2026-02-28T00:00:00.000Z");
  });

  it("should add an owner id only once (dedupes) and remove it", () => {
    const document = utils.createDocument();
    const added = reducer(document, addOwnerId({ ownerId: "phd:owner-1" }));
    // Duplicate add hits the `already includes` branch and does not push again.
    const addedAgain = reducer(added, addOwnerId({ ownerId: "phd:owner-1" }));
    expect(addedAgain.state.global.ownerIds).toStrictEqual(["phd:owner-1"]);

    // Removing a non-existent owner leaves the list unchanged (index === -1).
    const noRemove = reducer(
      addedAgain,
      removeOwnerId({ ownerId: "phd:owner-missing" }),
    );
    expect(noRemove.state.global.ownerIds).toStrictEqual(["phd:owner-1"]);

    // Removing an existing owner splices it out.
    const removed = reducer(
      noRemove,
      removeOwnerId({ ownerId: "phd:owner-1" }),
    );
    expect(removed.state.global.ownerIds).toStrictEqual([]);
  });
});
