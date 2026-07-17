import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { getServerSession } from "@/lib/session-server";
import { AppShell } from "./app-shell";

// Server-side auth gate: every page under (app) requires a valid session
// cookie (issued only to active workspace members). Unauthenticated requests
// never render app content — they're redirected to /login on the server.
export const dynamic = "force-dynamic";

export default async function AppLayout({ children }: { children: ReactNode }) {
  const session = await getServerSession();
  if (!session) redirect("/login");
  return <AppShell>{children}</AppShell>;
}
