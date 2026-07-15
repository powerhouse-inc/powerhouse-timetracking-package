import type { EditorModule } from "document-model";
import { lazy } from "react";

/** Document editor module for the "["powerhouse/account-transactions"]" document type */
export const AccountTransactions: EditorModule = {
  Component: lazy(() => import("./editor.js")),
  documentTypes: ["powerhouse/account-transactions"],
  config: {
    id: "powerhouse-account-transactions-editor",
    name: "Account Transactions",
  },
};
