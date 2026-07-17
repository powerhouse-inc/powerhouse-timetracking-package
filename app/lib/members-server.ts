/**
 * Server-only lookup of workspace members, used to gate sign-in.
 *
 * Runs on the server against the in-cluster Switchboard (never the browser), so
 * membership is authoritative and cannot be spoofed by the client.
 */

import { addressFromDid } from "./renown";

const TARGET =
  process.env.SWITCHBOARD_INTERNAL_URL ??
  process.env.NEXT_PUBLIC_SWITCHBOARD_URL ??
  "http://localhost:4001/graphql";

const MEMBERS_QUERY = `
  query {
    TimetrackingWorkspace {
      documents { items { state { global { members { address name role status } } } } }
    }
  }
`;

interface RawMember {
  address: string | null;
  name: string;
  role: string;
  status: string;
}

export interface ActiveMember {
  address: string;
  name: string;
  role: string;
}

/**
 * Returns the ACTIVE workspace member for a Renown DID (or plain address), or
 * null if the address is not an active member. Archived members are excluded —
 * archiving a member revokes their access at the next sign-in.
 */
export async function findActiveMember(
  did: string,
): Promise<ActiveMember | null> {
  const address = addressFromDid(did);
  if (!address) return null;

  const res = await fetch(TARGET, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query: MEMBERS_QUERY }),
    cache: "no-store",
    signal: AbortSignal.timeout(10_000),
  });
  if (!res.ok) throw new Error(`reactor ${res.status}`);
  const json = (await res.json()) as {
    data?: {
      TimetrackingWorkspace?: {
        documents?: { items?: { state: { global: { members: RawMember[] } } }[] };
      };
    };
  };

  const members =
    json.data?.TimetrackingWorkspace?.documents?.items?.[0]?.state.global
      .members ?? [];

  const match = members.find(
    (m) =>
      m.status !== "ARCHIVED" &&
      (m.address ?? "").toLowerCase() === address.toLowerCase(),
  );
  return match
    ? { address, name: match.name, role: match.role }
    : null;
}
