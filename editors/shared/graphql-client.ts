/**
 * GraphQL client utility for fetching remote builder profiles from Switchboard.
 * This is used as a fallback when local drives don't have the builder profile documents.
 */

import { getGraphQLUrl } from "./graphql.js";

interface GraphQLResponse<T> {
  data?: T;
  errors?: Array<{ message: string }>;
}

async function graphqlRequest<T>(
  query: string,
  variables?: Record<string, unknown>,
  options?: { silent?: boolean },
): Promise<T | null> {
  try {
    const response = await fetch(getGraphQLUrl(), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query, variables }),
    });

    if (!response.ok) {
      if (!options?.silent) {
        console.warn(
          "[graphql-client] Request failed:",
          response.status,
          response.statusText,
        );
      }
      return null;
    }

    const result = (await response.json()) as GraphQLResponse<T>;

    // Return data even if there are errors - partial data might still be useful
    // Only treat as full failure if there's no data at all
    if (result.errors?.length && !result.data) {
      if (!options?.silent) {
        console.warn("[graphql-client] GraphQL errors:", result.errors);
      }
      return null;
    }

    return result.data ?? null;
  } catch (error) {
    // Silently fail - this is a fallback mechanism
    if (!options?.silent) {
      console.warn("[graphql-client] Request error:", error);
    }
    return null;
  }
}

// Query to get all available drives
const GET_DRIVES_QUERY = `
  query GetDrives {
    drives
  }
`;

// Query to get drive ID by slug
const GET_DRIVE_ID_BY_SLUG_QUERY = `
  query GetDriveIdBySlug($slug: String!) {
    driveIdBySlug(slug: $slug)
  }
`;

// Query to get builder profile documents from a drive
const GET_BUILDER_PROFILES_QUERY = `
  query GetBuilderProfiles($driveId: String!) {
    BuilderProfile {
      getDocuments(driveId: $driveId) {
        id
        state {
          name
          slug
          icon
          description
        }
      }
    }
  }
`;

// Query to get a single builder profile by ID
const GET_BUILDER_PROFILE_QUERY = `
  query GetBuilderProfile($docId: PHID!, $driveId: PHID) {
    BuilderProfile {
      getDocument(docId: $docId, driveId: $driveId) {
        id
        state {
          name
          slug
          icon
          description
        }
      }
    }
  }
`;

interface DrivesResponse {
  drives: string[];
}

interface DriveIdBySlugResponse {
  driveIdBySlug: string;
}

export interface RemoteBuilderProfile {
  id: string;
  /** The drive slug/name this profile was fetched from */
  driveName?: string;
  state: {
    name: string | null;
    slug: string | null;
    icon: string | null;
    description: string | null;
  };
}

interface BuilderProfilesResponse {
  BuilderProfile: {
    getDocuments: RemoteBuilderProfile[];
  };
}

interface SingleBuilderProfileResponse {
  BuilderProfile: {
    getDocument: RemoteBuilderProfile | null;
  };
}

/**
 * Fetches all available remote drives
 */
export async function fetchRemoteDrives(): Promise<string[]> {
  const data = await graphqlRequest<DrivesResponse>(GET_DRIVES_QUERY);
  return data?.drives ?? [];
}

/**
 * Fetches drive ID by slug
 */
export async function fetchDriveIdBySlug(slug: string): Promise<string | null> {
  const data = await graphqlRequest<DriveIdBySlugResponse>(
    GET_DRIVE_ID_BY_SLUG_QUERY,
    { slug },
  );
  return data?.driveIdBySlug ?? null;
}

/**
 * Fetches all builder profiles from a specific drive
 */
export async function fetchBuilderProfilesFromDrive(
  driveId: string,
  options?: { silent?: boolean },
): Promise<RemoteBuilderProfile[]> {
  const data = await graphqlRequest<BuilderProfilesResponse>(
    GET_BUILDER_PROFILES_QUERY,
    { driveId },
    options,
  );
  return data?.BuilderProfile.getDocuments ?? [];
}

/**
 * Fetches a single builder profile by document ID
 */
export async function fetchBuilderProfileById(
  docId: string,
  driveId?: string,
): Promise<RemoteBuilderProfile | null> {
  const data = await graphqlRequest<SingleBuilderProfileResponse>(
    GET_BUILDER_PROFILE_QUERY,
    { docId, driveId },
  );
  return data?.BuilderProfile.getDocument ?? null;
}

/**
 * Fetches all builder profiles from all available remote drives.
 * This aggregates profiles from multiple drives into a single list.
 * Each profile includes the drive name it was fetched from.
 */
export async function fetchAllRemoteBuilderProfiles(): Promise<
  RemoteBuilderProfile[]
> {
  try {
    const drives = await fetchRemoteDrives();
    if (!drives.length) {
      return [];
    }

    // Fetch profiles from all drives in parallel (silent to avoid console spam)
    // Keep track of which drive each profile came from
    const profilePromises = drives.map(async (driveSlug) => {
      const profiles = await fetchBuilderProfilesFromDrive(driveSlug, {
        silent: true,
      }).catch(() => [] as RemoteBuilderProfile[]);
      // Attach drive name to each profile
      return profiles.map((profile) => ({
        ...profile,
        driveName: driveSlug,
      }));
    });

    const profileArrays = await Promise.all(profilePromises);

    // Flatten and dedupe by ID (keep first occurrence)
    const profileMap = new Map<string, RemoteBuilderProfile>();
    for (const profiles of profileArrays) {
      for (const profile of profiles) {
        if (!profileMap.has(profile.id)) {
          profileMap.set(profile.id, profile);
        }
      }
    }

    return Array.from(profileMap.values());
  } catch {
    return [];
  }
}

/**
 * Fetches multiple builder profiles by their IDs.
 * Tries to find them across all available remote drives.
 */
export async function fetchRemoteBuilderProfilesByIds(
  phids: string[],
): Promise<Map<string, RemoteBuilderProfile>> {
  if (!phids.length) {
    return new Map();
  }

  try {
    // First, get all profiles from all drives
    const allProfiles = await fetchAllRemoteBuilderProfiles();

    // Filter to only the ones we need
    const result = new Map<string, RemoteBuilderProfile>();
    for (const profile of allProfiles) {
      if (phids.includes(profile.id)) {
        result.set(profile.id, profile);
      }
    }

    // For any missing profiles, try direct fetch
    const missingPhids = phids.filter((phid) => !result.has(phid));
    if (missingPhids.length > 0) {
      const directFetches = missingPhids.map(async (phid) => {
        const profile = await fetchBuilderProfileById(phid);
        if (profile) {
          result.set(phid, profile);
        }
      });
      await Promise.all(directFetches);
    }

    return result;
  } catch {
    return new Map();
  }
}

// Mutation to set operational hub member on a builder profile
const SET_OP_HUB_MEMBER_MUTATION = `
  mutation BuilderProfile_setOpHubMember($driveId: String, $docId: PHID, $input: BuilderProfile_SetOpHubMemberInput) {
    BuilderProfile_setOpHubMember(driveId: $driveId, docId: $docId, input: $input)
  }
`;

export interface SetOpHubMemberInput {
  name: string | null;
  phid: string | null;
}

interface SetOpHubMemberResponse {
  BuilderProfile_setOpHubMember: boolean;
}

/**
 * Sets the operational hub member on a builder profile document.
 * This works for both local and remote documents via the Switchboard GraphQL API.
 *
 * @param docId - The builder profile document ID (PHID)
 * @param input - The operational hub member data (name and phid of the op hub)
 * @param driveId - Optional drive ID (can be null to let the server find the document)
 * @returns true if successful, false otherwise
 */
export async function setOpHubMemberOnBuilderProfile(
  docId: string,
  input: SetOpHubMemberInput,
  driveId?: string | null,
): Promise<boolean> {
  try {
    const data = await graphqlRequest<SetOpHubMemberResponse>(
      SET_OP_HUB_MEMBER_MUTATION,
      {
        driveId: driveId || null,
        docId,
        input,
      },
    );
    return data?.BuilderProfile_setOpHubMember ?? false;
  } catch (error) {
    console.warn("[graphql-client] Failed to set op hub member:", error);
    return false;
  }
}
