export type ErrorCode =
  | "DuplicateMemberError"
  | "MemberNotFoundError"
  | "DuplicateClientError"
  | "ClientNotFoundError"
  | "DuplicateProjectError"
  | "ProjectNotFoundError";

export interface ReducerError {
  errorCode: ErrorCode;
}

export class DuplicateMemberError extends Error implements ReducerError {
  errorCode = "DuplicateMemberError" as ErrorCode;
  constructor(message = "DuplicateMemberError") {
    super(message);
  }
}

export class MemberNotFoundError extends Error implements ReducerError {
  errorCode = "MemberNotFoundError" as ErrorCode;
  constructor(message = "MemberNotFoundError") {
    super(message);
  }
}

export class DuplicateClientError extends Error implements ReducerError {
  errorCode = "DuplicateClientError" as ErrorCode;
  constructor(message = "DuplicateClientError") {
    super(message);
  }
}

export class ClientNotFoundError extends Error implements ReducerError {
  errorCode = "ClientNotFoundError" as ErrorCode;
  constructor(message = "ClientNotFoundError") {
    super(message);
  }
}

export class DuplicateProjectError extends Error implements ReducerError {
  errorCode = "DuplicateProjectError" as ErrorCode;
  constructor(message = "DuplicateProjectError") {
    super(message);
  }
}

export class ProjectNotFoundError extends Error implements ReducerError {
  errorCode = "ProjectNotFoundError" as ErrorCode;
  constructor(message = "ProjectNotFoundError") {
    super(message);
  }
}

export const errors = {
  AddMember: { DuplicateMemberError },
  UpdateMember: { MemberNotFoundError },
  SetMemberRole: { MemberNotFoundError },
  ArchiveMember: { MemberNotFoundError },
  AddClient: { DuplicateClientError },
  UpdateClient: { ClientNotFoundError },
  ArchiveClient: { ClientNotFoundError },
  AddProject: { DuplicateProjectError, ClientNotFoundError },
  UpdateProject: { ProjectNotFoundError },
  ArchiveProject: { ProjectNotFoundError },
};
