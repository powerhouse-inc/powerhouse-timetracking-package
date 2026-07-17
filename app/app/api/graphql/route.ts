import { NextRequest } from "next/server";
import { findActiveMember } from "@/lib/members-server";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/session";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * Server-side proxy to the reactor's Switchboard.
 *
 * The Switchboard has no public ingress; the browser reaches it only through
 * this same-origin route. Access requires a valid member session, membership
 * is re-checked here (so removed members lose access quickly, not at token
 * expiry), and member-management mutations are restricted to managerial roles.
 */
const TARGET =
  process.env.SWITCHBOARD_INTERNAL_URL ??
  process.env.NEXT_PUBLIC_SWITCHBOARD_URL ??
  "http://localhost:4001/graphql";

// Mutations that can change who has access / what role — never allowed from a
// non-managerial session, regardless of the client UI.
const PRIVILEGED = /\b(addMember|setMemberRole|updateMember|archiveMember)\s*\(/;
const MANAGERIAL = new Set(["ADMIN", "MANAGER", "BILLING"]);

// Short-lived active-membership cache so we re-verify against the reactor
// without a round-trip on every call. Bounds the revocation window to ~60s.
const memberCache = new Map<string, { active: boolean; exp: number }>();
const CACHE_MS = 60_000;

async function stillActive(address: string): Promise<boolean> {
  const now = Date.now();
  const hit = memberCache.get(address);
  if (hit && hit.exp > now) return hit.active;
  let active = false;
  try {
    active = (await findActiveMember(address)) !== null;
  } catch {
    // On reactor error, fall back to the cached value if any; else deny.
    return hit?.active ?? false;
  }
  memberCache.set(address, { active, exp: now + CACHE_MS });
  return active;
}

function json(status: number, message: string) {
  return new Response(JSON.stringify({ errors: [{ message }] }), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export async function POST(req: NextRequest) {
  // Reject cross-origin POSTs (defense-in-depth atop sameSite=lax).
  const origin = req.headers.get("origin");
  if (origin && new URL(origin).host !== req.headers.get("host")) {
    return json(403, "Cross-origin request rejected.");
  }

  const session = await verifySessionToken(
    process.env.SESSION_SECRET ?? "",
    req.cookies.get(SESSION_COOKIE)?.value,
  );
  if (!session) return json(401, "Not authenticated.");

  // Re-check live membership (covers removal/archival during a session).
  if (!(await stillActive(session.address))) {
    return json(403, "Membership revoked.");
  }

  const body = await req.text();

  // Member-management mutations require a managerial role — blocks a plain
  // member from promoting themselves or editing others via a raw request.
  if (PRIVILEGED.test(body) && !MANAGERIAL.has(session.role)) {
    return json(403, "Not permitted for your role.");
  }

  try {
    const res = await fetch(TARGET, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
      cache: "no-store",
      signal: AbortSignal.timeout(15_000),
    });
    const text = await res.text();
    return new Response(text, {
      status: res.status,
      headers: {
        "Content-Type": res.headers.get("content-type") ?? "application/json",
      },
    });
  } catch {
    return json(502, "Reactor is unreachable.");
  }
}
