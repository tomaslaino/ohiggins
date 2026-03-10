"use client";

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

export default function DashboardSidebar({ isAdmin, userName }: NavProps) {
  const pathname = usePathname();

  const linkClass = (href: string) =>
    `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
      pathname === href || (href !== "/dashboard" && href !== "/panel" && pathname.startsWith(href)) || (href === "/panel" && pathname.startsWith("/panel"))
        ? "bg-[var(--primary)] text-white"
        : "text-[var(--foreground)] hover:bg-[var(--border)]"
    }`;

  return (
    <aside className="flex flex-col fixed top-0 left-0 bottom-0 w-56 bg-[var(--card)] border-r border-[var(--border)] z-10">
      <nav className="flex flex-col h-full gap-0.5 p-3">
        <div className="mb-2 px-3 py-2 pb-3 border-b border-[var(--border)]">
          <Link
            href="/dashboard"
            className="text-base font-semibold text-[var(--primary)] hover:opacity-90"
          >
            O&apos;Higgins y Las Huertas
          </Link>
        </div>
        {navItems.map(({ href, label }) => (
          <Link
            key={href}
            href={href}
            className={linkClass(href)}
          >
            {label}
          </Link>
        ))}
        {isAdmin && (
          <Link
            href="/usuarios"
            className={linkClass("/usuarios")}
          >
            Usuarios
          </Link>
        )}
        <div className="mt-auto pt-4 border-t border-[var(--border)] space-y-1">
          <Link
            href="/cuenta"
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              pathname === "/cuenta" ? "bg-[var(--primary)] text-white" : "text-[var(--foreground)] hover:bg-[var(--border)]"
            }`}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden className="shrink-0">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
            <div className="min-w-0 flex-1">
              {userName ? (
                <>
                  <p className={`text-xs font-medium ${pathname === "/cuenta" ? "text-white/90" : "text-[var(--muted)]"}`}>
                    Conectado como
                  </p>
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
      </nav>
    </aside>
  );
}
