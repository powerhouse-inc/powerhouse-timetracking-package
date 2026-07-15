import {
  addBillingStatement,
  addLineItem,
  addLineItemGroup,
  addWallet,
  isExpenseReportDocument,
  reducer,
  removeBillingStatement,
  removeGroupTotals,
  removeLineItem,
  removeLineItemGroup,
  removeWallet,
  setGroupTotals,
  setOwnerId,
  setPeriod,
  setPeriodEnd,
  setPeriodStart,
  setStatus,
  updateLineItem,
  updateLineItemGroup,
  updateWallet,
  utils,
} from "document-models/expense-report/v1";
import { describe, expect, it } from "vitest";

const ADDR_A = "0x1111111111111111111111111111111111111111";
const ADDR_B = "0x2222222222222222222222222222222222222222";
const ADDR_MISSING = "0x9999999999999999999999999999999999999999";
const ISO_A = "2026-01-01T00:00:00.000Z";
const ISO_B = "2026-01-31T00:00:00.000Z";

const GROUP_1 = "group-1";
const GROUP_2 = "group-2";

function walletByAddress(
  doc: ReturnType<typeof utils.createDocument>,
  addr: string,
) {
  return doc.state.global.wallets.find((w) => w.wallet === addr);
}

describe("ExpenseReport wallet reducer - full scenario", () => {
  it("runs an end-to-end lifecycle covering the happy path", () => {
    let doc = utils.createDocument();

    // Header / period setup
    doc = reducer(doc, setOwnerId({ ownerId: "phd:owner-1" }));
    doc = reducer(doc, setPeriod({ startDate: ISO_A, endDate: ISO_B }));
    doc = reducer(doc, setPeriodStart({ periodStart: ISO_A }));
    doc = reducer(doc, setPeriodEnd({ periodEnd: ISO_B }));

    expect(doc.state.global.ownerId).toBe("phd:owner-1");
    expect(doc.state.global.startDate).toBe(ISO_A);
    expect(doc.state.global.endDate).toBe(ISO_B);
    expect(doc.state.global.periodStart).toBe(ISO_A);
    expect(doc.state.global.periodEnd).toBe(ISO_B);

    // Wallets (one with a name, one without)
    doc = reducer(doc, addWallet({ wallet: ADDR_A, name: "Ops Wallet" }));
    doc = reducer(doc, addWallet({ wallet: ADDR_B }));
    expect(doc.state.global.wallets).toHaveLength(2);
    expect(walletByAddress(doc, ADDR_A)?.name).toBe("Ops Wallet");
    expect(walletByAddress(doc, ADDR_B)?.name).toBeNull();

    // Billing statements
    doc = reducer(
      doc,
      addBillingStatement({ wallet: ADDR_A, billingStatementId: "bs-1" }),
    );
    doc = reducer(
      doc,
      addBillingStatement({ wallet: ADDR_A, billingStatementId: "bs-2" }),
    );
    expect(walletByAddress(doc, ADDR_A)?.billingStatements).toEqual([
      "bs-1",
      "bs-2",
    ]);

    // Groups (root + child referencing parent)
    doc = reducer(
      doc,
      addLineItemGroup({ id: GROUP_1, label: "Engineering", parentId: null }),
    );
    doc = reducer(
      doc,
      addLineItemGroup({ id: GROUP_2, label: "Cloud", parentId: GROUP_1 }),
    );
    expect(
      doc.state.global.groups.find((g) => g.id === GROUP_2)?.parentId,
    ).toBe(GROUP_1);

    // Line items with all numeric fields -> totals accumulate for GROUP_1
    doc = reducer(
      doc,
      addLineItem({
        wallet: ADDR_A,
        lineItem: {
          id: "li-1",
          label: "Salaries",
          group: GROUP_1,
          budget: 100,
          actuals: 90,
          forecast: 95,
          payments: 80,
          comments: "note",
        },
      }),
    );
    doc = reducer(
      doc,
      addLineItem({
        wallet: ADDR_A,
        lineItem: {
          id: "li-2",
          label: "Bonuses",
          group: GROUP_1,
          budget: 10,
          actuals: 5,
          forecast: 7,
          payments: 4,
          comments: "note2",
        },
      }),
    );

    const totalsG1 = walletByAddress(doc, ADDR_A)?.totals?.find(
      (t) => t?.group === GROUP_1,
    );
    expect(totalsG1?.totalBudget).toBe(110);
    expect(totalsG1?.totalActuals).toBe(95);
    expect(totalsG1?.totalForecast).toBe(102);
    expect(totalsG1?.totalPayments).toBe(84);

    // Update line item in the SAME group (delta applied to same group)
    doc = reducer(
      doc,
      updateLineItem({
        wallet: ADDR_A,
        lineItemId: "li-1",
        label: "Salaries v2",
        budget: 200,
        actuals: 190,
        forecast: 195,
        payments: 180,
        comments: "updated",
      }),
    );
    const totalsG1b = walletByAddress(doc, ADDR_A)?.totals?.find(
      (t) => t?.group === GROUP_1,
    );
    // budget: 110 - 100 + 200 = 210
    expect(totalsG1b?.totalBudget).toBe(210);
    expect(walletByAddress(doc, ADDR_A)?.lineItems?.[0]?.label).toBe(
      "Salaries v2",
    );

    // Move li-2 to a DIFFERENT group (previousGroup !== nextGroup branch)
    doc = reducer(
      doc,
      updateLineItem({
        wallet: ADDR_A,
        lineItemId: "li-2",
        group: GROUP_2,
      }),
    );
    const totalsG1c = walletByAddress(doc, ADDR_A)?.totals?.find(
      (t) => t?.group === GROUP_1,
    );
    const totalsG2 = walletByAddress(doc, ADDR_A)?.totals?.find(
      (t) => t?.group === GROUP_2,
    );
    // GROUP_1 loses li-2's budget (10): 210 - 10 = 200
    expect(totalsG1c?.totalBudget).toBe(200);
    // GROUP_2 gains li-2's budget (10)
    expect(totalsG2?.totalBudget).toBe(10);

    // Update a group's label and parent (null parentId is skipped by reducer)
    doc = reducer(
      doc,
      updateLineItemGroup({ id: GROUP_2, label: "Cloud v2", parentId: null }),
    );
    const g2 = doc.state.global.groups.find((g) => g.id === GROUP_2);
    expect(g2?.label).toBe("Cloud v2");
    expect(g2?.parentId).toBe(GROUP_1);

    // Update wallet metadata
    doc = reducer(
      doc,
      updateWallet({
        address: ADDR_A,
        name: "Ops Wallet v2",
        accountDocumentId: "phd:acct-1",
        accountTransactionsDocumentId: "phd:txn-1",
      }),
    );
    const wA = walletByAddress(doc, ADDR_A);
    expect(wA?.name).toBe("Ops Wallet v2");
    expect(wA?.accountDocumentId).toBe("phd:acct-1");
    expect(wA?.accountTransactionsDocumentId).toBe("phd:txn-1");

    // Set explicit group totals (overwrite existing + create new)
    doc = reducer(
      doc,
      setGroupTotals({
        wallet: ADDR_A,
        groupTotals: {
          group: GROUP_1,
          totalBudget: 500,
          totalForecast: 400,
          totalActuals: 300,
          totalPayments: 200,
        },
      }),
    );
    expect(
      walletByAddress(doc, ADDR_A)?.totals?.find((t) => t?.group === GROUP_1)
        ?.totalBudget,
    ).toBe(500);

    // Removals
    doc = reducer(doc, removeLineItem({ wallet: ADDR_A, lineItemId: "li-1" }));
    expect(walletByAddress(doc, ADDR_A)?.lineItems).toHaveLength(1);

    doc = reducer(doc, removeGroupTotals({ wallet: ADDR_A, groupId: GROUP_2 }));
    expect(
      walletByAddress(doc, ADDR_A)?.totals?.find((t) => t?.group === GROUP_2),
    ).toBeUndefined();

    doc = reducer(
      doc,
      removeBillingStatement({ wallet: ADDR_A, billingStatementId: "bs-1" }),
    );
    expect(walletByAddress(doc, ADDR_A)?.billingStatements).toEqual(["bs-2"]);

    doc = reducer(doc, removeLineItemGroup({ id: GROUP_2 }));
    expect(
      doc.state.global.groups.find((g) => g.id === GROUP_2),
    ).toBeUndefined();

    doc = reducer(doc, removeWallet({ wallet: ADDR_B }));
    expect(doc.state.global.wallets).toHaveLength(1);

    // Status transitions
    doc = reducer(doc, setStatus({ status: "REVIEW" }));
    expect(doc.state.global.status).toBe("REVIEW");
    doc = reducer(doc, setStatus({ status: "FINAL" }));
    expect(doc.state.global.status).toBe("FINAL");
    doc = reducer(doc, setStatus({ status: "DRAFT" }));
    expect(doc.state.global.status).toBe("DRAFT");

    expect(isExpenseReportDocument(doc)).toBe(true);
  });
});

describe("ExpenseReport wallet reducer - optional / fallback branches", () => {
  it("addLineItem with a line item that has no group and null numeric fields", () => {
    let doc = utils.createDocument();
    doc = reducer(doc, addWallet({ wallet: ADDR_A }));
    // lineItem.group omitted -> applyTotalsDelta early-returns on falsy groupId
    // numeric fields omitted -> getLineItemTotals uses ?? 0 fallbacks
    doc = reducer(
      doc,
      addLineItem({
        wallet: ADDR_A,
        lineItem: { id: "li-x" },
      }),
    );
    const li = walletByAddress(doc, ADDR_A)?.lineItems?.[0];
    expect(li?.id).toBe("li-x");
    expect(li?.label).toBeNull();
    expect(li?.group).toBeNull();
    expect(li?.budget).toBeNull();
    expect(li?.comments).toBeNull();
    // No group -> no totals entry created
    expect(walletByAddress(doc, ADDR_A)?.totals).toHaveLength(0);
  });

  it("addLineItemGroup falls back to null when label/parentId falsy", () => {
    let doc = utils.createDocument();
    doc = reducer(
      doc,
      addLineItemGroup({ id: "g-empty", label: "", parentId: "" }),
    );
    const g = doc.state.global.groups.find((x) => x.id === "g-empty");
    expect(g?.label).toBeNull();
    expect(g?.parentId).toBeNull();
  });

  it("setGroupTotals stores null for falsy numeric totals then overwrites existing", () => {
    let doc = utils.createDocument();
    doc = reducer(doc, addWallet({ wallet: ADDR_A }));
    // First set: all falsy -> stored as null (|| null true side), pushed (existingIndex === -1)
    doc = reducer(
      doc,
      setGroupTotals({
        wallet: ADDR_A,
        groupTotals: {
          group: GROUP_1,
          totalBudget: 0,
          totalForecast: 0,
          totalActuals: 0,
          totalPayments: 0,
        },
      }),
    );
    let t = walletByAddress(doc, ADDR_A)?.totals?.find(
      (x) => x?.group === GROUP_1,
    );
    expect(t?.totalBudget).toBeNull();
    expect(t?.totalPayments).toBeNull();

    // Now add a line item into that group -> applyTotalsDelta finds existing
    // with null values, hitting the `existing.totalX ?? 0` true side.
    doc = reducer(
      doc,
      addLineItem({
        wallet: ADDR_A,
        lineItem: { id: "li-g", group: GROUP_1, budget: 50, payments: 25 },
      }),
    );
    t = walletByAddress(doc, ADDR_A)?.totals?.find((x) => x?.group === GROUP_1);
    expect(t?.totalBudget).toBe(50);
    expect(t?.totalPayments).toBe(25);

    // Overwrite existing totals (existingIndex !== -1 branch) with truthy values
    doc = reducer(
      doc,
      setGroupTotals({
        wallet: ADDR_A,
        groupTotals: {
          group: GROUP_1,
          totalBudget: 999,
          totalForecast: 1,
          totalActuals: 2,
          totalPayments: 3,
        },
      }),
    );
    t = walletByAddress(doc, ADDR_A)?.totals?.find((x) => x?.group === GROUP_1);
    expect(t?.totalBudget).toBe(999);
  });

  it("updateLineItem resetting payments to null via ?? and omitting other fields", () => {
    let doc = utils.createDocument();
    doc = reducer(doc, addWallet({ wallet: ADDR_A }));
    doc = reducer(
      doc,
      addLineItem({
        wallet: ADDR_A,
        lineItem: {
          id: "li-1",
          group: GROUP_1,
          budget: 100,
          payments: 50,
        },
      }),
    );
    // payments explicitly null -> lineItem.payments becomes null, delta uses 0
    doc = reducer(
      doc,
      updateLineItem({
        wallet: ADDR_A,
        lineItemId: "li-1",
        payments: null,
      }),
    );
    const li = walletByAddress(doc, ADDR_A)?.lineItems?.[0];
    expect(li?.payments).toBeNull();
    const t = walletByAddress(doc, ADDR_A)?.totals?.find(
      (x) => x?.group === GROUP_1,
    );
    // payments total: 50 -> 0
    expect(t?.totalPayments).toBe(0);
    // budget unchanged (branch skipped)
    expect(li?.budget).toBe(100);
  });

  it("updateLineItem on a line item that has no group (previousGroup ?? null)", () => {
    let doc = utils.createDocument();
    doc = reducer(doc, addWallet({ wallet: ADDR_A }));
    // line item created with no group -> lineItem.group is null
    doc = reducer(
      doc,
      addLineItem({ wallet: ADDR_A, lineItem: { id: "li-ng", budget: 10 } }),
    );
    // update it while it still has no group; previousGroup === nextGroup (both null)
    // applyTotalsDelta early-returns because groupId is falsy
    doc = reducer(
      doc,
      updateLineItem({ wallet: ADDR_A, lineItemId: "li-ng", budget: 20 }),
    );
    const li = walletByAddress(doc, ADDR_A)?.lineItems?.[0];
    expect(li?.budget).toBe(20);
    expect(li?.group).toBeNull();
    // no totals entry since there is no group
    expect(walletByAddress(doc, ADDR_A)?.totals).toHaveLength(0);
  });

  it("updateWallet updates only the provided fields, leaving others intact", () => {
    let doc = utils.createDocument();
    doc = reducer(doc, addWallet({ wallet: ADDR_A, name: "orig" }));
    // Only name provided; document-id fields omitted (skip those branches)
    doc = reducer(doc, updateWallet({ address: ADDR_A, name: "renamed" }));
    let w = walletByAddress(doc, ADDR_A);
    expect(w?.name).toBe("renamed");
    expect(w?.accountDocumentId).toBeNull();

    // Only accountTransactionsDocumentId provided; name omitted
    doc = reducer(
      doc,
      updateWallet({ address: ADDR_A, accountTransactionsDocumentId: "phd:t" }),
    );
    w = walletByAddress(doc, ADDR_A);
    expect(w?.name).toBe("renamed");
    expect(w?.accountTransactionsDocumentId).toBe("phd:t");
  });

  it("updateLineItemGroup with only label, then only parentId", () => {
    let doc = utils.createDocument();
    doc = reducer(
      doc,
      addLineItemGroup({ id: GROUP_1, label: "a", parentId: null }),
    );
    doc = reducer(doc, updateLineItemGroup({ id: GROUP_1, label: "b" }));
    expect(doc.state.global.groups.find((g) => g.id === GROUP_1)?.label).toBe(
      "b",
    );
    doc = reducer(doc, updateLineItemGroup({ id: GROUP_1, parentId: GROUP_2 }));
    expect(
      doc.state.global.groups.find((g) => g.id === GROUP_1)?.parentId,
    ).toBe(GROUP_2);
  });

  it("setPeriod with only startDate, then only endDate", () => {
    let doc = utils.createDocument();
    doc = reducer(doc, setPeriod({ startDate: ISO_A }));
    expect(doc.state.global.startDate).toBe(ISO_A);
    expect(doc.state.global.endDate).toBeNull();
    doc = reducer(doc, setPeriod({ endDate: ISO_B }));
    expect(doc.state.global.endDate).toBe(ISO_B);
  });
});

describe("ExpenseReport wallet reducer - no-op branches on missing entities", () => {
  it("operations targeting a missing wallet do not mutate state", () => {
    let doc = utils.createDocument();
    doc = reducer(doc, addWallet({ wallet: ADDR_A }));
    const before = JSON.stringify(doc.state.global.wallets);

    doc = reducer(doc, removeWallet({ wallet: ADDR_MISSING })); // index === -1
    doc = reducer(
      doc,
      addBillingStatement({ wallet: ADDR_MISSING, billingStatementId: "bs" }),
    );
    doc = reducer(
      doc,
      removeBillingStatement({
        wallet: ADDR_MISSING,
        billingStatementId: "bs",
      }),
    );
    doc = reducer(
      doc,
      addLineItem({ wallet: ADDR_MISSING, lineItem: { id: "li" } }),
    );
    doc = reducer(
      doc,
      updateLineItem({ wallet: ADDR_MISSING, lineItemId: "li" }),
    );
    doc = reducer(
      doc,
      removeLineItem({ wallet: ADDR_MISSING, lineItemId: "li" }),
    );
    doc = reducer(
      doc,
      setGroupTotals({
        wallet: ADDR_MISSING,
        groupTotals: { group: GROUP_1, totalBudget: 1 },
      }),
    );
    doc = reducer(
      doc,
      removeGroupTotals({ wallet: ADDR_MISSING, groupId: GROUP_1 }),
    );
    doc = reducer(doc, updateWallet({ address: ADDR_MISSING, name: "x" }));

    expect(JSON.stringify(doc.state.global.wallets)).toBe(before);
  });

  it("group/line-item removals and updates for missing ids are no-ops", () => {
    let doc = utils.createDocument();
    doc = reducer(doc, addWallet({ wallet: ADDR_A }));
    doc = reducer(
      doc,
      addLineItem({ wallet: ADDR_A, lineItem: { id: "li-1", group: GROUP_1 } }),
    );
    const groupsBefore = doc.state.global.groups.length;

    // update a non-existent group -> group not found, no change
    doc = reducer(
      doc,
      updateLineItemGroup({ id: "missing-group", label: "z" }),
    );
    // remove a non-existent group -> index === -1
    doc = reducer(doc, removeLineItemGroup({ id: "missing-group" }));
    expect(doc.state.global.groups.length).toBe(groupsBefore);

    // update / remove a non-existent line item on an existing wallet
    doc = reducer(
      doc,
      updateLineItem({ wallet: ADDR_A, lineItemId: "missing-li", label: "z" }),
    );
    doc = reducer(
      doc,
      removeLineItem({ wallet: ADDR_A, lineItemId: "missing-li" }),
    );
    // remove non-existent billing statement / group totals on existing wallet
    doc = reducer(
      doc,
      removeBillingStatement({ wallet: ADDR_A, billingStatementId: "none" }),
    );
    doc = reducer(doc, removeGroupTotals({ wallet: ADDR_A, groupId: "none" }));

    expect(walletByAddress(doc, ADDR_A)?.lineItems).toHaveLength(1);
  });
});

describe("ExpenseReport wallet reducer - wallets with null collections (init branches)", () => {
  // A wallet seeded with null collections exercises the `if (!wallet.X)` true
  // branches that addWallet's [] defaults would otherwise make unreachable.
  function seededDoc() {
    return utils.createDocument({
      global: {
        wallets: [
          {
            name: "Seeded",
            wallet: ADDR_A,
            totals: null,
            billingStatements: null,
            lineItems: null,
            accountDocumentId: null,
            accountTransactionsDocumentId: null,
          },
        ],
      },
    } as Parameters<typeof utils.createDocument>[0]);
  }

  it("addBillingStatement initializes a null billingStatements array", () => {
    let doc = seededDoc();
    doc = reducer(
      doc,
      addBillingStatement({ wallet: ADDR_A, billingStatementId: "bs-1" }),
    );
    expect(walletByAddress(doc, ADDR_A)?.billingStatements).toEqual(["bs-1"]);
  });

  it("addLineItem initializes a null lineItems array and null totals", () => {
    let doc = seededDoc();
    doc = reducer(
      doc,
      addLineItem({
        wallet: ADDR_A,
        lineItem: { id: "li-1", group: GROUP_1, budget: 10 },
      }),
    );
    expect(walletByAddress(doc, ADDR_A)?.lineItems).toHaveLength(1);
    expect(
      walletByAddress(doc, ADDR_A)?.totals?.find((t) => t?.group === GROUP_1)
        ?.totalBudget,
    ).toBe(10);
  });

  it("setGroupTotals initializes a null totals array", () => {
    let doc = seededDoc();
    doc = reducer(
      doc,
      setGroupTotals({
        wallet: ADDR_A,
        groupTotals: { group: GROUP_1, totalBudget: 7 },
      }),
    );
    expect(
      walletByAddress(doc, ADDR_A)?.totals?.find((t) => t?.group === GROUP_1)
        ?.totalBudget,
    ).toBe(7);
  });

  it("removeBillingStatement / removeGroupTotals no-op when collection is null", () => {
    let doc = seededDoc();
    doc = reducer(
      doc,
      removeBillingStatement({ wallet: ADDR_A, billingStatementId: "bs" }),
    );
    doc = reducer(doc, removeGroupTotals({ wallet: ADDR_A, groupId: GROUP_1 }));
    doc = reducer(doc, removeLineItem({ wallet: ADDR_A, lineItemId: "li" }));
    expect(walletByAddress(doc, ADDR_A)?.billingStatements).toBeNull();
    expect(walletByAddress(doc, ADDR_A)?.totals).toBeNull();
  });
});
