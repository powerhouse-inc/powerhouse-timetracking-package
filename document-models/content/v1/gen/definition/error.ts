export type ErrorCode = "AssetLinkNotFoundError";

export interface ReducerError {
  errorCode: ErrorCode;
}

export class AssetLinkNotFoundError extends Error implements ReducerError {
  errorCode = "AssetLinkNotFoundError" as ErrorCode;
  constructor(message = "AssetLinkNotFoundError") {
    super(message);
  }
}

export const errors = {
  UpdateAssetLink: { AssetLinkNotFoundError },
  RemoveAssetLink: { AssetLinkNotFoundError },
};
