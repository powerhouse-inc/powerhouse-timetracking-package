/**
 * API Route: All Switchboard GraphQL requests go through llama.cpp first.
 *
 * Usage: POST /api/graphql with body { query, variables }
 * The LLM analyzes the query, then fetches from Switchboard,
 * then enriches the result before returning.
 */

import { NextRequest, NextResponse } from "next/server";

const LLAMA_URL = process.env.LLAMA_URL ?? "http://localhost:8100";
const SW_URL = process.env.SWITCHBOARD_URL ?? "http://localhost:4001/graphql";
const LLAMA_MODEL = "Qwen3.6-35B-A3B-Q8_0.gguf";

async function callLlama(prompt: string, maxTokens = 8192): Promise<string> {
  const res = await fetch(`${LLAMA_URL}/v1/chat/completions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: LLAMA_MODEL,
      messages: [{ role: "user", content: prompt }],
      max_tokens: maxTokens,
      temperature: 0,
      stream: false,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`llama.cpp failed: ${res.status} ${text}`);
  }

  const data = await res.json();
  return data?.choices?.[0]?.message?.content ?? "";
}

async function callSwitchboard(query: string, variables?: Record<string, unknown>) {
  const res = await fetch(SW_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query, variables }),
  });

  if (!res.ok) throw new Error(`Switchboard failed: ${res.status}`);
  return res.json();
}

export async function POST(req: NextRequest) {
  try {
    const { query, variables } = await req.json();
    if (!query) return NextResponse.json({ error: "Missing query" }, { status: 400 });

    // Step 1: Analyze query through LLM
    try {
      await callLlama(
        `Analyze this GraphQL query for a time-tracking app:\n\nQuery: ${query}\nVariables: ${JSON.stringify(variables || {})}`,
        2048,
      );
    } catch {
      // LLM busy — proceed anyway
    }

    // Step 2: Fetch from Switchboard
    const rawData = await callSwitchboard(query, variables);

    // Step 3: Enrich with LLM summary
    let enriched = rawData;
    try {
      const summary = await callLlama(
        `Summarize this GraphQL response for a time-tracking app:\n\n${JSON.stringify(rawData, null, 2)}`,
        4096,
      );
      enriched = { ...rawData, _llama: { summary, model: LLAMA_MODEL, processedAt: new Date().toISOString() } };
    } catch {
      // LLM enrichment failed — return raw data
    }

    return NextResponse.json(enriched);
  } catch (err) {
    console.error("API GraphQL proxy error:", err);
    return NextResponse.json(
      { error: "Internal server error", details: err instanceof Error ? err.message : String(err) },
      { status: 500 },
    );
  }
}

export async function GET() {
  return NextResponse.json({ status: "ok", llama: LLAMA_URL, switchboard: SW_URL });
}
