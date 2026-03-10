"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type User = {
  id: string;
  name: string | null;
  email: string;
  role: string;
  createdAt: Date | string;
};

export default function UserList({
  users,
  currentUserId,
}: {
  users: User[];
  currentUserId: string;
}) {
  const router = useRouter();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);

  function formatDate(d: Date) {
    return new Intl.DateTimeFormat("es-UY", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }).format(new Date(d));
  }

  async function handleDelete(id: string) {
    setDeletingId(id);
    try {
      const res = await fetch(`/api/users/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Error al eliminar");
        return;
      }
      setConfirmId(null);
      router.refresh();
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <ul className="divide-y divide-[var(--border)]">
      {users.map((u) => (
        <li key={u.id} className="px-4 py-3 flex flex-wrap justify-between items-center gap-2 text-sm">
          <div>
            <p className="font-medium text-[var(--foreground)]">{u.name}</p>
            <p className="text-[var(--muted)]">{u.email}</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-1 rounded bg-[var(--border)] text-[var(--muted)] text-xs">
              {u.role === "ADMIN" ? "Administrador" : "Usuario"}
            </span>
            <span className="text-[var(--muted)] text-xs">{formatDate(u.createdAt)}</span>
            {u.id !== currentUserId && (
              confirmId === u.id ? (
                <span className="flex items-center gap-1">
                  <span className="text-xs text-[var(--muted)]">¿Eliminar?</span>
                  <button
                    type="button"
                    onClick={() => handleDelete(u.id)}
                    disabled={!!deletingId}
                    className="py-1 px-2 rounded text-xs font-medium bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
                  >
                    {deletingId === u.id ? "…" : "Sí"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmId(null)}
                    disabled={!!deletingId}
                    className="py-1 px-2 rounded text-xs font-medium border border-[var(--border)] hover:bg-[var(--border)]"
                  >
                    No
                  </button>
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirmId(u.id)}
                  className="py-1 px-2 rounded text-xs font-medium text-red-600 hover:bg-red-50"
                >
                  Eliminar
                </button>
              )
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}
