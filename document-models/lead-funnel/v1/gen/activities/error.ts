export type ErrorCode =
  | "LeadNotFoundError"
  | "DuplicateActivityIdError"
  | "ActivityNotFoundError";

export interface ReducerError {
  errorCode: ErrorCode;
}

export class LeadNotFoundError extends Error implements ReducerError {
  errorCode = "LeadNotFoundError" as ErrorCode;
  constructor(message = "LeadNotFoundError") {
    super(message);
  }
}

export class DuplicateActivityIdError extends Error implements ReducerError {
  errorCode = "DuplicateActivityIdError" as ErrorCode;
  constructor(message = "DuplicateActivityIdError") {
    super(message);
  }
}

export class ActivityNotFoundError extends Error implements ReducerError {
  errorCode = "ActivityNotFoundError" as ErrorCode;
  constructor(message = "ActivityNotFoundError") {
    super(message);
  }
}

export const errors = {
  AddActivity: { LeadNotFoundError, DuplicateActivityIdError },
  DeleteActivity: { LeadNotFoundError, ActivityNotFoundError },
};
