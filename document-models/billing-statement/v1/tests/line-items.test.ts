import {
  addLineItem,
  deleteLineItem,
  editLineItem,
  isBillingStatementDocument,
  reducer,
  utils,
} from "document-models/billing-statement/v1";
import type { AddLineItemInput } from "document-models/billing-statement/v1";
import { describe, expect, it } from "vitest";

function makeItem(overrides: Partial<AddLineItemInput> = {}): AddLineItemInput {
  return {
    id: "item-1",
    description: "Development work",
    quantity: 2,
    unit: "HOUR",
    unitPricePwt: 10,
    unitPriceCash: 100,
    totalPricePwt: 20,
    totalPriceCash: 200,
    ...overrides,
  };
}

describe("LineItemsOperations", () => {
  it("should add several line items with varying units and recompute totals", () => {
    const document = utils.createDocument();

    const withMinute = reducer(
      document,
      addLineItem(
        makeItem({
          id: "minute-item",
          unit: "MINUTE",
          quantity: 30,
          unitPriceCash: 1,
          unitPricePwt: 0.5,
        }),
      ),
    );
    const withHour = reducer(
      withMinute,
      addLineItem(
        makeItem({
          id: "hour-item",
          unit: "HOUR",
          quantity: 2,
          unitPriceCash: 100,
          unitPricePwt: 10,
        }),
      ),
    );
    const withDay = reducer(
      withHour,
      addLineItem(
        makeItem({
          id: "day-item",
          unit: "DAY",
          quantity: 1,
          unitPriceCash: 800,
          unitPricePwt: 80,
        }),
      ),
    );
    const withUnit = reducer(
      withDay,
      addLineItem(
        makeItem({
          id: "unit-item",
          unit: "UNIT",
          quantity: 5,
          unitPriceCash: 20,
          unitPricePwt: 2,
        }),
      ),
    );

    expect(isBillingStatementDocument(withUnit)).toBe(true);
    expect(withUnit.state.global.lineItems).toHaveLength(4);
    // cash: 30*1 + 2*100 + 1*800 + 5*20 = 30+200+800+100 = 1130
    expect(withUnit.state.global.totalCash).toBe(1130);
    // powt: 30*0.5 + 2*10 + 1*80 + 5*2 = 15+20+80+10 = 125
    expect(withUnit.state.global.totalPowt).toBe(125);
    expect(withUnit.operations.global[0].action.type).toBe("ADD_LINE_ITEM");
    expect(withUnit.state.global.lineItems[0].lineItemTag).toEqual([]);
  });

  it("should record an error and not mutate state for a duplicate line item id", () => {
    const document = utils.createDocument();
    const first = reducer(document, addLineItem(makeItem({ id: "dup" })));

    const duplicate = reducer(first, addLineItem(makeItem({ id: "dup" })));

    // Second add is the operation at index 1.
    expect(duplicate.operations.global[1].error).toBe("Duplicate line item ID");
    expect(duplicate.state.global.lineItems).toHaveLength(1);
  });

  it("should edit an existing line item and skip null fields (sanitize filter)", () => {
    const document = utils.createDocument();
    const first = reducer(document, addLineItem(makeItem({ id: "edit-me" })));

    // Mix of non-null (kept) and null (filtered out) fields.
    const edited = reducer(
      first,
      editLineItem({
        id: "edit-me",
        description: "Updated description",
        quantity: 4,
        unitPriceCash: 50,
        unitPricePwt: 5,
        unit: null,
        totalPriceCash: null,
        totalPricePwt: null,
      }),
    );

    const item = edited.state.global.lineItems[0];
    expect(item.description).toBe("Updated description");
    expect(item.quantity).toBe(4);
    expect(item.unitPriceCash).toBe(50);
    // null field must NOT override the seeded value.
    expect(item.unit).toBe("HOUR");
    // Totals recomputed: 4*50 = 200 cash, 4*5 = 20 powt.
    expect(edited.state.global.totalCash).toBe(200);
    expect(edited.state.global.totalPowt).toBe(20);
  });

  it("should record an error and not mutate state when editing a missing line item", () => {
    const document = utils.createDocument();
    const first = reducer(document, addLineItem(makeItem({ id: "present" })));

    const edited = reducer(first, editLineItem({ id: "absent" }));

    expect(edited.operations.global[1].error).toBe(
      "Item matching input.id not found",
    );
    expect(edited.state.global.lineItems[0].description).toBe(
      "Development work",
    );
  });

  it("should delete a line item and recompute totals", () => {
    const document = utils.createDocument();
    const a = reducer(document, addLineItem(makeItem({ id: "a" })));
    const b = reducer(
      a,
      addLineItem(
        makeItem({
          id: "b",
          quantity: 3,
          unitPriceCash: 10,
          unitPricePwt: 1,
        }),
      ),
    );

    const deleted = reducer(b, deleteLineItem({ id: "a" }));

    expect(deleted.state.global.lineItems).toHaveLength(1);
    expect(deleted.state.global.lineItems[0].id).toBe("b");
    // Only item b remains: 3*10 = 30 cash, 3*1 = 3 powt.
    expect(deleted.state.global.totalCash).toBe(30);
    expect(deleted.state.global.totalPowt).toBe(3);
    expect(deleted.operations.global[2].action.type).toBe("DELETE_LINE_ITEM");
  });
});
