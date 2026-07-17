/**
 * Server-only helpers for the PUBLIC survey link.
 *
 * These run on the server against the in-cluster Switchboard (never the browser)
 * and are the ONLY way an unauthenticated respondent touches the reactor. The
 * general /api/graphql proxy stays members-only; this path can do exactly two
 * things: read a published survey's definition, and append one response.
 */

import type {
  ResponseAnswerPayload,
} from "./survey-helpers";
import type {
  SurveyQuestion,
  SurveySection,
  SurveyStatus,
} from "./types";

const TARGET =
  process.env.SWITCHBOARD_INTERNAL_URL ??
  process.env.NEXT_PUBLIC_SWITCHBOARD_URL ??
  "http://localhost:4001/graphql";

/** Hard ceiling on responses per survey (spam / unbounded-growth guard). */
export const MAX_RESPONSES = 2000;

const SURVEY_QUERY = `
  query {
    Survey {
      documents {
        items {
          id
          state {
            global {
              title description kind status shareToken
              sections { id title description }
              questions {
                id sectionId type title helpText required
                options { id label }
                ratingScale { min max minLabel maxLabel }
                columns { id label type options { id label } }
              }
              responses { id }
            }
          }
        }
      }
    }
  }
`;

interface RawSurvey {
  id: string;
  state: {
    global: {
      title: string;
      description: string | null;
      kind: string;
      status: SurveyStatus;
      shareToken: string | null;
      sections: SurveySection[];
      questions: SurveyQuestion[];
      responses: { id: string }[];
    };
  };
}

export interface PublicSurvey {
  docId: string;
  title: string;
  description: string | null;
  status: SurveyStatus;
  responseCount: number;
  sections: SurveySection[];
  questions: SurveyQuestion[];
}

/** The sanitized shape sent to the browser — never includes responses. */
export interface PublicSurveyDefinition {
  title: string;
  description: string | null;
  sections: SurveySection[];
  questions: SurveyQuestion[];
}

export function parseLink(link: string): { docId: string; token: string } | null {
  const at = link.indexOf("~");
  if (at <= 0 || at === link.length - 1) return null;
  return { docId: link.slice(0, at), token: link.slice(at + 1) };
}

/**
 * Resolve a public link to its survey, verifying the token. Returns null when
 * the link is malformed, the survey doesn't exist, or the token doesn't match —
 * all indistinguishable to the caller (no oracle).
 */
export async function resolveSurveyLink(link: string): Promise<PublicSurvey | null> {
  const parsed = parseLink(link);
  if (!parsed) return null;

  const res = await fetch(TARGET, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query: SURVEY_QUERY }),
    cache: "no-store",
    signal: AbortSignal.timeout(10_000),
  });
  if (!res.ok) throw new Error(`reactor ${res.status}`);
  const json = (await res.json()) as {
    data?: { Survey?: { documents?: { items?: RawSurvey[] } } };
  };
  const item = json.data?.Survey?.documents?.items?.find((s) => s.id === parsed.docId);
  if (!item) return null;

  const g = item.state.global;
  // Templates are never answerable; token must match.
  if (g.kind === "TEMPLATE" || !g.shareToken || g.shareToken !== parsed.token) {
    return null;
  }
  return {
    docId: item.id,
    title: g.title,
    description: g.description,
    status: g.status,
    responseCount: g.responses.length,
    sections: g.sections,
    questions: g.questions,
  };
}

export function sanitize(survey: PublicSurvey): PublicSurveyDefinition {
  return {
    title: survey.title,
    description: survey.description,
    sections: survey.sections,
    questions: survey.questions,
  };
}

/**
 * Rebuild a clean answers array from client-supplied payload, keeping only
 * values valid for each question (known ids, valid options/columns, in-range
 * ratings). Returns an error message if a required question is unanswered.
 */
export function buildAnswers(
  questions: SurveyQuestion[],
  provided: ResponseAnswerPayload[],
): { answers: ResponseAnswerPayload[] } | { error: string } {
  const byId = new Map(questions.map((q) => [q.id, q]));
  const answered = new Set<string>();
  const out: ResponseAnswerPayload[] = [];

  for (const a of provided) {
    const q = byId.get(a?.questionId);
    if (!q) continue; // ignore unknown questions

    if (q.type === "SHORT_TEXT" || q.type === "LONG_TEXT") {
      const text = typeof a.text === "string" ? a.text.trim() : "";
      if (text) {
        out.push({ questionId: q.id, text, optionIds: [], rating: null, rows: [] });
        answered.add(q.id);
      }
    } else if (q.type === "SINGLE_SELECT" || q.type === "MULTI_SELECT") {
      const valid = (Array.isArray(a.optionIds) ? a.optionIds : []).filter((id) =>
        q.options.some((o) => o.id === id),
      );
      const ids = q.type === "SINGLE_SELECT" ? valid.slice(0, 1) : valid;
      if (ids.length > 0) {
        out.push({ questionId: q.id, text: null, optionIds: ids, rating: null, rows: [] });
        answered.add(q.id);
      }
    } else if (q.type === "RATING") {
      const min = q.ratingScale?.min ?? 1;
      const max = q.ratingScale?.max ?? 5;
      const r = typeof a.rating === "number" ? Math.round(a.rating) : null;
      if (r != null && r >= min && r <= max) {
        out.push({ questionId: q.id, text: null, optionIds: [], rating: r, rows: [] });
        answered.add(q.id);
      }
    } else if (q.type === "GRID") {
      const rows = (Array.isArray(a.rows) ? a.rows : [])
        .map((row) => ({
          cells: q.columns.map((col) => {
            const cell = row.cells?.find((c) => c.columnId === col.id);
            if (col.type === "SELECT") {
              const optionId =
                cell?.optionId && col.options.some((o) => o.id === cell.optionId)
                  ? cell.optionId
                  : null;
              return { columnId: col.id, text: null, optionId };
            }
            const text = typeof cell?.text === "string" ? cell.text.trim() || null : null;
            return { columnId: col.id, text, optionId: null };
          }),
        }))
        .filter((row) => row.cells.some((c) => c.text || c.optionId));
      if (rows.length > 0) {
        out.push({ questionId: q.id, text: null, optionIds: [], rating: null, rows });
        answered.add(q.id);
      }
    }
  }

  const missingRequired = questions.filter((q) => q.required && !answered.has(q.id));
  if (missingRequired.length > 0) {
    return { error: "Please answer all required questions." };
  }
  return { answers: out };
}

const ADD_RESPONSE_MUTATION = `
  mutation($docId: PHID!, $input: Survey_AddResponseInput!) {
    Survey { addResponse(docId: $docId, input: $input) { __typename } }
  }
`;

export async function appendResponse(
  docId: string,
  id: string,
  submittedAt: string,
  answers: ResponseAnswerPayload[],
): Promise<boolean> {
  const res = await fetch(TARGET, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      query: ADD_RESPONSE_MUTATION,
      variables: { docId, input: { id, submittedAt, answers } },
    }),
    cache: "no-store",
    signal: AbortSignal.timeout(10_000),
  });
  if (!res.ok) return false;
  const json = (await res.json()) as { errors?: unknown[] };
  return !json.errors || json.errors.length === 0;
}
