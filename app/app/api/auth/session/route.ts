import { NextRequest, NextResponse } from "next/server";
import { findActiveMember } from "@/lib/members-server";
import {
  SESSION_COOKIE,
  SESSION_TTL_SECONDS,
  createSessionToken,
} from "@/lib/session";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const cookieOpts = {
  httpOnly: true,
  secure: true,
  sameSite: "lax" as const,
  path: "/",
};

/**
 * Establish a session after Renown sign-in. The client posts the DID Renown
 * returned; the server independently confirms it maps to an ACTIVE workspace
 * member before issuing the cookie. Non-members get 403 — this is the
 * "only people on the members list may enter" gate, enforced server-side.
 */
export async function POST(req: NextRequest) {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    return NextResponse.json(
      { error: "Server auth is not configured." },
      { status: 500 },
    );
  }

  let did: unknown;
  try {
    ({ did } = (await req.json()) as { did?: unknown });
  } catch {
    return NextResponse.json({ error: "Bad request." }, { status: 400 });
  }
  if (typeof did !== "string" || !did) {
    return NextResponse.json({ error: "Missing identity." }, { status: 400 });
  }

  let member;
  try {
    member = await findActiveMember(did);
  } catch {
    return NextResponse.json(
      { error: "Reactor is unreachable." },
      { status: 502 },
    );
  }
  if (!member) {
    return NextResponse.json(
      { error: "This account is not a member of the workspace." },
      { status: 403 },
    );
  }

  const token = await createSessionToken(secret, {
    address: member.address,
    name: member.name,
    role: member.role,
  });
  const res = NextResponse.json({ user: member });
  res.cookies.set(SESSION_COOKIE, token, {
    ...cookieOpts,
    maxAge: SESSION_TTL_SECONDS,
  });
  return res;
}

/** Sign out — clear the session cookie. */
export function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE, "", { ...cookieOpts, maxAge: 0 });
  return res;
}
