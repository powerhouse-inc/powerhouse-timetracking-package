/**
 * WARNING: DO NOT EDIT
 * This file is auto-generated and updated by codegen
 */
import type { PHBaseState, PHDocument } from "document-model";
import type { ContentAction } from "./actions.js";
import type { ContentState as ContentGlobalState } from "./schema/types.js";

type ContentLocalState = Record<PropertyKey, never>;

type ContentPHState = PHBaseState & {
  global: ContentGlobalState;
  local: ContentLocalState;
};
type ContentDocument = PHDocument<ContentPHState>;

export * from "./schema/types.js";

export type {
  ContentAction,
  ContentDocument,
  ContentGlobalState,
  ContentLocalState,
  ContentPHState,
};
