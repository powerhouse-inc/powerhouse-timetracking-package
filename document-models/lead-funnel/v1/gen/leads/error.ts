export type ErrorCode = "DuplicateLeadIdError" | "LeadNotFoundError";

export interface ReducerError {
  errorCode: ErrorCode;
}

export class DuplicateLeadIdError extends Error implements ReducerError {
  errorCode = "DuplicateLeadIdError" as ErrorCode;
  constructor(message = "DuplicateLeadIdError") {
    super(message);
  }
}

export class LeadNotFoundError extends Error implements ReducerError {
  errorCode = "LeadNotFoundError" as ErrorCode;
  constructor(message = "LeadNotFoundError") {
    super(message);
  }
}

export const errors = {
  AddLead: { DuplicateLeadIdError },
  UpdateLead: { LeadNotFoundError },
  MoveLead: { LeadNotFoundError },
  ReorderLead: { LeadNotFoundError },
  DeleteLead: { LeadNotFoundError },
};
