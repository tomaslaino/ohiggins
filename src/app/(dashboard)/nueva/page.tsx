"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ENTRY_TYPES, CURRENCIES } from "@/lib/constants";

type Category = { id: string; name: string; type?: string };
type FruitType = { id: string; name: string };
type VegetableType = { id: string; name: string };

export default function NuevaEntradaPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [fruitTypes, setFruitTypes] = useState<FruitType[]>([]);
  const [vegetableTypes, setVegetableTypes] = useState<VegetableType[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    date: new Date().toISOString().slice(0, 10),
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
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  useEffect(() => {
    if (imageFile) {
      const url = URL.createObjectURL(imageFile);
      setPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    }
    setPreviewUrl(null);
  }, [imageFile]);

  // Fetch categories filtered by entry type; fetch fruit & vegetable types once
  useEffect(() => {
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
    setLoading(true);
    try {
      if (imageFile) {
        const formData = new FormData();
        formData.set("date", form.date);
        formData.set("type", form.type);
        formData.set("categoryId", form.categoryId || "");
        formData.set("fruitTypeId", form.fruitTypeId || "");
        formData.set("vegetableTypeId", form.vegetableTypeId || "");
        formData.set("otroDetalle", form.otroDetalle);
        formData.set("currency", form.currency);
        formData.set("amount", form.amount);
        formData.set("description", form.description.trim());
        formData.set("notes", form.notes);
        formData.set("image", imageFile);
        const res = await fetch("/api/entries", {
          method: "POST",
          body: formData,
        });
        const data = await res.json();
        if (!res.ok) {
          setError(data.error || "Error al guardar");
          setLoading(false);
          return;
        }
      } else {
        const res = await fetch("/api/entries", {
          method: "POST",
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
          setLoading(false);
          return;
        }
      }
      router.push("/dashboard");
      router.refresh();
    } catch {
      setError("Error de conexión");
    }
    setLoading(false);
  }

  return (
    <div className="max-w-lg mx-auto space-y-6 md:space-y-8">
      <h1 className="text-xl md:text-2xl font-bold text-[var(--primary)] tracking-tight">Nueva entrada</h1>
      <p className="text-sm text-[var(--muted)] -mt-2 md:-mt-4">
        ¿Falta una categoría o tipo? <Link href="/configuracion" className="text-[var(--primary)] hover:underline">Agregar en Configuración</Link>
      </p>
      <form onSubmit={handleSubmit} className="bg-[var(--card)] rounded-xl border border-[var(--border)] shadow-sm p-4 md:p-6 space-y-4">
        <div>
          <label htmlFor="date" className="block text-sm font-medium mb-1">Fecha</label>
          <input
            id="date"
            type="date"
            required
            value={form.date}
            onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
            className="w-full min-h-[48px] px-4 py-3 rounded-lg border border-[var(--border)] bg-white focus:outline-none focus:ring-2 focus:ring-[var(--primary)] touch-manipulation"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">Tipo</label>
          <div className="flex flex-wrap gap-4">
            {ENTRY_TYPES.map((t) => (
              <label key={t.value} className="flex items-center gap-2 cursor-pointer min-h-[44px] touch-manipulation">
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
                  className="w-5 h-5 shrink-0"
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
            className="w-full min-h-[48px] px-4 py-3 rounded-lg border border-[var(--border)] bg-white focus:outline-none focus:ring-2 focus:ring-[var(--primary)] touch-manipulation"
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
                    className="w-full min-h-[48px] px-4 py-3 rounded-lg border border-[var(--border)] bg-white focus:outline-none focus:ring-2 focus:ring-[var(--primary)] touch-manipulation"
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
                    className="w-full min-h-[48px] px-4 py-3 rounded-lg border border-[var(--border)] bg-white focus:outline-none focus:ring-2 focus:ring-[var(--primary)] touch-manipulation"
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
                    className="w-full min-h-[48px] px-4 py-3 rounded-lg border border-[var(--border)] bg-white focus:outline-none focus:ring-2 focus:ring-[var(--primary)] touch-manipulation"
                    placeholder="Ej. Donación, subvención…"
                  />
                </div>
              )}
            </>
          );
        })()}
        <div>
          <label className="block text-sm font-medium mb-2">Moneda</label>
          <div className="flex flex-wrap gap-4">
            {CURRENCIES.map((c) => (
              <label key={c.value} className="flex items-center gap-2 cursor-pointer min-h-[44px] touch-manipulation">
                <input
                  type="radio"
                  name="currency"
                  value={c.value}
                  checked={form.currency === c.value}
                  onChange={() => setForm((f) => ({ ...f, currency: c.value as "UYU" | "USD" }))}
                  className="w-5 h-5 shrink-0"
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
            className="w-full min-h-[48px] px-4 py-3 rounded-lg border border-[var(--border)] bg-white focus:outline-none focus:ring-2 focus:ring-[var(--primary)] touch-manipulation"
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
            className="w-full min-h-[48px] px-4 py-3 rounded-lg border border-[var(--border)] bg-white focus:outline-none focus:ring-2 focus:ring-[var(--primary)] touch-manipulation"
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
            className="w-full min-h-[80px] px-4 py-3 rounded-lg border border-[var(--border)] bg-white focus:outline-none focus:ring-2 focus:ring-[var(--primary)] touch-manipulation"
            placeholder="Opcional"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Foto o imagen (opcional)</label>
          <p className="text-xs text-[var(--muted)] mb-2">
            Ej. foto del recibo o comprobante. En el móvil puedes tomar una foto directamente.
          </p>
          <input
            id="entry-image"
            type="file"
            accept="image/*"
            capture="environment"
            onChange={(e) => setImageFile(e.target.files?.[0] ?? null)}
            className="w-full text-sm text-[var(--foreground)] file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-[var(--primary)] file:text-white file:font-medium file:cursor-pointer file:min-h-[44px] touch-manipulation"
            aria-label="Añadir foto o imagen"
          />
          {imageFile && previewUrl && (
            <div className="mt-2 relative inline-block">
              <img
                src={previewUrl}
                alt="Vista previa"
                className="max-h-40 rounded-lg border border-[var(--border)] object-contain"
              />
              <button
                type="button"
                onClick={() => setImageFile(null)}
                className="absolute top-1 right-1 py-1 px-2 rounded bg-black/70 text-white text-xs font-medium"
              >
                Quitar
              </button>
            </div>
          )}
        </div>
        {error && (
          <p className="text-sm text-red-600 bg-red-50 py-2 px-3 rounded-lg">{error}</p>
        )}
        <div className="flex flex-col-reverse sm:flex-row gap-3 pt-2">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 min-h-[48px] py-3 px-4 rounded-lg bg-[var(--primary)] text-white font-medium hover:opacity-90 disabled:opacity-60 transition-opacity touch-manipulation"
          >
            {loading ? "Guardando…" : "Guardar"}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="min-h-[48px] py-3 px-4 rounded-lg border border-[var(--border)] bg-[var(--card)] text-[var(--foreground)] font-medium hover:bg-[var(--border)] transition-colors touch-manipulation"
          >
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
}
