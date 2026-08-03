export type ErrorCode = "AssetSourceRequiredError" | "AssetLinkNotFoundError";

export interface ReducerError {
  errorCode: ErrorCode;
}

export class AssetSourceRequiredError extends Error implements ReducerError {
  errorCode = "AssetSourceRequiredError" as ErrorCode;
  constructor(message = "AssetSourceRequiredError") {
    super(message);
  }
}

export class AssetLinkNotFoundError extends Error implements ReducerError {
  errorCode = "AssetLinkNotFoundError" as ErrorCode;
  constructor(message = "AssetLinkNotFoundError") {
    super(message);
  }
}

export const errors = {
  AddAssetLink: { AssetSourceRequiredError },
  UpdateAssetLink: { AssetLinkNotFoundError },
  RemoveAssetLink: { AssetLinkNotFoundError },
};
