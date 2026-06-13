import { type ISubgraph } from "@powerhousedao/reactor-api";
import { TimetrackingRead } from "../../processors/timetracking-read/index.js";
import type {
  ClientRow,
  MemberRow,
  ProjectRow,
  TimeEntryRow,
} from "../../processors/timetracking-read/schema.js";
import {
  canSeeTeamReport,
  enrichEntries,
  filterByRange,
  summaryByClient,
  summaryByDay,
  summaryByMember,
  summaryByProject,
} from "./lib.js";

interface RangeArgs {
  driveId: string;
  ownerAddress?: string | null;
  from?: string | null;
  to?: string | null;
}

export const getResolvers = (subgraph: ISubgraph): Record<string, unknown> => {
  const fetchEntries = async (driveId: string) =>
    (await TimetrackingRead.query(driveId, subgraph.relationalDb)
      .selectFrom("tt_time_entries")
      .selectAll()
      .execute()) as TimeEntryRow[];

  const fetchProjects = async (driveId: string) =>
    (await TimetrackingRead.query(driveId, subgraph.relationalDb)
      .selectFrom("tt_projects")
      .selectAll()
      .execute()) as ProjectRow[];

  const fetchClients = async (driveId: string) =>
    (await TimetrackingRead.query(driveId, subgraph.relationalDb)
      .selectFrom("tt_clients")
      .selectAll()
      .execute()) as ClientRow[];

  const fetchMembers = async (driveId: string) =>
    (await TimetrackingRead.query(driveId, subgraph.relationalDb)
      .selectFrom("tt_members")
      .selectAll()
      .execute()) as MemberRow[];

  const loadEnriched = async (args: RangeArgs) => {
    const [entries, projects, clients] = await Promise.all([
      fetchEntries(args.driveId),
      fetchProjects(args.driveId),
      fetchClients(args.driveId),
    ]);
    const scoped = args.ownerAddress
      ? entries.filter((e) => e.ownerAddress === args.ownerAddress)
      : entries;
    const ranged = filterByRange(scoped, args.from, args.to);
    return enrichEntries(ranged, projects, clients);
  };

  return {
    Query: {
      tt_timeEntries: async (_p: unknown, args: RangeArgs) =>
        loadEnriched(args),

      tt_summaryByDay: async (_p: unknown, args: RangeArgs) =>
        summaryByDay(await loadEnriched(args)),

      tt_summaryByProject: async (_p: unknown, args: RangeArgs) =>
        summaryByProject(await loadEnriched(args)),

      tt_summaryByClient: async (_p: unknown, args: RangeArgs) =>
        summaryByClient(await loadEnriched(args)),

      tt_teamReport: async (
        _p: unknown,
        args: {
          driveId: string;
          callerAddress?: string | null;
          from?: string | null;
          to?: string | null;
        },
      ) => {
        const members = await fetchMembers(args.driveId);
        const caller = args.callerAddress
          ? members.find((m) => m.address === args.callerAddress)
          : undefined;
        const nameByAddress = new Map(
          members
            .filter((m) => m.address)
            .map((m) => [m.address as string, m.name]),
        );

        // Advisory gating: non-managerial callers only see their own totals.
        const ownerAddress = canSeeTeamReport(caller?.role)
          ? undefined
          : (args.callerAddress ?? undefined);

        const enriched = await loadEnriched({
          driveId: args.driveId,
          ownerAddress,
          from: args.from,
          to: args.to,
        });
        return summaryByMember(enriched, nameByAddress);
      },

      tt_workspaceMembers: async (_p: unknown, args: { driveId: string }) => {
        const members = await fetchMembers(args.driveId);
        return members.map((m) => ({
          localId: m.localId,
          address: m.address,
          did: m.did,
          name: m.name,
          avatarUrl: m.avatarUrl,
          role: m.role,
          status: m.status,
        }));
      },

      tt_workspaceProjects: async (_p: unknown, args: { driveId: string }) => {
        const [projects, clients] = await Promise.all([
          fetchProjects(args.driveId),
          fetchClients(args.driveId),
        ]);
        const clientById = new Map(clients.map((c) => [c.localId, c]));
        return projects.map((p) => ({
          localId: p.localId,
          name: p.name,
          clientId: p.clientId,
          clientName: p.clientId
            ? (clientById.get(p.clientId)?.name ?? null)
            : null,
          color: p.color,
          billable: p.billable,
          status: p.status,
        }));
      },

      tt_workspaceClients: async (_p: unknown, args: { driveId: string }) => {
        const clients = await fetchClients(args.driveId);
        return clients.map((c) => ({
          localId: c.localId,
          name: c.name,
          status: c.status,
        }));
      },
    },
  };
};
