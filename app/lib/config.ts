/** Runtime configuration, read from NEXT_PUBLIC_* env with local defaults. */

// The browser talks to the app's own same-origin proxy (/api/graphql), which
// forwards to the Switchboard server-side — so the reactor needs no public
// ingress. Set NEXT_PUBLIC_SWITCHBOARD_URL to hit a Switchboard directly
// (e.g. local dev against ph vetra).
export const SWITCHBOARD_URL =
  process.env.NEXT_PUBLIC_SWITCHBOARD_URL ?? "/api/graphql";

export const DRIVE_ID = process.env.NEXT_PUBLIC_DRIVE_ID ?? "vetra-690b7ba0";

export const RENOWN_URL = process.env.NEXT_PUBLIC_RENOWN_URL ?? "";
