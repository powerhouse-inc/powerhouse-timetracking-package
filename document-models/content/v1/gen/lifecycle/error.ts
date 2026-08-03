export type ErrorCode =
  | "EmptyOwnerError"
  | "InvalidStageTransitionError"
  | "OwnerRequiredError"
  | "ItemNotActiveError"
  | "DispositionReasonRequiredError"
  | "CannotResumeKilledError";

export interface ReducerError {
  errorCode: ErrorCode;
}

export class EmptyOwnerError extends Error implements ReducerError {
  errorCode = "EmptyOwnerError" as ErrorCode;
  constructor(message = "EmptyOwnerError") {
    super(message);
  }
}

export class InvalidStageTransitionError extends Error implements ReducerError {
  errorCode = "InvalidStageTransitionError" as ErrorCode;
  constructor(message = "InvalidStageTransitionError") {
    super(message);
  }
}

export class OwnerRequiredError extends Error implements ReducerError {
  errorCode = "OwnerRequiredError" as ErrorCode;
  constructor(message = "OwnerRequiredError") {
    super(message);
  }
}

export class ItemNotActiveError extends Error implements ReducerError {
  errorCode = "ItemNotActiveError" as ErrorCode;
  constructor(message = "ItemNotActiveError") {
    super(message);
  }
}

export class DispositionReasonRequiredError
  extends Error
  implements ReducerError
{
  errorCode = "DispositionReasonRequiredError" as ErrorCode;
  constructor(message = "DispositionReasonRequiredError") {
    super(message);
  }
}

export class CannotResumeKilledError extends Error implements ReducerError {
  errorCode = "CannotResumeKilledError" as ErrorCode;
  constructor(message = "CannotResumeKilledError") {
    super(message);
  }
}

export const errors = {
  AssignOwner: { EmptyOwnerError },
  AdvanceStage: {
    InvalidStageTransitionError,
    OwnerRequiredError,
    ItemNotActiveError,
  },
  Publish: { InvalidStageTransitionError, ItemNotActiveError },
  Park: { DispositionReasonRequiredError, ItemNotActiveError },
  Kill: { DispositionReasonRequiredError, ItemNotActiveError },
  Resume: { CannotResumeKilledError },
};
