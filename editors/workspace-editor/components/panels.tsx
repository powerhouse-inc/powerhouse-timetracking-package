import type {
  Client,
  Member,
  MemberRole,
  Project,
} from "document-models/timetracking-workspace";
import { useState } from "react";

const ROLES: MemberRole[] = ["ADMIN", "MANAGER", "MEMBER", "BILLING"];
const COLORS = [
  "#e57cd8",
  "#a855f7",
  "#6366f1",
  "#3b82f6",
  "#22c55e",
  "#eab308",
  "#f97316",
  "#ef4444",
];

const isActive = (s: string) => s === "ACTIVE";

/* ---------------- Projects ---------------- */

interface ProjectsPanelProps {
  projects: Project[];
  clients: Client[];
  onAdd: (p: {
    name: string;
    clientId: string | null;
    color: string;
    billable: boolean;
  }) => void;
  onUpdate: (
    id: string,
    patch: {
      name?: string;
      clientId?: string | null;
      color?: string;
      billable?: boolean;
    },
  ) => void;
  onArchive: (id: string) => void;
}

export function ProjectsPanel({
  projects,
  clients,
  onAdd,
  onUpdate,
  onArchive,
}: ProjectsPanelProps) {
  const [name, setName] = useState("");
  const [clientId, setClientId] = useState("");
  const [color, setColor] = useState(COLORS[0]);
  const clientName = (id: string | null | undefined) =>
    clients.find((c) => c.id === id)?.name ?? "—";

  return (
    <div>
      <form
        className="tt-add"
        onSubmit={(e) => {
          e.preventDefault();
          if (!name.trim()) return;
          onAdd({
            name: name.trim(),
            clientId: clientId || null,
            color,
            billable: true,
          });
          setName("");
          setClientId("");
        }}
      >
        <input
          className="tt-in"
          placeholder="New project name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <select
          className="tt-in"
          value={clientId}
          onChange={(e) => setClientId(e.target.value)}
        >
          <option value="">No client</option>
          {clients
            .filter((c) => isActive(c.status))
            .map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
        </select>
        <div className="tt-swatches">
          {COLORS.map((c) => (
            <button
              key={c}
              type="button"
              className={`tt-swatch ${c === color ? "is-on" : ""}`}
              style={{ background: c }}
              onClick={() => setColor(c)}
              aria-label={c}
            />
          ))}
        </div>
        <button className="tt-btn tt-btn--start" type="submit">
          Add project
        </button>
      </form>

      <table className="tt-table">
        <thead>
          <tr>
            <th>Project</th>
            <th>Client</th>
            <th>Billable</th>
            <th>Status</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {projects.map((p) => (
            <tr key={p.id} className={isActive(p.status) ? "" : "is-archived"}>
              <td>
                <span className="tt-dot" style={{ background: p.color }} />
                <input
                  className="tt-cellin"
                  defaultValue={p.name}
                  onBlur={(e) => {
                    const v = e.target.value.trim();
                    if (v && v !== p.name) onUpdate(p.id, { name: v });
                  }}
                />
              </td>
              <td>
                <select
                  className="tt-cellin"
                  value={p.clientId ?? ""}
                  onChange={(e) =>
                    onUpdate(p.id, { clientId: e.target.value || null })
                  }
                >
                  <option value="">No client</option>
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
                <span className="tt-hint">{clientName(p.clientId)}</span>
              </td>
              <td>
                <button
                  type="button"
                  className={`tt-pill ${p.billable ? "is-on" : ""}`}
                  onClick={() => onUpdate(p.id, { billable: !p.billable })}
                >
                  {p.billable ? "Billable" : "Non-billable"}
                </button>
              </td>
              <td>{p.status}</td>
              <td>
                {isActive(p.status) && (
                  <button
                    type="button"
                    className="tt-link"
                    onClick={() => onArchive(p.id)}
                  >
                    Archive
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ---------------- Clients ---------------- */

interface ClientsPanelProps {
  clients: Client[];
  onAdd: (name: string) => void;
  onUpdate: (id: string, name: string) => void;
  onArchive: (id: string) => void;
}

export function ClientsPanel({
  clients,
  onAdd,
  onUpdate,
  onArchive,
}: ClientsPanelProps) {
  const [name, setName] = useState("");
  return (
    <div>
      <form
        className="tt-add"
        onSubmit={(e) => {
          e.preventDefault();
          if (!name.trim()) return;
          onAdd(name.trim());
          setName("");
        }}
      >
        <input
          className="tt-in"
          placeholder="New client name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <button className="tt-btn tt-btn--start" type="submit">
          Add client
        </button>
      </form>
      <table className="tt-table">
        <thead>
          <tr>
            <th>Client</th>
            <th>Status</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {clients.map((c) => (
            <tr key={c.id} className={isActive(c.status) ? "" : "is-archived"}>
              <td>
                <input
                  className="tt-cellin"
                  defaultValue={c.name}
                  onBlur={(e) => {
                    const v = e.target.value.trim();
                    if (v && v !== c.name) onUpdate(c.id, v);
                  }}
                />
              </td>
              <td>{c.status}</td>
              <td>
                {isActive(c.status) && (
                  <button
                    type="button"
                    className="tt-link"
                    onClick={() => onArchive(c.id)}
                  >
                    Archive
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ---------------- Members ---------------- */

interface MembersPanelProps {
  members: Member[];
  onAdd: (m: {
    name: string;
    address: string | null;
    role: MemberRole;
  }) => void;
  onSetRole: (id: string, role: MemberRole) => void;
  onArchive: (id: string) => void;
}

export function MembersPanel({
  members,
  onAdd,
  onSetRole,
  onArchive,
}: MembersPanelProps) {
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [role, setRole] = useState<MemberRole>("MEMBER");
  return (
    <div>
      <form
        className="tt-add"
        onSubmit={(e) => {
          e.preventDefault();
          if (!name.trim()) return;
          onAdd({ name: name.trim(), address: address.trim() || null, role });
          setName("");
          setAddress("");
        }}
      >
        <input
          className="tt-in"
          placeholder="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <input
          className="tt-in"
          placeholder="0x address (optional)"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
        />
        <select
          className="tt-in"
          value={role}
          onChange={(e) => setRole(e.target.value as MemberRole)}
        >
          {ROLES.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
        <button className="tt-btn tt-btn--start" type="submit">
          Invite member
        </button>
      </form>
      <table className="tt-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Address</th>
            <th>Access</th>
            <th>Status</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {members.map((m) => (
            <tr
              key={m.id}
              className={m.status === "ARCHIVED" ? "is-archived" : ""}
            >
              <td>
                <span
                  className="tt-avatar"
                  style={{ background: avatarGradient(m.name) }}
                >
                  {m.name.slice(0, 1).toUpperCase()}
                </span>
                {m.name}
              </td>
              <td className="tt-mono">{m.address ?? "—"}</td>
              <td>
                <select
                  className="tt-cellin"
                  value={m.role}
                  onChange={(e) =>
                    onSetRole(m.id, e.target.value as MemberRole)
                  }
                >
                  {ROLES.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </td>
              <td>
                <span
                  className={`tt-status tt-status--${m.status.toLowerCase()}`}
                >
                  {m.status}
                </span>
              </td>
              <td>
                {m.status !== "ARCHIVED" && (
                  <button
                    type="button"
                    className="tt-link"
                    onClick={() => onArchive(m.id)}
                  >
                    Archive
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function avatarGradient(seed: string): string {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) % 360;
  return `linear-gradient(135deg, hsl(${h},75%,60%), hsl(${(h + 40) % 360},75%,55%))`;
}
