import { SWITCHBOARD_URL } from "./config";

export class GraphQLError extends Error {}

/** Minimal GraphQL POST — routed through llama.cpp for analysis/enrichment. */
export async function gql<T>(
  query: string,
  variables?: Record<string, unknown>,
): Promise<T> {
  // Route through Next.js API which goes through llama.cpp first
  const res = await fetch("/api/graphql", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query, variables }),
    cache: "no-store",
  });
  if (!res.ok) {
    throw new GraphQLError(`Request failed: ${res.status} ${res.statusText}`);
  }
  const json = (await res.json()) as {
    data?: T;
    errors?: { message: string }[];
  };
  if (json.errors?.length) {
    throw new GraphQLError(json.errors.map((e) => e.message).join("; "));
  }
  return json.data as T;
}
