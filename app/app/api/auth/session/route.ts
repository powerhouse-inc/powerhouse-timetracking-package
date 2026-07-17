import { NextRequest, NextResponse } from "next/server";
import { b64urlToBytes, didKeyFromJwk } from "@/lib/didkey";
import { findActiveMember } from "@/lib/members-server";
import { verifyDelegation } from "@/lib/renown-credential";
import {
  SESSION_COOKIE,
  SESSION_TTL_SECONDS,
  createSessionToken,
  verifyToken,
} from "@/lib/session";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const NONCE_COOKIE = "__Host-phop_nonce";

const cookieOpts = {
  httpOnly: true,
  secure: true,
  sameSite: "lax" as const,
  path: "/",
};

function fail(status: number, error: string) {
  return NextResponse.json({ error }, { status });
}

/** Verify an ECDSA P-256 signature over `nonce` by the public key `jwk`. */
async function verifyPossession(
  jwk: JsonWebKey,
  nonce: string,
  signatureB64: string,
): Promise<boolean> {
  try {
    const key = await crypto.subtle.importKey(
      "jwk",
      { kty: jwk.kty, crv: jwk.crv, x: jwk.x, y: jwk.y },
      { name: "ECDSA", namedCurve: "P-256" },
      false,
      ["verify"],
    );
    return await crypto.subtle.verify(
      { name: "ECDSA", hash: "SHA-256" },
      key,
      b64urlToBytes(signatureB64),
      new TextEncoder().encode(nonce),
    );
  } catch {
    return false;
  }
}

/**
 * Establish a session. The caller must prove, in one request:
 *  1. possession of the connect private key (sign our nonce),
 *  2. that the connect DID it presents matches that key,
 *  3. that the user's wallet delegated to that connect DID (Renown credential),
 *  4. that the user is an ACTIVE workspace member.
 * Only then is the httpOnly session cookie issued.
 */
export async function POST(req: NextRequest) {
  const origin = req.headers.get("origin");
  if (origin && new URL(origin).host !== req.headers.get("host")) {
    return fail(403, "Cross-origin request rejected.");
  }

  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 32) {
    return fail(500, "Server auth is not configured.");
  }

  let userDid: unknown, appDid: unknown, publicJwk: unknown, signature: unknown;
  try {
    ({ userDid, appDid, publicJwk, signature } = (await req.json()) as Record<
      string,
      unknown
    >);
  } catch {
    return fail(400, "Bad request.");
  }
  if (
    typeof userDid !== "string" ||
    typeof appDid !== "string" ||
    typeof signature !== "string" ||
    typeof publicJwk !== "object" ||
    publicJwk === null
  ) {
    return fail(400, "Missing fields.");
  }

  // (1) The nonce must be one we issued and still valid.
  const nonceToken = req.cookies.get(NONCE_COOKIE)?.value;
  const noncePayload = await verifyToken<{ nonce: string }>(secret, nonceToken);
  if (!noncePayload?.nonce) return fail(400, "Challenge expired. Try again.");

  // (2) The presented public key must derive to the claimed connect DID.
  let derivedDid: string;
  try {
    derivedDid = didKeyFromJwk(publicJwk as { x?: string; y?: string });
  } catch {
    return fail(400, "Invalid connect key.");
  }
  if (derivedDid !== appDid) return fail(400, "Connect key/DID mismatch.");

  // (1 cont.) Prove possession of the connect private key.
  const ok = await verifyPossession(
    publicJwk as JsonWebKey,
    noncePayload.nonce,
    signature,
  );
  if (!ok) return fail(401, "Invalid connect-key proof.");

  // (3) The user's wallet must have delegated to this connect DID via Renown.
  let delegated = false;
  try {
    delegated = await verifyDelegation(userDid, appDid);
  } catch {
    return fail(502, "Could not reach Renown.");
  }
  if (!delegated) return fail(403, "No valid Renown delegation for this app.");

  // (4) The user must be an active workspace member.
  let member;
  try {
    member = await findActiveMember(userDid);
  } catch {
    return fail(502, "Reactor is unreachable.");
  }
  if (!member) {
    return fail(403, "This account is not a member of the workspace.");
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
  res.cookies.set(NONCE_COOKIE, "", { ...cookieOpts, maxAge: 0 });
  return res;
}

/** Sign out — clear the session cookie. */
export function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE, "", { ...cookieOpts, maxAge: 0 });
  return res;
}
