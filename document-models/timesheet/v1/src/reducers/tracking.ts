import {
  DuplicateEntryIdError,
  EntryNotFoundError,
  InvalidTimeRangeError,
  NoRunningTimerError,
  TimerAlreadyRunningError,
} from "../../gen/tracking/error.js";
import type { TimesheetTrackingOperations } from "document-models/timesheet/v1";

export const timesheetTrackingOperations: TimesheetTrackingOperations = {
  setOwnerOperation(state, action) {
    state.ownerAddress = action.input.ownerAddress;
  },
  startTimerOperation(state, action) {
    if (state.running) {
      throw new TimerAlreadyRunningError("A timer is already running");
    }
    state.running = {
      id: action.input.id,
      description: action.input.description,
      projectId: action.input.projectId ?? null,
      start: action.input.start,
      billable: action.input.billable,
      tags: action.input.tags,
    };
  },
  stopTimerOperation(state, action) {
    if (!state.running) {
      throw new NoRunningTimerError("No timer is running");
    }
    if (
      new Date(action.input.end).getTime() <
      new Date(state.running.start).getTime()
    ) {
      throw new InvalidTimeRangeError("End must be after start");
    }
    state.entries.push({
      id: state.running.id,
      description: state.running.description,
      projectId: state.running.projectId ?? null,
      start: state.running.start,
      end: action.input.end,
      billable: state.running.billable,
      tags: state.running.tags,
    });
    state.running = null;
  },
  discardTimerOperation(state) {
    if (!state.running) {
      throw new NoRunningTimerError("No timer is running");
    }
    state.running = null;
  },
  addEntryOperation(state, action) {
    if (state.entries.some((e) => e.id === action.input.id)) {
      throw new DuplicateEntryIdError("Entry id already exists");
    }
    if (
      new Date(action.input.end).getTime() <
      new Date(action.input.start).getTime()
    ) {
      throw new InvalidTimeRangeError("End must be after start");
    }
    state.entries.push({
      id: action.input.id,
      description: action.input.description,
      projectId: action.input.projectId ?? null,
      start: action.input.start,
      end: action.input.end,
      billable: action.input.billable,
      tags: action.input.tags,
    });
  },
  updateEntryOperation(state, action) {
    const entry = state.entries.find((e) => e.id === action.input.id);
    if (!entry) {
      throw new EntryNotFoundError("Entry not found");
    }
    const nextStart = action.input.start ?? entry.start;
    const nextEnd = action.input.end ?? entry.end;
    if (new Date(nextEnd).getTime() < new Date(nextStart).getTime()) {
      throw new InvalidTimeRangeError("End must be after start");
    }
    if (action.input.description) entry.description = action.input.description;
    if (action.input.projectId !== undefined && action.input.projectId !== null)
      entry.projectId = action.input.projectId;
    if (action.input.start) entry.start = action.input.start;
    if (action.input.end) entry.end = action.input.end;
    if (action.input.billable !== undefined && action.input.billable !== null)
      entry.billable = action.input.billable;
    if (action.input.tags) entry.tags = action.input.tags;
  },
  deleteEntryOperation(state, action) {
    const index = state.entries.findIndex((e) => e.id === action.input.id);
    if (index === -1) {
      throw new EntryNotFoundError("Entry not found");
    }
    state.entries.splice(index, 1);
  },
};
