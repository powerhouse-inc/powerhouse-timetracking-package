export type ErrorCode = "SectionNotFoundError" | "QuestionNotFoundError";

export interface ReducerError {
  errorCode: ErrorCode;
}

export class SectionNotFoundError extends Error implements ReducerError {
  errorCode = "SectionNotFoundError" as ErrorCode;
  constructor(message = "SectionNotFoundError") {
    super(message);
  }
}

export class QuestionNotFoundError extends Error implements ReducerError {
  errorCode = "QuestionNotFoundError" as ErrorCode;
  constructor(message = "QuestionNotFoundError") {
    super(message);
  }
}

export const errors = {
  UpdateSection: { SectionNotFoundError },
  UpdateQuestion: { QuestionNotFoundError },
};
