import {
  accept,
  cancel,
  closePayment,
  confirmPayment,
  editInvoice,
  editIssuerWallet,
  editStatus,
  isInvoiceDocument,
  issue,
  reapprovePayment,
  reducer,
  registerPaymentTx,
  reinstate,
  reject,
  reportPaymentIssue,
  reset,
  schedulePayment,
  utils,
} from "document-models/invoice/v1";
import type { InvoiceDocument, Status } from "document-models/invoice/v1";
import { describe, expect, it } from "vitest";

const WALLET = { address: "0xabc", chainId: "1", chainName: "Ethereum" };

/** Drive a fresh document into an arbitrary status using editStatus. */
function inStatus(status: Status): InvoiceDocument {
  let d = utils.createDocument();
  d = reducer(d, editIssuerWallet(WALLET));
  d = reducer(d, editStatus({ status: "ISSUED" }));
  if (status !== "ISSUED") {
    d = reducer(d, editStatus({ status }));
  }
  return d;
}

describe("TransitionsOperations", () => {
  it("runs the full happy-path lifecycle", () => {
    let d = utils.createDocument();
    d = reducer(d, editInvoice({ currency: "USD" }));
    d = reducer(d, editIssuerWallet(WALLET));

    d = reducer(d, issue({ invoiceNo: "INV-1", dateIssued: "2024-01-01" }));
    expect(d.state.global.status).toBe("ISSUED");
    expect(d.state.global.invoiceNo).toBe("INV-1");
    expect(d.state.global.dateIssued).toBe("2024-01-01T00:00:00.000Z");
    expect(isInvoiceDocument(d)).toBe(true);

    d = reducer(d, accept({ payAfter: "2024-02-01T00:00:00.000Z" }));
    expect(d.state.global.status).toBe("ACCEPTED");
    expect(d.state.global.payAfter).toBe("2024-02-01T00:00:00.000Z");

    d = reducer(d, schedulePayment({ id: "pay-1", processorRef: "proc-1" }));
    expect(d.state.global.status).toBe("PAYMENTSCHEDULED");
    expect(d.state.global.payments).toHaveLength(1);

    d = reducer(
      d,
      registerPaymentTx({
        id: "pay-1",
        txRef: "0xdeadbeef",
        timestamp: "2024-01-05T00:00:00.000Z",
      }),
    );
    expect(d.state.global.status).toBe("PAYMENTSENT");
    expect(d.state.global.payments[0].txnRef).toBe("0xdeadbeef");
    expect(d.state.global.payments[0].paymentDate).toBe(
      "2024-01-05T00:00:00.000Z",
    );

    d = reducer(d, confirmPayment({ id: "pay-1", amount: 100 }));
    expect(d.state.global.status).toBe("PAYMENTRECEIVED");
    expect(d.state.global.payments[0].confirmed).toBe(true);
    expect(d.state.global.payments[0].amount).toBe(100);

    d = reducer(d, reportPaymentIssue({ id: "pay-1", issue: "late" }));
    expect(d.state.global.status).toBe("PAYMENTISSUE");
    expect(d.state.global.payments[0].issue).toBe("late");

    d = reducer(d, reapprovePayment({}));
    expect(d.state.global.status).toBe("ACCEPTED");

    d = reducer(d, closePayment({ closureReason: "OVERPAID" }));
    expect(d.state.global.status).toBe("PAYMENTCLOSED");
    expect(d.state.global.closureReason).toBe("OVERPAID");

    // PAYMENTCLOSED -> ACCEPTED
    d = reducer(d, reapprovePayment({}));
    expect(d.state.global.status).toBe("ACCEPTED");
    expect(isInvoiceDocument(d)).toBe(true);
  });

  it("cancel then reset lifecycle", () => {
    let d = utils.createDocument();
    d = reducer(d, cancel({}));
    expect(d.state.global.status).toBe("CANCELLED");

    d = reducer(d, reset({}));
    expect(d.state.global.status).toBe("DRAFT");
    expect(isInvoiceDocument(d)).toBe(true);
  });

  it("reject then reinstate lifecycle (non-final rejection)", () => {
    let d = utils.createDocument();
    d = reducer(d, editInvoice({ currency: "USD" }));
    d = reducer(d, editIssuerWallet(WALLET));
    d = reducer(d, issue({ invoiceNo: "INV-1", dateIssued: "2024-01-01" }));

    d = reducer(
      d,
      reject({ id: "rej-1", reason: "wrong amount", final: false }),
    );
    expect(d.state.global.status).toBe("REJECTED");
    expect(d.state.global.rejections).toHaveLength(1);

    d = reducer(d, reinstate({}));
    expect(d.state.global.status).toBe("ISSUED");
    expect(isInvoiceDocument(d)).toBe(true);
  });

  it("closePayment with CANCELLED reason and UNDERPAID reason", () => {
    let d = inStatus("PAYMENTSCHEDULED");
    d = reducer(d, closePayment({ closureReason: "CANCELLED" }));
    expect(d.state.global.status).toBe("PAYMENTCLOSED");
    expect(d.state.global.closureReason).toBe("CANCELLED");

    let d2 = inStatus("ACCEPTED");
    d2 = reducer(d2, closePayment({ closureReason: "UNDERPAID" }));
    expect(d2.state.global.status).toBe("PAYMENTCLOSED");
    expect(d2.state.global.closureReason).toBe("UNDERPAID");
  });

  describe("issue variations", () => {
    it("issue with datetime string keeps it as-is", () => {
      let d = utils.createDocument();
      d = reducer(d, editIssuerWallet(WALLET));
      d = reducer(
        d,
        issue({
          invoiceNo: "INV-9",
          dateIssued: "2024-01-01T09:30:00.000Z",
        }),
      );
      expect(d.state.global.dateIssued).toBe("2024-01-01T09:30:00.000Z");
    });

    it("issue with whitespace date falls back to raw input value", () => {
      let d = utils.createDocument();
      d = reducer(d, editIssuerWallet(WALLET));
      d = reducer(d, issue({ invoiceNo: "INV-8", dateIssued: "   " }));
      expect(d.state.global.status).toBe("ISSUED");
      expect(d.state.global.dateIssued).toBe("   ");
    });

    it("issue is allowed for stablecoin currency when wallet is set", () => {
      let d = utils.createDocument();
      d = reducer(d, editInvoice({ currency: "USDC" }));
      d = reducer(d, editIssuerWallet(WALLET));
      d = reducer(d, issue({ invoiceNo: "INV-7", dateIssued: "2024-01-01" }));
      expect(d.state.global.status).toBe("ISSUED");
    });
  });

  describe("validation errors", () => {
    it("issue requires invoiceNo and dateIssued", () => {
      const d = utils.createDocument();
      const next = reducer(d, issue({ invoiceNo: "", dateIssued: "" }));
      expect(next.operations.global[0].error).toBe(
        "Invoice number and date issued are required",
      );
    });

    it("issue requires wallet for stablecoin currency", () => {
      let d = utils.createDocument();
      d = reducer(d, editInvoice({ currency: "USDC" }));
      const next = reducer(
        d,
        issue({ invoiceNo: "INV-1", dateIssued: "2024-01-01" }),
      );
      expect(next.operations.global[1].error).toBe(
        "Issuer wallet address and chain must be set before issuing an invoice",
      );
    });

    it("issue requires a chain (not just an address) for stablecoin currency", () => {
      let d = utils.createDocument();
      d = reducer(d, editInvoice({ currency: "DAI" }));
      d = reducer(d, editIssuerWallet({ address: "0xabc" }));
      const before = d.operations.global.length;
      const next = reducer(
        d,
        issue({ invoiceNo: "INV-1", dateIssued: "2024-01-01" }),
      );
      expect(next.operations.global[before].error).toBe(
        "Issuer wallet address and chain must be set before issuing an invoice",
      );
    });

    it("reject requires id and reason", () => {
      const d = inStatus("ISSUED");
      const before = d.operations.global.length;
      const next = reducer(d, reject({ id: "", reason: "", final: false }));
      expect(next.operations.global[before].error).toBe(
        "Reason, ID and final are required",
      );
    });

    it("accept requires payAfter", () => {
      const d = inStatus("ISSUED");
      const before = d.operations.global.length;
      const next = reducer(d, accept({}));
      expect(next.operations.global[before].error).toBe(
        "Pay after is required",
      );
    });

    it("schedulePayment requires id and processorRef", () => {
      const d = inStatus("ACCEPTED");
      const before = d.operations.global.length;
      const next = reducer(d, schedulePayment({ id: "", processorRef: "" }));
      expect(next.operations.global[before].error).toBe(
        "ID and processorRef are required",
      );
    });

    it("reportPaymentIssue requires id and issue", () => {
      const d = utils.createDocument();
      const next = reducer(d, reportPaymentIssue({ id: "", issue: "" }));
      expect(next.operations.global[0].error).toBe("ID and issue are required");
    });

    it("confirmPayment requires id and amount", () => {
      const d = utils.createDocument();
      const next = reducer(d, confirmPayment({ id: "", amount: 0 }));
      expect(next.operations.global[0].error).toBe(
        "ID and amount are required",
      );
    });

    it("closePayment requires closureReason", () => {
      const d = utils.createDocument();
      const next = reducer(d, closePayment({}));
      expect(next.operations.global[0].error).toBe(
        "Closure reason is required",
      );
    });

    it("reinstate is blocked when a final rejection exists", () => {
      let d = utils.createDocument();
      d = reducer(d, editIssuerWallet(WALLET));
      d = reducer(d, issue({ invoiceNo: "INV-1", dateIssued: "2024-01-01" }));
      d = reducer(d, reject({ id: "r", reason: "final", final: true }));
      const before = d.operations.global.length;
      const next = reducer(d, reinstate({}));
      expect(next.operations.global[before].error).toBe(
        "Cannot reinstate an invoice that has been rejected",
      );
    });
  });

  describe("invalid transitions", () => {
    it("cancel from ISSUED is invalid", () => {
      const d = inStatus("ISSUED");
      const before = d.operations.global.length;
      const next = reducer(d, cancel({}));
      expect(next.operations.global[before].error).toBe(
        "Invalid transition from ISSUED to CANCELLED",
      );
    });

    it("issue from ACCEPTED is invalid", () => {
      const d = inStatus("ACCEPTED");
      const before = d.operations.global.length;
      const next = reducer(
        d,
        issue({ invoiceNo: "INV-1", dateIssued: "2024-01-01" }),
      );
      expect(next.operations.global[before].error).toBe(
        "Invalid transition from ACCEPTED to ISSUED",
      );
    });

    it("reset from DRAFT is invalid", () => {
      const d = utils.createDocument();
      const next = reducer(d, reset({}));
      expect(next.operations.global[0].error).toBe(
        "Invalid transition from DRAFT to DRAFT",
      );
    });

    it("reject from ACCEPTED is invalid", () => {
      const d = inStatus("ACCEPTED");
      const before = d.operations.global.length;
      const next = reducer(d, reject({ id: "r", reason: "x", final: false }));
      expect(next.operations.global[before].error).toBe(
        "Invalid transition from ACCEPTED to REJECTED",
      );
    });

    it("accept from DRAFT is invalid", () => {
      const d = utils.createDocument();
      const next = reducer(d, accept({ payAfter: "2024-02-01T00:00:00.000Z" }));
      expect(next.operations.global[0].error).toBe(
        "Invalid transition from DRAFT to ACCEPTED",
      );
    });

    it("reinstate from ACCEPTED is invalid", () => {
      const d = inStatus("ACCEPTED");
      const before = d.operations.global.length;
      const next = reducer(d, reinstate({}));
      expect(next.operations.global[before].error).toBe(
        "Invalid transition from ACCEPTED to ISSUED",
      );
    });

    it("schedulePayment from DRAFT is invalid", () => {
      const d = utils.createDocument();
      const next = reducer(d, schedulePayment({ id: "x", processorRef: "y" }));
      expect(next.operations.global[0].error).toBe(
        "Invalid transition from DRAFT to PAYMENTSCHEDULED",
      );
    });

    it("reapprovePayment from DRAFT is invalid", () => {
      const d = utils.createDocument();
      const next = reducer(d, reapprovePayment({}));
      expect(next.operations.global[0].error).toBe(
        "Invalid transition from DRAFT to ACCEPTED",
      );
    });

    it("registerPaymentTx from DRAFT is invalid", () => {
      const d = utils.createDocument();
      const next = reducer(
        d,
        registerPaymentTx({
          id: "x",
          txRef: "y",
          timestamp: "2024-01-01T00:00:00.000Z",
        }),
      );
      expect(next.operations.global[0].error).toBe(
        "Invalid transition from DRAFT to PAYMENTSENT",
      );
    });

    it("reportPaymentIssue from ISSUED is invalid", () => {
      const d = inStatus("ISSUED");
      const before = d.operations.global.length;
      const next = reducer(d, reportPaymentIssue({ id: "x", issue: "y" }));
      expect(next.operations.global[before].error).toBe(
        "Invalid transition from ISSUED to PAYMENTISSUE",
      );
    });

    it("confirmPayment from ISSUED is invalid", () => {
      const d = inStatus("ISSUED");
      const before = d.operations.global.length;
      const next = reducer(d, confirmPayment({ id: "x", amount: 5 }));
      expect(next.operations.global[before].error).toBe(
        "Invalid transition from ISSUED to PAYMENTRECEIVED",
      );
    });

    it("closePayment from ISSUED is invalid", () => {
      const d = inStatus("ISSUED");
      const before = d.operations.global.length;
      const next = reducer(d, closePayment({ closureReason: "CANCELLED" }));
      expect(next.operations.global[before].error).toBe(
        "Invalid transition from ISSUED to PAYMENTCLOSED",
      );
    });

    it("reapprovePayment from PAYMENTISSUE succeeds", () => {
      const d = inStatus("PAYMENTISSUE");
      const next = reducer(d, reapprovePayment({}));
      expect(next.state.global.status).toBe("ACCEPTED");
    });
  });

  describe("payment-not-found errors", () => {
    function scheduledDoc(): InvoiceDocument {
      let d = utils.createDocument();
      d = reducer(d, editIssuerWallet(WALLET));
      d = reducer(d, issue({ invoiceNo: "INV-1", dateIssued: "2024-01-01" }));
      d = reducer(d, accept({ payAfter: "2024-02-01T00:00:00.000Z" }));
      d = reducer(d, schedulePayment({ id: "pay-1", processorRef: "proc-1" }));
      return d;
    }

    it("registerPaymentTx errors when payment id not found", () => {
      const d = scheduledDoc();
      const before = d.operations.global.length;
      const next = reducer(
        d,
        registerPaymentTx({
          id: "other",
          txRef: "tx",
          timestamp: "2024-01-05T00:00:00.000Z",
        }),
      );
      expect(next.operations.global[before].error).toBe("Payment not found");
    });

    it("reportPaymentIssue errors when payment id not found", () => {
      const d = scheduledDoc();
      const before = d.operations.global.length;
      const next = reducer(
        d,
        reportPaymentIssue({ id: "other", issue: "problem" }),
      );
      expect(next.operations.global[before].error).toBe("Payment not found");
    });

    it("confirmPayment errors when payment id not found", () => {
      let d = scheduledDoc();
      d = reducer(
        d,
        registerPaymentTx({
          id: "pay-1",
          txRef: "tx",
          timestamp: "2024-01-05T00:00:00.000Z",
        }),
      );
      const before = d.operations.global.length;
      const next = reducer(d, confirmPayment({ id: "other", amount: 10 }));
      expect(next.operations.global[before].error).toBe("Payment not found");
    });
  });
});
