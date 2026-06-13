import type { DocumentNode } from "graphql";
import { gql } from "graphql-tag";

export const schema: DocumentNode = gql`
  type TimetrackingEntry {
    entryId: ID!
    timesheetId: ID!
    ownerAddress: String
    entryLocalId: ID!
    description: String!
    projectId: ID
    projectName: String
    projectColor: String
    clientId: ID
    clientName: String
    startTime: String!
    endTime: String!
    durationSeconds: Int!
    billable: Boolean!
    tags: [String!]!
    day: String!
    week: String!
    month: String!
    year: Int!
  }

  type TimetrackingDaySummary {
    day: String!
    durationSeconds: Int!
    billableSeconds: Int!
  }

  type TimetrackingProjectSummary {
    projectId: ID
    projectName: String
    color: String
    durationSeconds: Int!
    billableSeconds: Int!
  }

  type TimetrackingClientSummary {
    clientId: ID
    clientName: String
    durationSeconds: Int!
    billableSeconds: Int!
  }

  type TimetrackingMemberSummary {
    address: String
    name: String
    durationSeconds: Int!
    billableSeconds: Int!
  }

  type TimetrackingWorkspaceMember {
    localId: ID!
    address: String
    did: String
    name: String!
    avatarUrl: String
    role: String!
    status: String!
  }

  type TimetrackingWorkspaceProject {
    localId: ID!
    name: String!
    clientId: ID
    clientName: String
    color: String!
    billable: Boolean!
    status: String!
  }

  type TimetrackingWorkspaceClient {
    localId: ID!
    name: String!
    status: String!
  }

  type Query {
    tt_timeEntries(
      driveId: ID!
      ownerAddress: String
      from: String
      to: String
    ): [TimetrackingEntry!]!
    tt_summaryByDay(
      driveId: ID!
      ownerAddress: String
      from: String
      to: String
    ): [TimetrackingDaySummary!]!
    tt_summaryByProject(
      driveId: ID!
      ownerAddress: String
      from: String
      to: String
    ): [TimetrackingProjectSummary!]!
    tt_summaryByClient(
      driveId: ID!
      ownerAddress: String
      from: String
      to: String
    ): [TimetrackingClientSummary!]!
    tt_teamReport(
      driveId: ID!
      callerAddress: String
      from: String
      to: String
    ): [TimetrackingMemberSummary!]!
    tt_workspaceMembers(driveId: ID!): [TimetrackingWorkspaceMember!]!
    tt_workspaceProjects(driveId: ID!): [TimetrackingWorkspaceProject!]!
    tt_workspaceClients(driveId: ID!): [TimetrackingWorkspaceClient!]!
  }
`;
