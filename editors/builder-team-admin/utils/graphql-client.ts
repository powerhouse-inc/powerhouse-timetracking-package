/**
 * Re-export from shared location for backwards compatibility.
 * @see editors/shared/graphql-client.ts
 */
export {
  fetchRemoteDrives,
  fetchDriveIdBySlug,
  fetchBuilderProfilesFromDrive,
  fetchBuilderProfileById,
  fetchAllRemoteBuilderProfiles,
  fetchRemoteBuilderProfilesByIds,
  type RemoteBuilderProfile,
} from "../../shared/graphql-client.js";
