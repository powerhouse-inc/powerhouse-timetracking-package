/**
 * Server-side check that the user's wallet delegated access to our connect DID.
 *
 * Renown issues a Verifiable Credential (signed by the user's wallet) that
 * names the wallet as issuer and the connect DID as subject. We look it up at
 * Renown's API by (address, connectId) and confirm it delegates THIS user to
 * THIS connect DID. Renown only mints the credential after the wallet signs, so
 * its existence + these field checks establish the delegation.
 */

import { addressFromDid } from "./renown";

const RENOWN_BASE =
  process.env.NEXT_PUBLIC_RENOWN_URL || "https://www.renown.id";

interface RenownCredential {
  issuer?: { id?: string; ethereumAddress?: string };
  credentialSubject?: { id?: string };
}

function chainIdFromDid(did: string): number {
  // did:pkh:eip155:<chainId>:<address>
  const parts = did.split(":");
  const n = Number(parts[3]);
  return Number.isFinite(n) && n > 0 ? n : 1;
}

/**
 * True iff Renown holds a credential in which `userDid`'s wallet delegates to
 * `appDid` (our connect DID).
 */
export async function verifyDelegation(
  userDid: string,
  appDid: string,
): Promise<boolean> {
  const address = addressFromDid(userDid);
  if (!address.startsWith("0x")) return false;
  const chainId = chainIdFromDid(userDid);

  const url = new URL("/api/auth/credential", RENOWN_BASE);
  url.searchParams.set("address", address);
  url.searchParams.set("chainId", String(chainId));
  url.searchParams.set("connectId", appDid);
  url.searchParams.set("appId", appDid);

  const res = await fetch(url, {
    method: "GET",
    cache: "no-store",
    signal: AbortSignal.timeout(10_000),
  });
  if (!res.ok) return false;

  const body = (await res.json().catch(() => null)) as {
    credential?: RenownCredential;
  } | null;
  const cred = body?.credential;
  if (!cred) return false;

  return (
    cred.issuer?.id === userDid &&
    cred.credentialSubject?.id === appDid &&
    (cred.issuer?.ethereumAddress ?? "").toLowerCase() === address.toLowerCase()
  );
}
