/**
 * Runtime configuration.
 *
 * Next inlines `process.env.NEXT_PUBLIC_*` at BUILD time, which is wrong for a
 * container image reused across environments. So the root layout injects the
 * live values from the server's process.env into `window.__ENV` at request
 * time, and we prefer those here — falling back to the build-time inline and
 * then a default. This makes DRIVE_ID / RENOWN_URL / SWITCHBOARD_URL
 * configurable per deployment without rebuilding the image.
 */

declare global {
  interface Window {
    __ENV?: Record<string, string | undefined>;
  }
}

function conf(
  runtimeKey: string,
  buildTime: string | undefined,
  fallback: string,
): string {
  if (typeof window !== "undefined") {
    const v = window.__ENV?.[runtimeKey];
    if (v) return v;
  }
  return buildTime && buildTime !== "" ? buildTime : fallback;
}

// The browser talks to the app's own same-origin proxy (/api/graphql), which
// forwards to the Switchboard server-side — so the reactor needs no public
// ingress. Set NEXT_PUBLIC_SWITCHBOARD_URL to hit a Switchboard directly
// (e.g. local dev against ph vetra).
export const SWITCHBOARD_URL = conf(
  "NEXT_PUBLIC_SWITCHBOARD_URL",
  process.env.NEXT_PUBLIC_SWITCHBOARD_URL,
  "/api/graphql",
);

export const DRIVE_ID = conf(
  "NEXT_PUBLIC_DRIVE_ID",
  process.env.NEXT_PUBLIC_DRIVE_ID,
  "powerhouse",
);

export const RENOWN_URL = conf(
  "NEXT_PUBLIC_RENOWN_URL",
  process.env.NEXT_PUBLIC_RENOWN_URL,
  "",
);
