export type ErrorCode =
  | "LeadNotFoundError"
  | "DuplicateTagError"
  | "TagNotFoundError";

export interface ReducerError {
  errorCode: ErrorCode;
}

export class LeadNotFoundError extends Error implements ReducerError {
  errorCode = "LeadNotFoundError" as ErrorCode;
  constructor(message = "LeadNotFoundError") {
    super(message);
  }
}

export class DuplicateTagError extends Error implements ReducerError {
  errorCode = "DuplicateTagError" as ErrorCode;
  constructor(message = "DuplicateTagError") {
    super(message);
  }
}

export class TagNotFoundError extends Error implements ReducerError {
  errorCode = "TagNotFoundError" as ErrorCode;
  constructor(message = "TagNotFoundError") {
    super(message);
  }
}

export const errors = {
  AddTag: { LeadNotFoundError, DuplicateTagError },
  RemoveTag: { LeadNotFoundError, TagNotFoundError },
};
