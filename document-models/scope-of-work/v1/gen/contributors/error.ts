export type ErrorCode = "AgentNotFoundError";

export interface ReducerError {
  errorCode: ErrorCode;
}

export class AgentNotFoundError extends Error implements ReducerError {
  errorCode = "AgentNotFoundError" as ErrorCode;
  constructor(message = "AgentNotFoundError") {
    super(message);
  }
}

export const errors = {
  RemoveAgent: { AgentNotFoundError },
};
