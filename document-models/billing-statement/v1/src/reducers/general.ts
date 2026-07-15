import type { BillingStatementGeneralOperations } from "document-models/billing-statement/v1";

export const billingStatementGeneralOperations: BillingStatementGeneralOperations =
  {
    editBillingStatementOperation(state, action) {
      state.dateIssued = action.input.dateIssued ?? state.dateIssued;
      state.dateDue = action.input.dateDue ?? state.dateDue;
      state.currency = action.input.currency ?? state.currency;
      state.notes = action.input.notes ?? state.notes;
    },
    editContributorOperation(state, action) {
      // `contributor` is a required PHID in the input schema (validated by the
      // generated reducer wrapper before this runs), so no fallback is needed.
      state.contributor = action.input.contributor;
    },
    editStatusOperation(state, action) {
      // `status` is a required enum, already validated by the generated reducer
      // wrapper's zod parse; the previous in-body re-validation was dead code
      // (and imported a schema from the package barrel, which resolved to
      // `undefined` via a circular import and broke this op at runtime).
      state.status = action.input.status;
    },
  };
