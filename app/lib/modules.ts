/**
 * Module toggles.
 *
 * The app bundles every operations module (sales, delivery, billing, time,
 * workspace management), but a deployment can ship a subset. Which modules are
 * enabled is read at request time from `NEXT_PUBLIC_MODULES` (comma-separated
 * keys) via the same runtime-env mechanism as the rest of config — so one image
 * can be a full ops app or a single-channel app without a rebuild.
 *
 * Ships defaulting to the sales channel only.
 */

import { conf } from "./config";

export type ModuleKey =
  | "dashboard"
  | "myWork"
  | "calendar"
  | "timer"
  | "reports"
  | "profitability"
  | "sales"
  | "delivery"
  | "submitInvoice"
  | "invoices"
  | "statements"
  | "finance"
  | "projects"
  | "clients"
  | "members"
  | "surveys";

const DEFAULT_ENABLED = "dashboard,sales,clients,members";

export function enabledModules(): Set<ModuleKey> {
  const raw = conf(
    "NEXT_PUBLIC_MODULES",
    process.env.NEXT_PUBLIC_MODULES,
    DEFAULT_ENABLED,
  );
  return new Set(
    raw
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean) as ModuleKey[],
  );
}

export function isModuleEnabled(key: ModuleKey): boolean {
  return enabledModules().has(key);
}

/** Which module each app route belongs to (used to guard direct-URL access). */
export const ROUTE_MODULE: Record<string, ModuleKey> = {
  "/": "dashboard",
  "/my-work": "myWork",
  "/calendar": "calendar",
  "/timer": "timer",
  "/reports": "reports",
  "/profitability": "profitability",
  "/sales": "sales",
  "/delivery": "delivery",
  "/submit-invoice": "submitInvoice",
  "/invoices": "invoices",
  "/statements": "statements",
  "/finance": "finance",
  "/projects": "projects",
  "/clients": "clients",
  "/members": "members",
  "/surveys": "surveys",
};

// Where to send users landing on a disabled route (first enabled by priority).
const LANDING_PRIORITY: ModuleKey[] = [
  "dashboard",
  "sales",
  "myWork",
  "clients",
  "members",
];

export function landingRoute(): string {
  const enabled = enabledModules();
  for (const key of LANDING_PRIORITY) {
    if (!enabled.has(key)) continue;
    const entry = Object.entries(ROUTE_MODULE).find(([, m]) => m === key);
    if (entry) return entry[0];
  }
  return "/sales";
}
