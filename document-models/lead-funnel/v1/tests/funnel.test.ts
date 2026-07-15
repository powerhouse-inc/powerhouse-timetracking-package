import { generateMock } from "document-model";
import {
  isLeadFunnelDocument,
  reducer,
  setFunnelName,
  SetFunnelNameInputSchema,
  utils,
} from "document-models/lead-funnel/v1";
import { describe, expect, it } from "vitest";

describe("Funnel operations", () => {
  it("renames the funnel board", () => {
    let doc = utils.createDocument();
    expect(doc.state.global.name).toBe("Lead Funnel");

    doc = reducer(doc, setFunnelName({ name: "Q3 Enterprise Pipeline" }));
    expect(doc.state.global.name).toBe("Q3 Enterprise Pipeline");
  });

  it("should handle setFunnelName operation", () => {
    const document = utils.createDocument();
    const input = generateMock(SetFunnelNameInputSchema());

    const updatedDocument = reducer(document, setFunnelName(input));

    expect(isLeadFunnelDocument(updatedDocument)).toBe(true);
    expect(updatedDocument.operations.global).toHaveLength(1);
    expect(updatedDocument.operations.global[0].action.type).toBe(
      "SET_FUNNEL_NAME",
    );
    expect(updatedDocument.operations.global[0].action.input).toStrictEqual(
      input,
    );
    expect(updatedDocument.operations.global[0].index).toEqual(0);
  });
});
