"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { ENTRY_TYPES, CURRENCIES } from "@/lib/constants";

type Category = { id: string; name: string; type?: string };
type FruitType = { id: string; name: string };
type VegetableType = { id: string; name: string };
type Entry = {
  id: string;
  date: string;
  type: string;
  categoryId: string;
  category: { id: string; name: string };
  fruitTypeId: string | null;
  fruitType: { id: string; name: string } | null;
  vegetableTypeId: string | null;
  vegetableType: { id: string; name: string } | null;
  otroDetalle: string | null;
  amount: number;
  currency: string;
  description: string;
  notes: string | null;
  paymentMethod: string | null;
  imagePath: string | null;
};

export default function EditarEntradaPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const [categories, setCategories] = useState<Category[]>([]);
  const [fruitTypes, setFruitTypes] = useState<FruitType[]>([]);
  const [vegetableTypes, setVegetableTypes] = useState<VegetableType[]>([]);
  const [entry, setEntry] = useState<Entry | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [imageUploading, setImageUploading] = useState(false);
  const [imageDeleting, setImageDeleting] = useState(false);
  const [form, setForm] = useState({
    date: "",
    type: "gasto" as "ingreso" | "gasto",
    categoryId: "",
    fruitTypeId: "",
    vegetableTypeId: "",
    otroDetalle: "",
    currency: "UYU" as "UYU" | "USD",
    amount: "",
    description: "",
    notes: "",
  });

  useEffect(() => {
    if (!id) return;
    fetch(`/api/entries/${id}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((ent) => {
        setEntry(ent);
        if (ent) {
          setForm({
            date: ent.date.slice(0, 10),
            type: ent.type as "ingreso" | "gasto",
            categoryId: ent.categoryId,
            fruitTypeId: ent.fruitTypeId || "",
            vegetableTypeId: ent.vegetableTypeId || "",
            otroDetalle: ent.otroDetalle || "",
            currency: ent.currency as "UYU" | "USD",
            amount: String(ent.amount),
            description: ent.description,
            notes: ent.notes || "",
          });
        }
      })
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (!form.type) return;
    fetch(`/api/categories?type=${form.type}`)
      .then((r) => r.json())
      .then((list) => setCategories(Array.isArray(list) ? list : []));
  }, [form.type]);

  useEffect(() => {
    Promise.all([
      fetch("/api/fruit-types").then((r) => r.json()),
      fetch("/api/vegetable-types").then((r) => r.json()),
    ]).then(([fruitList, vegList]) => {
      setFruitTypes(Array.isArray(fruitList) ? fruitList : []);
      setVegetableTypes(Array.isArray(vegList) ? vegList : []);
    });
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      const res = await fetch(`/api/entries/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: form.date,
          type: form.type,
          categoryId: form.categoryId || undefined,
          fruitTypeId: form.fruitTypeId || undefined,
          vegetableTypeId: form.vegetableTypeId || undefined,
          otroDetalle: form.otroDetalle.trim() || undefined,
          currency: form.currency,
          amount: Number(form.amount),
          description: form.description.trim(),
          notes: form.notes.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Error al guardar");
        setSaving(false);
        return;
      }
      router.push("/entradas");
      router.refresh();
    } catch {
      setError("Error de conexión");
    }
    setSaving(false);
  }

  if (loading) {
    return <p className="text-[var(--muted)] py-8">Cargando…</p>;
  }
  if (!entry) {
    return (
      <div className="space-y-4">
        <p className="text-[var(--muted)]">Entrada no encontrada.</p>
        <Link href="/entradas" className="text-[var(--primary)] hover:underline">Volver al listado</Link>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto space-y-8">
      <header>
        <h1 className="text-2xl font-bold text-[var(--primary)] tracking-tight">Editar entrada</h1>
      </header>
      <p className="text-sm text-[var(--muted)] -mt-4">
        <Link href="/entradas" className="text-[var(--primary)] hover:underline">← Volver al listado</Link>
      </p>
      <form onSubmit={handleSubmit} className="bg-[var(--card)] rounded-xl border border-[var(--border)] shadow-sm p-6 space-y-4">
        <div>
          <label htmlFor="date" className="block text-sm font-medium mb-1">Fecha</label>
          <input
            id="date"
            type="date"
            required
            value={form.date}
            onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
            className="w-full px-4 py-3 rounded-lg border border-[var(--border)] bg-white focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">Tipo</label>
          <div className="flex gap-4">
            {ENTRY_TYPES.map((t) => (
              <label key={t.value} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="type"
                  value={t.value}
                  checked={form.type === t.value}
                  onChange={() => setForm((f) => ({
                    ...f,
                    type: t.value as "ingreso" | "gasto",
                    categoryId: "",
                    fruitTypeId: "",
                    vegetableTypeId: "",
                    otroDetalle: "",
                  }))}
                  className="w-5 h-5"
                />
                <span>{t.label}</span>
              </label>
            ))}
          </div>
        </div>
        <div>
          <label htmlFor="category" className="block text-sm font-medium mb-1">Categoría</label>
          <select
            id="category"
            required
            value={form.categoryId}
            onChange={(e) => setForm((f) => ({ ...f, categoryId: e.target.value, fruitTypeId: "", vegetableTypeId: "", otroDetalle: "" }))}
            className="w-full px-4 py-3 rounded-lg border border-[var(--border)] bg-white focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
          >
            <option value="">Seleccionar…</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
        {(() => {
          const selectedCategory = categories.find((c) => c.id === form.categoryId);
          const showFruitType = selectedCategory?.name === "Fruta";
          const showVegetableType = selectedCategory?.name === "Verduras";
          const showOtroDetalle = selectedCategory?.name === "Otro";
          return (
            <>
              {showFruitType && (
                <div>
                  <label htmlFor="fruitType" className="block text-sm font-medium mb-1">Tipo de fruta (opcional)</label>
                  <select
                    id="fruitType"
                    value={form.fruitTypeId}
                    onChange={(e) => setForm((f) => ({ ...f, fruitTypeId: e.target.value }))}
                    className="w-full px-4 py-3 rounded-lg border border-[var(--border)] bg-white focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                  >
                    <option value="">Ninguno</option>
                    {fruitTypes.map((f) => (
                      <option key={f.id} value={f.id}>{f.name}</option>
                    ))}
                  </select>
                </div>
              )}
              {showVegetableType && (
                <div>
                  <label htmlFor="vegetableType" className="block text-sm font-medium mb-1">Tipo de verdura (opcional)</label>
                  <select
                    id="vegetableType"
                    value={form.vegetableTypeId}
                    onChange={(e) => setForm((f) => ({ ...f, vegetableTypeId: e.target.value }))}
                    className="w-full px-4 py-3 rounded-lg border border-[var(--border)] bg-white focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                  >
                    <option value="">Ninguno</option>
                    {vegetableTypes.map((v) => (
                      <option key={v.id} value={v.id}>{v.name}</option>
                    ))}
                  </select>
                </div>
              )}
              {showOtroDetalle && (
                <div>
                  <label htmlFor="otroDetalle" className="block text-sm font-medium mb-1">Especificar (opcional)</label>
                  <input
                    id="otroDetalle"
                    type="text"
                    value={form.otroDetalle}
                    onChange={(e) => setForm((f) => ({ ...f, otroDetalle: e.target.value }))}
                    className="w-full px-4 py-3 rounded-lg border border-[var(--border)] bg-white focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                    placeholder="Ej. Donación, subvención…"
                  />
                </div>
              )}
            </>
          );
        })()}
        <div>
          <label className="block text-sm font-medium mb-2">Moneda</label>
          <div className="flex gap-4">
            {CURRENCIES.map((c) => (
              <label key={c.value} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="currency"
                  value={c.value}
                  checked={form.currency === c.value}
                  onChange={() => setForm((f) => ({ ...f, currency: c.value as "UYU" | "USD" }))}
                  className="w-5 h-5"
                />
                <span>{c.label}</span>
              </label>
            ))}
          </div>
        </div>
        <div>
          <label htmlFor="amount" className="block text-sm font-medium mb-1">Monto ({form.currency})</label>
          <input
            id="amount"
            type="number"
            step="0.01"
            min="0"
            required
            value={form.amount}
            onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
            className="w-full px-4 py-3 rounded-lg border border-[var(--border)] bg-white focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
            placeholder="0"
          />
        </div>
        <div>
          <label htmlFor="description" className="block text-sm font-medium mb-1">Descripción (opcional)</label>
          <input
            id="description"
            type="text"
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            className="w-full px-4 py-3 rounded-lg border border-[var(--border)] bg-white focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
            placeholder="Ej. Venta fruta orgánica"
          />
        </div>
        <div>
          <label htmlFor="notes" className="block text-sm font-medium mb-1">Notas</label>
          <textarea
            id="notes"
            rows={2}
            value={form.notes}
            onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
            className="w-full px-4 py-3 rounded-lg border border-[var(--border)] bg-white focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
            placeholder="Opcional"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Foto o imagen</label>
          {entry.imagePath ? (
            <div className="space-y-2">
              <a
                href={entry.imagePath}
                target="_blank"
                rel="noopener noreferrer"
                className="block max-w-xs"
              >
                <img
                  src={entry.imagePath}
                  alt="Adjunto"
                  className="max-h-40 rounded-lg border border-[var(--border)] object-contain hover:opacity-90"
                />
              </a>
              <p className="text-xs text-[var(--muted)]">Toca la imagen para verla en tamaño completo.</p>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={async () => {
                    setImageDeleting(true);
                    try {
                      const res = await fetch(`/api/entries/${id}/image`, { method: "DELETE" });
                      if (res.ok) setEntry((prev) => (prev ? { ...prev, imagePath: null } : null));
                    } finally {
                      setImageDeleting(false);
                    }
                  }}
                  disabled={imageDeleting}
                  className="py-2 px-3 rounded-lg border border-[var(--border)] text-red-600 text-sm font-medium hover:bg-red-50 disabled:opacity-50"
                >
                  {imageDeleting ? "…" : "Eliminar imagen"}
                </button>
                <label className="py-2 px-3 rounded-lg bg-[var(--primary)] text-white text-sm font-medium cursor-pointer disabled:opacity-50">
                  {imageUploading ? "…" : "Reemplazar"}
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    className="sr-only"
                    disabled={imageUploading}
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      setImageUploading(true);
                      try {
                        const fd = new FormData();
                        fd.set("image", file);
                        const res = await fetch(`/api/entries/${id}/image`, { method: "POST", body: fd });
                        const data = await res.json();
                        if (res.ok && data.imagePath) setEntry((prev) => (prev ? { ...prev, imagePath: data.imagePath } : null));
                      } finally {
                        setImageUploading(false);
                        e.target.value = "";
                      }
                    }}
                  />
                </label>
              </div>
            </div>
          ) : (
            <div>
              <p className="text-xs text-[var(--muted)] mb-2">Puedes añadir una foto (ej. del recibo). En el móvil puedes tomar una foto.</p>
              <label className="block w-full text-sm text-[var(--foreground)] file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-[var(--primary)] file:text-white file:font-medium file:cursor-pointer">
                {imageUploading ? "Subiendo…" : "Añadir imagen"}
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="sr-only"
                  disabled={imageUploading}
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    setImageUploading(true);
                    try {
                      const fd = new FormData();
                      fd.set("image", file);
                      const res = await fetch(`/api/entries/${id}/image`, { method: "POST", body: fd });
                      const data = await res.json();
                      if (res.ok && data.imagePath) setEntry((prev) => (prev ? { ...prev, imagePath: data.imagePath } : null));
                    } finally {
                      setImageUploading(false);
                      e.target.value = "";
                    }
                  }}
                />
              </label>
            </div>
          )}
        </div>
        {error && (
          <p className="text-sm text-red-600 bg-red-50 py-2 px-3 rounded-lg">{error}</p>
        )}
        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={saving}
            className="flex-1 py-3 px-4 rounded-lg bg-[var(--primary)] text-white font-medium hover:opacity-90 disabled:opacity-60 transition-opacity"
          >
            {saving ? "Guardando…" : "Guardar cambios"}
          </button>
          <Link
            href="/entradas"
            className="py-3 px-4 rounded-lg border border-[var(--border)] bg-[var(--card)] text-[var(--foreground)] font-medium hover:bg-[var(--border)] transition-colors text-center"
          >
            Cancelar
          </Link>
        </div>
      </form>
    </div>
  );
}
