/**
 * Admin-only: list all users (email, name, role). No create/edit in MVP.
 */
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

export default async function UsuariosPage() {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") redirect("/dashboard");

  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    select: { id: true, email: true, name: true, role: true, createdAt: true },
  });

  function formatDate(d: Date) {
    return new Intl.DateTimeFormat("es-UY", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }).format(d);
  }

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold text-[var(--foreground)]">Usuarios</h1>
      <p className="text-sm text-[var(--muted)]">Solo administradores pueden ver esta página.</p>
      <div className="bg-[var(--card)] rounded-xl border border-[var(--border)] overflow-hidden">
        <ul className="divide-y divide-[var(--border)]">
          {users.map((u) => (
            <li key={u.id} className="px-4 py-3 flex flex-wrap justify-between gap-2 text-sm">
              <div>
                <p className="font-medium text-[var(--foreground)]">{u.name}</p>
                <p className="text-[var(--muted)]">{u.email}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-1 rounded bg-[var(--border)] text-[var(--muted)] text-xs">
                  {u.role === "ADMIN" ? "Administrador" : "Usuario"}
                </span>
                <span className="text-[var(--muted)] text-xs">{formatDate(u.createdAt)}</span>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
