export type ErrorCode =
  | "TimerAlreadyRunningError"
  | "NoRunningTimerError"
  | "InvalidTimeRangeError"
  | "DuplicateEntryIdError"
  | "EntryNotFoundError";

export interface ReducerError {
  errorCode: ErrorCode;
}

export class TimerAlreadyRunningError extends Error implements ReducerError {
  errorCode = "TimerAlreadyRunningError" as ErrorCode;
  constructor(message = "TimerAlreadyRunningError") {
    super(message);
  }
}

export class NoRunningTimerError extends Error implements ReducerError {
  errorCode = "NoRunningTimerError" as ErrorCode;
  constructor(message = "NoRunningTimerError") {
    super(message);
  }
}

export class InvalidTimeRangeError extends Error implements ReducerError {
  errorCode = "InvalidTimeRangeError" as ErrorCode;
  constructor(message = "InvalidTimeRangeError") {
    super(message);
  }
}

export class DuplicateEntryIdError extends Error implements ReducerError {
  errorCode = "DuplicateEntryIdError" as ErrorCode;
  constructor(message = "DuplicateEntryIdError") {
    super(message);
  }
}

export class EntryNotFoundError extends Error implements ReducerError {
  errorCode = "EntryNotFoundError" as ErrorCode;
  constructor(message = "EntryNotFoundError") {
    super(message);
  }
}

export const errors = {
  StartTimer: { TimerAlreadyRunningError },
  StopTimer: { NoRunningTimerError, InvalidTimeRangeError },
  DiscardTimer: { NoRunningTimerError },
  AddEntry: { DuplicateEntryIdError, InvalidTimeRangeError },
  UpdateEntry: { EntryNotFoundError, InvalidTimeRangeError },
  DeleteEntry: { EntryNotFoundError },
};
