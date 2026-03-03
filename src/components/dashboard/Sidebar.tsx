"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useState } from "react";
import ThemeToggle from "@/components/theme/ThemeToggle";

const navItems = [
  {
    href: "/dashboard",
    label: "Dashboard",
    desktopOnly: false,
    icon: (
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
      </svg>
    ),
  },
  {
    href: "/dashboard/practice",
    label: "Practice",
    desktopOnly: true,
    icon: (
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
      </svg>
    ),
  },
  {
    href: "/dashboard/log",
    label: "Log",
    desktopOnly: false,
    icon: (
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
      </svg>
    ),
  },
  {
    href: "/dashboard/progress",
    label: "Progress",
    desktopOnly: true,
    icon: (
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
  },
  {
    href: "/dashboard/import",
    label: "Import",
    desktopOnly: false,
    icon: (
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
      </svg>
    ),
  },
];

export default function Sidebar({ email }: { email: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  async function handleLogout() {
    setLoggingOut(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  }

  async function handleClearAllData() {
    setClearing(true);
    try {
      const res = await fetch("/api/user-data", { method: "DELETE" });
      if (res.ok) {
        setShowClearConfirm(false);
        router.refresh();
      }
    } finally {
      setClearing(false);
    }
  }

  function isActive(href: string) {
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname.startsWith(href);
  }

  const navContent = (
    <>
      <div className="p-4 border-b border-[var(--surface-border)]">
        <h2 className="text-lg font-bold">
          <span className="text-foreground">Algo</span>
          <span className="text-neon-cyan text-glow-cyan">Reps</span>
        </h2>
      </div>

      <nav className="flex-1 overflow-y-auto min-h-0 p-3 space-y-0.5">
        {navItems.map((item) => (
          <div key={item.href}>
            {item.desktopOnly && (
              <span
                className="flex md:hidden items-center gap-2.5 px-3 py-2 rounded-md text-sm font-medium text-gray-600 cursor-not-allowed"
                title="Available on desktop only"
              >
                {item.icon}
                {item.label}
                <svg className="h-3 w-3 ml-auto opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </span>
            )}
            <Link
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={`${item.desktopOnly ? "hidden md:flex" : "flex"} items-center gap-2.5 px-3 py-2 rounded-md text-sm font-medium transition-all ${
                isActive(item.href)
                  ? "text-neon-cyan bg-neon-cyan/10 shadow-[0_0_10px_rgba(0,255,242,0.1)]"
                  : "text-gray-400 hover:text-foreground hover:bg-white/5"
              }`}
            >
              {item.icon}
              {item.label}
            </Link>
          </div>
        ))}
      </nav>

      <div className="p-3 border-t border-[var(--surface-border)] space-y-2">
        <p className="text-xs text-gray-500 truncate px-3">
          {email}
        </p>
        <ThemeToggle />
        {showClearConfirm ? (
          <div className="rounded-md border border-red-500/30 bg-red-500/10 p-3 space-y-2">
            <p className="text-xs text-red-400">
              Delete all history, streaks, and progress? This cannot be undone.
            </p>
            <div className="flex gap-2">
              <button
                onClick={handleClearAllData}
                disabled={clearing}
                className="flex-1 rounded-md bg-red-600 px-2 py-1.5 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-50 transition-colors"
              >
                {clearing ? "Clearing..." : "Confirm"}
              </button>
              <button
                onClick={() => setShowClearConfirm(false)}
                className="flex-1 rounded-md border border-[var(--surface-border)] px-2 py-1.5 text-xs font-medium text-gray-400 hover:text-foreground hover:bg-white/5 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setShowClearConfirm(true)}
            className="w-full rounded-md border border-red-500/20 px-3 py-2 text-sm font-medium text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors"
          >
            Clear All Data
          </button>
        )}
        <button
          onClick={handleLogout}
          disabled={loggingOut}
          className="w-full rounded-md border border-[var(--surface-border)] px-3 py-2 text-sm font-medium text-gray-400 hover:text-foreground hover:bg-white/5 disabled:opacity-50 transition-colors"
        >
          {loggingOut ? "Signing out..." : "Sign Out"}
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile hamburger button */}
      <button
        onClick={() => setMobileOpen(!mobileOpen)}
        className="md:hidden fixed top-4 left-4 z-50 rounded-md bg-[var(--surface)] p-2 shadow-md border border-[var(--surface-border)]"
        aria-label="Toggle navigation"
      >
        <svg
          className="h-5 w-5 text-foreground"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          {mobileOpen ? (
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          ) : (
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
          )}
        </svg>
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="md:hidden fixed inset-0 z-30 bg-black/60"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar - desktop: static, mobile: slide-in */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 bg-[var(--surface)] border-r border-[var(--surface-border)] flex flex-col transition-transform duration-200 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        } md:translate-x-0 md:static md:z-auto`}
      >
        {navContent}
      </aside>
    </>
  );
}
