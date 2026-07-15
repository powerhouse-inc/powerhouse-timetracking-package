/**
 * This is a scaffold file meant for customization:
 * - change it by adding new tests or modifying the existing ones
 */

import { describe, it, expect } from "vitest";
import { generateMock } from "document-model";
import {
  reducer,
  utils,
  isAccountsDocument,
  addAccount,
  AddAccountInputSchema,
} from "document-models/accounts";

describe("Accounts Operations", () => {
  it("should handle addAccount operation", () => {
    const document = utils.createDocument();
    const input = generateMock(AddAccountInputSchema());

    const updatedDocument = reducer(document, addAccount(input));

    expect(isAccountsDocument(updatedDocument)).toBe(true);
    expect(updatedDocument.operations.global).toHaveLength(1);
    expect(updatedDocument.operations.global[0].action.type).toBe(
      "ADD_ACCOUNT",
    );
    expect(updatedDocument.operations.global[0].action.input).toStrictEqual(
      input,
    );
    expect(updatedDocument.operations.global[0].index).toEqual(0);
  });
});
