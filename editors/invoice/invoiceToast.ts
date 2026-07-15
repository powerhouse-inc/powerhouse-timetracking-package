import {
  type ConnectToastOptions,
  toast,
} from "@powerhousedao/design-system/connect/toast";

export const INVOICE_TOAST_CONTAINER_ID = "invoice-editor-toast";

export const invoiceToast = (
  message: Parameters<typeof toast>[0],
  options?: ConnectToastOptions,
): ReturnType<typeof toast> =>
  toast(message, {
    ...options,
    containerId: INVOICE_TOAST_CONTAINER_ID,
  } as ConnectToastOptions);
