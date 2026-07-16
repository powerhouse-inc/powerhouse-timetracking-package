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
    const did = params.get("user");
    if (did) {
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

  const value = useMemo<AuthValue>(
    () => ({
      user,
      ready,
      signIn,
      signOut,
      startRenown,
      renownConfigured: Boolean(RENOWN_URL),
    }),
    [user, ready, signIn, signOut, startRenown],
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
