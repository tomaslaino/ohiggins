"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Category = { id: string; name: string; type: string };
type FruitType = { id: string; name: string };
type VegetableType = { id: string; name: string };

export default function ConfiguracionPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [fruitTypes, setFruitTypes] = useState<FruitType[]>([]);
  const [vegetableTypes, setVegetableTypes] = useState<VegetableType[]>([]);
  const [loading, setLoading] = useState(true);
  const [newCategory, setNewCategory] = useState("");
  const [newCategoryType, setNewCategoryType] = useState<"ingreso" | "gasto">("gasto");
  const [newFruit, setNewFruit] = useState("");
  const [newVegetable, setNewVegetable] = useState("");
  const [savingCat, setSavingCat] = useState(false);
  const [savingFruit, setSavingFruit] = useState(false);
  const [savingVegetable, setSavingVegetable] = useState(false);
  const [errorCat, setErrorCat] = useState("");
  const [errorFruit, setErrorFruit] = useState("");
  const [errorVegetable, setErrorVegetable] = useState("");

  function load() {
    setLoading(true);
    Promise.all([
      fetch("/api/categories").then((r) => r.json()),
      fetch("/api/fruit-types").then((r) => r.json()),
      fetch("/api/vegetable-types").then((r) => r.json()),
    ])
      .then(([catList, fruitList, vegList]) => {
        setCategories(Array.isArray(catList) ? catList : []);
        setFruitTypes(Array.isArray(fruitList) ? fruitList : []);
        setVegetableTypes(Array.isArray(vegList) ? vegList : []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
  }, []);

  async function addCategory(e: React.FormEvent) {
    e.preventDefault();
    const name = newCategory.trim();
    if (!name) return;
    setErrorCat("");
    setSavingCat(true);
    const res = await fetch("/api/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, type: newCategoryType }),
    });
    const data = await res.json();
    if (res.ok) {
      setNewCategory("");
      load();
    } else {
      setErrorCat(data.error || "Error al guardar");
    }
    setSavingCat(false);
  }

  async function addFruitType(e: React.FormEvent) {
    e.preventDefault();
    const name = newFruit.trim();
    if (!name) return;
    setErrorFruit("");
    setSavingFruit(true);
    const res = await fetch("/api/fruit-types", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    const data = await res.json();
    if (res.ok) {
      setNewFruit("");
      load();
    } else {
      setErrorFruit(data.error || "Error al guardar");
    }
    setSavingFruit(false);
  }

  async function addVegetableType(e: React.FormEvent) {
    e.preventDefault();
    const name = newVegetable.trim();
    if (!name) return;
    setErrorVegetable("");
    setSavingVegetable(true);
    const res = await fetch("/api/vegetable-types", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    const data = await res.json();
    if (res.ok) {
      setNewVegetable("");
      load();
    } else {
      setErrorVegetable(data.error || "Error al guardar");
    }
    setSavingVegetable(false);
  }

  if (loading) {
    return <p className="text-[var(--muted)] py-8">Cargando…</p>;
  }

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-bold text-[var(--primary)] tracking-tight">Configuración</h1>
      </header>
      <p className="text-sm text-[var(--muted)] -mt-4">
        Aquí puedes agregar, editar y eliminar categorías (ingreso o gasto), tipos de fruta y tipos de verdura. Estarán disponibles al registrar entradas.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-[var(--card)] rounded-xl border border-[var(--border)] shadow-sm p-6">
          <h2 className="text-base font-semibold text-[var(--foreground)] mb-4">Categorías</h2>
          <form onSubmit={addCategory} className="space-y-2 mb-4">
            <div className="flex gap-2">
              <input
                type="text"
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                placeholder="Nueva categoría"
                className="flex-1 px-4 py-3 rounded-lg border border-[var(--border)] bg-white focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
              />
              <button
                type="submit"
                disabled={savingCat || !newCategory.trim()}
                className="py-3 px-4 rounded-lg bg-[var(--primary)] text-white font-medium hover:opacity-90 disabled:opacity-60"
              >
                {savingCat ? "…" : "Agregar"}
              </button>
            </div>
            <div className="flex gap-4 text-sm">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="newCatType"
                  checked={newCategoryType === "ingreso"}
                  onChange={() => setNewCategoryType("ingreso")}
                  className="w-4 h-4"
                />
                <span>Ingreso</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="newCatType"
                  checked={newCategoryType === "gasto"}
                  onChange={() => setNewCategoryType("gasto")}
                  className="w-4 h-4"
                />
                <span>Gasto</span>
              </label>
            </div>
          </form>
          {errorCat && <p className="text-sm text-red-600 mb-2">{errorCat}</p>}
          <ul className="border border-[var(--border)] rounded-lg overflow-hidden divide-y divide-[var(--border)]">
            {categories.length === 0 ? (
              <li className="px-4 py-6 text-center text-sm text-[var(--muted)]">No hay categorías</li>
            ) : (
              categories.map((c) => (
              <CategoryRow
                key={c.id}
                category={c}
                onUpdated={load}
                onDeleted={() => setCategories((prev) => prev.filter((x) => x.id !== c.id))}
                setError={setErrorCat}
              />
            ))
            )}
          </ul>
        </div>

        <div className="bg-[var(--card)] rounded-xl border border-[var(--border)] shadow-sm p-6">
          <h2 className="text-base font-semibold text-[var(--foreground)] mb-4">Tipos de fruta</h2>
          <form onSubmit={addFruitType} className="flex gap-2 mb-4">
            <input
              type="text"
              value={newFruit}
              onChange={(e) => setNewFruit(e.target.value)}
              placeholder="Nuevo tipo de fruta"
              className="flex-1 px-4 py-3 rounded-lg border border-[var(--border)] bg-white focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
            />
            <button
              type="submit"
              disabled={savingFruit || !newFruit.trim()}
              className="py-3 px-4 rounded-lg bg-[var(--primary)] text-white font-medium hover:opacity-90 disabled:opacity-60"
            >
              {savingFruit ? "…" : "Agregar"}
            </button>
          </form>
          {errorFruit && <p className="text-sm text-red-600 mb-2">{errorFruit}</p>}
          <ul className="border border-[var(--border)] rounded-lg overflow-hidden divide-y divide-[var(--border)]">
            {fruitTypes.length === 0 ? (
              <li className="px-4 py-6 text-center text-sm text-[var(--muted)]">No hay tipos de fruta</li>
            ) : (
              fruitTypes.map((f) => (
              <FruitTypeRow
                key={f.id}
                fruitType={f}
                onUpdated={load}
                onDeleted={() => setFruitTypes((prev) => prev.filter((x) => x.id !== f.id))}
                setError={setErrorFruit}
              />
            ))
            )}
          </ul>
        </div>

        <div className="bg-[var(--card)] rounded-xl border border-[var(--border)] shadow-sm p-6">
          <h2 className="text-base font-semibold text-[var(--foreground)] mb-4">Tipos de verdura</h2>
          <form onSubmit={addVegetableType} className="flex gap-2 mb-4">
            <input
              type="text"
              value={newVegetable}
              onChange={(e) => setNewVegetable(e.target.value)}
              placeholder="Nuevo tipo de verdura"
              className="flex-1 px-4 py-3 rounded-lg border border-[var(--border)] bg-white focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
            />
            <button
              type="submit"
              disabled={savingVegetable || !newVegetable.trim()}
              className="py-3 px-4 rounded-lg bg-[var(--primary)] text-white font-medium hover:opacity-90 disabled:opacity-60"
            >
              {savingVegetable ? "…" : "Agregar"}
            </button>
          </form>
          {errorVegetable && <p className="text-sm text-red-600 mb-2">{errorVegetable}</p>}
          <ul className="border border-[var(--border)] rounded-lg overflow-hidden divide-y divide-[var(--border)]">
            {vegetableTypes.length === 0 ? (
              <li className="px-4 py-6 text-center text-sm text-[var(--muted)]">No hay tipos de verdura</li>
            ) : (
              vegetableTypes.map((v) => (
              <VegetableTypeRow
                key={v.id}
                vegetableType={v}
                onUpdated={load}
                onDeleted={() => setVegetableTypes((prev) => prev.filter((x) => x.id !== v.id))}
                setError={setErrorVegetable}
              />
            ))
            )}
          </ul>
        </div>
      </div>
    </div>
  );
}

function CategoryRow({
  category,
  onUpdated,
  onDeleted,
  setError,
}: {
  category: Category;
  onUpdated: () => void;
  onDeleted: () => void;
  setError: (s: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState(category.name);
  const [editType, setEditType] = useState<"ingreso" | "gasto">(category.type === "ingreso" ? "ingreso" : "gasto");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const router = useRouter();

  async function saveEdit() {
    const name = editName.trim();
    if (!name) {
      setEditing(false);
      return;
    }
    if (name === category.name && editType === category.type) {
      setEditing(false);
      return;
    }
    setSaving(true);
    setError("");
    const res = await fetch(`/api/categories/${category.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, type: editType }),
    });
    const data = await res.json();
    setSaving(false);
    if (res.ok) {
      setEditing(false);
      onUpdated();
      router.refresh();
    } else {
      setError(data.error || "Error al guardar");
    }
  }

  async function handleDelete() {
    setDeleting(true);
    setError("");
    const res = await fetch(`/api/categories/${category.id}`, { method: "DELETE" });
    const data = await res.json();
    setDeleting(false);
    setConfirmDelete(false);
    if (res.ok) {
      onDeleted();
      router.refresh();
    } else {
      setError(data.error || "Error al eliminar");
    }
  }

  if (confirmDelete) {
    return (
      <li className="flex items-center justify-between gap-2 px-4 py-3 text-sm bg-[var(--background)]/50">
        <span className="text-[var(--muted)]">¿Eliminar &quot;{category.name}&quot;?</span>
        <div className="flex gap-1">
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
            onClick={() => setConfirmDelete(false)}
            disabled={deleting}
            className="py-1 px-2 rounded text-xs font-medium border border-[var(--border)] hover:bg-[var(--border)]"
          >
            No
          </button>
        </div>
      </li>
    );
  }

  if (editing) {
    return (
      <li className="flex flex-wrap items-center gap-2 px-4 py-3 text-sm bg-[var(--background)]/50">
        <input
          type="text"
          value={editName}
          onChange={(e) => setEditName(e.target.value)}
          className="flex-1 min-w-[120px] px-2 py-1.5 rounded border border-[var(--border)] bg-white text-sm"
          autoFocus
        />
        <div className="flex gap-2 items-center">
          <label className="flex items-center gap-1 cursor-pointer">
            <input
              type="radio"
              name={`cat-type-${category.id}`}
              checked={editType === "ingreso"}
              onChange={() => setEditType("ingreso")}
              className="w-3.5 h-3.5"
            />
            <span>Ingreso</span>
          </label>
          <label className="flex items-center gap-1 cursor-pointer">
            <input
              type="radio"
              name={`cat-type-${category.id}`}
              checked={editType === "gasto"}
              onChange={() => setEditType("gasto")}
              className="w-3.5 h-3.5"
            />
            <span>Gasto</span>
          </label>
        </div>
        <button
          type="button"
          onClick={saveEdit}
          disabled={saving || !editName.trim()}
          className="py-1 px-2 rounded text-xs font-medium bg-[var(--primary)] text-white disabled:opacity-50"
        >
          {saving ? "…" : "Guardar"}
        </button>
        <button
          type="button"
          onClick={() => { setEditing(false); setEditName(category.name); setEditType(category.type === "ingreso" ? "ingreso" : "gasto"); }}
          disabled={saving}
          className="py-1 px-2 rounded text-xs font-medium border border-[var(--border)] hover:bg-[var(--border)]"
        >
          Cancelar
        </button>
      </li>
    );
  }

  return (
    <li className="flex items-center justify-between gap-2 px-4 py-3 text-sm hover:bg-[var(--background)]/30 transition-colors">
      <span className="text-[var(--foreground)] min-w-0 flex-1 font-medium">{category.name}</span>
      <span className={`shrink-0 w-16 text-center text-xs font-medium px-1.5 py-0.5 rounded ${category.type === "ingreso" ? "bg-[var(--ingreso)]/20 text-[var(--ingreso)]" : "bg-[var(--gasto)]/20 text-[var(--gasto)]"}`}>
        {category.type === "ingreso" ? "Ingreso" : "Gasto"}
      </span>
      <div className="flex gap-1 shrink-0">
        <button
          type="button"
          onClick={() => { setEditing(true); setEditName(category.name); }}
          className="py-1 px-2 rounded text-[var(--primary)] hover:bg-[var(--border)] text-xs font-medium"
        >
          Editar
        </button>
        <button
          type="button"
          onClick={() => setConfirmDelete(true)}
          className="py-1 px-2 rounded text-red-600 hover:bg-red-50 text-xs font-medium"
        >
          Eliminar
        </button>
      </div>
    </li>
  );
}

function FruitTypeRow({
  fruitType,
  onUpdated,
  onDeleted,
  setError,
}: {
  fruitType: FruitType;
  onUpdated: () => void;
  onDeleted: () => void;
  setError: (s: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState(fruitType.name);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const router = useRouter();

  async function saveEdit() {
    const name = editName.trim();
    if (!name || name === fruitType.name) {
      setEditing(false);
      return;
    }
    setSaving(true);
    setError("");
    const res = await fetch(`/api/fruit-types/${fruitType.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    const data = await res.json();
    setSaving(false);
    if (res.ok) {
      setEditing(false);
      onUpdated();
      router.refresh();
    } else {
      setError(data.error || "Error al guardar");
    }
  }

  async function handleDelete() {
    setDeleting(true);
    setError("");
    const res = await fetch(`/api/fruit-types/${fruitType.id}`, { method: "DELETE" });
    const data = await res.json();
    setDeleting(false);
    setConfirmDelete(false);
    if (res.ok) {
      onDeleted();
      router.refresh();
    } else {
      setError(data.error || "Error al eliminar");
    }
  }

  if (confirmDelete) {
    return (
      <li className="flex items-center justify-between gap-2 px-4 py-3 text-sm bg-[var(--background)]/50">
        <span className="text-[var(--muted)]">¿Eliminar &quot;{fruitType.name}&quot;? (Las entradas quedarán sin tipo de fruta)</span>
        <div className="flex gap-1">
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
            onClick={() => setConfirmDelete(false)}
            disabled={deleting}
            className="py-1 px-2 rounded text-xs font-medium border border-[var(--border)] hover:bg-[var(--border)]"
          >
            No
          </button>
        </div>
      </li>
    );
  }

  if (editing) {
    return (
      <li className="flex items-center gap-2 px-4 py-3 text-sm bg-[var(--background)]/50">
        <input
          type="text"
          value={editName}
          onChange={(e) => setEditName(e.target.value)}
          className="flex-1 px-2 py-1.5 rounded border border-[var(--border)] bg-white text-sm"
          autoFocus
        />
        <button
          type="button"
          onClick={saveEdit}
          disabled={saving || !editName.trim()}
          className="py-1 px-2 rounded text-xs font-medium bg-[var(--primary)] text-white disabled:opacity-50"
        >
          {saving ? "…" : "Guardar"}
        </button>
        <button
          type="button"
          onClick={() => { setEditing(false); setEditName(fruitType.name); }}
          disabled={saving}
          className="py-1 px-2 rounded text-xs font-medium border border-[var(--border)] hover:bg-[var(--border)]"
        >
          Cancelar
        </button>
      </li>
    );
  }

  return (
    <li className="flex items-center justify-between gap-2 px-4 py-3 text-sm hover:bg-[var(--background)]/30 transition-colors">
      <span className="text-[var(--foreground)] font-medium">{fruitType.name}</span>
      <div className="flex gap-1">
        <button
          type="button"
          onClick={() => { setEditing(true); setEditName(fruitType.name); }}
          className="py-1 px-2 rounded text-[var(--primary)] hover:bg-[var(--border)] text-xs font-medium"
        >
          Editar
        </button>
        <button
          type="button"
          onClick={() => setConfirmDelete(true)}
          className="py-1 px-2 rounded text-red-600 hover:bg-red-50 text-xs font-medium"
        >
          Eliminar
        </button>
      </div>
    </li>
  );
}

function VegetableTypeRow({
  vegetableType,
  onUpdated,
  onDeleted,
  setError,
}: {
  vegetableType: VegetableType;
  onUpdated: () => void;
  onDeleted: () => void;
  setError: (s: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState(vegetableType.name);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const router = useRouter();

  async function saveEdit() {
    const name = editName.trim();
    if (!name || name === vegetableType.name) {
      setEditing(false);
      return;
    }
    setSaving(true);
    setError("");
    const res = await fetch(`/api/vegetable-types/${vegetableType.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    const data = await res.json();
    setSaving(false);
    if (res.ok) {
      setEditing(false);
      onUpdated();
      router.refresh();
    } else {
      setError(data.error || "Error al guardar");
    }
  }

  async function handleDelete() {
    setDeleting(true);
    setError("");
    const res = await fetch(`/api/vegetable-types/${vegetableType.id}`, { method: "DELETE" });
    const data = await res.json();
    setDeleting(false);
    setConfirmDelete(false);
    if (res.ok) {
      onDeleted();
      router.refresh();
    } else {
      setError(data.error || "Error al eliminar");
    }
  }

  if (confirmDelete) {
    return (
      <li className="flex items-center justify-between gap-2 px-4 py-3 text-sm bg-[var(--background)]/50">
        <span className="text-[var(--muted)]">¿Eliminar &quot;{vegetableType.name}&quot;? (Las entradas quedarán sin tipo de verdura)</span>
        <div className="flex gap-1">
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
            onClick={() => setConfirmDelete(false)}
            disabled={deleting}
            className="py-1 px-2 rounded text-xs font-medium border border-[var(--border)] hover:bg-[var(--border)]"
          >
            No
          </button>
        </div>
      </li>
    );
  }

  if (editing) {
    return (
      <li className="flex items-center gap-2 px-4 py-3 text-sm bg-[var(--background)]/50">
        <input
          type="text"
          value={editName}
          onChange={(e) => setEditName(e.target.value)}
          className="flex-1 px-2 py-1.5 rounded border border-[var(--border)] bg-white text-sm"
          autoFocus
        />
        <button
          type="button"
          onClick={saveEdit}
          disabled={saving || !editName.trim()}
          className="py-1 px-2 rounded text-xs font-medium bg-[var(--primary)] text-white disabled:opacity-50"
        >
          {saving ? "…" : "Guardar"}
        </button>
        <button
          type="button"
          onClick={() => { setEditing(false); setEditName(vegetableType.name); }}
          disabled={saving}
          className="py-1 px-2 rounded text-xs font-medium border border-[var(--border)] hover:bg-[var(--border)]"
        >
          Cancelar
        </button>
      </li>
    );
  }

  return (
    <li className="flex items-center justify-between gap-2 px-4 py-3 text-sm hover:bg-[var(--background)]/30 transition-colors">
      <span className="text-[var(--foreground)] font-medium">{vegetableType.name}</span>
      <div className="flex gap-1">
        <button
          type="button"
          onClick={() => { setEditing(true); setEditName(vegetableType.name); }}
          className="py-1 px-2 rounded text-[var(--primary)] hover:bg-[var(--border)] text-xs font-medium"
        >
          Editar
        </button>
        <button
          type="button"
          onClick={() => setConfirmDelete(true)}
          className="py-1 px-2 rounded text-red-600 hover:bg-red-50 text-xs font-medium"
        >
          Eliminar
        </button>
      </div>
    </li>
  );
}
