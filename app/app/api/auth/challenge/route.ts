import { NextResponse } from "next/server";
import { bytesToB64url } from "@/lib/didkey";
import { signToken } from "@/lib/session";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const NONCE_COOKIE = "__Host-phop_nonce";
const NONCE_TTL = 300; // 5 min

/**
 * Issues a one-time nonce for the connect-key possession proof. The nonce is
 * returned to the client to sign, and also stored (HMAC-signed, httpOnly) in a
 * short-lived cookie so /api/auth/session can confirm the client signed the
 * nonce WE issued.
 */
export async function GET() {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "not configured" }, { status: 500 });
  }
  const nonce = bytesToB64url(crypto.getRandomValues(new Uint8Array(24)));
  const token = await signToken(secret, { nonce }, NONCE_TTL);
  const res = NextResponse.json({ nonce });
  res.cookies.set(NONCE_COOKIE, token, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: NONCE_TTL,
  });
  return res;
}
