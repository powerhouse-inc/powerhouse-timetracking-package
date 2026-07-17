/**
 * P-256 `did:key` encoding — shared by the browser (to derive its connect DID)
 * and the server (to bind a presented public key back to a claimed DID).
 * Matches @didtools/key-webcrypto, which is what the Renown SDK uses.
 */

const B58 = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";

export function base58btc(bytes: Uint8Array): string {
  const digits: number[] = [];
  for (const byte of bytes) {
    let carry = byte;
    for (let i = 0; i < digits.length; i++) {
      carry += digits[i] << 8;
      digits[i] = carry % 58;
      carry = (carry / 58) | 0;
    }
    while (carry > 0) {
      digits.push(carry % 58);
      carry = (carry / 58) | 0;
    }
  }
  let out = "";
  for (const byte of bytes) {
    if (byte === 0) out += "1";
    else break;
  }
  for (let i = digits.length - 1; i >= 0; i--) out += B58[digits[i]];
  return out;
}

export function b64urlToBytes(s: string): Uint8Array {
  const b64 = s.replace(/-/g, "+").replace(/_/g, "/");
  const bin = atob(b64 + "=".repeat((4 - (b64.length % 4)) % 4));
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

export function bytesToB64url(bytes: Uint8Array): string {
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

// raw = 0x04 ++ X(32) ++ Y(32); did:key = base58btc(0x80 0x24 ++ compressedPoint)
function didKeyFromRawPublicKey(raw: Uint8Array): string {
  const compressed = new Uint8Array(33);
  compressed[0] = (raw[64] & 1) === 1 ? 0x03 : 0x02;
  compressed.set(raw.slice(1, 33), 1);
  const prefixed = new Uint8Array(35);
  prefixed[0] = 0x80;
  prefixed[1] = 0x24;
  prefixed.set(compressed, 2);
  return `did:key:z${base58btc(prefixed)}`;
}

/** Derive the P-256 did:key for a public-key JWK ({ x, y } base64url). */
export function didKeyFromJwk(jwk: { x?: string; y?: string }): string {
  if (!jwk.x || !jwk.y) throw new Error("Invalid EC public JWK");
  const x = b64urlToBytes(jwk.x);
  const y = b64urlToBytes(jwk.y);
  if (x.length !== 32 || y.length !== 32) throw new Error("Bad P-256 coords");
  const raw = new Uint8Array(65);
  raw[0] = 0x04;
  raw.set(x, 1);
  raw.set(y, 33);
  return didKeyFromRawPublicKey(raw);
}
