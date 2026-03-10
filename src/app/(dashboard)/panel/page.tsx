/**
 * Panel de control: rango de fechas, totales, resumen por categoría e informe (exportar CSV).
 */
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Suspense } from "react";
import DashboardDateFilter from "../dashboard/DashboardDateFilter";
import ExportInformeCsv from "../dashboard/ExportInformeCsv";

function formatMoney(amount: number, currency: string) {
  return new Intl.NumberFormat("es-UY", {
    style: "currency",
    currency: currency === "USD" ? "USD" : "UYU",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export default async function PanelPage({
  searchParams,
}: {
  searchParams: Promise<{ dateFrom?: string; dateTo?: string }>;
}) {
  await auth();
  const params = await searchParams;
  const dateFrom = params.dateFrom ? new Date(params.dateFrom) : null;
  const dateTo = params.dateTo ? new Date(params.dateTo) : null;

  const where: { date?: { gte?: Date; lte?: Date } } = {};
  if (dateFrom && !Number.isNaN(dateFrom.getTime())) where.date = { ...where.date, gte: dateFrom };
  if (dateTo && !Number.isNaN(dateTo.getTime())) where.date = { ...where.date, lte: dateTo };

  const all = await prisma.entry.findMany({
    where,
    include: { category: { select: { name: true } } },
  });

  const byCurrency = { UYU: { ingreso: 0, gasto: 0 }, USD: { ingreso: 0, gasto: 0 } };
  for (const e of all) {
    const c = e.currency === "USD" ? "USD" : "UYU";
    if (e.type === "ingreso") byCurrency[c].ingreso += e.amount;
    else byCurrency[c].gasto += e.amount;
  }
  const balanceUYU = byCurrency.UYU.ingreso - byCurrency.UYU.gasto;
  const balanceUSD = byCurrency.USD.ingreso - byCurrency.USD.gasto;

  const byCategory: Record<string, { UYU: { ingreso: number; gasto: number }; USD: { ingreso: number; gasto: number } }> = {};
  for (const e of all) {
    const cat = e.category.name;
    if (!byCategory[cat]) byCategory[cat] = { UYU: { ingreso: 0, gasto: 0 }, USD: { ingreso: 0, gasto: 0 } };
    const c = e.currency === "USD" ? "USD" : "UYU";
    if (e.type === "ingreso") byCategory[cat][c].ingreso += e.amount;
    else byCategory[cat][c].gasto += e.amount;
  }
  const categories = Object.entries(byCategory).sort(
    (a, b) =>
      b[1].UYU.ingreso + b[1].UYU.gasto + b[1].USD.ingreso + b[1].USD.gasto -
      (a[1].UYU.ingreso + a[1].UYU.gasto + a[1].USD.ingreso + a[1].USD.gasto)
  );

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-bold text-[var(--primary)] tracking-tight">Panel de control</h1>
      </header>

      <section className="bg-[var(--card)] rounded-xl border border-[var(--border)] shadow-sm p-5">
        <h2 className="text-base font-semibold text-[var(--foreground)] mb-3">Rango de fechas</h2>
        <Suspense fallback={null}>
          <DashboardDateFilter basePath="/panel" />
        </Suspense>
      </section>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[var(--card)] rounded-xl border border-[var(--border)] shadow-sm p-5">
          <p className="text-sm text-[var(--muted)]">Ingresos (UYU)</p>
          <p className="text-xl font-semibold text-[var(--ingreso)]">{formatMoney(byCurrency.UYU.ingreso, "UYU")}</p>
        </div>
        <div className="bg-[var(--card)] rounded-xl border border-[var(--border)] shadow-sm p-5">
          <p className="text-sm text-[var(--muted)]">Gastos (UYU)</p>
          <p className="text-xl font-semibold text-[var(--gasto)]">{formatMoney(byCurrency.UYU.gasto, "UYU")}</p>
        </div>
        <div className="bg-[var(--card)] rounded-xl border border-[var(--border)] shadow-sm p-5">
          <p className="text-sm text-[var(--muted)]">Ingresos (USD)</p>
          <p className="text-xl font-semibold text-[var(--ingreso)]">{formatMoney(byCurrency.USD.ingreso, "USD")}</p>
        </div>
        <div className="bg-[var(--card)] rounded-xl border border-[var(--border)] shadow-sm p-5">
          <p className="text-sm text-[var(--muted)]">Gastos (USD)</p>
          <p className="text-xl font-semibold text-[var(--gasto)]">{formatMoney(byCurrency.USD.gasto, "USD")}</p>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-[var(--card)] rounded-xl border border-[var(--border)] shadow-sm p-5">
          <p className="text-sm text-[var(--muted)]">Balance UYU</p>
          <p className={`text-xl font-semibold ${balanceUYU >= 0 ? "text-[var(--ingreso)]" : "text-[var(--gasto)]"}`}>
            {formatMoney(balanceUYU, "UYU")}
          </p>
        </div>
        <div className="bg-[var(--card)] rounded-xl border border-[var(--border)] shadow-sm p-5">
          <p className="text-sm text-[var(--muted)]">Balance USD</p>
          <p className={`text-xl font-semibold ${balanceUSD >= 0 ? "text-[var(--ingreso)]" : "text-[var(--gasto)]"}`}>
            {formatMoney(balanceUSD, "USD")}
          </p>
        </div>
      </div>

      <section className="bg-[var(--card)] rounded-xl border border-[var(--border)] shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-[var(--border)] bg-[var(--background)]/50">
          <h2 className="text-base font-semibold text-[var(--foreground)]">Resumen por categoría</h2>
        </div>
        <ul className="divide-y divide-[var(--border)]">
          {categories.slice(0, 8).map(([cat, v]) => (
            <li key={cat} className="px-4 py-3 flex justify-between items-center text-sm flex-wrap gap-1">
              <span className="text-[var(--foreground)]">{cat}</span>
              <span className="text-[var(--muted)]">
                UYU: +{formatMoney(v.UYU.ingreso, "UYU")} / −{formatMoney(v.UYU.gasto, "UYU")}
                {v.USD.ingreso + v.USD.gasto > 0 && (
                  <> · USD: +{formatMoney(v.USD.ingreso, "USD")} / −{formatMoney(v.USD.gasto, "USD")}</>
                )}
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section className="bg-[var(--card)] rounded-xl border border-[var(--border)] shadow-sm p-5">
        <h2 className="text-base font-semibold text-[var(--foreground)] mb-3">Informe</h2>
        <p className="text-sm text-[var(--muted)] mb-3">
          Exporta las entradas del rango de fechas seleccionado arriba en formato CSV.
        </p>
        <ExportInformeCsv dateFrom={params.dateFrom} dateTo={params.dateTo} />
      </section>
    </div>
  );
}
