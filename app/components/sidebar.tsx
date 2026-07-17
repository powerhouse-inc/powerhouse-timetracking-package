"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { useMyRole } from "@/lib/hooks";
import { isModuleEnabled, type ModuleKey } from "@/lib/modules";
import type { Role } from "@/lib/types";
import { Avatar } from "./ui";

interface NavItem {
  href: string;
  label: string;
  icon: string;
  module: ModuleKey;
  managerial?: boolean;
}

const GROUPS: { heading: string; items: NavItem[] }[] = [
  {
    heading: "Overview",
    items: [
      { href: "/", label: "Dashboard", icon: "◆", module: "dashboard" },
      { href: "/my-work", label: "My Work", icon: "✦", module: "myWork" },
    ],
  },
  { heading: "Track", items: [
    { href: "/calendar", label: "Calendar", icon: "▦", module: "calendar" },
    { href: "/timer", label: "Timer", icon: "⏱", module: "timer" },
  ] },
  {
    heading: "Analyze",
    items: [
      { href: "/reports", label: "Reports", icon: "▿", module: "reports" },
      {
        href: "/profitability",
        label: "Profitability",
        icon: "◑",
        module: "profitability",
        managerial: true,
      },
    ],
  },
  {
    heading: "Sales",
    items: [{ href: "/sales", label: "Pipeline", icon: "◈", module: "sales" }],
  },
  {
    heading: "Delivery",
    items: [
      { href: "/delivery", label: "Scopes of Work", icon: "◫", module: "delivery" },
    ],
  },
  {
    heading: "Billing",
    items: [
      { href: "/submit-invoice", label: "Submit Invoice", icon: "✎", module: "submitInvoice" },
      { href: "/invoices", label: "Invoices", icon: "▤", module: "invoices", managerial: true },
      { href: "/statements", label: "Statements", icon: "▥", module: "statements", managerial: true },
      { href: "/finance", label: "Finance", icon: "◭", module: "finance", managerial: true },
    ],
  },
  {
    heading: "Manage",
    items: [
      { href: "/projects", label: "Projects", icon: "▦", module: "projects", managerial: true },
      { href: "/clients", label: "Clients", icon: "◍", module: "clients", managerial: true },
      { href: "/members", label: "Members", icon: "⦿", module: "members", managerial: true },
    ],
  },
];

const MANAGERIAL: Role[] = ["ADMIN", "MANAGER", "BILLING"];

export function Sidebar({
  open = false,
  onClose,
}: {
  open?: boolean;
  onClose?: () => void;
}) {
  const pathname = usePathname();
  const { user, signOut } = useAuth();
  const role = useMyRole(user?.address);
  const canManage = role ? MANAGERIAL.includes(role) : false;

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-50 flex w-64 max-w-[82vw] flex-none flex-col border-r border-ink-600/60 bg-ink-900/95 backdrop-blur-sm transition-transform duration-200 md:static md:z-10 md:w-60 md:translate-x-0 md:bg-ink-900/70 ${
        open ? "translate-x-0" : "-translate-x-full"
      }`}
    >
      <div className="flex items-center gap-2.5 px-5 py-5">
        <span className="grid size-8 place-items-center rounded-lg bg-magenta text-ink-950 shadow-glow">
          ⬡
        </span>
        <span className="flex flex-col leading-none">
          <span className="text-[15px] font-extrabold tracking-tight">
            Powerhouse
          </span>
          <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-magenta">
            Operations
          </span>
        </span>
      </div>

      <nav className="flex-1 px-3">
        {GROUPS.map((group) => {
          const items = group.items.filter(
            (i) => isModuleEnabled(i.module) && (!i.managerial || canManage),
          );
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
                    onClick={onClose}
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
