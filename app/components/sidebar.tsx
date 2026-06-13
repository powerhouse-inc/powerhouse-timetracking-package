"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { useMyRole } from "@/lib/hooks";
import type { Role } from "@/lib/types";
import { Avatar } from "./ui";

interface NavItem {
  href: string;
  label: string;
  icon: string;
  managerial?: boolean;
}

const GROUPS: { heading: string; items: NavItem[] }[] = [
  { heading: "Track", items: [
    { href: "/calendar", label: "Calendar", icon: "▦" },
    { href: "/timer", label: "Timer", icon: "⏱" },
  ] },
  {
    heading: "Analyze",
    items: [{ href: "/reports", label: "Reports", icon: "▿" }],
  },
  {
    heading: "Manage",
    items: [
      { href: "/projects", label: "Projects", icon: "▦", managerial: true },
      { href: "/clients", label: "Clients", icon: "◍", managerial: true },
      { href: "/members", label: "Members", icon: "⦿", managerial: true },
    ],
  },
];

const MANAGERIAL: Role[] = ["ADMIN", "MANAGER", "BILLING"];

export function Sidebar() {
  const pathname = usePathname();
  const { user, signOut } = useAuth();
  const role = useMyRole(user?.address);
  const canManage = role ? MANAGERIAL.includes(role) : false;

  return (
    <aside className="relative z-10 flex w-60 flex-none flex-col border-r border-ink-600/60 bg-ink-900/70 backdrop-blur-sm">
      <div className="flex items-center gap-2.5 px-5 py-5">
        <span className="grid size-8 place-items-center rounded-lg bg-magenta text-ink-950 shadow-glow">
          ⏱
        </span>
        <span className="text-[15px] font-extrabold tracking-tight">
          Powerhouse Time
        </span>
      </div>

      <nav className="flex-1 px-3">
        {GROUPS.map((group) => {
          const items = group.items.filter((i) => !i.managerial || canManage);
          if (items.length === 0) return null;
          return (
            <div key={group.heading} className="mb-5">
              <div className="px-2 pb-1.5 text-[11px] font-semibold uppercase tracking-wider text-mist-400">
                {group.heading}
              </div>
              {items.map((item) => {
                const active = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`mb-0.5 flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition ${
                      active
                        ? "bg-ink-700 text-mist-100"
                        : "text-mist-400 hover:bg-ink-800 hover:text-mist-200"
                    }`}
                  >
                    <span
                      className={`w-4 text-center ${active ? "text-magenta" : ""}`}
                    >
                      {item.icon}
                    </span>
                    {item.label}
                  </Link>
                );
              })}
            </div>
          );
        })}
      </nav>

      {user && (
        <div className="flex items-center gap-3 border-t border-ink-600/60 px-4 py-3">
          <Avatar seed={user.name} size={32} />
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-medium">{user.name}</div>
            <div className="truncate text-xs text-mist-400">
              {role ?? "—"}
            </div>
          </div>
          <button
            className="text-xs text-mist-400 hover:text-mist-100"
            onClick={signOut}
            title="Sign out"
          >
            ⏻
          </button>
        </div>
      )}
    </aside>
  );
}
