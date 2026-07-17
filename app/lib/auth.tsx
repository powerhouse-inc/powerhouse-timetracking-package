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
import { getAppDid } from "./renown";

export interface Identity {
  address: string;
  name: string;
  did: string | null;
}

interface AuthValue {
  user: Identity | null;
  ready: boolean;
  /** Non-null when a sign-in was rejected (e.g. not a workspace member). */
  error: string | null;
  signOut: () => void;
  startRenown: () => void;
  renownConfigured: boolean;
}

const AuthContext = createContext<AuthValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Identity | null>(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    // Renown returns the signed-in DID as ?user=<did>. We hand it to the server,
    // which independently verifies active membership before issuing the session
    // cookie — the client can't grant itself access.
    const params = new URLSearchParams(window.location.search);
    const rawUser = params.get("user");

    async function establish(did: string) {
      const res = await fetch("/api/auth/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ did }),
      });
      // Strip ?user from the URL regardless of outcome.
      params.delete("user");
      const qs = params.toString();
      window.history.replaceState(
        {},
        "",
        window.location.pathname + (qs ? `?${qs}` : ""),
      );
      if (res.ok) {
        // Full navigation so the server auth gate re-runs with the new cookie.
        window.location.replace("/");
        return;
      }
      const body = (await res.json().catch(() => null)) as {
        error?: string;
      } | null;
      if (!cancelled) {
        setError(body?.error ?? "Sign-in failed.");
        setReady(true);
      }
    }

    async function loadMe() {
      const res = await fetch("/api/auth/me", { cache: "no-store" });
      const body = (await res.json().catch(() => null)) as {
        user?: { address: string; name: string } | null;
      } | null;
      if (cancelled) return;
      setUser(
        body?.user
          ? { address: body.user.address, name: body.user.name, did: null }
          : null,
      );
      setReady(true);
    }

    if (rawUser) {
      // Renown double-encodes the param, so decode once more.
      let did = rawUser;
      try {
        did = decodeURIComponent(rawUser);
      } catch {
        /* keep raw */
      }
      void establish(did);
    } else {
      void loadMe();
    }

    return () => {
      cancelled = true;
    };
  }, []);

  const signOut = useCallback(() => {
    void fetch("/api/auth/session", { method: "DELETE" }).finally(() => {
      setUser(null);
      window.location.replace("/login");
    });
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
      error,
      signOut,
      startRenown,
      renownConfigured: Boolean(RENOWN_URL),
    }),
    [user, ready, error, signOut, startRenown],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
