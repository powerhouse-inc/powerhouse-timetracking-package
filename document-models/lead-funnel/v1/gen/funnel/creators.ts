/**
 * WARNING: DO NOT EDIT
 * This file is auto-generated and updated by codegen
 */
import { createAction } from "document-model";
import { SetFunnelNameInputSchema } from "../schema/zod.js";
import type { SetFunnelNameInput } from "../types.js";
import type { SetFunnelNameAction } from "./actions.js";

export const setFunnelName = (input: SetFunnelNameInput) =>
  createAction<SetFunnelNameAction>(
    "SET_FUNNEL_NAME",
    { ...input },
    undefined,
    SetFunnelNameInputSchema,
    "global",
  );
