/**
 * This is a scaffold file meant for customization:
 * - change it by adding new tests or modifying the existing ones
 */
/**
 * This is a scaffold file meant for customization:
 * - change it by adding new tests or modifying the existing ones
 */

import {
  assertIsTimetrackingWorkspaceDocument,
  assertIsTimetrackingWorkspaceState,
  initialGlobalState,
  initialLocalState,
  isTimetrackingWorkspaceDocument,
  isTimetrackingWorkspaceState,
  timetrackingWorkspaceDocumentType,
  utils,
} from "document-models/timetracking-workspace/v1";
import { describe, expect, it } from "vitest";
import { ZodError } from "zod";

describe("TimetrackingWorkspace Document Model", () => {
  it("should create a new TimetrackingWorkspace document", () => {
    const document = utils.createDocument();

    expect(document).toBeDefined();
    expect(document.header.documentType).toBe(
      timetrackingWorkspaceDocumentType,
    );
  });

  it("should create a new TimetrackingWorkspace document with a valid initial state", () => {
    const document = utils.createDocument();
    expect(document.state.global).toStrictEqual(initialGlobalState);
    expect(document.state.local).toStrictEqual(initialLocalState);
    expect(isTimetrackingWorkspaceDocument(document)).toBe(true);
    expect(isTimetrackingWorkspaceState(document.state)).toBe(true);
  });
  it("should reject a document that is not a TimetrackingWorkspace document", () => {
    const wrongDocumentType = utils.createDocument();
    wrongDocumentType.header.documentType = "the-wrong-thing-1234";
    try {
      expect(
        assertIsTimetrackingWorkspaceDocument(wrongDocumentType),
      ).toThrow();
      expect(isTimetrackingWorkspaceDocument(wrongDocumentType)).toBe(false);
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
    expect(isTimetrackingWorkspaceState(wrongState.state)).toBe(false);
    expect(assertIsTimetrackingWorkspaceState(wrongState.state)).toThrow();
    expect(isTimetrackingWorkspaceDocument(wrongState)).toBe(false);
    expect(assertIsTimetrackingWorkspaceDocument(wrongState)).toThrow();
  } catch (error) {
    expect(error).toBeInstanceOf(ZodError);
  }

  const wrongInitialState = utils.createDocument();
  // @ts-expect-error - we are testing the error case
  wrongInitialState.initialState.global = {
    ...{ notWhat: "you want" },
  };
  try {
    expect(isTimetrackingWorkspaceState(wrongInitialState.state)).toBe(false);
    expect(
      assertIsTimetrackingWorkspaceState(wrongInitialState.state),
    ).toThrow();
    expect(isTimetrackingWorkspaceDocument(wrongInitialState)).toBe(false);
    expect(assertIsTimetrackingWorkspaceDocument(wrongInitialState)).toThrow();
  } catch (error) {
    expect(error).toBeInstanceOf(ZodError);
  }

  const missingIdInHeader = utils.createDocument();
  // @ts-expect-error - we are testing the error case
  delete missingIdInHeader.header.id;
  try {
    expect(isTimetrackingWorkspaceDocument(missingIdInHeader)).toBe(false);
    expect(assertIsTimetrackingWorkspaceDocument(missingIdInHeader)).toThrow();
  } catch (error) {
    expect(error).toBeInstanceOf(ZodError);
  }

  const missingNameInHeader = utils.createDocument();
  // @ts-expect-error - we are testing the error case
  delete missingNameInHeader.header.name;
  try {
    expect(isTimetrackingWorkspaceDocument(missingNameInHeader)).toBe(false);
    expect(
      assertIsTimetrackingWorkspaceDocument(missingNameInHeader),
    ).toThrow();
  } catch (error) {
    expect(error).toBeInstanceOf(ZodError);
  }

  const missingCreatedAtUtcIsoInHeader = utils.createDocument();
  // @ts-expect-error - we are testing the error case
  delete missingCreatedAtUtcIsoInHeader.header.createdAtUtcIso;
  try {
    expect(
      isTimetrackingWorkspaceDocument(missingCreatedAtUtcIsoInHeader),
    ).toBe(false);
    expect(
      assertIsTimetrackingWorkspaceDocument(missingCreatedAtUtcIsoInHeader),
    ).toThrow();
  } catch (error) {
    expect(error).toBeInstanceOf(ZodError);
  }

  const missingLastModifiedAtUtcIsoInHeader = utils.createDocument();
  // @ts-expect-error - we are testing the error case
  delete missingLastModifiedAtUtcIsoInHeader.header.lastModifiedAtUtcIso;
  try {
    expect(
      isTimetrackingWorkspaceDocument(missingLastModifiedAtUtcIsoInHeader),
    ).toBe(false);
    expect(
      assertIsTimetrackingWorkspaceDocument(
        missingLastModifiedAtUtcIsoInHeader,
      ),
    ).toThrow();
  } catch (error) {
    expect(error).toBeInstanceOf(ZodError);
  }
});
