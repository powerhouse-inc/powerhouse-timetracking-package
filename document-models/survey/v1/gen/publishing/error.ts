export type ErrorCode = "CannotPublishTemplateError";

export interface ReducerError {
  errorCode: ErrorCode;
}

export class CannotPublishTemplateError extends Error implements ReducerError {
  errorCode = "CannotPublishTemplateError" as ErrorCode;
  constructor(message = "CannotPublishTemplateError") {
    super(message);
  }
}

export const errors = {
  PublishSurvey: { CannotPublishTemplateError },
};
