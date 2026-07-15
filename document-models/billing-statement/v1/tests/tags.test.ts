import {
  addLineItem,
  editLineItemTag,
  isBillingStatementDocument,
  reducer,
  utils,
} from "document-models/billing-statement/v1";
import type {
  AddLineItemInput,
  BillingStatementLineItem,
} from "document-models/billing-statement/v1";
import { describe, expect, it } from "vitest";

function makeItem(id: string): AddLineItemInput {
  return {
    id,
    description: "Work",
    quantity: 1,
    unit: "HOUR",
    unitPricePwt: 1,
    unitPriceCash: 10,
    totalPricePwt: 1,
    totalPriceCash: 10,
  };
}

describe("TagsOperations", () => {
  it("should add a new tag to a line item (with and without label)", () => {
    const document = utils.createDocument();
    const withItem = reducer(document, addLineItem(makeItem("li-1")));

    // New tag WITH label -> `label || null` takes the label.
    const tagged = reducer(
      withItem,
      editLineItemTag({
        lineItemId: "li-1",
        dimension: "project",
        value: "alpha",
        label: "Project Alpha",
      }),
    );

    expect(isBillingStatementDocument(tagged)).toBe(true);
    expect(tagged.operations.global[1].action.type).toBe("EDIT_LINE_ITEM_TAG");
    const tags1 = tagged.state.global.lineItems[0].lineItemTag;
    expect(tags1).toHaveLength(1);
    expect(tags1[0]).toEqual({
      dimension: "project",
      value: "alpha",
      label: "Project Alpha",
    });

    // New tag WITHOUT label -> `label || null` falls back to null.
    const taggedNoLabel = reducer(
      tagged,
      editLineItemTag({
        lineItemId: "li-1",
        dimension: "client",
        value: "acme",
      }),
    );
    const tags2 = taggedNoLabel.state.global.lineItems[0].lineItemTag;
    expect(tags2).toHaveLength(2);
    expect(tags2[1]).toEqual({
      dimension: "client",
      value: "acme",
      label: null,
    });
  });

  it("should update an existing tag with the same dimension (label truthy then falsy)", () => {
    const document = utils.createDocument();
    const withItem = reducer(document, addLineItem(makeItem("li-2")));
    const tagged = reducer(
      withItem,
      editLineItemTag({
        lineItemId: "li-2",
        dimension: "project",
        value: "alpha",
        label: "Alpha",
      }),
    );

    // Same dimension -> update existing tag, label truthy branch.
    const updated = reducer(
      tagged,
      editLineItemTag({
        lineItemId: "li-2",
        dimension: "project",
        value: "beta",
        label: "Beta",
      }),
    );
    let tags = updated.state.global.lineItems[0].lineItemTag;
    expect(tags).toHaveLength(1);
    expect(tags[0]).toEqual({
      dimension: "project",
      value: "beta",
      label: "Beta",
    });

    // Same dimension again, no label -> update existing tag, `label || null` -> null.
    const updatedNoLabel = reducer(
      updated,
      editLineItemTag({
        lineItemId: "li-2",
        dimension: "project",
        value: "gamma",
      }),
    );
    tags = updatedNoLabel.state.global.lineItems[0].lineItemTag;
    expect(tags).toHaveLength(1);
    expect(tags[0]).toEqual({
      dimension: "project",
      value: "gamma",
      label: null,
    });
  });

  it("should initialize lineItemTag when a seeded line item has none (defensive branch)", () => {
    // A line item loaded from an external source may arrive without a
    // `lineItemTag` array. The reducer defends against this by lazily
    // initializing it before pushing the new tag. Seed such a document to
    // exercise the `stateItem.lineItemTag?` short-circuit and the
    // `if (!stateItem.lineItemTag)` initialization branch.
    const seededItem = {
      id: "seed-1",
      description: "Legacy item",
      quantity: 1,
      unit: "HOUR",
      unitPricePwt: 1,
      unitPriceCash: 10,
      totalPricePwt: 1,
      totalPriceCash: 10,
    } as unknown as BillingStatementLineItem;

    // A partial global state is merged over `initialGlobalState` at runtime;
    // cast to the parameter type since the seed is intentionally incomplete.
    const document = utils.createDocument({
      global: { lineItems: [seededItem] },
    } as Parameters<typeof utils.createDocument>[0]);

    // The seeded item genuinely has no tag array yet.
    expect(document.state.global.lineItems[0].lineItemTag).toBeUndefined();

    const tagged = reducer(
      document,
      editLineItemTag({
        lineItemId: "seed-1",
        dimension: "project",
        value: "legacy",
      }),
    );

    expect(tagged.operations.global[0].error).toBeUndefined();
    expect(tagged.state.global.lineItems[0].lineItemTag).toEqual([
      { dimension: "project", value: "legacy", label: null },
    ]);
  });

  it("should record an error and not mutate state for a missing line item", () => {
    const document = utils.createDocument();
    const withItem = reducer(document, addLineItem(makeItem("li-3")));

    const result = reducer(
      withItem,
      editLineItemTag({
        lineItemId: "missing",
        dimension: "project",
        value: "alpha",
      }),
    );

    expect(result.operations.global[1].error).toBe(
      "Item matching input.lineItemId not found",
    );
    expect(result.state.global.lineItems[0].lineItemTag).toEqual([]);
  });
});
