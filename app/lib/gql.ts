export class GraphQLError extends Error {}

/** Minimal GraphQL POST — proxied through Next.js /api/graphql to Switchboard. */
export async function gql<T>(
  query: string,
  variables?: Record<string, unknown>,
): Promise<T> {
  // Route through Next.js API which proxies to Switchboard
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
