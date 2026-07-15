import { generateMock } from "document-model";
import { describe, expect, it } from "vitest";
import {
  reducer,
  utils,
  isScopeOfWorkDocument,
  addRoadmap,
  removeRoadmap,
  editRoadmap,
  AddRoadmapInputSchema,
  RemoveRoadmapInputSchema,
  EditRoadmapInputSchema,
} from "document-models/scope-of-work";

describe("RoadmapsOperations", () => {
  it("should handle addRoadmap operation", () => {
    const document = utils.createDocument();
    const input = generateMock(AddRoadmapInputSchema());

    const updatedDocument = reducer(document, addRoadmap(input));

    expect(isScopeOfWorkDocument(updatedDocument)).toBe(true);
    expect(updatedDocument.operations.global).toHaveLength(1);
    expect(updatedDocument.operations.global[0].action.type).toBe(
      "ADD_ROADMAP",
    );
    expect(updatedDocument.operations.global[0].action.input).toStrictEqual(
      input,
    );
    expect(updatedDocument.operations.global[0].index).toEqual(0);
  });

  it("should handle removeRoadmap operation", () => {
    const document = utils.createDocument();
    const input = generateMock(RemoveRoadmapInputSchema());

    const updatedDocument = reducer(document, removeRoadmap(input));

    expect(isScopeOfWorkDocument(updatedDocument)).toBe(true);
    expect(updatedDocument.operations.global).toHaveLength(1);
    expect(updatedDocument.operations.global[0].action.type).toBe(
      "REMOVE_ROADMAP",
    );
    expect(updatedDocument.operations.global[0].action.input).toStrictEqual(
      input,
    );
    expect(updatedDocument.operations.global[0].index).toEqual(0);
  });

  it("should handle editRoadmap operation", () => {
    const document = utils.createDocument();
    const input = generateMock(EditRoadmapInputSchema());

    const updatedDocument = reducer(document, editRoadmap(input));

    expect(isScopeOfWorkDocument(updatedDocument)).toBe(true);
    expect(updatedDocument.operations.global).toHaveLength(1);
    expect(updatedDocument.operations.global[0].action.type).toBe(
      "EDIT_ROADMAP",
    );
    expect(updatedDocument.operations.global[0].action.input).toStrictEqual(
      input,
    );
    expect(updatedDocument.operations.global[0].index).toEqual(0);
  });
});
