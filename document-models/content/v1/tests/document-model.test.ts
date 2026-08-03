/**
 * This is a scaffold file meant for customization:
 * - change it by adding new tests or modifying the existing ones
 */
/**
 * This is a scaffold file meant for customization:
 * - change it by adding new tests or modifying the existing ones
 */

import {
  assertIsContentDocument,
  assertIsContentState,
  contentDocumentType,
  initialGlobalState,
  initialLocalState,
  isContentDocument,
  isContentState,
  utils,
} from "document-models/content/v1";
import { describe, expect, it } from "vitest";
import { ZodError } from "zod";

describe("Content Document Model", () => {
  it("should create a new Content document", () => {
    const document = utils.createDocument();

    expect(document).toBeDefined();
    expect(document.header.documentType).toBe(contentDocumentType);
  });

  it("should create a new Content document with a valid initial state", () => {
    const document = utils.createDocument();
    expect(document.state.global).toStrictEqual(initialGlobalState);
    expect(document.state.local).toStrictEqual(initialLocalState);
    expect(isContentDocument(document)).toBe(true);
    expect(isContentState(document.state)).toBe(true);
  });
  it("should reject a document that is not a Content document", () => {
    const wrongDocumentType = utils.createDocument();
    wrongDocumentType.header.documentType = "the-wrong-thing-1234";
    try {
      expect(assertIsContentDocument(wrongDocumentType)).toThrow();
      expect(isContentDocument(wrongDocumentType)).toBe(false);
    } catch (error) {
      expect(error).toBeInstanceOf(ZodError);
    }
  });
  const wrongState = utils.createDocument();
  // @ts-expect-error - we are testing the error case
  wrongState.state.global = {
    ...{ notWhat: "you want" },
  };
  try {
    expect(isContentState(wrongState.state)).toBe(false);
    expect(assertIsContentState(wrongState.state)).toThrow();
    expect(isContentDocument(wrongState)).toBe(false);
    expect(assertIsContentDocument(wrongState)).toThrow();
  } catch (error) {
    expect(error).toBeInstanceOf(ZodError);
  }

  const wrongInitialState = utils.createDocument();
  // @ts-expect-error - we are testing the error case
  wrongInitialState.initialState.global = {
    ...{ notWhat: "you want" },
  };
  try {
    expect(isContentState(wrongInitialState.state)).toBe(false);
    expect(assertIsContentState(wrongInitialState.state)).toThrow();
    expect(isContentDocument(wrongInitialState)).toBe(false);
    expect(assertIsContentDocument(wrongInitialState)).toThrow();
  } catch (error) {
    expect(error).toBeInstanceOf(ZodError);
  }

  const missingIdInHeader = utils.createDocument();
  // @ts-expect-error - we are testing the error case
  delete missingIdInHeader.header.id;
  try {
    expect(isContentDocument(missingIdInHeader)).toBe(false);
    expect(assertIsContentDocument(missingIdInHeader)).toThrow();
  } catch (error) {
    expect(error).toBeInstanceOf(ZodError);
  }

  const missingNameInHeader = utils.createDocument();
  // @ts-expect-error - we are testing the error case
  delete missingNameInHeader.header.name;
  try {
    expect(isContentDocument(missingNameInHeader)).toBe(false);
    expect(assertIsContentDocument(missingNameInHeader)).toThrow();
  } catch (error) {
    expect(error).toBeInstanceOf(ZodError);
  }

  const missingCreatedAtUtcIsoInHeader = utils.createDocument();
  // @ts-expect-error - we are testing the error case
  delete missingCreatedAtUtcIsoInHeader.header.createdAtUtcIso;
  try {
    expect(isContentDocument(missingCreatedAtUtcIsoInHeader)).toBe(false);
    expect(assertIsContentDocument(missingCreatedAtUtcIsoInHeader)).toThrow();
  } catch (error) {
    expect(error).toBeInstanceOf(ZodError);
  }

  const missingLastModifiedAtUtcIsoInHeader = utils.createDocument();
  // @ts-expect-error - we are testing the error case
  delete missingLastModifiedAtUtcIsoInHeader.header.lastModifiedAtUtcIso;
  try {
    expect(isContentDocument(missingLastModifiedAtUtcIsoInHeader)).toBe(false);
    expect(
      assertIsContentDocument(missingLastModifiedAtUtcIsoInHeader),
    ).toThrow();
  } catch (error) {
    expect(error).toBeInstanceOf(ZodError);
  }
});
