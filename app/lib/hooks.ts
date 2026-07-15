"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  fetchLeadFunnel,
  fetchTimesheets,
  fetchWorkspace,
  type LeadFunnelDoc,
  type TimesheetDoc,
  type WorkspaceDoc,
} from "./api";
import type { Role } from "./types";

export function useWorkspace() {
  return useQuery<WorkspaceDoc | null>({
    queryKey: ["workspace"],
    queryFn: fetchWorkspace,
    refetchInterval: 4000,
  });
}

export function useTimesheets() {
  return useQuery<TimesheetDoc[]>({
    queryKey: ["timesheets"],
    queryFn: fetchTimesheets,
    refetchInterval: 4000,
  });
}

export function useMyTimesheet(address: string | null | undefined) {
  const { data: sheets, ...rest } = useTimesheets();
  const mine =
    address != null
      ? (sheets?.find((s) => s.ownerAddress === address) ?? null)
      : null;
  return { timesheet: mine, sheets: sheets ?? [], ...rest };
}

/** Role of the current user as recorded in the workspace (defaults to MEMBER). */
export function useMyRole(address: string | null | undefined): Role | null {
  const { data: workspace } = useWorkspace();
  if (!address || !workspace) return null;
  const member = workspace.members.find((m) => m.address === address);
  return member?.role ?? null;
}

export function useLeadFunnel() {
  return useQuery<LeadFunnelDoc | null>({
    queryKey: ["leadFunnel"],
    queryFn: fetchLeadFunnel,
    refetchInterval: 4000,
  });
}

/** Invalidate the read queries after a mutation so the UI reflects changes fast. */
export function useRefresh() {
  const qc = useQueryClient();
  return () => {
    void qc.invalidateQueries({ queryKey: ["timesheets"] });
    void qc.invalidateQueries({ queryKey: ["workspace"] });
    void qc.invalidateQueries({ queryKey: ["leadFunnel"] });
  };
}

export function useAction<TArgs extends unknown[]>(
  fn: (...args: TArgs) => Promise<void>,
) {
  const refresh = useRefresh();
  return useMutation({
    mutationFn: (args: TArgs) => fn(...args),
    onSuccess: refresh,
  });
}
