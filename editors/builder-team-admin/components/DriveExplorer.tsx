import type { EditorProps } from "document-model";
import { setName } from "document-model";
import { FolderTree, type CustomView } from "./FolderTree.js";
import { DriveContents } from "./DriveContents.js";
import { ContributorsSection } from "./team-members.js";
import {
  useDocumentsInSelectedDrive,
  useSelectedDrive,
  addDocument,
  dispatchActions,
  setSelectedNode,
} from "@powerhousedao/reactor-browser";
import { useCallback, useMemo, useState } from "react";
import { isValidName } from "document-drive";
import { ExpenseReports } from "./expense-reports.js";
import { SnapshotReports } from "./snapshot-reports.js";
import { ResourcesServices } from "./ResourcesServices.js";
import { ServiceSubscriptions } from "./service-subscriptions.js";
import { actions as builderProfileActions } from "@powerhousedao/builder-profile/document-models/builder-profile";

function generateCode(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);

  if (words.length >= 2) {
    // Acronym from first letter of each word, capped at 5
    let code = words.map((w) => w[0]).join("");
    // If only 2 words, pad with second letter of the first word
    if (code.length < 3 && words[0].length > 1) {
      code = words[0][0] + words[0][1] + words[1][0];
    }
    return code.slice(0, 5).toUpperCase();
  }

  // Single word: first, middle, last letter
  const word = words[0];
  const mid = Math.floor(word.length / 2);
  return (word[0] + word[mid] + word[word.length - 1]).toUpperCase();
}

/**
 * Main drive explorer component with sidebar navigation and content area.
 * Layout: Left sidebar (folder tree) + Right content area (files/folders + document editor)
 */
export function DriveExplorer({ children }: EditorProps) {
  // if a document is selected then it's editor will be passed as children
  const showDocumentEditor = !!children;
  const documentsInSelectedDrive = useDocumentsInSelectedDrive();
  const [customView, setCustomView] = useState<CustomView>(null);
  const [profileName, setProfileName] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [selectedDrive] = useSelectedDrive();

  // Check if builder profile document exists
  const hasBuilderProfile = useMemo(() => {
    if (!documentsInSelectedDrive) return false;
    return documentsInSelectedDrive.some(
      (doc) => doc.header.documentType === "powerhouse/builder-profile",
    );
  }, [documentsInSelectedDrive]);

  const handleCreateProfile = useCallback(async () => {
    const trimmedName = profileName.trim();
    const driveId = selectedDrive?.header.id;

    if (!trimmedName || !driveId || isCreating) return;

    setIsCreating(true);

    try {
      const createdNode = await addDocument(
        driveId,
        trimmedName,
        "powerhouse/builder-profile",
      );

      if (!createdNode?.id) {
        console.error("Failed to create builder profile document");
        return;
      }

      // Set the profile name, slug, and code in the document state
      const slug = trimmedName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");
      const code = generateCode(trimmedName);
      await dispatchActions(
        builderProfileActions.updateProfile({ name: trimmedName, slug, code }),
        createdNode.id,
      );

      // Set the document name to match
      await dispatchActions(setName(trimmedName), createdNode.id);

      // Deselect so the main drive view renders instead of the document editor
      setSelectedNode("");
    } catch (error) {
      console.error("Error creating builder profile:", error);
    } finally {
      setIsCreating(false);
    }
  }, [profileName, selectedDrive?.header.id, isCreating]);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (isValidName(profileName) && !isCreating) {
        void handleCreateProfile();
      }
    },
    [profileName, isCreating, handleCreateProfile],
  );

  // If no builder profile exists, show the creation form
  if (!hasBuilderProfile) {
    const isValid = isValidName(profileName);

    return (
      <div className="flex h-full items-center justify-center px-4 py-12">
        <div className="relative w-full max-w-2xl overflow-hidden rounded-2xl border border-slate-200/50 bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/40 p-12 shadow-xl shadow-slate-200/50 backdrop-blur-sm">
          {/* Decorative background elements */}
          <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-gradient-to-br from-blue-400/20 to-indigo-400/20 blur-3xl" />
          <div className="absolute -bottom-16 -left-16 h-48 w-48 rounded-full bg-gradient-to-br from-indigo-300/20 to-purple-300/20 blur-2xl" />

          {/* Content */}
          <div className="relative z-10 text-center">
            <div className="mb-6 inline-flex items-center justify-center rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 p-3 shadow-lg shadow-blue-500/30">
              <svg
                className="h-8 w-8 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
            </div>

            <h2 className="mb-4 text-3xl font-bold tracking-tight text-slate-900">
              Create your Builder Team Profile
            </h2>

            <p className="mb-8 text-lg leading-relaxed text-slate-600">
              Get started by creating your builder profile to manage your team,
              services, and build your presence in the Achra ecosystem.
            </p>

            <form onSubmit={handleSubmit} className="mx-auto max-w-md">
              {!isValid && profileName && (
                <div className="mb-2 text-sm text-red-500">
                  Document name must be valid URL characters.
                </div>
              )}
              <input
                type="text"
                value={profileName}
                onChange={(e) => setProfileName(e.target.value)}
                placeholder="Builder Profile name"
                maxLength={100}
                disabled={isCreating}
                className="mb-6 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-base text-slate-900 placeholder-slate-400 shadow-sm outline-none transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 disabled:opacity-50"
              />

              <button
                type="submit"
                disabled={!isValid || isCreating}
                className="group relative w-full overflow-hidden rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-8 py-4 text-base font-semibold text-white shadow-lg shadow-blue-500/40 transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-blue-500/50 active:scale-100 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100 disabled:hover:shadow-lg"
              >
                <span className="relative z-10 flex items-center justify-center gap-2">
                  <span>
                    {isCreating ? "Creating..." : "Create Builder Profile"}
                  </span>
                  {!isCreating && (
                    <svg
                      className="h-5 w-5 transition-transform duration-300 group-hover:translate-x-1"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M13 7l5 5m0 0l-5 5m5-5H6"
                      />
                    </svg>
                  )}
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-blue-700 to-indigo-700 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // Render the appropriate content based on state
  const renderContent = () => {
    // Document editor takes priority
    if (showDocumentEditor) {
      return children;
    }

    // Custom views
    if (customView === "team-members") {
      return <ContributorsSection />;
    }

    if (customView === "service-subscriptions") {
      return <ServiceSubscriptions />;
    }

    if (customView === "expense-reports") {
      return <ExpenseReports />;
    }

    if (customView === "snapshot-reports") {
      return <SnapshotReports />;
    }

    if (customView === "resources-services") {
      return <ResourcesServices />;
    }

    // Default: folder contents
    return <DriveContents />;
  };

  // Normal layout when builder profile exists
  return (
    <div className="flex h-full">
      <FolderTree onCustomViewChange={setCustomView} />
      <div className="flex-1 overflow-y-auto p-4">{renderContent()}</div>
    </div>
  );
}
