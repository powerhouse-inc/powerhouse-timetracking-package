/**
 * This is a scaffold file meant for customization:
 * - change it by adding new tests or modifying the existing ones
 */
/**
 * This is a scaffold file meant for customization:
 * - change it by adding new tests or modifying the existing ones
 */

import {
  assertIsSurveyDocument,
  assertIsSurveyState,
  initialGlobalState,
  initialLocalState,
  isSurveyDocument,
  isSurveyState,
  surveyDocumentType,
  utils,
} from "document-models/survey/v1";
import { describe, expect, it } from "vitest";
import { ZodError } from "zod";

describe("Survey Document Model", () => {
  it("should create a new Survey document", () => {
    const document = utils.createDocument();

    expect(document).toBeDefined();
    expect(document.header.documentType).toBe(surveyDocumentType);
  });

  it("should create a new Survey document with a valid initial state", () => {
    const document = utils.createDocument();
    expect(document.state.global).toStrictEqual(initialGlobalState);
    expect(document.state.local).toStrictEqual(initialLocalState);
    expect(isSurveyDocument(document)).toBe(true);
    expect(isSurveyState(document.state)).toBe(true);
  });
  it("should reject a document that is not a Survey document", () => {
    const wrongDocumentType = utils.createDocument();
    wrongDocumentType.header.documentType = "the-wrong-thing-1234";
    try {
      expect(assertIsSurveyDocument(wrongDocumentType)).toThrow();
      expect(isSurveyDocument(wrongDocumentType)).toBe(false);
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
    expect(isSurveyState(wrongState.state)).toBe(false);
    expect(assertIsSurveyState(wrongState.state)).toThrow();
    expect(isSurveyDocument(wrongState)).toBe(false);
    expect(assertIsSurveyDocument(wrongState)).toThrow();
  } catch (error) {
    expect(error).toBeInstanceOf(ZodError);
  }

  const wrongInitialState = utils.createDocument();
  // @ts-expect-error - we are testing the error case
  wrongInitialState.initialState.global = {
    ...{ notWhat: "you want" },
  };
  try {
    expect(isSurveyState(wrongInitialState.state)).toBe(false);
    expect(assertIsSurveyState(wrongInitialState.state)).toThrow();
    expect(isSurveyDocument(wrongInitialState)).toBe(false);
    expect(assertIsSurveyDocument(wrongInitialState)).toThrow();
  } catch (error) {
    expect(error).toBeInstanceOf(ZodError);
  }

  const missingIdInHeader = utils.createDocument();
  // @ts-expect-error - we are testing the error case
  delete missingIdInHeader.header.id;
  try {
    expect(isSurveyDocument(missingIdInHeader)).toBe(false);
    expect(assertIsSurveyDocument(missingIdInHeader)).toThrow();
  } catch (error) {
    expect(error).toBeInstanceOf(ZodError);
  }

  const missingNameInHeader = utils.createDocument();
  // @ts-expect-error - we are testing the error case
  delete missingNameInHeader.header.name;
  try {
    expect(isSurveyDocument(missingNameInHeader)).toBe(false);
    expect(assertIsSurveyDocument(missingNameInHeader)).toThrow();
  } catch (error) {
    expect(error).toBeInstanceOf(ZodError);
  }

  const missingCreatedAtUtcIsoInHeader = utils.createDocument();
  // @ts-expect-error - we are testing the error case
  delete missingCreatedAtUtcIsoInHeader.header.createdAtUtcIso;
  try {
    expect(isSurveyDocument(missingCreatedAtUtcIsoInHeader)).toBe(false);
    expect(assertIsSurveyDocument(missingCreatedAtUtcIsoInHeader)).toThrow();
  } catch (error) {
    expect(error).toBeInstanceOf(ZodError);
  }

  const missingLastModifiedAtUtcIsoInHeader = utils.createDocument();
  // @ts-expect-error - we are testing the error case
  delete missingLastModifiedAtUtcIsoInHeader.header.lastModifiedAtUtcIso;
  try {
    expect(isSurveyDocument(missingLastModifiedAtUtcIsoInHeader)).toBe(false);
    expect(
      assertIsSurveyDocument(missingLastModifiedAtUtcIsoInHeader),
    ).toThrow();
  } catch (error) {
    expect(error).toBeInstanceOf(ZodError);
  }
});
