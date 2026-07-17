export type ErrorCode =
  | "SurveyNotOpenError"
  | "UnknownQuestionError"
  | "ResponseNotFoundError";

export interface ReducerError {
  errorCode: ErrorCode;
}

export class SurveyNotOpenError extends Error implements ReducerError {
  errorCode = "SurveyNotOpenError" as ErrorCode;
  constructor(message = "SurveyNotOpenError") {
    super(message);
  }
}

export class UnknownQuestionError extends Error implements ReducerError {
  errorCode = "UnknownQuestionError" as ErrorCode;
  constructor(message = "UnknownQuestionError") {
    super(message);
  }
}

export class ResponseNotFoundError extends Error implements ReducerError {
  errorCode = "ResponseNotFoundError" as ErrorCode;
  constructor(message = "ResponseNotFoundError") {
    super(message);
  }
}

export const errors = {
  AddResponse: { SurveyNotOpenError, UnknownQuestionError },
  DeleteResponse: { ResponseNotFoundError },
};
