/**
 * This is a scaffold file meant for customization:
 * - change it by adding new tests or modifying the existing ones
 */
/**
 * This is a scaffold file meant for customization:
 * - change it by adding new tests or modifying the existing ones
 */

import {
  assertIsTimesheetDocument,
  assertIsTimesheetState,
  initialGlobalState,
  initialLocalState,
  isTimesheetDocument,
  isTimesheetState,
  timesheetDocumentType,
  utils,
} from "document-models/timesheet/v1";
import { describe, expect, it } from "vitest";
import { ZodError } from "zod";

describe("Timesheet Document Model", () => {
  it("should create a new Timesheet document", () => {
    const document = utils.createDocument();

    expect(document).toBeDefined();
    expect(document.header.documentType).toBe(timesheetDocumentType);
  });

  it("should create a new Timesheet document with a valid initial state", () => {
    const document = utils.createDocument();
    expect(document.state.global).toStrictEqual(initialGlobalState);
    expect(document.state.local).toStrictEqual(initialLocalState);
    expect(isTimesheetDocument(document)).toBe(true);
    expect(isTimesheetState(document.state)).toBe(true);
  });
  it("should reject a document that is not a Timesheet document", () => {
    const wrongDocumentType = utils.createDocument();
    wrongDocumentType.header.documentType = "the-wrong-thing-1234";
    try {
      expect(assertIsTimesheetDocument(wrongDocumentType)).toThrow();
      expect(isTimesheetDocument(wrongDocumentType)).toBe(false);
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
    expect(isTimesheetState(wrongState.state)).toBe(false);
    expect(assertIsTimesheetState(wrongState.state)).toThrow();
    expect(isTimesheetDocument(wrongState)).toBe(false);
    expect(assertIsTimesheetDocument(wrongState)).toThrow();
  } catch (error) {
    expect(error).toBeInstanceOf(ZodError);
  }

  const wrongInitialState = utils.createDocument();
  // @ts-expect-error - we are testing the error case
  wrongInitialState.initialState.global = {
    ...{ notWhat: "you want" },
  };
  try {
    expect(isTimesheetState(wrongInitialState.state)).toBe(false);
    expect(assertIsTimesheetState(wrongInitialState.state)).toThrow();
    expect(isTimesheetDocument(wrongInitialState)).toBe(false);
    expect(assertIsTimesheetDocument(wrongInitialState)).toThrow();
  } catch (error) {
    expect(error).toBeInstanceOf(ZodError);
  }

  const missingIdInHeader = utils.createDocument();
  // @ts-expect-error - we are testing the error case
  delete missingIdInHeader.header.id;
  try {
    expect(isTimesheetDocument(missingIdInHeader)).toBe(false);
    expect(assertIsTimesheetDocument(missingIdInHeader)).toThrow();
  } catch (error) {
    expect(error).toBeInstanceOf(ZodError);
  }

  const missingNameInHeader = utils.createDocument();
  // @ts-expect-error - we are testing the error case
  delete missingNameInHeader.header.name;
  try {
    expect(isTimesheetDocument(missingNameInHeader)).toBe(false);
    expect(assertIsTimesheetDocument(missingNameInHeader)).toThrow();
  } catch (error) {
    expect(error).toBeInstanceOf(ZodError);
  }

  const missingCreatedAtUtcIsoInHeader = utils.createDocument();
  // @ts-expect-error - we are testing the error case
  delete missingCreatedAtUtcIsoInHeader.header.createdAtUtcIso;
  try {
    expect(isTimesheetDocument(missingCreatedAtUtcIsoInHeader)).toBe(false);
    expect(assertIsTimesheetDocument(missingCreatedAtUtcIsoInHeader)).toThrow();
  } catch (error) {
    expect(error).toBeInstanceOf(ZodError);
  }

  const missingLastModifiedAtUtcIsoInHeader = utils.createDocument();
  // @ts-expect-error - we are testing the error case
  delete missingLastModifiedAtUtcIsoInHeader.header.lastModifiedAtUtcIso;
  try {
    expect(isTimesheetDocument(missingLastModifiedAtUtcIsoInHeader)).toBe(
      false,
    );
    expect(
      assertIsTimesheetDocument(missingLastModifiedAtUtcIsoInHeader),
    ).toThrow();
  } catch (error) {
    expect(error).toBeInstanceOf(ZodError);
  }
});
