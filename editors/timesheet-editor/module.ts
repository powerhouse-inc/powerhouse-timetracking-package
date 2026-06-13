/**
 * WARNING: DO NOT EDIT
 * This file is auto-generated and updated by codegen
 */
import type { EditorModule } from "document-model";
import { lazy } from "react";

/** Document editor module for the "powerhouse/timesheet" document type */
export const TimesheetEditor: EditorModule = {
  Component: lazy(() => import("./editor.js")),
  documentTypes: ["powerhouse/timesheet"],
  config: {
    id: "timesheet-editor",
    name: "timesheet-editor",
  },
};
