/**
 * WARNING: DO NOT EDIT
 * This file is auto-generated and updated by codegen
 */
import { PHDocumentController } from "document-model";
import { Timesheet } from "../module.js";
import type { TimesheetAction, TimesheetPHState } from "./types.js";

export const TimesheetController = PHDocumentController.forDocumentModel<
  TimesheetPHState,
  TimesheetAction
>(Timesheet);
