import type { EditorModule } from "document-model";
import { lazy } from "react";

/**
 * Drive-level editor: a team dashboard over every Timesheet + the
 * TimetrackingWorkspace in the drive. Registered for the built-in
 * `powerhouse/document-drive` type (hand-written because editor codegen does
 * not support the drive document type).
 */
export const TtDriveEditor: EditorModule = {
  Component: lazy(() => import("./editor.js")),
  documentTypes: ["powerhouse/document-drive"],
  config: {
    id: "tt-drive",
    name: "Timetracking — Team",
  },
};
