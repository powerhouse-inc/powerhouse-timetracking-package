/**
 * WARNING: DO NOT EDIT
 * This file is auto-generated and updated by codegen
 */
import type { ContentDefinitionAction } from "./definition/actions.js";
import type { ContentLifecycleAction } from "./lifecycle/actions.js";

export * from "./definition/actions.js";
export * from "./lifecycle/actions.js";

export type ContentAction = ContentDefinitionAction | ContentLifecycleAction;
