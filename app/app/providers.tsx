"use client";

import {
  MutationCache,
  QueryCache,
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query";
import { useEffect, useState, type ReactNode } from "react";
import { AuthProvider } from "@/lib/auth";
import { toast } from "@/lib/toast";
import { Toaster } from "@/components/toasts";

function messageOf(error: unknown): string {
  if (error instanceof Error) return error.message;
  return "Something went wrong talking to the reactor.";
}

export function Providers({ children }: { children: ReactNode }) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: { queries: { staleTime: 2000, retry: 1 } },
        // Surface read failures (e.g. reactor unreachable) instead of silently
        // showing an empty state.
        queryCache: new QueryCache({
          onError: (error) => toast(messageOf(error), "error"),
        }),
        // Catches failures from mutations dispatched via useMutation/useAction.
        mutationCache: new MutationCache({
          onError: (error) => toast(messageOf(error), "error"),
        }),
      }),
  );

  // Catch-all for inline `await api.x()` mutations not wrapped in useMutation —
  // a failed dispatch otherwise becomes a silent unhandled rejection.
  useEffect(() => {
    const handler = (e: PromiseRejectionEvent) => {
      const msg = messageOf(e.reason);
      if (msg) toast(msg, "error");
    };
    window.addEventListener("unhandledrejection", handler);
    return () => window.removeEventListener("unhandledrejection", handler);
  }, []);

  return (
    <QueryClientProvider client={client}>
      <AuthProvider>{children}</AuthProvider>
      <Toaster />
    </QueryClientProvider>
  );
}
