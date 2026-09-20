"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { FloatingIcons } from "@/components/FloatingIcons";

const LINKS = [
  { href: "/", label: "Home", icon: "M10 3l7 6v8a1 1 0 01-1 1h-4v-5H8v5H4a1 1 0 01-1-1V9l7-6z" },
  {
    href: "/chat",
    label: "Legal Q&A",
    icon: "M3 4h14a1 1 0 011 1v8a1 1 0 01-1 1H8l-4 3v-3H3a1 1 0 01-1-1V5a1 1 0 011-1z",
  },
  {
    href: "/analyze",
    label: "Analyze Document",
    icon: "M7 2h6l4 4v14a1 1 0 01-1 1H7a1 1 0 01-1-1V3a1 1 0 011-1zM13 2v4h4M8 11h6M8 14h6M8 8h2",
  },
];

function NavIcon({ path }: { path: string }) {
  return (
    <svg width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden className="shrink-0">
      <path d={path} fill="currentColor" />
    </svg>
  );
}

function HamburgerIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden>
      <path d="M2 4.5h14M2 9h14M2 13.5h14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function CollapseIcon({ collapsed }: { collapsed: boolean }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden
      className={`transition-transform duration-300 ${collapsed ? "rotate-180" : ""}`}
    >
      <path d="M10 3L5 8l5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function SidebarLogo({ collapsed, onNavigate }: { collapsed: boolean; onNavigate?: () => void }) {
  return (
    <Link href="/" onClick={onNavigate} className="flex flex-col items-center gap-1.5 pb-3 pt-1 text-center">
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" aria-hidden className="text-[var(--accent)]">
        <path
          d="M12 3v18M12 3l-6 3M12 3l6 3M4 8l2 5a2.5 2.5 0 004.6 0L12.6 8M20.6 8l-2-5.8M14.6 8l2 5a2.5 2.5 0 004.6 0l2-5M4 8l2-5.8M6 21h12"
          stroke="currentColor"
          strokeWidth="1.3"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
      </svg>
      {!collapsed && (
        <span className="font-semibold tracking-tight text-[var(--foreground)]">
          LexPlain<span className="text-[var(--accent)]">AI</span>
        </span>
      )}
    </Link>
  );
}

function NavLinks({ collapsed, onNavigate }: { collapsed: boolean; onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <ul className="flex flex-col gap-1">
      {LINKS.map((link) => {
        const active = pathname === link.href;
        return (
          <li key={link.href}>
            <Link
              href={link.href}
              onClick={onNavigate}
              aria-current={active ? "page" : undefined}
              aria-label={link.label}
              title={collapsed ? link.label : undefined}
              className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm ${
                active
                  ? "bg-[var(--accent)] text-white shadow-sm"
                  : "text-[var(--muted)] hover:bg-[var(--surface)] hover:text-[var(--foreground)]"
              } ${collapsed ? "justify-center" : ""}`}
            >
              <NavIcon path={link.icon} />
              {!collapsed && <span className="truncate">{link.label}</span>}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

/** Renders nothing unless the login gate is actually on (authRequired), so a zero-config install of this app never shows a pointless "Log out" button. */
function UserMenu({ collapsed }: { collapsed: boolean }) {
  const router = useRouter();
  const [authInfo, setAuthInfo] = useState<{ authRequired: boolean; username: string | null } | null>(null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/session")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!cancelled && data) setAuthInfo({ authRequired: Boolean(data.authRequired), username: data.username });
      })
      .catch(() => {
        // Non-fatal — just hide the user menu if this fails.
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (!authInfo?.authRequired) return null;

  /** Redirects unconditionally in `finally` — even if the logout request itself fails, sending the user to /login is the safe outcome either way. */
  async function handleLogout() {
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } finally {
      router.push("/login");
      router.refresh();
    }
  }

  return (
    <div className={`border-t border-[var(--border)] pt-2 ${collapsed ? "text-center" : ""}`}>
      {!collapsed && authInfo.username && (
        <p className="truncate px-3 pb-1 text-xs text-[var(--muted)]">Signed in as {authInfo.username}</p>
      )}
      <button
        type="button"
        onClick={handleLogout}
        disabled={isLoggingOut}
        title={collapsed ? "Log out" : undefined}
        className={`flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium text-[var(--muted)] transition-colors hover:bg-[var(--surface)] hover:text-[var(--foreground)] disabled:opacity-50 ${
          collapsed ? "justify-center" : ""
        }`}
      >
        {collapsed ? "⎋" : isLoggingOut ? "Logging out…" : "Log out"}
      </button>
    </div>
  );
}

export function Sidebar({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  if (pathname === "/login") {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen">
      <FloatingIcons />

      <button
        type="button"
        onClick={() => setMobileOpen((v) => !v)}
        aria-expanded={mobileOpen}
        aria-controls="mobile-sidebar"
        className="fixed left-4 top-4 z-40 rounded-full border border-[var(--border)] bg-[var(--background)] p-2.5 text-[var(--foreground)] shadow-sm md:hidden"
      >
        <span className="sr-only">Toggle navigation</span>
        <HamburgerIcon />
      </button>

      <div className="relative z-10 flex w-full items-start gap-4 px-4 py-4 sm:px-6 md:gap-6 lg:px-8">
        {/* Desktop sidebar */}
        <aside
          className={`sticky top-4 hidden shrink-0 transition-[width] duration-300 md:block ${
            collapsed ? "w-[76px]" : "w-64"
          }`}
        >
          <nav
            aria-label="Primary"
            className="flex flex-col gap-2 rounded-2xl border border-[var(--border)] bg-[var(--background)] p-3 shadow-sm"
          >
            <SidebarLogo collapsed={collapsed} />
            <NavLinks collapsed={collapsed} />
            <UserMenu collapsed={collapsed} />
            <div className="border-t border-[var(--border)] pt-2">
              <button
                type="button"
                onClick={() => setCollapsed((v) => !v)}
                className={`flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium text-[var(--muted)] transition-colors hover:bg-[var(--surface)] hover:text-[var(--foreground)] ${
                  collapsed ? "justify-center" : ""
                }`}
              >
                <CollapseIcon collapsed={collapsed} />
                {!collapsed && <span>Collapse</span>}
              </button>
            </div>
          </nav>
        </aside>

        {/* Mobile drawer */}
        {mobileOpen && (
          <div className="fixed inset-0 z-50 md:hidden">
            <button
              type="button"
              aria-label="Close navigation"
              className="absolute inset-0 bg-black/30"
              onClick={() => setMobileOpen(false)}
            />
            <nav
              id="mobile-sidebar"
              aria-label="Primary mobile"
              className="absolute left-3 top-3 bottom-3 flex w-72 flex-col gap-2 rounded-2xl border border-[var(--border)] bg-[var(--background)] p-3 shadow-xl"
            >
              <SidebarLogo collapsed={false} onNavigate={() => setMobileOpen(false)} />
              <NavLinks collapsed={false} onNavigate={() => setMobileOpen(false)} />
              <UserMenu collapsed={false} />
            </nav>
          </div>
        )}

        <main id="main-content" className="min-w-0 flex-1 pb-10 pt-14 md:pt-0">
          {children}
          <footer className="mt-10 border-t border-[var(--border)] pt-4 text-center text-xs text-[var(--muted)]">
            © {new Date().getFullYear()} LexPlain AI. All rights reserved.
          </footer>
        </main>
      </div>
    </div>
  );
}
