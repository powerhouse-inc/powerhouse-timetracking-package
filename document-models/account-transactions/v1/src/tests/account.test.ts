/**
 * This is a scaffold file meant for customization:
 * - change it by adding new tests or modifying the existing ones
 */

import { describe, it, expect } from "vitest";
import { generateMock } from "document-model";
import {
  reducer,
  utils,
  isAccountTransactionsDocument,
  setAccount,
  SetAccountInputSchema,
} from "document-models/account-transactions";

describe("Account Operations", () => {
  it("should handle setAccount operation", () => {
    const document = utils.createDocument();
    const input = generateMock(SetAccountInputSchema());

    const updatedDocument = reducer(document, setAccount(input));

    expect(isAccountTransactionsDocument(updatedDocument)).toBe(true);
    expect(updatedDocument.operations.global).toHaveLength(1);
    expect(updatedDocument.operations.global[0].action.type).toBe(
      "SET_ACCOUNT",
    );
    expect(updatedDocument.operations.global[0].action.input).toStrictEqual(
      input,
    );
    expect(updatedDocument.operations.global[0].index).toEqual(0);
  });
});
