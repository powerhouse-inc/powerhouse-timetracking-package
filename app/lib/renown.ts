/**
 * Renown sign-in helpers.
 *
 * Renown's web flow only renders when it receives the requesting app's DID as
 * the `connect` (a.k.a. `app`) query parameter — without it the page is blank
 * and the redirect never comes back. That DID is a self-certifying P-256
 * `did:key`, the same kind Powerhouse Connect derives via `@didtools/key-webcrypto`.
 * We generate one here with Web Crypto (no extra deps) and persist it so a
 * browser keeps a stable app identity across sign-ins.
 */

const APP_DID_KEY = "tt-app-did";

const B58_ALPHABET =
  "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";

function base58btc(bytes: Uint8Array): string {
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
  for (let i = digits.length - 1; i >= 0; i--) out += B58_ALPHABET[digits[i]];
  return out;
}

// did:key for a P-256 public key = base58btc( varint(0x1200) ++ compressedPoint )
// prefixed with "did:key:z". varint(0x1200) is the two bytes [0x80, 0x24];
// the compressed point is 0x02/0x03 (Y parity) followed by the 32-byte X.
async function generateAppDid(): Promise<string> {
  const keyPair = await crypto.subtle.generateKey(
    { name: "ECDSA", namedCurve: "P-256" },
    true,
    ["sign", "verify"],
  );
  // raw public key = 0x04 ++ X(32) ++ Y(32)
  const raw = new Uint8Array(
    await crypto.subtle.exportKey("raw", keyPair.publicKey),
  );
  const compressed = new Uint8Array(33);
  compressed[0] = (raw[64] & 1) === 1 ? 0x03 : 0x02;
  compressed.set(raw.slice(1, 33), 1);

  const prefixed = new Uint8Array(35);
  prefixed[0] = 0x80;
  prefixed[1] = 0x24;
  prefixed.set(compressed, 2);

  return `did:key:z${base58btc(prefixed)}`;
}

/** The stable app (connect) DID for this browser, generated on first use. */
export async function getAppDid(): Promise<string> {
  const existing = localStorage.getItem(APP_DID_KEY);
  if (existing) return existing;
  const did = await generateAppDid();
  localStorage.setItem(APP_DID_KEY, did);
  return did;
}

/**
 * Renown returns the signed-in identity as `did:pkh:eip155:<chainId>:<address>`.
 * Workspace members are keyed by their plain lowercased Ethereum address, so we
 * pull that out for role matching. Falls back to the whole string lowercased.
 */
export function addressFromDid(did: string): string {
  if (did.startsWith("did:pkh:")) {
    const last = did.split(":").pop();
    if (last && last.startsWith("0x")) return last.toLowerCase();
  }
  return did.toLowerCase();
}
