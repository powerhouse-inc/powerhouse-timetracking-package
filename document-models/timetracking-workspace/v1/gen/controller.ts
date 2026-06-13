/**
 * WARNING: DO NOT EDIT
 * This file is auto-generated and updated by codegen
 */
import { PHDocumentController } from "document-model";
import { TimetrackingWorkspace } from "../module.js";
import type {
  TimetrackingWorkspaceAction,
  TimetrackingWorkspacePHState,
} from "./types.js";

export const TimetrackingWorkspaceController =
  PHDocumentController.forDocumentModel<
    TimetrackingWorkspacePHState,
    TimetrackingWorkspaceAction
  >(TimetrackingWorkspace);
