import { NextRequest } from "next/server";
import { findActiveMember } from "@/lib/members-server";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/session";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * Server-side proxy to the reactor's attachment REST surface.
 *
 * The Switchboard has no public ingress and attachments are a separate HTTP
 * surface (`/attachments/*`), not GraphQL — so, like `/api/graphql`, the browser
 * reaches them only through this same-origin route. Access requires a valid
 * member session (re-checked live so removed members lose access quickly).
 *
 * Client → this route:   /api/attachments/<path>
 * this route → reactor:  {SWITCHBOARD_BASE}/attachments/<path>
 * where <path> is `reservations`, `reservations/:id`, or `:hash`.
 */
const GRAPHQL_TARGET =
  process.env.SWITCHBOARD_INTERNAL_URL ??
  process.env.NEXT_PUBLIC_SWITCHBOARD_URL ??
  "http://localhost:4001/graphql";

// The attachment routes sit at the switchboard root, next to /graphql.
const SWITCHBOARD_BASE = GRAPHQL_TARGET.replace(/\/graphql\/?$/, "");

// Response headers worth relaying to the browser (downloads + pending state).
const PASS_THROUGH = [
  "content-type",
  "content-length",
  "content-disposition",
  "attachment-metadata",
  "attachment-pending",
  "retry-after",
  "cache-control",
];

function json(status: number, message: string) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

async function authorize(req: NextRequest): Promise<Response | null> {
  const session = await verifySessionToken(
    process.env.SESSION_SECRET ?? "",
    req.cookies.get(SESSION_COOKIE)?.value,
  );
  if (!session) return json(401, "Not authenticated.");
  try {
    if ((await findActiveMember(session.address)) === null) {
      return json(403, "Membership revoked.");
    }
  } catch {
    return json(502, "Reactor is unreachable.");
  }
  return null;
}

async function proxy(req: NextRequest, path: string[]): Promise<Response> {
  const denied = await authorize(req);
  if (denied) return denied;

  const suffix = path.map(encodeURIComponent).join("/");
  const target = `${SWITCHBOARD_BASE}/attachments/${suffix}`;
  const method = req.method;
  const hasBody = method !== "GET" && method !== "HEAD";

  const headers: Record<string, string> = {};
  const ct = req.headers.get("content-type");
  if (ct) headers["content-type"] = ct;

  try {
    const res = await fetch(target, {
      method,
      headers,
      body: hasBody ? await req.arrayBuffer() : undefined,
      cache: "no-store",
      signal: AbortSignal.timeout(60_000),
    });
    const outHeaders = new Headers();
    for (const h of PASS_THROUGH) {
      const v = res.headers.get(h);
      if (v) outHeaders.set(h, v);
    }
    return new Response(res.body, { status: res.status, headers: outHeaders });
  } catch {
    return json(502, "Reactor is unreachable.");
  }
}

type Ctx = { params: Promise<{ path: string[] }> };

export async function GET(req: NextRequest, ctx: Ctx) {
  return proxy(req, (await ctx.params).path);
}
export async function HEAD(req: NextRequest, ctx: Ctx) {
  return proxy(req, (await ctx.params).path);
}
export async function POST(req: NextRequest, ctx: Ctx) {
  return proxy(req, (await ctx.params).path);
}
export async function PUT(req: NextRequest, ctx: Ctx) {
  return proxy(req, (await ctx.params).path);
}
export async function DELETE(req: NextRequest, ctx: Ctx) {
  return proxy(req, (await ctx.params).path);
}
