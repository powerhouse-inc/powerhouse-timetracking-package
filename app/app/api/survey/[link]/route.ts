import { NextRequest } from "next/server";
import type { ResponseAnswerPayload } from "@/lib/survey-helpers";
import {
  MAX_RESPONSES,
  appendResponse,
  buildAnswers,
  resolveSurveyLink,
  sanitize,
} from "@/lib/survey-server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function json(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

/** GET: sanitized definition for a published survey (never responses). */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ link: string }> },
) {
  const { link } = await params;
  let survey;
  try {
    survey = await resolveSurveyLink(link);
  } catch {
    return json(502, { error: "unavailable" });
  }
  if (!survey) return json(404, { error: "not_found" });
  return json(200, {
    status: survey.status,
    title: survey.title,
    // Definition is only exposed while the survey is accepting responses.
    definition: survey.status === "OPEN" ? sanitize(survey) : null,
  });
}

// Simple in-memory per-IP throttle: bounds abuse without a datastore.
const hits = new Map<string, number[]>();
const WINDOW_MS = 10 * 60_000;
const MAX_PER_WINDOW = 30;

function throttled(ip: string): boolean {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  if (recent.length >= MAX_PER_WINDOW) {
    hits.set(ip, recent);
    return true;
  }
  recent.push(now);
  hits.set(ip, recent);
  return false;
}

/** POST: submit one response to an OPEN survey. */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ link: string }> },
) {
  // Same-origin only (the public page is served from this app).
  const origin = req.headers.get("origin");
  if (origin && new URL(origin).host !== req.headers.get("host")) {
    return json(403, { error: "cross_origin" });
  }

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  if (throttled(ip)) return json(429, { error: "rate_limited" });

  const { link } = await params;

  let body: { answers?: ResponseAnswerPayload[] };
  try {
    body = (await req.json()) as { answers?: ResponseAnswerPayload[] };
  } catch {
    return json(400, { error: "bad_request" });
  }
  if (!Array.isArray(body.answers)) return json(400, { error: "bad_request" });

  let survey;
  try {
    survey = await resolveSurveyLink(link);
  } catch {
    return json(502, { error: "unavailable" });
  }
  if (!survey) return json(404, { error: "not_found" });
  if (survey.status !== "OPEN") return json(409, { error: "closed" });
  if (survey.responseCount >= MAX_RESPONSES) return json(429, { error: "full" });

  const built = buildAnswers(survey.questions, body.answers);
  if ("error" in built) return json(400, { error: "validation", message: built.error });

  const ok = await appendResponse(
    survey.docId,
    crypto.randomUUID(),
    new Date().toISOString(),
    built.answers,
  );
  if (!ok) return json(502, { error: "unavailable" });
  return json(200, { ok: true });
}
