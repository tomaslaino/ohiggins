"use client";

import { useState } from "react";

type Entry = {
  date: string;
  type: string;
  category: { name: string };
  fruitType: { name: string } | null;
  vegetableType: { name: string } | null;
  otroDetalle: string | null;
  amount: number;
  currency: string;
  description: string;
  createdBy: { name: string } | null;
};

export default function ExportInformeCsv({
  dateFrom,
  dateTo,
}: {
  dateFrom?: string;
  dateTo?: string;
}) {
  const [exporting, setExporting] = useState(false);

  async function exportCsv() {
    setExporting(true);
    const params = new URLSearchParams();
    if (dateFrom) params.set("dateFrom", dateFrom);
    if (dateTo) params.set("dateTo", dateTo);
    const res = await fetch(`/api/entries?${params}`);
    const entries: Entry[] = res.ok ? await res.json() : [];
    setExporting(false);
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
    a.download = `informe-${dateFrom || "desde"}-${dateTo || "hasta"}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <button
      type="button"
      onClick={exportCsv}
      disabled={exporting}
      className="py-2 px-4 rounded-lg border border-[var(--border)] bg-[var(--card)] text-sm font-medium text-[var(--foreground)] hover:bg-[var(--border)] disabled:opacity-50"
    >
      {exporting ? "Exportando…" : "Exportar informe CSV"}
    </button>
  );
}
