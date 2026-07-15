import {
  editIssuer,
  editIssuerBank,
  editIssuerWallet,
  editPayer,
  editPayerBank,
  editPayerWallet,
  isInvoiceDocument,
  reducer,
  utils,
} from "document-models/invoice/v1";
import { describe, expect, it } from "vitest";

const FULL_ENTITY_INPUT = {
  name: "Acme Corp",
  id: "corp-123",
  country: "US",
  city: "New York",
  streetAddress: "1 Main St",
  extendedAddress: "Suite 100",
  postalCode: "10001",
  stateProvince: "NY",
  tel: "+1-555-0100",
  email: "billing@acme.example",
};

const FULL_BANK_INPUT = {
  ABA: "111000025",
  BIC: "DEUTDEFF",
  SWIFT: "CHASUS33",
  accountNum: "123456789",
  accountType: "CHECKING" as const,
  beneficiary: "Acme Corp",
  city: "New York",
  country: "US",
  extendedAddress: "Floor 2",
  memo: "invoice payment",
  name: "Big Bank",
  postalCode: "10001",
  stateProvince: "NY",
  streetAddress: "1 Bank St",
  ABAIntermediary: "222000025",
  BICIntermediary: "MIDLGB22",
  SWIFTIntermediary: "BOFAUS3N",
  accountNumIntermediary: "987654321",
  accountTypeIntermediary: "SAVINGS" as const,
  beneficiaryIntermediary: "Intermediary Inc",
  cityIntermediary: "London",
  countryIntermediary: "UK",
  extendedAddressIntermediary: "Level 3",
  memoIntermediary: "routing",
  nameIntermediary: "Middle Bank",
  postalCodeIntermediary: "EC1A",
  stateProvinceIntermediary: "London",
  streetAddressIntermediary: "5 Money Rd",
};

const FULL_WALLET_INPUT = {
  address: "0x1234567890abcdef",
  chainId: "1",
  chainName: "Ethereum",
  rpc: "https://rpc.example",
};

describe("PartiesOperations", () => {
  describe("editIssuer", () => {
    it("sets full issuer details", () => {
      const document = utils.createDocument();
      const next = reducer(document, editIssuer(FULL_ENTITY_INPUT));
      expect(isInvoiceDocument(next)).toBe(true);
      const issuer = next.state.global.issuer;
      expect(issuer.name).toBe("Acme Corp");
      expect(issuer.country).toBe("US");
      expect(issuer.id).toEqual({ corpRegId: "corp-123", taxId: null });
      expect(issuer.address?.city).toBe("New York");
      expect(issuer.contactInfo?.email).toBe("billing@acme.example");
    });

    it("updates a subset, falling back to existing state for omitted fields", () => {
      let document = utils.createDocument();
      document = reducer(document, editIssuer(FULL_ENTITY_INPUT));
      const next = reducer(document, editIssuer({ city: "Boston" }));
      const issuer = next.state.global.issuer;
      expect(issuer.address?.city).toBe("Boston");
      // omitted fields keep prior values
      expect(issuer.address?.country).toBe("US");
      expect(issuer.address?.streetAddress).toBe("1 Main St");
    });

    it("clears the id when an empty id is provided", () => {
      let document = utils.createDocument();
      document = reducer(document, editIssuer(FULL_ENTITY_INPUT));
      const next = reducer(document, editIssuer({ id: "" }));
      expect(next.state.global.issuer.id).toBeNull();
    });

    it("sets only the name when no address/contact fields are present", () => {
      const document = utils.createDocument();
      const next = reducer(document, editIssuer({ name: "Just Name" }));
      expect(next.state.global.issuer.name).toBe("Just Name");
      expect(next.state.global.issuer.address).toBeNull();
      expect(next.state.global.issuer.contactInfo).toBeNull();
    });

    it("defaults unspecified address fields to null then to prior values", () => {
      let document = utils.createDocument();
      // Only streetAddress provided: every other field falls back to null.
      document = reducer(document, editIssuer({ streetAddress: "1 St" }));
      expect(document.state.global.issuer.address).toMatchObject({
        streetAddress: "1 St",
        city: null,
        country: null,
        extendedAddress: null,
        postalCode: null,
        stateProvince: null,
      });
      // Populate fully, then edit only streetAddress: others fall back to prior.
      document = reducer(document, editIssuer(FULL_ENTITY_INPUT));
      const next = reducer(document, editIssuer({ streetAddress: "2 St" }));
      expect(next.state.global.issuer.address).toMatchObject({
        streetAddress: "2 St",
        city: "New York",
        country: "US",
        postalCode: "10001",
        stateProvince: "NY",
        extendedAddress: "Suite 100",
      });
    });

    it("defaults unspecified contact fields to null then to prior values", () => {
      // Setting tel first: email falls back to null.
      let d1 = utils.createDocument();
      d1 = reducer(d1, editIssuer({ tel: "T1" }));
      expect(d1.state.global.issuer.contactInfo).toMatchObject({
        tel: "T1",
        email: null,
      });
      // Setting email now: tel falls back to the prior value.
      d1 = reducer(d1, editIssuer({ email: "E1" }));
      expect(d1.state.global.issuer.contactInfo).toMatchObject({
        tel: "T1",
        email: "E1",
      });
      // Setting tel again: email falls back to the prior value.
      d1 = reducer(d1, editIssuer({ tel: "T2" }));
      expect(d1.state.global.issuer.contactInfo).toMatchObject({
        tel: "T2",
        email: "E1",
      });
      // Fresh doc, email first: tel falls back to null.
      let d2 = utils.createDocument();
      d2 = reducer(d2, editIssuer({ email: "E9" }));
      expect(d2.state.global.issuer.contactInfo).toMatchObject({
        tel: null,
        email: "E9",
      });
    });

    it("country/name fall back to null then to prior values", () => {
      let document = utils.createDocument();
      document = reducer(
        document,
        editIssuer({ country: undefined, name: undefined }),
      );
      expect(document.state.global.issuer.country).toBeNull();
      expect(document.state.global.issuer.name).toBeNull();
      document = reducer(document, editIssuer(FULL_ENTITY_INPUT));
      const next = reducer(
        document,
        editIssuer({ country: undefined, name: undefined }),
      );
      expect(next.state.global.issuer.country).toBe("US");
      expect(next.state.global.issuer.name).toBe("Acme Corp");
    });
  });

  describe("editPayer", () => {
    it("sets full payer details (id maps to taxId)", () => {
      const document = utils.createDocument();
      const next = reducer(document, editPayer(FULL_ENTITY_INPUT));
      expect(isInvoiceDocument(next)).toBe(true);
      const payer = next.state.global.payer;
      expect(payer.name).toBe("Acme Corp");
      expect(payer.id).toEqual({ taxId: "corp-123", corpRegId: null });
      expect(payer.address?.city).toBe("New York");
      expect(payer.contactInfo?.tel).toBe("+1-555-0100");
    });

    it("updates a subset, falling back to existing state for omitted fields", () => {
      let document = utils.createDocument();
      document = reducer(document, editPayer(FULL_ENTITY_INPUT));
      const next = reducer(document, editPayer({ email: "new@acme.example" }));
      expect(next.state.global.payer.contactInfo?.email).toBe(
        "new@acme.example",
      );
      expect(next.state.global.payer.contactInfo?.tel).toBe("+1-555-0100");
    });

    it("clears the id when an empty id is provided", () => {
      let document = utils.createDocument();
      document = reducer(document, editPayer(FULL_ENTITY_INPUT));
      const next = reducer(document, editPayer({ id: "" }));
      expect(next.state.global.payer.id).toBeNull();
    });

    it("sets only the name when no address/contact fields are present", () => {
      const document = utils.createDocument();
      const next = reducer(document, editPayer({ name: "Payer Name" }));
      expect(next.state.global.payer.name).toBe("Payer Name");
      expect(next.state.global.payer.address).toBeNull();
    });

    it("defaults unspecified address fields to null then to prior values", () => {
      let document = utils.createDocument();
      document = reducer(document, editPayer({ streetAddress: "1 St" }));
      expect(document.state.global.payer.address).toMatchObject({
        streetAddress: "1 St",
        city: null,
        country: null,
        extendedAddress: null,
        postalCode: null,
        stateProvince: null,
      });
      document = reducer(document, editPayer(FULL_ENTITY_INPUT));
      const next = reducer(document, editPayer({ streetAddress: "2 St" }));
      expect(next.state.global.payer.address).toMatchObject({
        streetAddress: "2 St",
        city: "New York",
        country: "US",
        postalCode: "10001",
        stateProvince: "NY",
        extendedAddress: "Suite 100",
      });
    });

    it("defaults unspecified contact fields to null then to prior values", () => {
      let d1 = utils.createDocument();
      d1 = reducer(d1, editPayer({ tel: "T1" }));
      expect(d1.state.global.payer.contactInfo).toMatchObject({
        tel: "T1",
        email: null,
      });
      d1 = reducer(d1, editPayer({ email: "E1" }));
      expect(d1.state.global.payer.contactInfo).toMatchObject({
        tel: "T1",
        email: "E1",
      });
      d1 = reducer(d1, editPayer({ tel: "T2" }));
      expect(d1.state.global.payer.contactInfo).toMatchObject({
        tel: "T2",
        email: "E1",
      });
      let d2 = utils.createDocument();
      d2 = reducer(d2, editPayer({ email: "E9" }));
      expect(d2.state.global.payer.contactInfo).toMatchObject({
        tel: null,
        email: "E9",
      });
    });

    it("country/name fall back to null then to prior values", () => {
      let document = utils.createDocument();
      document = reducer(
        document,
        editPayer({ country: undefined, name: undefined }),
      );
      expect(document.state.global.payer.country).toBeNull();
      expect(document.state.global.payer.name).toBeNull();
      document = reducer(document, editPayer(FULL_ENTITY_INPUT));
      const next = reducer(
        document,
        editPayer({ country: undefined, name: undefined }),
      );
      expect(next.state.global.payer.country).toBe("US");
      expect(next.state.global.payer.name).toBe("Acme Corp");
    });
  });

  describe("editIssuerBank", () => {
    it("creates payment routing and defaults empty bank fields", () => {
      const document = utils.createDocument();
      const next = reducer(document, editIssuerBank({}));
      expect(isInvoiceDocument(next)).toBe(true);
      const bank = next.state.global.issuer.paymentRouting?.bank;
      expect(bank?.accountNum).toBe("");
      expect(bank?.name).toBe("");
      expect(bank?.ABA).toBeNull();
      expect(bank?.address.city).toBeNull();
      expect(bank?.intermediaryBank?.accountNum).toBe("");
      expect(bank?.intermediaryBank?.address.country).toBeNull();
    });

    it("sets full bank details on an existing payment routing", () => {
      let document = utils.createDocument();
      document = reducer(document, editIssuerBank({}));
      const next = reducer(document, editIssuerBank(FULL_BANK_INPUT));
      const bank = next.state.global.issuer.paymentRouting?.bank;
      expect(bank?.ABA).toBe("111000025");
      expect(bank?.accountNum).toBe("123456789");
      expect(bank?.name).toBe("Big Bank");
      expect(bank?.accountType).toBe("CHECKING");
      expect(bank?.address.streetAddress).toBe("1 Bank St");
      expect(bank?.intermediaryBank?.name).toBe("Middle Bank");
      expect(bank?.intermediaryBank?.accountType).toBe("SAVINGS");
      expect(bank?.intermediaryBank?.address.city).toBe("London");
    });
  });

  describe("editPayerBank", () => {
    it("creates payment routing and defaults empty bank fields", () => {
      const document = utils.createDocument();
      const next = reducer(document, editPayerBank({}));
      const bank = next.state.global.payer.paymentRouting?.bank;
      expect(bank?.accountNum).toBe("");
      expect(bank?.name).toBe("");
      expect(bank?.intermediaryBank?.accountNum).toBe("");
    });

    it("sets full bank details on an existing payment routing", () => {
      let document = utils.createDocument();
      document = reducer(document, editPayerBank({}));
      const next = reducer(document, editPayerBank(FULL_BANK_INPUT));
      const bank = next.state.global.payer.paymentRouting?.bank;
      expect(bank?.ABA).toBe("111000025");
      expect(bank?.name).toBe("Big Bank");
      expect(bank?.intermediaryBank?.name).toBe("Middle Bank");
      expect(bank?.intermediaryBank?.address.streetAddress).toBe("5 Money Rd");
    });
  });

  describe("editIssuerWallet", () => {
    it("creates payment routing and defaults empty wallet fields", () => {
      const document = utils.createDocument();
      const next = reducer(document, editIssuerWallet({}));
      expect(isInvoiceDocument(next)).toBe(true);
      const wallet = next.state.global.issuer.paymentRouting?.wallet;
      expect(wallet?.address).toBeNull();
      expect(wallet?.chainId).toBeNull();
      expect(wallet?.chainName).toBeNull();
      expect(wallet?.rpc).toBeNull();
    });

    it("sets full wallet details on existing payment routing", () => {
      let document = utils.createDocument();
      document = reducer(document, editIssuerWallet({}));
      const next = reducer(document, editIssuerWallet(FULL_WALLET_INPUT));
      const wallet = next.state.global.issuer.paymentRouting?.wallet;
      expect(wallet?.address).toBe("0x1234567890abcdef");
      expect(wallet?.chainId).toBe("1");
      expect(wallet?.chainName).toBe("Ethereum");
      expect(wallet?.rpc).toBe("https://rpc.example");
    });
  });

  describe("editPayerWallet", () => {
    it("creates payment routing and defaults empty wallet fields", () => {
      const document = utils.createDocument();
      const next = reducer(document, editPayerWallet({}));
      const wallet = next.state.global.payer.paymentRouting?.wallet;
      expect(wallet?.address).toBeNull();
      expect(wallet?.rpc).toBeNull();
    });

    it("sets full wallet details on existing payment routing", () => {
      let document = utils.createDocument();
      document = reducer(document, editPayerWallet({}));
      const next = reducer(document, editPayerWallet(FULL_WALLET_INPUT));
      const wallet = next.state.global.payer.paymentRouting?.wallet;
      expect(wallet?.address).toBe("0x1234567890abcdef");
      expect(wallet?.chainName).toBe("Ethereum");
    });
  });
});
