/**
 * Server-side session tokens.
 *
 * A session is a compact `<payload>.<sig>` string where sig = HMAC-SHA256 of
 * the payload under SESSION_SECRET. It is stored in an httpOnly, Secure,
 * SameSite=Lax cookie so client JS can never read or forge it. The token is
 * only ever created after the server has confirmed the address is an active
 * workspace member, so possessing a valid cookie == an authorized member.
 *
 * Web Crypto only (no Node APIs), so it runs in both middleware (edge) and
 * route handlers (node).
 */

// __Host- prefix: browser enforces Secure + Path=/ + no Domain, hardening
// against subdomain cookie fixation.
export const SESSION_COOKIE = "__Host-phop_session";
export const SESSION_TTL_SECONDS = 60 * 60 * 2; // 2h — membership is also re-checked at the proxy

export interface SessionPayload {
  address: string;
  name: string;
  role: string;
  exp: number; // unix seconds
}

function toBase64Url(bytes: Uint8Array): string {
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(s: string): Uint8Array {
  const b64 = s.replace(/-/g, "+").replace(/_/g, "/");
  const bin = atob(b64 + "=".repeat((4 - (b64.length % 4)) % 4));
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

const enc = new TextEncoder();

async function hmac(secret: string, data: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(data));
  return toBase64Url(new Uint8Array(sig));
}

// Constant-time-ish string compare (no early return on mismatch).
function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

/** Generic HMAC-signed, self-expiring token: `<base64url(json+exp)>.<sig>`. */
export async function signToken(
  secret: string,
  data: Record<string, unknown>,
  ttlSeconds: number,
): Promise<string> {
  const payload = {
    ...data,
    exp: Math.floor(Date.now() / 1000) + ttlSeconds,
  };
  const body = toBase64Url(enc.encode(JSON.stringify(payload)));
  const sig = await hmac(secret, body);
  return `${body}.${sig}`;
}

export async function verifyToken<T = Record<string, unknown>>(
  secret: string,
  token: string | undefined | null,
): Promise<(T & { exp: number }) | null> {
  if (!secret || !token) return null;
  const dot = token.indexOf(".");
  if (dot < 1) return null;
  const body = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  const expected = await hmac(secret, body);
  if (!safeEqual(sig, expected)) return null;
  try {
    const payload = JSON.parse(new TextDecoder().decode(fromBase64Url(body)));
    if (
      typeof payload.exp !== "number" ||
      payload.exp < Math.floor(Date.now() / 1000)
    ) {
      return null;
    }
    return payload;
  } catch {
    return null;
  }
}

export function createSessionToken(
  secret: string,
  data: Omit<SessionPayload, "exp">,
): Promise<string> {
  return signToken(secret, { ...data }, SESSION_TTL_SECONDS);
}

export async function verifySessionToken(
  secret: string,
  token: string | undefined | null,
): Promise<SessionPayload | null> {
  const p = await verifyToken<Omit<SessionPayload, "exp">>(secret, token);
  if (!p || typeof p.address !== "string") return null;
  return { address: p.address, name: p.name, role: p.role, exp: p.exp };
}
