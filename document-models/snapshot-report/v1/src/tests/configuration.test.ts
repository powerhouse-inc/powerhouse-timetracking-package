/**
 * This is a scaffold file meant for customization:
 * - change it by adding new tests or modifying the existing ones
 */

import { describe, it, expect } from "vitest";
import { generateMock } from "document-model";
import {
  reducer,
  utils,
  isSnapshotReportDocument,
  setReportConfig,
  SetReportConfigInputSchema,
  setAccountsDocument,
  SetAccountsDocumentInputSchema,
  setPeriod,
  SetPeriodInputSchema,
} from "document-models/snapshot-report";

describe("Configuration Operations", () => {
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
});
