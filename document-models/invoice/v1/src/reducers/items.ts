import type { InvoiceItemsOperations } from "document-models/invoice/v1";
import type {
  InvoiceLineItem,
  InvoiceState,
  InvoiceTag,
} from "../../gen/types.js";

export const invoiceItemsOperations: InvoiceItemsOperations = {
  addLineItemOperation(state, action) {
    const item: InvoiceLineItem = {
      ...action.input,
      lineItemTag: [],
    };

    if (state.lineItems.find((x) => x.id === item.id))
      throw new Error("Duplicate input.id");

    validatePrices(item);
    state.lineItems.push(item);
    updateTotals(state);
  },

  editLineItemOperation(state, action) {
    const stateItem = state.lineItems.find((x) => x.id === action.input.id);
    if (!stateItem) throw new Error("Item matching input.id not found");

    const sanitizedInput = Object.fromEntries(
      Object.entries(action.input).filter(([, value]) => value !== null),
    ) as Partial<InvoiceLineItem>;

    // Ensure lineItemTag is always an array if provided
    if ("lineItemTag" in action.input) {
      sanitizedInput.lineItemTag = (action.input.lineItemTag ??
        []) as InvoiceTag[];
    }

    const nextItem: InvoiceLineItem = {
      ...stateItem,
      ...sanitizedInput,
    };
    validatePrices(nextItem);
    applyInvariants(nextItem);
    Object.assign(stateItem, nextItem);
    updateTotals(state);
  },

  deleteLineItemOperation(state, action) {
    state.lineItems = state.lineItems.filter((x) => x.id !== action.input.id);
    updateTotals(state);
  },

  setLineItemTagOperation(state, action) {
    const stateItem = state.lineItems.find(
      (x) => x.id === action.input.lineItemId,
    );
    if (!stateItem) throw new Error("Item matching input.id not found");

    // if tag already exists with the same dimension, update the value and label
    const existingTag = stateItem.lineItemTag?.find(
      (tag) => tag.dimension === action.input.dimension,
    );
    if (existingTag) {
      existingTag.value = action.input.value;
      existingTag.label = action.input.label || null;
    } else {
      // if tag does not exist, add it
      const newTag: InvoiceTag = {
        dimension: action.input.dimension,
        value: action.input.value,
        label: action.input.label || null,
      };
      if (!stateItem.lineItemTag) {
        stateItem.lineItemTag = [];
      }

      // Add the new tag
      stateItem.lineItemTag?.push(newTag);
    }
  },
  setInvoiceTagOperation(state, action) {
    // if tag already exists with the same dimension, update the value and label
    const existingTag = state.invoiceTags?.find(
      (tag) => tag.dimension === action.input.dimension,
    );
    if (existingTag) {
      existingTag.value = action.input.value;
      existingTag.label = action.input.label || null;
    } else {
      // if tag does not exist, add it
      const newTag: InvoiceTag = {
        dimension: action.input.dimension,
        value: action.input.value,
        label: action.input.label || null,
      };
      // Add the new tag (invoiceTags is a non-nullable array in state)
      state.invoiceTags.push(newTag);
    }
  },
};

function updateTotals(state: InvoiceState) {
  state.totalPriceTaxExcl = state.lineItems.reduce((total, lineItem) => {
    return total + lineItem.quantity * lineItem.unitPriceTaxExcl;
  }, 0.0);

  state.totalPriceTaxIncl = state.lineItems.reduce((total, lineItem) => {
    return total + lineItem.quantity * lineItem.unitPriceTaxIncl;
  }, 0.0);
}

function validatePrices(item: InvoiceLineItem) {
  const EPSILON = 0.00001; // Small value for floating point comparisons

  // Calculate total prices from unit prices and quantity
  const calcPriceIncl = item.quantity * item.unitPriceTaxIncl;
  const calcPriceExcl = item.quantity * item.unitPriceTaxExcl;

  // Convert tax percentage to decimal rate
  const taxRate = item.taxPercent / 100;

  // Helper function to compare floating point numbers
  const isClose = (a: number, b: number) => Math.abs(a - b) < EPSILON;

  // Validate unit prices (tax-exclusive should equal tax-inclusive / (1 + taxRate))
  const expectedUnitPriceExcl = item.unitPriceTaxIncl / (1 + taxRate);
  if (!isClose(item.unitPriceTaxExcl, expectedUnitPriceExcl)) {
    throw new Error("Tax inclusive/exclusive unit prices failed comparison.");
  }

  // Validate total prices
  if (!isClose(calcPriceIncl, item.totalPriceTaxIncl)) {
    throw new Error("Calculated unitPriceTaxIncl does not match input total");
  }

  if (!isClose(calcPriceExcl, item.totalPriceTaxExcl)) {
    throw new Error("Calculated unitPriceTaxExcl does not match input total");
  }

  // Validate total prices using the tax rate
  const expectedTotalPriceExcl = calcPriceIncl / (1 + taxRate);
  if (!isClose(calcPriceExcl, expectedTotalPriceExcl)) {
    throw new Error("Tax inclusive/exclusive totals failed comparison.");
  }
}

const applyInvariants = (nextItem: InvoiceLineItem) => {
  const EPSILON = 0.00001; // Small value for floating point comparisons

  // Helper function to compare floating point numbers
  const isClose = (a: number, b: number) => Math.abs(a - b) < EPSILON;

  // Helper function to check if a value has changed significantly
  const hasChanged = (oldValue: number, newValue: number) =>
    !isClose(oldValue, newValue);

  const taxRate = nextItem.taxPercent / 100;

  // Check if unitPriceTaxExcl was changed and update totals accordingly.
  // (The tax-exclusive/inclusive relationship is scaled by (1 + taxRate),
  // so this can differ from the tolerance validatePrices enforced.)
  const expectedUnitPriceTaxIncl = nextItem.unitPriceTaxExcl * (1 + taxRate);
  if (hasChanged(expectedUnitPriceTaxIncl, nextItem.unitPriceTaxIncl)) {
    // Unit price was changed, update tax-inclusive unit price and totals
    nextItem.unitPriceTaxIncl = nextItem.unitPriceTaxExcl * (1 + taxRate);
    nextItem.totalPriceTaxExcl = nextItem.quantity * nextItem.unitPriceTaxExcl;
    nextItem.totalPriceTaxIncl = nextItem.quantity * nextItem.unitPriceTaxIncl;
  }
};
