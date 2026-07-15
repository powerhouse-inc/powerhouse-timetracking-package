import { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

/**
 * Server-side proxy to the reactor's Switchboard.
 *
 * In the phop deployment the Switchboard has no public ingress — it is only
 * reachable in-cluster. The browser therefore never talks to it directly;
 * it calls this same-origin route, which forwards to the internal service
 * (SWITCHBOARD_INTERNAL_URL). Locally it falls back to the dev switchboard.
 */
const TARGET =
  process.env.SWITCHBOARD_INTERNAL_URL ??
  process.env.NEXT_PUBLIC_SWITCHBOARD_URL ??
  "http://localhost:4001/graphql";

export async function POST(req: NextRequest) {
  const body = await req.text();
  try {
    const res = await fetch(TARGET, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
      cache: "no-store",
    });
    const text = await res.text();
    return new Response(text, {
      status: res.status,
      headers: {
        "Content-Type": res.headers.get("content-type") ?? "application/json",
      },
    });
  } catch {
    return new Response(
      JSON.stringify({ errors: [{ message: "Reactor is unreachable." }] }),
      { status: 502, headers: { "Content-Type": "application/json" } },
    );
  }
}
