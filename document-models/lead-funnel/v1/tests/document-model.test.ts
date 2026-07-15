/**
 * This is a scaffold file meant for customization:
 * - change it by adding new tests or modifying the existing ones
 */
/**
 * This is a scaffold file meant for customization:
 * - change it by adding new tests or modifying the existing ones
 */

import {
  assertIsLeadFunnelDocument,
  assertIsLeadFunnelState,
  initialGlobalState,
  initialLocalState,
  isLeadFunnelDocument,
  isLeadFunnelState,
  leadFunnelDocumentType,
  utils,
} from "document-models/lead-funnel/v1";
import { describe, expect, it } from "vitest";
import { ZodError } from "zod";

describe("LeadFunnel Document Model", () => {
  it("should create a new LeadFunnel document", () => {
    const document = utils.createDocument();

    expect(document).toBeDefined();
    expect(document.header.documentType).toBe(leadFunnelDocumentType);
  });

  it("should create a new LeadFunnel document with a valid initial state", () => {
    const document = utils.createDocument();
    expect(document.state.global).toStrictEqual(initialGlobalState);
    expect(document.state.local).toStrictEqual(initialLocalState);
    expect(isLeadFunnelDocument(document)).toBe(true);
    expect(isLeadFunnelState(document.state)).toBe(true);
  });
  it("should reject a document that is not a LeadFunnel document", () => {
    const wrongDocumentType = utils.createDocument();
    wrongDocumentType.header.documentType = "the-wrong-thing-1234";
    try {
      expect(assertIsLeadFunnelDocument(wrongDocumentType)).toThrow();
      expect(isLeadFunnelDocument(wrongDocumentType)).toBe(false);
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
    expect(isLeadFunnelState(wrongState.state)).toBe(false);
    expect(assertIsLeadFunnelState(wrongState.state)).toThrow();
    expect(isLeadFunnelDocument(wrongState)).toBe(false);
    expect(assertIsLeadFunnelDocument(wrongState)).toThrow();
  } catch (error) {
    expect(error).toBeInstanceOf(ZodError);
  }

  const wrongInitialState = utils.createDocument();
  // @ts-expect-error - we are testing the error case
  wrongInitialState.initialState.global = {
    ...{ notWhat: "you want" },
  };
  try {
    expect(isLeadFunnelState(wrongInitialState.state)).toBe(false);
    expect(assertIsLeadFunnelState(wrongInitialState.state)).toThrow();
    expect(isLeadFunnelDocument(wrongInitialState)).toBe(false);
    expect(assertIsLeadFunnelDocument(wrongInitialState)).toThrow();
  } catch (error) {
    expect(error).toBeInstanceOf(ZodError);
  }

  const missingIdInHeader = utils.createDocument();
  // @ts-expect-error - we are testing the error case
  delete missingIdInHeader.header.id;
  try {
    expect(isLeadFunnelDocument(missingIdInHeader)).toBe(false);
    expect(assertIsLeadFunnelDocument(missingIdInHeader)).toThrow();
  } catch (error) {
    expect(error).toBeInstanceOf(ZodError);
  }

  const missingNameInHeader = utils.createDocument();
  // @ts-expect-error - we are testing the error case
  delete missingNameInHeader.header.name;
  try {
    expect(isLeadFunnelDocument(missingNameInHeader)).toBe(false);
    expect(assertIsLeadFunnelDocument(missingNameInHeader)).toThrow();
  } catch (error) {
    expect(error).toBeInstanceOf(ZodError);
  }

  const missingCreatedAtUtcIsoInHeader = utils.createDocument();
  // @ts-expect-error - we are testing the error case
  delete missingCreatedAtUtcIsoInHeader.header.createdAtUtcIso;
  try {
    expect(isLeadFunnelDocument(missingCreatedAtUtcIsoInHeader)).toBe(false);
    expect(
      assertIsLeadFunnelDocument(missingCreatedAtUtcIsoInHeader),
    ).toThrow();
  } catch (error) {
    expect(error).toBeInstanceOf(ZodError);
  }

  const missingLastModifiedAtUtcIsoInHeader = utils.createDocument();
  // @ts-expect-error - we are testing the error case
  delete missingLastModifiedAtUtcIsoInHeader.header.lastModifiedAtUtcIso;
  try {
    expect(isLeadFunnelDocument(missingLastModifiedAtUtcIsoInHeader)).toBe(
      false,
    );
    expect(
      assertIsLeadFunnelDocument(missingLastModifiedAtUtcIsoInHeader),
    ).toThrow();
  } catch (error) {
    expect(error).toBeInstanceOf(ZodError);
  }
});
