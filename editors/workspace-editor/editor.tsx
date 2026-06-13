import { DocumentToolbar } from "@powerhousedao/design-system/connect";
import { generateId } from "document-model";
import {
  actions,
  type MemberRole,
  useSelectedTimetrackingWorkspaceDocument,
} from "document-models/timetracking-workspace";
import { useState } from "react";
import {
  ClientsPanel,
  MembersPanel,
  ProjectsPanel,
} from "./components/panels.js";
import { editorStyles } from "./styles.js";

type Tab = "projects" | "clients" | "members";

export default function Editor() {
  const [document, dispatch] = useSelectedTimetrackingWorkspaceDocument();
  const [tab, setTab] = useState<Tab>("projects");
  const { name, projects, clients, members } = document.state.global;

  return (
    <div className="tt-ws">
      <style>{editorStyles}</style>
      <DocumentToolbar />

      <div className="tt-ws__body">
        <input
          className="tt-ws__name"
          defaultValue={name}
          placeholder="Workspace name"
          onBlur={(e) => {
            const v = e.target.value.trim();
            if (v && v !== name)
              dispatch(actions.setWorkspaceName({ name: v }));
          }}
        />

        <div className="tt-tabs">
          {(["projects", "clients", "members"] as Tab[]).map((t) => (
            <button
              key={t}
              type="button"
              className={`tt-tab ${tab === t ? "is-on" : ""}`}
              onClick={() => setTab(t)}
            >
              {t[0].toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>

        {tab === "projects" && (
          <ProjectsPanel
            projects={projects}
            clients={clients}
            onAdd={(p) =>
              dispatch(actions.addProject({ id: generateId(), ...p }))
            }
            onUpdate={(id, patch) =>
              dispatch(actions.updateProject({ id, ...patch }))
            }
            onArchive={(id) => dispatch(actions.archiveProject({ id }))}
          />
        )}

        {tab === "clients" && (
          <ClientsPanel
            clients={clients}
            onAdd={(name) =>
              dispatch(actions.addClient({ id: generateId(), name }))
            }
            onUpdate={(id, name) =>
              dispatch(actions.updateClient({ id, name }))
            }
            onArchive={(id) => dispatch(actions.archiveClient({ id }))}
          />
        )}

        {tab === "members" && (
          <MembersPanel
            members={members}
            onAdd={(m) =>
              dispatch(
                actions.addMember({
                  id: generateId(),
                  name: m.name,
                  address: m.address,
                  role: m.role,
                }),
              )
            }
            onSetRole={(id, role: MemberRole) =>
              dispatch(actions.setMemberRole({ id, role }))
            }
            onArchive={(id) => dispatch(actions.archiveMember({ id }))}
          />
        )}
      </div>
    </div>
  );
}
