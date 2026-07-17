"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { RENOWN_URL } from "./config";
import { addressFromDid, getAppDid } from "./renown";
import { useWorkspace } from "./hooks";

export interface Identity {
  address: string;
  name: string;
  did: string | null;
}

interface AuthValue {
  user: Identity | null;
  ready: boolean;
  signIn: (identity: Identity) => void;
  signOut: () => void;
  startRenown: () => void;
  renownConfigured: boolean;
}

const STORAGE_KEY = "tt-identity";
const AuthContext = createContext<AuthValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Identity | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Renown returns the signed-in DID as ?user=<did>; capture it.
    const params = new URLSearchParams(window.location.search);
    const rawUser = params.get("user");
    if (rawUser) {
      // Renown double-encodes the user param (encodeURIComponent + then
      // URLSearchParams), so after URLSearchParams decodes once it's still
      // percent-encoded (did%3A…). Decode again to get did:pkh:eip155:1:0x…,
      // whose final segment is the signer's Ethereum address.
      const did = safeDecode(rawUser);
      const identity: Identity = {
        address: addressFromDid(did),
        name: shortDid(did),
        did,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(identity));
      setUser(identity);
      params.delete("user");
      const qs = params.toString();
      window.history.replaceState(
        {},
        "",
        window.location.pathname + (qs ? `?${qs}` : ""),
      );
      setReady(true);
      return;
    }
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      try {
        setUser(JSON.parse(raw) as Identity);
      } catch {
        /* ignore */
      }
    }
    setReady(true);
  }, []);

  const signIn = useCallback((identity: Identity) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(identity));
    setUser(identity);
  }, []);

  const signOut = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setUser(null);
  }, []);

  const startRenown = useCallback(() => {
    if (!RENOWN_URL) return;
    // Renown needs the requesting app's DID (`connect`/`app`) to render its
    // sign-in flow; it redirects back to `returnUrl` with `?user=<did:pkh…>`.
    void (async () => {
      const appDid = await getAppDid();
      const returnUrl = window.location.origin + window.location.pathname;
      const url = new URL(RENOWN_URL);
      url.searchParams.set("connect", appDid);
      url.searchParams.set("app", appDid);
      url.searchParams.set("network", "eip155");
      url.searchParams.set("chain", "1");
      url.searchParams.set("returnUrl", returnUrl);
      window.location.href = url.toString();
    })();
  }, []);

  const { data: workspace } = useWorkspace();

  // The DID only carries the eth address; the human name lives on the workspace
  // member. Resolve it by matching addresses so the UI shows "Frank Pfeift"
  // rather than the short 0x…address (and never the raw DID).
  const resolvedUser = useMemo<Identity | null>(() => {
    if (!user) return null;
    const addr = user.address.toLowerCase();
    // Match an ACTIVE member — an archived one must not keep claiming the
    // identity (that's what let a stale/duplicate member win by list order).
    const member = workspace?.members?.find(
      (m) => m.status !== "ARCHIVED" && m.address?.toLowerCase() === addr,
    );
    return member?.name && member.name !== user.name
      ? { ...user, name: member.name }
      : user;
  }, [user, workspace]);

  const value = useMemo<AuthValue>(
    () => ({
      user: resolvedUser,
      ready,
      signIn,
      signOut,
      startRenown,
      renownConfigured: Boolean(RENOWN_URL),
    }),
    [resolvedUser, ready, signIn, signOut, startRenown],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

function shortDid(did: string): string {
  const tail = did.split(":").pop() ?? did;
  return tail.length > 10 ? `${tail.slice(0, 6)}…${tail.slice(-4)}` : tail;
}

function safeDecode(s: string): string {
  try {
    return decodeURIComponent(s);
  } catch {
    return s;
  }
}
