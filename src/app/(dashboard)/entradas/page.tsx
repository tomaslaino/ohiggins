"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ENTRY_TYPES, CURRENCIES } from "@/lib/constants";

type Entry = {
  id: string;
  date: string;
  type: string;
  category: { id: string; name: string };
  fruitType: { id: string; name: string } | null;
  vegetableType: { id: string; name: string } | null;
  otroDetalle: string | null;
  amount: number;
  currency: string;
  description: string;
  createdBy: { name: string } | null;
  createdAt?: string;
  updatedAt?: string;
};

type Category = { id: string; name: string };
type User = { id: string; name: string };

function formatMoney(amount: number, currency: string) {
  return new Intl.NumberFormat("es-UY", {
    style: "currency",
    currency: currency === "USD" ? "USD" : "UYU",
    maximumFractionDigits: 0,
  }).format(amount);
}
function formatDate(s: string) {
  return new Intl.DateTimeFormat("es-UY", { day: "2-digit", month: "2-digit", year: "numeric" }).format(new Date(s));
}
function formatDateTime(s: string) {
  return new Intl.DateTimeFormat("es-UY", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(s));
}

function DeleteButton({
  entryId,
  description,
  onDeleted,
}: {
  entryId: string;
  description: string;
  onDeleted: () => void;
}) {
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const router = useRouter();

  async function handleDelete() {
    setDeleting(true);
    const res = await fetch(`/api/entries/${entryId}`, { method: "DELETE" });
    setDeleting(false);
    setConfirming(false);
    if (res.ok) {
      onDeleted();
      router.refresh();
    }
  }

  if (confirming) {
    return (
      <div className="flex items-center gap-1">
        <span className="text-xs text-[var(--muted)]">¿Eliminar?</span>
        <button
          type="button"
          onClick={handleDelete}
          disabled={deleting}
          className="py-1 px-2 rounded text-xs font-medium bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
        >
          {deleting ? "…" : "Sí"}
        </button>
        <button
          type="button"
          onClick={() => setConfirming(false)}
          disabled={deleting}
          className="py-1 px-2 rounded text-xs font-medium border border-[var(--border)] hover:bg-[var(--border)]"
        >
          No
        </button>
      </div>
    );
  }
  return (
    <button
      type="button"
      onClick={() => setConfirming(true)}
      className="py-1.5 px-2 rounded text-red-600 hover:bg-red-50 text-xs font-medium"
      title={`Eliminar: ${description}`}
    >
      Eliminar
    </button>
  );
}

export default function EntradasPage() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [userId, setUserId] = useState("");
  const [currency, setCurrency] = useState("");
  const [type, setType] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    Promise.all([
      fetch("/api/categories").then((r) => r.json()),
      fetch("/api/users").then((r) => r.json()),
    ]).then(([catList, userList]) => {
      setCategories(Array.isArray(catList) ? catList : []);
      setUsers(Array.isArray(userList) ? userList : []);
    });
  }, []);

  useEffect(() => {
    const params = new URLSearchParams();
    if (dateFrom) params.set("dateFrom", dateFrom);
    if (dateTo) params.set("dateTo", dateTo);
    if (categoryId) params.set("categoryId", categoryId);
    if (userId) params.set("createdById", userId);
    if (currency) params.set("currency", currency);
    if (type) params.set("type", type);
    if (searchQuery.trim()) params.set("q", searchQuery.trim());
    setLoading(true);
    fetch(`/api/entries?${params}`)
      .then((res) => res.ok ? res.json() : [])
      .then(setEntries)
      .finally(() => setLoading(false));
  }, [dateFrom, dateTo, categoryId, userId, currency, type, searchQuery]);

  // Resumen a partir de las entradas filtradas
  const resumen = (() => {
    const byCurrency = { UYU: { ingreso: 0, gasto: 0 }, USD: { ingreso: 0, gasto: 0 } };
    for (const e of entries) {
      const c = e.currency === "USD" ? "USD" : "UYU";
      if (e.type === "ingreso") byCurrency[c].ingreso += e.amount;
      else byCurrency[c].gasto += e.amount;
    }
    const balanceUYU = byCurrency.UYU.ingreso - byCurrency.UYU.gasto;
    const balanceUSD = byCurrency.USD.ingreso - byCurrency.USD.gasto;
    return { byCurrency, balanceUYU, balanceUSD };
  })();

  function exportCsv() {
    if (entries.length === 0) return;
    const headers = ["Fecha", "Tipo", "Categoría", "Tipo de fruta", "Tipo de verdura", "Otro (detalle)", "Monto", "Moneda", "Descripción", "Registrado por"];
    const rows = entries.map((e) => [
      e.date.slice(0, 10),
      e.type,
      e.category.name,
      e.fruitType?.name ?? "",
      e.vegetableType?.name ?? "",
      `"${(e.otroDetalle ?? "").replace(/"/g, '""')}"`,
      e.amount,
      e.currency,
      `"${(e.description || "").replace(/"/g, '""')}"`,
      e.createdBy?.name ?? "",
    ]);
    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `entradas-${dateFrom || "desde"}-${dateTo || "hasta"}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <h1 className="text-2xl font-bold text-[var(--primary)] tracking-tight">Listado de entradas</h1>
        <button
          type="button"
          onClick={exportCsv}
          disabled={entries.length === 0}
          className="py-2.5 px-4 rounded-lg border border-[var(--border)] bg-[var(--card)] shadow-sm text-sm font-medium text-[var(--foreground)] hover:bg-[var(--border)] disabled:opacity-50 transition-colors"
        >
          Exportar CSV
        </button>
      </header>

      <div className="bg-[var(--card)] rounded-xl border border-[var(--border)] shadow-sm p-4 sm:p-5">
        <h2 className="text-base font-semibold text-[var(--foreground)] mb-3">Filtros</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
        <div className="sm:col-span-2 lg:col-span-6">
          <label className="block text-xs font-medium text-[var(--muted)] mb-1">Buscar</label>
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Descripción, categoría, usuario, tipo de fruta/verdura…"
            className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--card)] text-sm placeholder:text-[var(--muted)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
            aria-label="Buscar en el listado"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-[var(--muted)] mb-1">Desde</label>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--card)] text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-[var(--muted)] mb-1">Hasta</label>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--card)] text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-[var(--muted)] mb-1">Categoría</label>
          <select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--card)] text-sm"
          >
            <option value="">Todas</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-[var(--muted)] mb-1">Usuario</label>
          <select
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--card)] text-sm"
          >
            <option value="">Todos</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>{u.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-[var(--muted)] mb-1">Moneda</label>
          <select
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--card)] text-sm"
          >
            <option value="">Todas</option>
            {CURRENCIES.map((c) => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-[var(--muted)] mb-1">Tipo</label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--card)] text-sm"
          >
            <option value="">Todos</option>
            {ENTRY_TYPES.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </div>
      </div>
      </div>

      {loading ? (
        <p className="text-[var(--muted)] py-8">Cargando…</p>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-6 items-start">
          <div className="space-y-3 min-w-0">
            {entries.length === 0 ? (
              <p className="text-[var(--muted)] py-8">No hay entradas con estos filtros.</p>
            ) : (
              <ul className="divide-y divide-[var(--border)] bg-[var(--card)] rounded-xl border border-[var(--border)] shadow-sm overflow-hidden">
                {entries.map((e) => (
                  <li key={e.id} className="px-4 py-3 flex flex-wrap justify-between items-center gap-2 text-sm group">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-[var(--foreground)]">{e.description}</p>
                      <p className="text-[var(--muted)]">
                        {formatDate(e.date)} · {e.category.name}
                        {e.fruitType ? ` · ${e.fruitType.name}` : ""}
                        {e.vegetableType ? ` · ${e.vegetableType.name}` : ""}
                        {e.otroDetalle ? ` · ${e.otroDetalle}` : ""} · {e.createdBy?.name ?? "—"}
                      </p>
                      {(e.createdAt || e.updatedAt) && (
                        <p className="text-xs text-[var(--muted)] mt-0.5">
                          {e.createdAt && <>Registrado: {formatDateTime(e.createdAt)}</>}
                          {e.updatedAt && e.createdAt && new Date(e.updatedAt).getTime() > new Date(e.createdAt).getTime() && (
                            <> · Editado: {formatDateTime(e.updatedAt)}</>
                          )}
                          {e.updatedAt && !e.createdAt && <>Editado: {formatDateTime(e.updatedAt)}</>}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={e.type === "ingreso" ? "text-[var(--ingreso)] font-medium" : "text-[var(--gasto)] font-medium"}>
                        {e.type === "ingreso" ? "+" : "−"} {formatMoney(e.amount, e.currency)}
                      </span>
                      <Link
                        href={`/entradas/${e.id}/editar`}
                        className="py-1.5 px-2 rounded text-[var(--primary)] hover:bg-[var(--border)] text-xs font-medium"
                      >
                        Editar
                      </Link>
                      <DeleteButton entryId={e.id} description={e.description} onDeleted={() => setEntries((prev) => prev.filter((x) => x.id !== e.id))} />
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="lg:sticky lg:top-4">
            <div className="bg-[var(--card)] rounded-xl border border-[var(--border)] shadow-sm p-5">
              <h2 className="text-base font-semibold text-[var(--foreground)] mb-4 pb-2 border-b border-[var(--border)]">
                Resumen
              </h2>
              <p className="text-xs text-[var(--muted)] mb-3">
                Según los filtros aplicados ({entries.length} {entries.length === 1 ? "entrada" : "entradas"})
              </p>
              <div className="space-y-4">
                <div>
                  <p className="text-xs font-medium text-[var(--muted)] mb-1.5">UYU</p>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-[var(--muted)]">Ingresos</span>
                      <span className="text-[var(--ingreso)]">{formatMoney(resumen.byCurrency.UYU.ingreso, "UYU")}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[var(--muted)]">Gastos</span>
                      <span className="text-[var(--gasto)]">{formatMoney(resumen.byCurrency.UYU.gasto, "UYU")}</span>
                    </div>
                    <div className="flex justify-between pt-1.5 border-t border-[var(--border)] font-medium">
                      <span>Balance</span>
                      <span className={resumen.balanceUYU >= 0 ? "text-[var(--ingreso)]" : "text-[var(--gasto)]"}>
                        {formatMoney(resumen.balanceUYU, "UYU")}
                      </span>
                    </div>
                  </div>
                </div>
                <div>
                  <p className="text-xs font-medium text-[var(--muted)] mb-1.5">USD</p>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-[var(--muted)]">Ingresos</span>
                      <span className="text-[var(--ingreso)]">{formatMoney(resumen.byCurrency.USD.ingreso, "USD")}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[var(--muted)]">Gastos</span>
                      <span className="text-[var(--gasto)]">{formatMoney(resumen.byCurrency.USD.gasto, "USD")}</span>
                    </div>
                    <div className="flex justify-between pt-1.5 border-t border-[var(--border)] font-medium">
                      <span>Balance</span>
                      <span className={resumen.balanceUSD >= 0 ? "text-[var(--ingreso)]" : "text-[var(--gasto)]"}>
                        {formatMoney(resumen.balanceUSD, "USD")}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
