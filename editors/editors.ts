/**
 * Hand-maintained editor registry.
 *
 * NOTE: editor codegen regenerates this file from the editor *documents* on
 * the Vetra drive, but it cannot scaffold drive editors (the built-in
 * `powerhouse/document-drive` type has no package metadata). `TtDriveEditor`
 * is hand-written and added here manually — keep it in the array if codegen
 * rewrites this file.
 */
import type { EditorModule } from "document-model";
import { LeadFunnelBoard } from "./lead-funnel-board/module.js";
import { TimesheetEditor } from "./timesheet-editor/module.js";
import { TtDriveEditor } from "./tt-drive/module.js";
import { WorkspaceEditor } from "./workspace-editor/module.js";

export const editors: EditorModule[] = [
  TimesheetEditor,
  WorkspaceEditor,
  TtDriveEditor,
  LeadFunnelBoard,
];
