import { DocumentToolbar } from "@powerhousedao/design-system/connect";
import { generateId } from "document-model";
import {
  actions,
  useSelectedTimesheetDocument,
} from "document-models/timesheet";
import { useTimetrackingWorkspaceDocumentsInSelectedDrive } from "document-models/timetracking-workspace";
import { EntryList, type EntryPatch } from "./components/entry-list.js";
import { type StartValues, TimerBar } from "./components/timer-bar.js";
import { editorStyles } from "./styles.js";

export default function Editor() {
  const [document, dispatch] = useSelectedTimesheetDocument();
  const workspaces = useTimetrackingWorkspaceDocumentsInSelectedDrive();
  const projects = (workspaces?.[0]?.state.global.projects ?? []).filter(
    (p) => p.status === "ACTIVE",
  );

  const { running, entries } = document.state.global;

  const handleStart = (values: StartValues) => {
    dispatch(
      actions.startTimer({
        id: generateId(),
        description: values.description,
        projectId: values.projectId,
        start: new Date().toISOString(),
        billable: values.billable,
        tags: [],
      }),
    );
  };

  const handleStop = () => {
    dispatch(actions.stopTimer({ end: new Date().toISOString() }));
  };

  const handleDiscard = () => {
    dispatch(actions.discardTimer({}));
  };

  const handleUpdate = (id: string, patch: EntryPatch) => {
    dispatch(actions.updateEntry({ id, ...patch }));
  };

  const handleDelete = (id: string) => {
    dispatch(actions.deleteEntry({ id }));
  };

  const addManual = () => {
    const now = new Date();
    const start = new Date(now.getTime() - 30 * 60 * 1000);
    dispatch(
      actions.addEntry({
        id: generateId(),
        description: "(new entry)",
        projectId: null,
        start: start.toISOString(),
        end: now.toISOString(),
        billable: true,
        tags: [],
      }),
    );
  };

  return (
    <div className="tt-editor">
      <style>{editorStyles}</style>
      <DocumentToolbar />

      <div className="tt-editor__body">
        <TimerBar
          running={running ?? null}
          projects={projects}
          onStart={handleStart}
          onStop={handleStop}
          onDiscard={handleDiscard}
        />

        <div className="tt-editor__bar">
          <h2 className="tt-editor__title">Time entries</h2>
          <button
            type="button"
            className="tt-btn tt-btn--ghost"
            onClick={addManual}
          >
            + Add manually
          </button>
        </div>

        <EntryList
          entries={entries}
          projects={projects}
          onUpdate={handleUpdate}
          onDelete={handleDelete}
        />
      </div>
    </div>
  );
}
