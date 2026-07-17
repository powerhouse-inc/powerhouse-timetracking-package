import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/session";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** Returns the current session's user (from the signed cookie), or null. */
export async function GET(req: NextRequest) {
  const secret = process.env.SESSION_SECRET ?? "";
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  const session = await verifySessionToken(secret, token);
  if (!session) return NextResponse.json({ user: null });
  return NextResponse.json({
    user: {
      address: session.address,
      name: session.name,
      role: session.role,
    },
  });
}
