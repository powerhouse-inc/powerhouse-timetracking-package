/** Runtime configuration, read from NEXT_PUBLIC_* env with local defaults. */

export const SWITCHBOARD_URL =
  process.env.NEXT_PUBLIC_SWITCHBOARD_URL ?? "http://localhost:4001/graphql";

export const DRIVE_ID = process.env.NEXT_PUBLIC_DRIVE_ID ?? "vetra-690b7ba0";

export const RENOWN_URL = process.env.NEXT_PUBLIC_RENOWN_URL ?? "";
