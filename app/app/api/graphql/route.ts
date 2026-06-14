/**
 * API Route: Simple pass-through proxy to Switchboard GraphQL.
 *
 * The Next.js NextUI frontend calls POST /api/graphql, which forwards
 * the request to the Switchboard supergraph and returns the response
 * unchanged.  No LLM processing is performed.
 */

import { NextRequest, NextResponse } from "next/server";

const SW_URL = process.env.SWITCHBOARD_URL ?? "http://localhost:4001/graphql";

export async function POST(req: NextRequest) {
  try {
    const { query, variables } = await req.json();
    if (!query) {
      return NextResponse.json({ error: "Missing query" }, { status: 400 });
    }

    const res = await fetch(SW_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query, variables }),
    });

    if (!res.ok) {
      const text = await res.text();
      console.error("Switchboard GraphQL error:", res.status, text);
      return NextResponse.json(
        { error: "Switchboard request failed", details: text },
        { status: res.status },
      );
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (err) {
    console.error("API GraphQL proxy error:", err);
    return NextResponse.json(
      { error: "Internal server error", details: err instanceof Error ? err.message : String(err) },
      { status: 500 },
    );
  }
}

export async function GET() {
  return NextResponse.json({ status: "ok", switchboard: SW_URL });
}
