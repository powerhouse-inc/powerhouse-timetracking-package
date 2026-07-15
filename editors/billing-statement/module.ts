import type { EditorModule } from "document-model";
import { lazy } from "react";

/** Document editor module for the "["powerhouse/billing-statement"]" document type */
export const BillingStatement: EditorModule = {
  Component: lazy(() => import("./editor.js")),
  documentTypes: ["powerhouse/billing-statement"],
  config: {
    id: "powerhouse-billing-statement-editor",
    name: "Billing Statement",
  },
};
