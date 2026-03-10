"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

type User = {
  id: string;
  email: string;
  name: string;
  role: string;
  createdAt: string;
};

export default function CuentaPage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  useEffect(() => {
    fetch("/api/me")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        setUser(data);
        if (data) {
          setForm((f) => ({ ...f, name: data.name ?? "", email: data.email ?? "" }));
        }
      })
      .finally(() => setLoading(false));
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      const body: Record<string, string> = { name: form.name.trim(), email: form.email.trim().toLowerCase() };
      if (form.password) {
        if (form.password.length < 8) {
          setError("La contraseña debe tener al menos 8 caracteres.");
          setSaving(false);
          return;
        }
        if (form.password !== form.confirmPassword) {
          setError("Las contraseñas no coinciden.");
          setSaving(false);
          return;
        }
        body.password = form.password;
      }
      const res = await fetch("/api/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Error al guardar");
        setSaving(false);
        return;
      }
      setUser(data);
      setForm((f) => ({ ...f, password: "", confirmPassword: "" }));
    } catch {
      setError("Error de conexión");
    }
    setSaving(false);
  }

  async function handleDeleteAccount() {
    setError("");
    setDeleting(true);
    try {
      const res = await fetch("/api/me", { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Error al eliminar la cuenta");
        setDeleting(false);
        return;
      }
      window.location.href = "/api/auth/signout?callbackUrl=/login";
      return;
    } catch {
      setError("Error de conexión");
    }
    setDeleting(false);
  }

  if (loading) {
    return <p className="text-[var(--muted)] py-8">Cargando…</p>;
  }
  if (!user) {
    return (
      <div className="space-y-4">
        <p className="text-[var(--muted)]">No se pudo cargar tu cuenta.</p>
        <Link href="/dashboard" className="text-[var(--primary)] hover:underline">Volver al inicio</Link>
      </div>
    );
  }

  return (
    <div className="max-w-lg space-y-8">
      <header>
        <h1 className="text-2xl font-bold text-[var(--primary)] tracking-tight">Mi cuenta</h1>
      </header>

      <form onSubmit={handleSubmit} className="bg-[var(--card)] rounded-xl border border-[var(--border)] shadow-sm p-6 space-y-4">
        <div>
          <label htmlFor="name" className="block text-sm font-medium mb-1">Nombre</label>
          <input
            id="name"
            type="text"
            required
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            className="w-full px-4 py-3 rounded-lg border border-[var(--border)] bg-white focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
          />
        </div>
        <div>
          <label htmlFor="email" className="block text-sm font-medium mb-1">Correo</label>
          <input
            id="email"
            type="email"
            required
            value={form.email}
            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            className="w-full px-4 py-3 rounded-lg border border-[var(--border)] bg-white focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
          />
        </div>
        <div>
          <label htmlFor="password" className="block text-sm font-medium mb-1">Nueva contraseña (opcional)</label>
          <input
            id="password"
            type="password"
            value={form.password}
            onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
            className="w-full px-4 py-3 rounded-lg border border-[var(--border)] bg-white focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
            placeholder="Dejar en blanco para no cambiar"
            autoComplete="new-password"
          />
        </div>
        {form.password ? (
          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium mb-1">Confirmar nueva contraseña</label>
            <input
              id="confirmPassword"
              type="password"
              value={form.confirmPassword}
              onChange={(e) => setForm((f) => ({ ...f, confirmPassword: e.target.value }))}
              className="w-full px-4 py-3 rounded-lg border border-[var(--border)] bg-white focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
              autoComplete="new-password"
            />
          </div>
        ) : null}
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={saving}
          className="py-3 px-4 rounded-lg bg-[var(--primary)] text-white font-medium hover:opacity-90 disabled:opacity-60 transition-opacity"
        >
          {saving ? "Guardando…" : "Guardar cambios"}
        </button>
      </form>

      <div className="bg-[var(--card)] rounded-xl border border-red-200 shadow-sm p-6 space-y-4">
        <h2 className="text-base font-semibold text-[var(--foreground)]">Eliminar cuenta</h2>
        {!confirmDelete ? (
          <button
            type="button"
            onClick={() => setConfirmDelete(true)}
            className="py-2 px-4 rounded-lg border border-red-300 text-red-600 font-medium hover:bg-red-50"
          >
            Quiero eliminar mi cuenta
          </button>
        ) : (
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-sm text-[var(--muted)]">¿Estás seguro?</span>
            <button
              type="button"
              onClick={handleDeleteAccount}
              disabled={deleting}
              className="py-2 px-4 rounded-lg bg-red-600 text-white font-medium hover:bg-red-700 disabled:opacity-60"
            >
              {deleting ? "…" : "Sí, eliminar mi cuenta"}
            </button>
            <button
              type="button"
              onClick={() => setConfirmDelete(false)}
              disabled={deleting}
              className="py-2 px-4 rounded-lg border border-[var(--border)] bg-[var(--card)] hover:bg-[var(--border)] transition-colors"
            >
              Cancelar
            </button>
          </div>
        )}
      </div>

      <p>
        <Link href="/dashboard" className="text-[var(--primary)] hover:underline">← Volver al inicio</Link>
      </p>
    </div>
  );
}
