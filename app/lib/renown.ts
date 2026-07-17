/**
 * The browser's connect identity for Renown sign-in.
 *
 * We generate a P-256 keypair (the "connect DID") once and keep it in
 * IndexedDB with a NON-EXTRACTABLE private key — JS can sign with it but can
 * never read it out. Renown's sign-in has the user's wallet issue a credential
 * delegating their address to this connect DID; on return the server both
 * looks that credential up at Renown AND makes us prove we still hold the
 * connect private key (by signing a server nonce), so a leaked DID alone can't
 * be replayed.
 */

import { bytesToB64url, didKeyFromJwk } from "./didkey";

const DB_NAME = "phop-auth";
const STORE = "kv";
const KEY = "connect";
const ALG = { name: "ECDSA", namedCurve: "P-256" } as const;

interface ConnectKey {
  priv: CryptoKey; // non-extractable
  publicJwk: JsonWebKey;
  did: string;
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function idbGet<T>(key: string): Promise<T | undefined> {
  return openDb().then(
    (db) =>
      new Promise<T | undefined>((resolve, reject) => {
        const tx = db.transaction(STORE, "readonly").objectStore(STORE).get(key);
        tx.onsuccess = () => resolve(tx.result as T | undefined);
        tx.onerror = () => reject(tx.error);
      }),
  );
}

function idbSet(key: string, value: unknown): Promise<void> {
  return openDb().then(
    (db) =>
      new Promise<void>((resolve, reject) => {
        const tx = db
          .transaction(STORE, "readwrite")
          .objectStore(STORE)
          .put(value, key);
        tx.onsuccess = () => resolve();
        tx.onerror = () => reject(tx.error);
      }),
  );
}

let cache: ConnectKey | null = null;

async function loadOrCreate(): Promise<ConnectKey> {
  if (cache) return cache;
  const existing = await idbGet<ConnectKey>(KEY);
  if (existing?.priv && existing.did && existing.publicJwk) {
    cache = existing;
    return existing;
  }
  // Generate extractable, then re-import the private half as non-extractable
  // and discard the extractable copy.
  const pair = await crypto.subtle.generateKey(ALG, true, ["sign", "verify"]);
  const publicJwk = await crypto.subtle.exportKey("jwk", pair.publicKey);
  const privateJwk = await crypto.subtle.exportKey("jwk", pair.privateKey);
  const priv = await crypto.subtle.importKey("jwk", privateJwk, ALG, false, [
    "sign",
  ]);
  const did = didKeyFromJwk(publicJwk);
  const rec: ConnectKey = { priv, publicJwk, did };
  await idbSet(KEY, rec);
  cache = rec;
  return rec;
}

/** The connect DID + its public JWK (safe to send to the server). */
export async function getAppIdentity(): Promise<{
  did: string;
  publicJwk: JsonWebKey;
}> {
  const k = await loadOrCreate();
  return { did: k.did, publicJwk: k.publicJwk };
}

/** The connect DID string (used as `connect`/`app` in the Renown redirect). */
export async function getAppDid(): Promise<string> {
  return (await loadOrCreate()).did;
}

/** Prove possession of the connect private key by signing a server nonce. */
export async function signChallenge(nonce: string): Promise<string> {
  const k = await loadOrCreate();
  const sig = await crypto.subtle.sign(
    { name: "ECDSA", hash: "SHA-256" },
    k.priv,
    new TextEncoder().encode(nonce),
  );
  return bytesToB64url(new Uint8Array(sig));
}

/**
 * Renown returns the signed-in identity as `did:pkh:eip155:<chainId>:<address>`.
 * Workspace members are keyed by their plain lowercased Ethereum address.
 */
export function addressFromDid(did: string): string {
  if (did.startsWith("did:pkh:")) {
    const last = did.split(":").pop();
    if (last && last.startsWith("0x")) return last.toLowerCase();
  }
  return did.toLowerCase();
}
