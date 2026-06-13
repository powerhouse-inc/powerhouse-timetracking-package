/**
 * WARNING: DO NOT EDIT
 * This file is auto-generated and updated by codegen
 */
import type { EditorModule } from "document-model";
import { lazy } from "react";

/** Document editor module for the "powerhouse/timetracking-workspace" document type */
export const WorkspaceEditor: EditorModule = {
  Component: lazy(() => import("./editor.js")),
  documentTypes: ["powerhouse/timetracking-workspace"],
  config: {
    id: "workspace-editor",
    name: "workspace-editor",
  },
};
