import {
  addPayment,
  editInvoice,
  editIssuerWallet,
  editPaymentData,
  editStatus,
  isInvoiceDocument,
  reducer,
  setExportedData,
  utils,
} from "document-models/invoice/v1";
import { describe, expect, it } from "vitest";

describe("GeneralOperations", () => {
  describe("editInvoice", () => {
    it("applies explicit values and converts date-only strings to datetime", () => {
      const document = utils.createDocument();
      const input = {
        currency: "USD",
        dateDue: "2024-02-01",
        dateIssued: "2024-01-01T10:00:00.000Z",
        dateDelivered: "2024-01-15",
        invoiceNo: "INV-1",
        notes: "hello",
      };

      const next = reducer(document, editInvoice(input));

      expect(isInvoiceDocument(next)).toBe(true);
      expect(next.operations.global).toHaveLength(1);
      expect(next.operations.global[0].action.type).toBe("EDIT_INVOICE");
      expect(next.operations.global[0].index).toEqual(0);
      expect(next.state.global.currency).toBe("USD");
      // date-only converted, datetime kept as-is
      expect(next.state.global.dateDue).toBe("2024-02-01T00:00:00.000Z");
      expect(next.state.global.dateIssued).toBe("2024-01-01T10:00:00.000Z");
      expect(next.state.global.dateDelivered).toBe("2024-01-15T00:00:00.000Z");
      expect(next.state.global.invoiceNo).toBe("INV-1");
      expect(next.state.global.notes).toBe("hello");
    });

    it("keeps existing state when fields are omitted (?? / undefined fallbacks)", () => {
      let document = utils.createDocument();
      document = reducer(
        document,
        editInvoice({
          currency: "EUR",
          dateDue: "2024-03-01T00:00:00.000Z",
          dateIssued: "2024-01-01T00:00:00.000Z",
          dateDelivered: "2024-02-01T00:00:00.000Z",
          invoiceNo: "INV-2",
          notes: "note",
        }),
      );

      const next = reducer(document, editInvoice({}));

      expect(isInvoiceDocument(next)).toBe(true);
      expect(next.state.global.currency).toBe("EUR");
      expect(next.state.global.dateDue).toBe("2024-03-01T00:00:00.000Z");
      expect(next.state.global.dateIssued).toBe("2024-01-01T00:00:00.000Z");
      expect(next.state.global.dateDelivered).toBe("2024-02-01T00:00:00.000Z");
      expect(next.state.global.invoiceNo).toBe("INV-2");
      expect(next.state.global.notes).toBe("note");
    });

    it("treats empty string date as null (falsy branch of ensureDatetimeFormat)", () => {
      const document = utils.createDocument();
      const next = reducer(document, editInvoice({ dateDue: "" }));
      expect(next.state.global.dateDue).toBeNull();
    });

    it("treats whitespace-only date as null (trim branch of ensureDatetimeFormat)", () => {
      const document = utils.createDocument();
      const next = reducer(document, editInvoice({ dateIssued: "   " }));
      expect(next.state.global.dateIssued).toBeNull();
    });
  });

  describe("editStatus", () => {
    it("moves from DRAFT to CANCELLED without wallet requirement", () => {
      const document = utils.createDocument();
      const next = reducer(document, editStatus({ status: "CANCELLED" }));
      expect(isInvoiceDocument(next)).toBe(true);
      expect(next.state.global.status).toBe("CANCELLED");
      expect(next.operations.global[0].action.type).toBe("EDIT_STATUS");
    });

    it("moves out of DRAFT to ISSUED when issuer wallet is set", () => {
      let document = utils.createDocument();
      document = reducer(
        document,
        editIssuerWallet({
          address: "0xabc",
          chainId: "1",
          chainName: "Ethereum",
        }),
      );
      const next = reducer(document, editStatus({ status: "ISSUED" }));
      expect(isInvoiceDocument(next)).toBe(true);
      expect(next.state.global.status).toBe("ISSUED");
    });

    it("errors leaving DRAFT with no wallet at all", () => {
      const document = utils.createDocument();
      const next = reducer(document, editStatus({ status: "ISSUED" }));
      expect(next.operations.global[0].error).toBe(
        "Issuer wallet address and chain must be set before moving out of DRAFT",
      );
      expect(next.state.global.status).toBe("DRAFT");
    });

    it("errors leaving DRAFT when wallet has address but no chain", () => {
      let document = utils.createDocument();
      document = reducer(document, editIssuerWallet({ address: "0xabc" }));
      const next = reducer(document, editStatus({ status: "ISSUED" }));
      expect(next.operations.global[1].error).toBe(
        "Issuer wallet address and chain must be set before moving out of DRAFT",
      );
      expect(next.state.global.status).toBe("DRAFT");
    });
  });

  describe("addPayment / editPaymentData", () => {
    it("adds a payment with explicit values then edits it", () => {
      let document = utils.createDocument();
      document = reducer(
        document,
        addPayment({
          id: "pay-1",
          confirmed: false,
          processorRef: "proc-1",
          paymentDate: "2024-06-01T00:00:00.000Z",
          txnRef: "tx-1",
          issue: "",
        }),
      );
      expect(isInvoiceDocument(document)).toBe(true);
      expect(document.state.global.payments).toHaveLength(1);

      const next = reducer(
        document,
        editPaymentData({
          id: "pay-1",
          confirmed: true,
          processorRef: "proc-2",
          paymentDate: "2024-07-01T00:00:00.000Z",
          txnRef: "tx-2",
          issue: "late",
        }),
      );
      expect(isInvoiceDocument(next)).toBe(true);
      const payment = next.state.global.payments[0];
      expect(payment.processorRef).toBe("proc-2");
      expect(payment.txnRef).toBe("tx-2");
      expect(payment.confirmed).toBe(true);
      expect(payment.issue).toBe("late");
      expect(payment.paymentDate).toBe("2024-07-01T00:00:00.000Z");
    });

    it("adds a payment with minimal input (fallback defaults)", () => {
      const document = utils.createDocument();
      const next = reducer(
        document,
        addPayment({ id: "pay-min", confirmed: true }),
      );
      expect(isInvoiceDocument(next)).toBe(true);
      const payment = next.state.global.payments[0];
      expect(payment.processorRef).toBe("");
      expect(payment.txnRef).toBe("");
      expect(payment.issue).toBe("");
      expect(payment.confirmed).toBe(true);
      expect(payment.paymentDate).toBeTruthy();
    });

    it("editPaymentData is a no-op when payment id is not found", () => {
      const document = utils.createDocument();
      const next = reducer(
        document,
        editPaymentData({ id: "missing", confirmed: true }),
      );
      expect(isInvoiceDocument(next)).toBe(true);
      expect(next.state.global.payments).toHaveLength(0);
      expect(next.operations.global[0].error).toBeUndefined();
    });

    it("editPaymentData keeps existing values when fields omitted", () => {
      let document = utils.createDocument();
      document = reducer(
        document,
        addPayment({
          id: "pay-keep",
          confirmed: true,
          processorRef: "keep-proc",
          paymentDate: "2024-06-01T00:00:00.000Z",
          txnRef: "keep-tx",
          issue: "keep-issue",
        }),
      );
      const next = reducer(
        document,
        editPaymentData({ id: "pay-keep", confirmed: false }),
      );
      const payment = next.state.global.payments[0];
      expect(payment.processorRef).toBe("keep-proc");
      expect(payment.txnRef).toBe("keep-tx");
      expect(payment.issue).toBe("keep-issue");
      expect(payment.confirmed).toBe(false);
    });
  });

  describe("setExportedData", () => {
    it("stores exported data", () => {
      const document = utils.createDocument();
      const next = reducer(
        document,
        setExportedData({
          timestamp: "2024-08-01T00:00:00.000Z",
          exportedLineItems: [["a", "b"], ["c"]],
        }),
      );
      expect(isInvoiceDocument(next)).toBe(true);
      expect(next.state.global.exported.timestamp).toBe(
        "2024-08-01T00:00:00.000Z",
      );
      expect(next.state.global.exported.exportedLineItems).toEqual([
        ["a", "b"],
        ["c"],
      ]);
      expect(next.operations.global[0].action.type).toBe("SET_EXPORTED_DATA");
    });
  });
});
