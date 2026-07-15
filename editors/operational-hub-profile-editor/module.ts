import type { EditorModule } from "document-model";
import { lazy } from "react";

/** Document editor module for the "["powerhouse/operational-hub-profile"]" document type */
export const OperationalHubProfileEditor: EditorModule = {
  Component: lazy(() => import("./editor.js")),
  documentTypes: ["powerhouse/operational-hub-profile"],
  config: {
    id: "operational-hub-profile-editor",
    name: "OperationalHubProfileEditor",
  },
};
