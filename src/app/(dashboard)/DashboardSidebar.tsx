"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOutAction } from "./actions";

type NavProps = {
  isAdmin: boolean;
  userName: string | null;
};

const navItems = [
  { href: "/nueva", label: "Nueva entrada" },
  { href: "/panel", label: "Panel de Control" },
  { href: "/entradas", label: "Listado" },
  { href: "/configuracion", label: "Configuración" },
] as const;

function NavContent({
  pathname,
  linkClass,
  isAdmin,
  userName,
  onLinkClick,
}: {
  pathname: string;
  linkClass: (href: string) => string;
  isAdmin: boolean;
  userName: string | null;
  onLinkClick?: () => void;
}) {
  return (
    <>
      {navItems.map(({ href, label }) => (
        <Link key={href} href={href} className={linkClass(href)} onClick={onLinkClick}>
          {label}
        </Link>
      ))}
      {isAdmin && (
        <Link href="/usuarios" className={linkClass("/usuarios")} onClick={onLinkClick}>
          Usuarios
        </Link>
      )}
      <div className="mt-auto pt-4 border-t border-[var(--border)] space-y-1">
        <Link
          href="/cuenta"
          className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
            pathname === "/cuenta" ? "bg-[var(--primary)] text-white" : "text-[var(--foreground)] hover:bg-[var(--border)]"
          }`}
          onClick={onLinkClick}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden className="shrink-0">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
          <div className="min-w-0 flex-1">
            {pathname === "/cuenta" ? (
              <span className="font-semibold">Mi cuenta</span>
            ) : userName ? (
              <>
                <p className="text-xs font-medium text-[var(--muted)]">Conectado como</p>
                <p className="font-semibold truncate" title={userName}>{userName}</p>
              </>
            ) : (
              <p className="font-medium">Mi cuenta</p>
            )}
          </div>
        </Link>
        <form action={signOutAction} className="block">
          <button
            type="submit"
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-colors border border-transparent hover:border-red-200"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            Salir
          </button>
        </form>
      </div>
    </>
  );
}

// Need userName in NavContent - pass it
export default function DashboardSidebar({ isAdmin, userName }: NavProps) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  const linkClass = (href: string) =>
    `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
      pathname === href || (href !== "/dashboard" && href !== "/panel" && pathname.startsWith(href)) || (href === "/panel" && pathname.startsWith("/panel"))
        ? "bg-[var(--primary)] text-white"
        : "text-[var(--foreground)] hover:bg-[var(--border)]"
    }`;

  // Close drawer on route change (e.g. after clicking a link)
  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  return (
    <>
      {/* Mobile: top bar with logo + hamburger */}
      <header className="md:hidden fixed top-0 left-0 right-0 h-14 z-20 flex items-center justify-between px-4 bg-[var(--card)] border-b border-[var(--border)]">
        <Link
          href="/dashboard"
          className="text-base font-semibold text-[var(--primary)] hover:opacity-90"
          onClick={() => setMenuOpen(false)}
        >
          O&apos;Higgins
        </Link>
        <button
          type="button"
          onClick={() => setMenuOpen((o) => !o)}
          className="p-2 rounded-lg text-[var(--foreground)] hover:bg-[var(--border)] touch-manipulation"
          aria-label={menuOpen ? "Cerrar menú" : "Abrir menú"}
          aria-expanded={menuOpen}
        >
          {menuOpen ? (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          ) : (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          )}
        </button>
      </header>

      {/* Mobile: overlay when menu open */}
      {menuOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/40 z-30"
          aria-hidden
          onClick={() => setMenuOpen(false)}
        />
      )}

      {/* Mobile: drawer with nav */}
      <aside
        className={`md:hidden fixed top-0 left-0 bottom-0 w-72 max-w-[85vw] bg-[var(--card)] border-r border-[var(--border)] z-40 flex flex-col transition-transform duration-200 ease-out ${
          menuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <nav className="flex flex-col h-full gap-0.5 p-3 overflow-y-auto">
          <div className="mb-2 px-3 py-2 pb-3 border-b border-[var(--border)]">
            <Link
              href="/dashboard"
              className="text-base font-semibold text-[var(--primary)] hover:opacity-90"
              onClick={() => setMenuOpen(false)}
            >
              O&apos;Higgins y Las Huertas
            </Link>
          </div>
          <NavContent pathname={pathname} linkClass={linkClass} isAdmin={isAdmin} userName={userName} onLinkClick={() => setMenuOpen(false)} />
        </nav>
      </aside>

      {/* Desktop: fixed sidebar */}
      <aside className="hidden md:flex flex-col fixed top-0 left-0 bottom-0 w-56 bg-[var(--card)] border-r border-[var(--border)] z-10">
        <nav className="flex flex-col h-full gap-0.5 p-3">
          <div className="mb-2 px-3 py-2 pb-3 border-b border-[var(--border)]">
            <Link
              href="/dashboard"
              className="text-base font-semibold text-[var(--primary)] hover:opacity-90"
            >
              O&apos;Higgins y Las Huertas
            </Link>
          </div>
          <NavContent pathname={pathname} linkClass={linkClass} isAdmin={isAdmin} userName={userName} />
        </nav>
      </aside>
    </>
  );
}
