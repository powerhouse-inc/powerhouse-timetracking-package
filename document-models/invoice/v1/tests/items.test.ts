import {
  addLineItem,
  deleteLineItem,
  editLineItem,
  isInvoiceDocument,
  reducer,
  setInvoiceTag,
  setLineItemTag,
  utils,
} from "document-models/invoice/v1";
import type { InvoiceDocument } from "document-models/invoice/v1";
import { describe, expect, it } from "vitest";

/** A fully price-consistent line item (passes validatePrices). */
function cleanItem(id: string) {
  return {
    id,
    currency: "USD",
    description: `item ${id}`,
    quantity: 2,
    taxPercent: 10,
    unitPriceTaxExcl: 100,
    unitPriceTaxIncl: 110,
    totalPriceTaxExcl: 200,
    totalPriceTaxIncl: 220,
  };
}

function docWithItem(id: string): InvoiceDocument {
  const document = utils.createDocument();
  return reducer(document, addLineItem(cleanItem(id)));
}

describe("ItemsOperations", () => {
  describe("addLineItem", () => {
    it("adds a valid line item and updates totals", () => {
      const next = docWithItem("li-1");
      expect(isInvoiceDocument(next)).toBe(true);
      expect(next.state.global.lineItems).toHaveLength(1);
      expect(next.state.global.lineItems[0].lineItemTag).toEqual([]);
      expect(next.state.global.totalPriceTaxExcl).toBe(200);
      expect(next.state.global.totalPriceTaxIncl).toBe(220);
      expect(next.operations.global[0].action.type).toBe("ADD_LINE_ITEM");
    });

    it("errors on duplicate id", () => {
      const document = docWithItem("dup");
      const next = reducer(document, addLineItem(cleanItem("dup")));
      expect(next.operations.global[1].error).toBe("Duplicate input.id");
      expect(next.state.global.lineItems).toHaveLength(1);
    });

    it("errors when unit tax-incl/excl prices are inconsistent", () => {
      const document = utils.createDocument();
      const next = reducer(
        document,
        addLineItem({ ...cleanItem("bad"), unitPriceTaxExcl: 90 }),
      );
      expect(next.operations.global[0].error).toBe(
        "Tax inclusive/exclusive unit prices failed comparison.",
      );
    });

    it("errors when totalPriceTaxIncl does not match", () => {
      const document = utils.createDocument();
      const next = reducer(
        document,
        addLineItem({ ...cleanItem("bad2"), totalPriceTaxIncl: 999 }),
      );
      expect(next.operations.global[0].error).toBe(
        "Calculated unitPriceTaxIncl does not match input total",
      );
    });

    it("errors when totalPriceTaxExcl does not match", () => {
      const document = utils.createDocument();
      const next = reducer(
        document,
        addLineItem({ ...cleanItem("bad3"), totalPriceTaxExcl: 999 }),
      );
      expect(next.operations.global[0].error).toBe(
        "Calculated unitPriceTaxExcl does not match input total",
      );
    });

    it("errors on tax inclusive/exclusive totals comparison (epsilon window)", () => {
      // unit prices pass check1 (|d| < EPS) but totals scale the diff past EPS
      const document = utils.createDocument();
      const next = reducer(
        document,
        addLineItem({
          id: "eps",
          currency: "USD",
          description: "epsilon",
          quantity: 2,
          taxPercent: 10,
          unitPriceTaxExcl: 100.000009,
          unitPriceTaxIncl: 110,
          totalPriceTaxExcl: 200.000018,
          totalPriceTaxIncl: 220,
        }),
      );
      expect(next.operations.global[0].error).toBe(
        "Tax inclusive/exclusive totals failed comparison.",
      );
    });
  });

  describe("editLineItem", () => {
    it("errors when the item does not exist", () => {
      const document = utils.createDocument();
      const next = reducer(document, editLineItem({ id: "nope" }));
      expect(next.operations.global[0].error).toBe(
        "Item matching input.id not found",
      );
    });

    it("edits non-price fields, filtering null inputs", () => {
      const document = docWithItem("li-2");
      const next = reducer(
        document,
        editLineItem({
          id: "li-2",
          description: "updated description",
          currency: null,
        }),
      );
      expect(isInvoiceDocument(next)).toBe(true);
      const item = next.state.global.lineItems[0];
      expect(item.description).toBe("updated description");
      // null currency was filtered out, keeping the previous value
      expect(item.currency).toBe("USD");
    });

    it("edits lineItemTag when provided as array", () => {
      const document = docWithItem("li-3");
      // `lineItemTag` is not part of EditLineItemInput, but the reducer accepts
      // it at runtime. Passing via a variable avoids the excess-property check.
      const input = {
        id: "li-3",
        lineItemTag: [
          { dimension: "cost-center", value: "eng", label: "Engineering" },
        ],
      };
      const next = reducer(document, editLineItem(input));
      expect(next.state.global.lineItems[0].lineItemTag).toEqual([
        { dimension: "cost-center", value: "eng", label: "Engineering" },
      ]);
    });

    it("coerces a null lineItemTag input to an empty array", () => {
      const document = docWithItem("li-4");
      const input = { id: "li-4", lineItemTag: null };
      const next = reducer(document, editLineItem(input));
      expect(next.state.global.lineItems[0].lineItemTag).toEqual([]);
    });

    it("applies invariants: unit-price change recomputes tax-inclusive values", () => {
      // Borderline values: passes validatePrices but applyInvariants detects a
      // scaled change on unitPriceTaxIncl.
      const document = docWithItem("li-5");
      const next = reducer(
        document,
        editLineItem({
          id: "li-5",
          quantity: 1,
          taxPercent: 10,
          unitPriceTaxExcl: 100.0000095,
          unitPriceTaxIncl: 110,
          totalPriceTaxExcl: 100.0000095,
          totalPriceTaxIncl: 110,
        }),
      );
      expect(next.operations.global[1].error).toBeUndefined();
      const item = next.state.global.lineItems[0];
      // unitPriceTaxIncl recomputed from unitPriceTaxExcl * (1 + taxRate)
      expect(item.unitPriceTaxIncl).toBeCloseTo(100.0000095 * 1.1, 6);
    });
  });

  describe("deleteLineItem", () => {
    it("removes a line item and updates totals", () => {
      const document = docWithItem("li-del");
      const next = reducer(document, deleteLineItem({ id: "li-del" }));
      expect(next.state.global.lineItems).toHaveLength(0);
      expect(next.state.global.totalPriceTaxExcl).toBe(0);
      expect(next.state.global.totalPriceTaxIncl).toBe(0);
    });

    it("is a no-op when deleting a non-existent item", () => {
      const document = docWithItem("keep");
      const next = reducer(document, deleteLineItem({ id: "ghost" }));
      expect(next.state.global.lineItems).toHaveLength(1);
    });
  });

  describe("setLineItemTag", () => {
    it("errors when the line item does not exist", () => {
      const document = utils.createDocument();
      const next = reducer(
        document,
        setLineItemTag({ lineItemId: "nope", dimension: "d", value: "v" }),
      );
      expect(next.operations.global[0].error).toBe(
        "Item matching input.id not found",
      );
    });

    it("adds a new tag with a label", () => {
      const document = docWithItem("tag-1");
      const next = reducer(
        document,
        setLineItemTag({
          lineItemId: "tag-1",
          dimension: "cost-center",
          value: "eng",
          label: "Engineering",
        }),
      );
      expect(next.state.global.lineItems[0].lineItemTag).toEqual([
        { dimension: "cost-center", value: "eng", label: "Engineering" },
      ]);
    });

    it("adds a new tag without a label (null fallback)", () => {
      const document = docWithItem("tag-2");
      const next = reducer(
        document,
        setLineItemTag({
          lineItemId: "tag-2",
          dimension: "region",
          value: "eu",
        }),
      );
      expect(next.state.global.lineItems[0].lineItemTag).toEqual([
        { dimension: "region", value: "eu", label: null },
      ]);
    });

    it("updates an existing tag with the same dimension", () => {
      let document = docWithItem("tag-3");
      document = reducer(
        document,
        setLineItemTag({
          lineItemId: "tag-3",
          dimension: "region",
          value: "eu",
          label: "Europe",
        }),
      );
      const next = reducer(
        document,
        setLineItemTag({
          lineItemId: "tag-3",
          dimension: "region",
          value: "us",
        }),
      );
      expect(next.state.global.lineItems[0].lineItemTag).toEqual([
        { dimension: "region", value: "us", label: null },
      ]);
    });

    it("initializes lineItemTag when the seeded item has a null tag array", () => {
      // lineItemTag is a nullable array in the schema ([InvoiceTag!]). addLineItem
      // always seeds it to [], so a null value can only exist on a document loaded
      // with pre-existing state. A partial global is merged over initialGlobalState
      // at runtime; cast to the parameter type since the seed is intentionally
      // incomplete.
      const seededItem = {
        id: "seed-null-tag",
        currency: "USD",
        description: "seeded",
        quantity: 1,
        taxPercent: 0,
        unitPriceTaxExcl: 0,
        unitPriceTaxIncl: 0,
        totalPriceTaxExcl: 0,
        totalPriceTaxIncl: 0,
        lineItemTag: null,
      };
      const document = utils.createDocument({
        global: { lineItems: [seededItem] },
      } as Parameters<typeof utils.createDocument>[0]);
      expect(document.state.global.lineItems[0].lineItemTag).toBeNull();

      const next = reducer(
        document,
        setLineItemTag({
          lineItemId: "seed-null-tag",
          dimension: "region",
          value: "eu",
        }),
      );
      expect(next.operations.global[0].error).toBeUndefined();
      expect(next.state.global.lineItems[0].lineItemTag).toEqual([
        { dimension: "region", value: "eu", label: null },
      ]);
    });
  });

  describe("setInvoiceTag", () => {
    it("adds a new invoice tag with a label", () => {
      const document = utils.createDocument();
      const next = reducer(
        document,
        setInvoiceTag({ dimension: "project", value: "x", label: "Project X" }),
      );
      expect(next.state.global.invoiceTags).toEqual([
        { dimension: "project", value: "x", label: "Project X" },
      ]);
    });

    it("adds a new invoice tag without a label (null fallback)", () => {
      const document = utils.createDocument();
      const next = reducer(
        document,
        setInvoiceTag({ dimension: "team", value: "core" }),
      );
      expect(next.state.global.invoiceTags).toEqual([
        { dimension: "team", value: "core", label: null },
      ]);
    });

    it("updates an existing invoice tag with the same dimension", () => {
      let document = utils.createDocument();
      document = reducer(
        document,
        setInvoiceTag({ dimension: "team", value: "core", label: "Core" }),
      );
      const next = reducer(
        document,
        setInvoiceTag({ dimension: "team", value: "platform" }),
      );
      expect(next.state.global.invoiceTags).toEqual([
        { dimension: "team", value: "platform", label: null },
      ]);
    });
  });
});
