import React, { useState } from "react";
import { type InvoiceAction, actions } from "document-models/invoice";
import { invoiceToast as toast } from "./invoiceToast.js";
import { uploadPdfChunked } from "./uploadPdfChunked.js";
import { getCountryCodeFromName, mapChainNameToConfig } from "./utils/utils.js";
import { LoaderCircle } from "lucide-react";
import { getGraphQLUrl } from "../shared/graphql.js";

const GRAPHQL_URL = getGraphQLUrl();

export async function loadPDFFile({
  file,
}: {
  file: File;
  dispatch: (action: InvoiceAction) => void;
}) {
  if (!file) throw new Error("No file provided");

  if (file.type !== "application/pdf") {
    throw new Error("Please upload a PDF file");
  }

  console.log("Loading PDF file:", file.name);

  return file;
}

interface PDFUploaderProps {
  dispatch: (action: InvoiceAction) => void;
  changeDropdownOpen: (open: boolean) => void;
}

/**
 * Extracts the actual error message from Claude API error format
 * Format: "Claude API error: 400 - {...json...}"
 */
function extractErrorMessage(errorMsg: string): string {
  if (errorMsg.includes("Claude API error")) {
    try {
      const jsonMatch = errorMsg.match(/Claude API error: \d+ - (.+)/);
      if (jsonMatch) {
        const errorJson = JSON.parse(jsonMatch[1]);
        if (errorJson?.error?.message) {
          return errorJson.error.message;
        } else if (errorJson?.message) {
          return errorJson.message;
        }
      }
    } catch (parseError) {
      // If parsing fails, use the original error message
      console.error("Failed to parse error message:", parseError);
    }
  }
  return errorMsg;
}

export default function PDFUploader({
  dispatch,
  changeDropdownOpen,
}: PDFUploaderProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number>(0);

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    setError(null);
    setIsLoading(true);
    setUploadProgress(0);

    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64Data =
          typeof reader.result === "string"
            ? reader.result.split(",")[1]
            : undefined;
        if (!base64Data) {
          throw new Error("Failed to read file");
        }

        try {
          const result = await uploadPdfChunked(
            base64Data,
            GRAPHQL_URL,
            50 * 1024,
            (progress) => setUploadProgress(progress),
          );

          if (result.success) {
            const invoiceData = result.data.invoiceData;

            // Dispatch the parsed invoice data
            dispatch(
              actions.editInvoice({
                invoiceNo: invoiceData.invoiceNo || "",
                dateIssued:
                  invoiceData.dateIssued ||
                  new Date().toISOString().split("T")[0],
                dateDue:
                  invoiceData.dateDue || new Date().toISOString().split("T")[0],
                currency: invoiceData.currency || "USD",
              }),
            );

            // If we have line items, dispatch them
            if (invoiceData.lineItems && invoiceData.lineItems.length > 0) {
              invoiceData.lineItems.forEach((item: any) => {
                // Add the line item first
                dispatch(
                  actions.addLineItem({
                    id: item.id,
                    description: item.description,
                    taxPercent: item.taxPercent,
                    quantity: item.quantity,
                    currency: item.currency,
                    unitPriceTaxExcl: item.unitPriceTaxExcl,
                    unitPriceTaxIncl: item.unitPriceTaxIncl,
                    totalPriceTaxExcl: item.totalPriceTaxExcl,
                    totalPriceTaxIncl: item.totalPriceTaxIncl,
                  }),
                );

                // If auto-tagging assigned tags, add them
                if (item.lineItemTag && Array.isArray(item.lineItemTag)) {
                  item.lineItemTag.forEach((tag: any) => {
                    dispatch(
                      actions.setLineItemTag({
                        lineItemId: item.id,
                        dimension: tag.dimension,
                        value: tag.value,
                        label: tag.label,
                      }),
                    );
                  });
                }
              });
            }

            // If we have issuer data, dispatch it
            if (invoiceData.issuer) {
              dispatch(
                actions.editIssuer({
                  name: invoiceData.issuer.name || "",
                  country:
                    getCountryCodeFromName(invoiceData.issuer.country) || "",
                  streetAddress:
                    invoiceData.issuer.address?.streetAddress || "",
                  extendedAddress:
                    invoiceData.issuer.address?.extendedAddress || "",
                  city: invoiceData.issuer.address?.city || "",
                  postalCode: invoiceData.issuer.address?.postalCode || "",
                  stateProvince:
                    invoiceData.issuer.address?.stateProvince || "",
                  tel: invoiceData.issuer.contactInfo?.tel || "",
                  email: invoiceData.issuer.contactInfo?.email || "",
                  id: invoiceData.issuer.id?.taxId || "",
                }),
              );

              // Add bank information dispatch
              if (invoiceData.issuer.paymentRouting?.bank) {
                const bank = invoiceData.issuer.paymentRouting.bank;
                console.log("Dispatching bank details:", bank); // Debug log
                dispatch(
                  actions.editIssuerBank({
                    name: bank.name || "",
                    accountNum: bank.accountNum || "",
                    ABA: bank.ABA || "",
                    BIC: bank.BIC || "",
                    SWIFT: bank.SWIFT || "",
                    accountType: bank.accountType || "CHECKING",
                    beneficiary: bank.beneficiary || "",
                    memo: bank.memo || "",
                    streetAddress: bank.address?.streetAddress || "",
                    city: bank.address?.city || "",
                    stateProvince: bank.address?.stateProvince || "",
                    postalCode: bank.address?.postalCode || "",
                    country:
                      getCountryCodeFromName(bank.address?.country) || "",
                    extendedAddress: bank.address?.extendedAddress || "",
                  }),
                );
              }

              // Add crypto wallet information dispatch
              if (invoiceData.issuer.paymentRouting?.wallet) {
                const chainConfig = mapChainNameToConfig(
                  invoiceData.issuer.paymentRouting.wallet.chainName,
                );

                dispatch(
                  actions.editIssuerWallet({
                    address:
                      invoiceData.issuer.paymentRouting.wallet.address || "",
                    chainId:
                      invoiceData.issuer.paymentRouting.wallet.chainId ||
                      chainConfig.chainId,
                    chainName:
                      invoiceData.issuer.paymentRouting.wallet.chainName ||
                      chainConfig.chainName,
                    rpc:
                      invoiceData.issuer.paymentRouting.wallet.rpc ||
                      chainConfig.rpc,
                  }),
                );
              }
            }

            // If we have payer data, dispatch it
            if (invoiceData.payer) {
              dispatch(
                actions.editPayer({
                  name: invoiceData.payer.name || "",
                  country:
                    getCountryCodeFromName(invoiceData.payer.country) || "",
                  streetAddress: invoiceData.payer.address?.streetAddress || "",
                  extendedAddress:
                    invoiceData.payer.address?.extendedAddress || "",
                  city: invoiceData.payer.address?.city || "",
                  postalCode: invoiceData.payer.address?.postalCode || "",
                  stateProvince: invoiceData.payer.address?.stateProvince || "",
                  tel: invoiceData.payer.contactInfo?.tel || "",
                  email: invoiceData.payer.contactInfo?.email || "",
                  id: invoiceData.payer.id?.taxId || "",
                }),
              );

              // Add payer bank information if present
              if (invoiceData.payer.paymentRouting?.bank) {
                dispatch(
                  actions.editPayerBank({
                    name: invoiceData.payer.paymentRouting.bank.name || "",
                    accountNum:
                      invoiceData.payer.paymentRouting.bank.accountNum || "",
                    ABA: invoiceData.payer.paymentRouting.bank.ABA || "",
                    BIC: invoiceData.payer.paymentRouting.bank.BIC || "",
                    SWIFT: invoiceData.payer.paymentRouting.bank.SWIFT || "",
                    accountType:
                      invoiceData.payer.paymentRouting.bank.accountType ||
                      "CHECKING",
                    beneficiary:
                      invoiceData.payer.paymentRouting.bank.beneficiary || "",
                    memo: invoiceData.payer.paymentRouting.bank.memo || "",
                  }),
                );
              }

              // Add payer crypto wallet information if present
              if (invoiceData.payer.paymentRouting?.wallet) {
                const payerChainConfig = mapChainNameToConfig(
                  invoiceData.payer.paymentRouting.wallet.chainName,
                );

                dispatch(
                  actions.editPayerWallet({
                    address:
                      invoiceData.payer.paymentRouting.wallet.address || "",
                    chainId:
                      invoiceData.payer.paymentRouting.wallet.chainId ||
                      payerChainConfig.chainId,
                    chainName:
                      invoiceData.payer.paymentRouting.wallet.chainName ||
                      payerChainConfig.chainName,
                    rpc:
                      invoiceData.payer.paymentRouting.wallet.rpc ||
                      payerChainConfig.rpc,
                  }),
                );
              }
            }

            setIsLoading(false);
            toast("Invoice uploaded successfully", {
              type: "success",
            });

            changeDropdownOpen(false);

            // Debug log after all dispatch actions are completed
            setTimeout(() => {
              console.log(
                "Final document state after all dispatches:",
                JSON.stringify(
                  {
                    issuer: invoiceData.issuer,
                    payer: invoiceData.payer,
                    lineItems: invoiceData.lineItems,
                    paymentRouting: invoiceData.issuer?.paymentRouting,
                    bankDetails: invoiceData.issuer?.paymentRouting?.bank,
                  },
                  null,
                  2,
                ),
              );
            }, 100);
          } else {
            const errorMsg = extractErrorMessage(
              result.error || "Failed to process PDF",
            );
            throw new Error(errorMsg);
          }
        } catch (error) {
          console.error("Error processing PDF:", error);
          const errorMessage = extractErrorMessage(
            error instanceof Error
              ? error.message
              : "An error occurred while processing the PDF",
          );
          setError(errorMessage);
        } finally {
          setIsLoading(false);
        }
      };

      reader.onerror = () => {
        setError("Failed to read file");
        setIsLoading(false);
      };

      reader.readAsDataURL(file);
    } catch (error) {
      console.error("Error handling file:", error);
      setError(
        error instanceof Error
          ? error.message
          : "An error occurred while handling the file",
      );
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <label
          htmlFor="pdf-upload"
          className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer"
        >
          {isLoading && (
            <LoaderCircle className="w-4 h-4 text-blue-600 animate-spin" />
          )}
          {isLoading ? "Uploading..." : "Upload PDF"}
          <input
            id="pdf-upload"
            type="file"
            accept="application/pdf"
            onChange={handleFileChange}
            className="hidden"
            disabled={isLoading}
          />
        </label>

        {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
      </div>
    </div>
  );
}
