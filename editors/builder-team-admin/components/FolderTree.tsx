import {
  Sidebar,
  SidebarProvider,
  type SidebarNode,
} from "@powerhousedao/document-engineering";
import {
  setSelectedNode,
  showCreateDocumentModal,
  useDocumentsInSelectedDrive,
  useSelectedDrive,
  isFolderNodeKind,
  isFileNodeKind,
} from "@powerhousedao/reactor-browser";
import type { Node, FolderNode, FileNode } from "document-drive";
import type { BuilderProfileState } from "@powerhousedao/builder-profile/document-models/builder-profile";
import {
  CreditCard,
  FileText,
  User,
  Users,
  Folder,
  Camera,
  Layers,
} from "lucide-react";
import { useMemo, useState } from "react";

const ICON_SIZE = 16;
const EXPENSE_REPORTS_FOLDER_NAME = "Expense Reports";
const SNAPSHOT_REPORTS_FOLDER_NAME = "Snapshot Reports";
const SERVICE_SUBSCRIPTIONS_FOLDER_NAME = "Service Subscriptions";
const SERVICES_AND_OFFERINGS_FOLDER_NAME = "Services And Offerings";
const RESOURCE_TEMPLATES_FOLDER_NAME = "Products";
const SERVICE_OFFERINGS_FOLDER_NAME = "Service Offerings";

/** Custom view types that don't correspond to document models */
export type CustomView =
  | "team-members"
  | "expense-reports"
  | "snapshot-reports"
  | "resources-services"
  | "service-subscriptions"
  | null;

/**
 * Maps navigation section IDs to their corresponding document types.
 * When a section is clicked, the corresponding document type will be created or navigated to.
 * A null value indicates the section uses a custom view instead.
 */
const SECTION_TO_DOCUMENT_TYPE: Record<string, string | null> = {
  "builder-profile": "powerhouse/builder-profile",
  "team-members": null, // Uses custom TeamMembers component
  "service-subscriptions": null, // Uses custom ServiceSubscriptions component
  "resources-services": null, // Uses custom ResourcesServices component
  "expense-reports": null, // Uses custom ExpenseReports component
  "snapshot-reports": null, // Uses custom SnapshotReports component
};

/**
 * Maps navigation section IDs to custom view identifiers.
 */
const SECTION_TO_CUSTOM_VIEW: Record<string, CustomView> = {
  "team-members": "team-members",
  "service-subscriptions": "service-subscriptions",
  "resources-services": "resources-services",
  "expense-reports": "expense-reports",
  "snapshot-reports": "snapshot-reports",
};

/**
 * Base navigation sections for the Builder Team Admin drive.
 * The expense-reports and snapshot-reports sections will have dynamic children added based on folder contents.
 */
const BASE_NAVIGATION_SECTIONS: SidebarNode[] = [
  {
    id: "builder-profile",
    title: "Builder Profile",
    icon: <User size={ICON_SIZE} />,
  },
  {
    id: "team-members",
    title: "Team Members",
    icon: <Users size={ICON_SIZE} />,
  },
  {
    id: "service-subscriptions",
    title: "Service Subscriptions",
    icon: <CreditCard size={ICON_SIZE} />,
  },
  {
    id: "resources-services",
    title: "Service Offerings",
    icon: <Layers size={ICON_SIZE} />,
  },
  {
    id: "expense-reports",
    title: "Expense Reports",
    icon: <FileText size={ICON_SIZE} />,
  },
  {
    id: "snapshot-reports",
    title: "Snapshot Reports",
    icon: <Camera size={ICON_SIZE} />,
  },
];

/**
 * Recursively builds SidebarNode children from folder contents.
 * Folders get folder icons, files get document icons.
 */
function buildSidebarNodesFromFolder(
  parentId: string,
  allNodes: Node[],
): SidebarNode[] {
  // Find all nodes that are direct children of the parent folder
  const childNodes = allNodes.filter((node) => {
    if (isFolderNodeKind(node)) {
      return node.parentFolder === parentId;
    }
    if (isFileNodeKind(node)) {
      return (node as FileNode).parentFolder === parentId;
    }
    return false;
  });

  return childNodes.map((node) => {
    const isFolder = isFolderNodeKind(node);
    const sidebarNode: SidebarNode = {
      id: node.id,
      title: node.name,
      icon: isFolder ? (
        <Folder size={ICON_SIZE} />
      ) : (
        <FileText size={ICON_SIZE} />
      ),
    };

    // Recursively add children for folders
    if (isFolder) {
      const children = buildSidebarNodesFromFolder(node.id, allNodes);
      if (children.length > 0) {
        sidebarNode.children = children;
      }
    }

    return sidebarNode;
  });
}

type FolderTreeProps = {
  onCustomViewChange?: (view: CustomView) => void;
};

/**
 * Sidebar navigation component with hardcoded navigation sections.
 * Displays Builder Profile, Team Members, Service Subscriptions, and Expense Reports.
 * Clicking a section navigates to an existing document or creates one if none exists.
 * The Expense Reports section dynamically shows folder contents as child nodes.
 */
export function FolderTree({ onCustomViewChange }: FolderTreeProps) {
  const [activeNodeId, setActiveNodeId] = useState<string>(
    BASE_NAVIGATION_SECTIONS[0].id,
  );

  const documentsInDrive = useDocumentsInSelectedDrive();
  const [driveDocument] = useSelectedDrive();

  // Find the "Expense Reports" folder in the drive
  const expenseReportsFolder = useMemo(() => {
    if (!driveDocument) return null;
    const nodes = driveDocument.state.global.nodes;
    return nodes.find(
      (node: Node): node is FolderNode =>
        isFolderNodeKind(node) && node.name === EXPENSE_REPORTS_FOLDER_NAME,
    );
  }, [driveDocument]);

  // Find the "Snapshot Reports" folder in the drive
  const snapshotReportsFolder = useMemo(() => {
    if (!driveDocument) return null;
    const nodes = driveDocument.state.global.nodes;
    return nodes.find(
      (node: Node): node is FolderNode =>
        isFolderNodeKind(node) && node.name === SNAPSHOT_REPORTS_FOLDER_NAME,
    );
  }, [driveDocument]);

  // Find the "Service Subscriptions" folder in the drive
  const serviceSubscriptionsFolder = useMemo(() => {
    if (!driveDocument) return null;
    const nodes = driveDocument.state.global.nodes;
    return nodes.find(
      (node: Node): node is FolderNode =>
        isFolderNodeKind(node) &&
        node.name === SERVICE_SUBSCRIPTIONS_FOLDER_NAME,
    );
  }, [driveDocument]);

  // Find the "Services And Offerings" parent folder in the drive (at root level)
  const servicesAndOfferingsFolder = useMemo(() => {
    if (!driveDocument) return null;
    const nodes = driveDocument.state.global.nodes;
    return nodes.find(
      (node: Node): node is FolderNode =>
        isFolderNodeKind(node) &&
        node.name === SERVICES_AND_OFFERINGS_FOLDER_NAME &&
        !node.parentFolder,
    );
  }, [driveDocument]);

  // Find the "Products" folder (inside Services And Offerings folder)
  const resourceTemplatesFolder = useMemo(() => {
    if (!driveDocument || !servicesAndOfferingsFolder) return null;
    const nodes = driveDocument.state.global.nodes;
    return nodes.find(
      (node: Node): node is FolderNode =>
        isFolderNodeKind(node) &&
        node.name === RESOURCE_TEMPLATES_FOLDER_NAME &&
        node.parentFolder === servicesAndOfferingsFolder.id,
    );
  }, [driveDocument, servicesAndOfferingsFolder]);

  // Find the "Service Offerings" folder (inside Services And Offerings folder)
  const serviceOfferingsFolder = useMemo(() => {
    if (!driveDocument || !servicesAndOfferingsFolder) return null;
    const nodes = driveDocument.state.global.nodes;
    return nodes.find(
      (node: Node): node is FolderNode =>
        isFolderNodeKind(node) &&
        node.name === SERVICE_OFFERINGS_FOLDER_NAME &&
        node.parentFolder === servicesAndOfferingsFolder.id,
    );
  }, [driveDocument, servicesAndOfferingsFolder]);

  // Build a set of all node IDs that are within the Expense Reports folder tree
  const expenseReportsNodeIds = useMemo(() => {
    const nodeIds = new Set<string>();
    if (!expenseReportsFolder || !driveDocument) return nodeIds;

    const allNodes = driveDocument.state.global.nodes;

    // Recursively collect all node IDs within the Expense Reports folder
    const collectNodeIds = (parentId: string) => {
      nodeIds.add(parentId);
      for (const node of allNodes) {
        if (isFolderNodeKind(node) && node.parentFolder === parentId) {
          collectNodeIds(node.id);
        } else if (isFileNodeKind(node) && node.parentFolder === parentId) {
          nodeIds.add(node.id);
        }
      }
    };

    collectNodeIds(expenseReportsFolder.id);
    return nodeIds;
  }, [expenseReportsFolder, driveDocument]);

  // Build a set of all node IDs that are within the Snapshot Reports folder tree
  const snapshotReportsNodeIds = useMemo(() => {
    const nodeIds = new Set<string>();
    if (!snapshotReportsFolder || !driveDocument) return nodeIds;

    const allNodes = driveDocument.state.global.nodes;

    // Recursively collect all node IDs within the Snapshot Reports folder
    const collectNodeIds = (parentId: string) => {
      nodeIds.add(parentId);
      for (const node of allNodes) {
        if (isFolderNodeKind(node) && node.parentFolder === parentId) {
          collectNodeIds(node.id);
        } else if (isFileNodeKind(node) && node.parentFolder === parentId) {
          nodeIds.add(node.id);
        }
      }
    };

    collectNodeIds(snapshotReportsFolder.id);
    return nodeIds;
  }, [snapshotReportsFolder, driveDocument]);

  // Build a set of all node IDs that are within the Service Subscriptions folder tree
  const serviceSubscriptionsNodeIds = useMemo(() => {
    const nodeIds = new Set<string>();
    if (!serviceSubscriptionsFolder || !driveDocument) return nodeIds;

    const allNodes = driveDocument.state.global.nodes;

    // Recursively collect all node IDs within the Service Subscriptions folder
    const collectNodeIds = (parentId: string) => {
      nodeIds.add(parentId);
      for (const node of allNodes) {
        if (isFolderNodeKind(node) && node.parentFolder === parentId) {
          collectNodeIds(node.id);
        } else if (isFileNodeKind(node) && node.parentFolder === parentId) {
          nodeIds.add(node.id);
        }
      }
    };

    collectNodeIds(serviceSubscriptionsFolder.id);
    return nodeIds;
  }, [serviceSubscriptionsFolder, driveDocument]);

  // Build a set of all node IDs that are within the Resource Templates folder tree
  const resourceTemplatesNodeIds = useMemo(() => {
    const nodeIds = new Set<string>();
    if (!resourceTemplatesFolder || !driveDocument) return nodeIds;

    const allNodes = driveDocument.state.global.nodes;

    const collectNodeIds = (parentId: string) => {
      nodeIds.add(parentId);
      for (const node of allNodes) {
        if (isFolderNodeKind(node) && node.parentFolder === parentId) {
          collectNodeIds(node.id);
        } else if (isFileNodeKind(node) && node.parentFolder === parentId) {
          nodeIds.add(node.id);
        }
      }
    };

    collectNodeIds(resourceTemplatesFolder.id);
    return nodeIds;
  }, [resourceTemplatesFolder, driveDocument]);

  // Build a set of all node IDs that are within the Service Offerings folder tree
  const serviceOfferingsNodeIds = useMemo(() => {
    const nodeIds = new Set<string>();
    if (!serviceOfferingsFolder || !driveDocument) return nodeIds;

    const allNodes = driveDocument.state.global.nodes;

    const collectNodeIds = (parentId: string) => {
      nodeIds.add(parentId);
      for (const node of allNodes) {
        if (isFolderNodeKind(node) && node.parentFolder === parentId) {
          collectNodeIds(node.id);
        } else if (isFileNodeKind(node) && node.parentFolder === parentId) {
          nodeIds.add(node.id);
        }
      }
    };

    collectNodeIds(serviceOfferingsFolder.id);
    return nodeIds;
  }, [serviceOfferingsFolder, driveDocument]);

  // Find the builder profile document and get its state
  const builderProfileDocument = useMemo(() => {
    if (!documentsInDrive) return null;
    return documentsInDrive.find(
      (doc) => doc.header.documentType === "powerhouse/builder-profile",
    );
  }, [documentsInDrive]);

  // Check if builder profile document exists - don't show sidebar if it doesn't
  const hasBuilderProfile = builderProfileDocument !== null;

  // Get the isOperator flag from the builder profile state
  const isOperator = useMemo(() => {
    if (!builderProfileDocument) return false;
    const state = (
      builderProfileDocument.state as unknown as { global: BuilderProfileState }
    )?.global;
    return state?.isOperator ?? false;
  }, [builderProfileDocument]);

  // Build navigation sections with dynamic expense reports, snapshot reports, and resources & services children
  const navigationSections = useMemo(() => {
    if (!driveDocument) {
      return BASE_NAVIGATION_SECTIONS;
    }

    const allNodes = driveDocument.state.global.nodes;

    // Build expense reports children
    const expenseReportsChildren = expenseReportsFolder
      ? buildSidebarNodesFromFolder(expenseReportsFolder.id, allNodes)
      : [];

    // Build snapshot reports children
    const snapshotReportsChildren = snapshotReportsFolder
      ? buildSidebarNodesFromFolder(snapshotReportsFolder.id, allNodes)
      : [];

    // Build resources & services children (Resource Templates and Service Offerings folders)
    const resourcesServicesChildren: SidebarNode[] = [];
    if (resourceTemplatesFolder) {
      const resourceTemplatesChildren = buildSidebarNodesFromFolder(
        resourceTemplatesFolder.id,
        allNodes,
      );
      resourcesServicesChildren.push({
        id: resourceTemplatesFolder.id,
        title: RESOURCE_TEMPLATES_FOLDER_NAME,
        icon: <Folder size={ICON_SIZE} />,
        children:
          resourceTemplatesChildren.length > 0
            ? resourceTemplatesChildren
            : undefined,
      });
    }
    if (serviceOfferingsFolder) {
      const serviceOfferingsChildren = buildSidebarNodesFromFolder(
        serviceOfferingsFolder.id,
        allNodes,
      );
      resourcesServicesChildren.push({
        id: serviceOfferingsFolder.id,
        title: SERVICE_OFFERINGS_FOLDER_NAME,
        icon: <Folder size={ICON_SIZE} />,
        children:
          serviceOfferingsChildren.length > 0
            ? serviceOfferingsChildren
            : undefined,
      });
    }

    // Filter and transform the sections based on isOperator flag
    return (
      BASE_NAVIGATION_SECTIONS
        // Hide "Resources & Services" when isOperator is false
        .filter((section) => {
          if (section.id === "resources-services" && !isOperator) {
            return false;
          }
          return true;
        })
        // Transform sections with dynamic content
        .map((section) => {
          // Change "Builder Profile" to "Operator Profile" when isOperator is true
          if (section.id === "builder-profile" && isOperator) {
            return {
              ...section,
              title: "Operator Profile",
            };
          }
          if (
            section.id === "resources-services" &&
            resourcesServicesChildren.length > 0
          ) {
            return {
              ...section,
              children: resourcesServicesChildren,
            };
          }
          if (
            section.id === "expense-reports" &&
            expenseReportsChildren.length > 0
          ) {
            return {
              ...section,
              children: expenseReportsChildren,
            };
          }
          if (
            section.id === "snapshot-reports" &&
            snapshotReportsChildren.length > 0
          ) {
            return {
              ...section,
              children: snapshotReportsChildren,
            };
          }
          return section;
        })
    );
  }, [
    expenseReportsFolder,
    snapshotReportsFolder,
    resourceTemplatesFolder,
    serviceOfferingsFolder,
    driveDocument,
    isOperator,
  ]);

  // Create a map of document type to existing document (first one found)
  const existingDocumentsByType = useMemo(() => {
    const map: Record<string, string | undefined> = {};
    if (!documentsInDrive) return map;

    for (const doc of documentsInDrive) {
      const docType = doc.header.documentType;
      // Only store the first document of each type (singleton pattern)
      if (!map[docType]) {
        map[docType] = doc.header.id;
      }
    }
    return map;
  }, [documentsInDrive]);

  // Don't render if no builder profile exists
  if (!hasBuilderProfile) {
    return null;
  }

  const handleActiveNodeChange = (node: SidebarNode) => {
    setActiveNodeId(node.id);

    // Check if this is a child node within the Expense Reports folder
    if (expenseReportsNodeIds.has(node.id)) {
      // Check if it's a folder or a document
      const driveNode = driveDocument?.state.global.nodes.find(
        (n: Node) => n.id === node.id,
      );

      if (driveNode && isFolderNodeKind(driveNode)) {
        // It's a folder - navigate to it within the expense reports view
        onCustomViewChange?.("expense-reports");
        setSelectedNode(node.id);
      } else if (driveNode && isFileNodeKind(driveNode)) {
        // It's a document - open the document editor
        onCustomViewChange?.(null);
        setSelectedNode(node.id);
      }
      return;
    }

    // Check if this is a child node within the Snapshot Reports folder
    if (snapshotReportsNodeIds.has(node.id)) {
      // Check if it's a folder or a document
      const driveNode = driveDocument?.state.global.nodes.find(
        (n: Node) => n.id === node.id,
      );

      if (driveNode && isFolderNodeKind(driveNode)) {
        // It's a folder - navigate to it within the snapshot reports view
        onCustomViewChange?.("snapshot-reports");
        setSelectedNode(node.id);
      } else if (driveNode && isFileNodeKind(driveNode)) {
        // It's a document - open the document editor
        onCustomViewChange?.(null);
        setSelectedNode(node.id);
      }
      return;
    }

    // Check if this is a child node within the Service Subscriptions folder
    if (serviceSubscriptionsNodeIds.has(node.id)) {
      // Check if it's a folder or a document
      const driveNode = driveDocument?.state.global.nodes.find(
        (n: Node) => n.id === node.id,
      );

      if (driveNode && isFolderNodeKind(driveNode)) {
        // It's a folder - navigate to it within the service subscriptions view
        onCustomViewChange?.("service-subscriptions");
        setSelectedNode(node.id);
      } else if (driveNode && isFileNodeKind(driveNode)) {
        // It's a document - open the document editor
        onCustomViewChange?.(null);
        setSelectedNode(node.id);
      }
      return;
    }

    // Check if this is a child node within the Resource Templates folder
    if (resourceTemplatesNodeIds.has(node.id)) {
      const driveNode = driveDocument?.state.global.nodes.find(
        (n: Node) => n.id === node.id,
      );

      if (driveNode && isFolderNodeKind(driveNode)) {
        // It's a folder - navigate to it within the resources & services view
        onCustomViewChange?.("resources-services");
        setSelectedNode(node.id);
      } else if (driveNode && isFileNodeKind(driveNode)) {
        // It's a document - open the document editor
        onCustomViewChange?.(null);
        setSelectedNode(node.id);
      }
      return;
    }

    // Check if this is a child node within the Service Offerings folder
    if (serviceOfferingsNodeIds.has(node.id)) {
      const driveNode = driveDocument?.state.global.nodes.find(
        (n: Node) => n.id === node.id,
      );

      if (driveNode && isFolderNodeKind(driveNode)) {
        // It's a folder - navigate to it within the resources & services view
        onCustomViewChange?.("resources-services");
        setSelectedNode(node.id);
      } else if (driveNode && isFileNodeKind(driveNode)) {
        // It's a document - open the document editor
        onCustomViewChange?.(null);
        setSelectedNode(node.id);
      }
      return;
    }

    // Check if this section has a custom view
    const customView = SECTION_TO_CUSTOM_VIEW[node.id];
    if (customView) {
      onCustomViewChange?.(customView);
      setSelectedNode(""); // Deselect any document so custom view can render
      return;
    }

    // Clear custom view when navigating to a document
    onCustomViewChange?.(null);

    const documentType = SECTION_TO_DOCUMENT_TYPE[node.id];
    if (!documentType) return;

    const existingDocId = existingDocumentsByType[documentType];
    if (existingDocId) {
      // Navigate to the existing document
      setSelectedNode(existingDocId);
    } else {
      // Clear selected node to create document at drive root, not in current folder
      setSelectedNode("");
      showCreateDocumentModal(documentType);
    }
  };

  return (
    <SidebarProvider nodes={navigationSections}>
      <Sidebar
        className="pt-1"
        nodes={navigationSections}
        activeNodeId={activeNodeId}
        onActiveNodeChange={handleActiveNodeChange}
        sidebarTitle={isOperator ? "Operator Team Admin" : "Builder Team Admin"}
        showSearchBar={false}
        resizable={true}
        allowPinning={false}
        showStatusFilter={false}
        initialWidth={256}
        defaultLevel={2}
        handleOnTitleClick={() => {
          onCustomViewChange?.(null);
          setSelectedNode("");
        }}
      />
    </SidebarProvider>
  );
}
