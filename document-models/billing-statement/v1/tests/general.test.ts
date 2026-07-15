// NOTE: The `editStatus` reducer imports `BillingStatementStatusInputSchema`
// from the top-level barrel `document-models/billing-statement`. Because of a
// circular import between that barrel and this package's `v1` entry point, the
// named binding only becomes defined once the top-level barrel has been fully
// evaluated. Importing it for side effects here forces that evaluation so the
// reducer sees a real schema instead of `undefined` at call time.
import "document-models/billing-statement";

import {
  editBillingStatement,
  editContributor,
  editStatus,
  isBillingStatementDocument,
  reducer,
  utils,
} from "document-models/billing-statement/v1";
import { describe, expect, it } from "vitest";

describe("GeneralOperations", () => {
  it("should handle editBillingStatement operation (all fields provided)", () => {
    const document = utils.createDocument();
    const input = {
      dateIssued: "2026-01-01T00:00:00.000Z",
      dateDue: "2026-02-01T00:00:00.000Z",
      currency: "USD",
      notes: "First billing statement",
    };

    const updatedDocument = reducer(document, editBillingStatement(input));

    expect(isBillingStatementDocument(updatedDocument)).toBe(true);
    expect(updatedDocument.operations.global).toHaveLength(1);
    expect(updatedDocument.operations.global[0].action.type).toBe(
      "EDIT_BILLING_STATEMENT",
    );
    expect(updatedDocument.state.global.dateIssued).toBe(
      "2026-01-01T00:00:00.000Z",
    );
    expect(updatedDocument.state.global.dateDue).toBe(
      "2026-02-01T00:00:00.000Z",
    );
    expect(updatedDocument.state.global.currency).toBe("USD");
    expect(updatedDocument.state.global.notes).toBe("First billing statement");
    expect(updatedDocument.operations.global[0].index).toEqual(0);
  });

  it("should keep existing values when editBillingStatement receives empty input (fallback branches)", () => {
    const document = utils.createDocument();
    const seeded = reducer(
      document,
      editBillingStatement({
        dateIssued: "2026-01-01T00:00:00.000Z",
        dateDue: "2026-02-01T00:00:00.000Z",
        currency: "EUR",
        notes: "seed",
      }),
    );

    // Empty input -> every `?? state.x` fallback branch is taken.
    const updated = reducer(seeded, editBillingStatement({}));

    expect(updated.state.global.dateIssued).toBe("2026-01-01T00:00:00.000Z");
    expect(updated.state.global.dateDue).toBe("2026-02-01T00:00:00.000Z");
    expect(updated.state.global.currency).toBe("EUR");
    expect(updated.state.global.notes).toBe("seed");
  });

  it("should handle editContributor operation", () => {
    const document = utils.createDocument();
    const input = { contributor: "phd:contributor-123" };

    const updatedDocument = reducer(document, editContributor(input));

    expect(isBillingStatementDocument(updatedDocument)).toBe(true);
    expect(updatedDocument.operations.global).toHaveLength(1);
    expect(updatedDocument.operations.global[0].action.type).toBe(
      "EDIT_CONTRIBUTOR",
    );
    expect(updatedDocument.state.global.contributor).toBe(
      "phd:contributor-123",
    );
  });

  it("should walk the status through every valid transition", () => {
    const document = utils.createDocument();
    expect(document.state.global.status).toBe("DRAFT");

    const issued = reducer(document, editStatus({ status: "ISSUED" }));
    expect(issued.operations.global[0].action.type).toBe("EDIT_STATUS");
    expect(issued.operations.global[0].error).toBeUndefined();
    expect(issued.state.global.status).toBe("ISSUED");

    const accepted = reducer(issued, editStatus({ status: "ACCEPTED" }));
    expect(accepted.state.global.status).toBe("ACCEPTED");

    const rejected = reducer(issued, editStatus({ status: "REJECTED" }));
    expect(rejected.state.global.status).toBe("REJECTED");

    const paid = reducer(accepted, editStatus({ status: "PAID" }));
    expect(paid.state.global.status).toBe("PAID");

    const backToDraft = reducer(paid, editStatus({ status: "DRAFT" }));
    expect(backToDraft.state.global.status).toBe("DRAFT");
  });
});
