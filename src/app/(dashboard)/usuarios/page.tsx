/**
 * Admin-only: list all users (email, name, role). Delete other users.
 */
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import UserList from "./UserList";

export default async function UsuariosPage() {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") redirect("/dashboard");

  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    select: { id: true, email: true, name: true, role: true, createdAt: true },
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-[var(--primary)] tracking-tight">Usuarios</h1>
      <p className="text-sm text-[var(--muted)]">Solo administradores pueden ver esta página. Puedes eliminar otros usuarios (no a ti mismo).</p>
      <div className="bg-[var(--card)] rounded-xl border border-[var(--border)] shadow-sm overflow-hidden">
        <UserList users={users} currentUserId={session.user?.id ?? ""} />
      </div>
    </div>
  );
}
