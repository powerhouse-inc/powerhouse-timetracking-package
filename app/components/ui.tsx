import type { ReactNode } from "react";

/** Toggl-style gradient circular avatar derived from a seed string. */
export function Avatar({
  seed,
  size = 28,
}: {
  seed: string;
  size?: number;
}) {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) % 360;
  const bg = `linear-gradient(135deg, hsl(${h},78%,62%), hsl(${(h + 48) % 360},80%,56%))`;
  return (
    <span
      className="inline-flex flex-none items-center justify-center rounded-full font-bold text-ink-950"
      style={{ width: size, height: size, background: bg, fontSize: size * 0.42 }}
    >
      {seed.slice(0, 1).toUpperCase()}
    </span>
  );
}

const ROLE_STYLES: Record<string, string> = {
  ADMIN: "bg-magenta/15 text-magenta",
  MANAGER: "bg-indigo-400/15 text-indigo-300",
  BILLING: "bg-amber-400/15 text-amber-300",
  MEMBER: "bg-ink-600 text-mist-300",
};

export function RoleBadge({ role }: { role: string }) {
  return (
    <span className={`tt-chip ${ROLE_STYLES[role] ?? ROLE_STYLES.MEMBER}`}>
      {role}
    </span>
  );
}

const STATUS_STYLES: Record<string, string> = {
  ACTIVE: "bg-emerald-400/15 text-emerald-300",
  INVITED: "bg-amber-400/15 text-amber-300",
  ARCHIVED: "bg-ink-600 text-mist-400",
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`tt-chip ${STATUS_STYLES[status] ?? STATUS_STYLES.ARCHIVED}`}>
      {status[0] + status.slice(1).toLowerCase()}
    </span>
  );
}

export function PageHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-x-4 gap-y-3 md:mb-8">
      <div className="min-w-0">
        <h1 className="text-xl font-extrabold tracking-tight text-mist-100 md:text-2xl">
          {title}
        </h1>
        {subtitle && <p className="mt-1 text-sm text-mist-400">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function EmptyState({ children }: { children: ReactNode }) {
  return (
    <div className="tt-card flex flex-col items-center gap-2 px-6 py-16 text-center text-mist-400">
      {children}
    </div>
  );
}

export function Dot({ color }: { color: string }) {
  return (
    <span
      className="inline-block size-2.5 flex-none rounded-full"
      style={{ background: color }}
    />
  );
}
