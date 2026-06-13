import type {
  IProcessorHostModule,
  ProcessorApp,
  ProcessorFactoryBuilder,
  ProcessorFilter,
} from "@powerhousedao/reactor-browser";
import type { PHDocumentHeader } from "document-model";
import { TimetrackingRead } from "./processor.js";

export const timetrackingReadFactoryBuilder: ProcessorFactoryBuilder =
  (module: IProcessorHostModule) =>
  async (driveHeader: PHDocumentHeader, _processorApp?: ProcessorApp) => {
    // Create a namespace for the processor and the provided drive id
    const namespace = TimetrackingRead.getNamespace(driveHeader.id);

    // Create a namespaced db for the processor
    const store =
      await module.relationalDb.createNamespace<TimetrackingRead>(namespace);

    // Create a filter for the processor
    const filter: ProcessorFilter = {
      branch: ["main"],
      documentId: ["*"],
      documentType: [
        "powerhouse/timesheet",
        "powerhouse/timetracking-workspace",
      ],
      scope: ["global"],
    };

    // Create the processor. State is replayed from the start of history so the
    // relational projection is always complete.
    const processor = new TimetrackingRead(
      namespace,
      filter,
      store,
      driveHeader.id,
    );
    // Create the relational tables before the reactor starts feeding operations.
    await processor.initAndUpgrade();
    return [
      {
        processor,
        filter,
        startFrom: "beginning",
      },
    ];
  };
