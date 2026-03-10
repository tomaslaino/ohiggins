/**
 * Förstasida: O'Higgins + Hola användare + Últimas entradas (senaste 10, ingen datumfilter).
 */
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";

function formatMoney(amount: number, currency: string) {
  return new Intl.NumberFormat("es-UY", {
    style: "currency",
    currency: currency === "USD" ? "USD" : "UYU",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDate(d: Date) {
  return new Intl.DateTimeFormat("es-UY", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(d);
}

function formatDateTime(d: Date) {
  return new Intl.DateTimeFormat("es-UY", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

export default async function DashboardPage() {
  const session = await auth();

  const entries = await prisma.entry.findMany({
    orderBy: { createdAt: "desc" },
    take: 10,
    include: {
      createdBy: { select: { id: true, name: true } },
      category: { select: { name: true } },
      fruitType: { select: { name: true } },
      vegetableType: { select: { name: true } },
    },
  });

  return (
    <div className="space-y-8">
      <section className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-8 items-center">
        <div className="flex flex-col justify-center min-h-[160px] py-6 lg:py-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-[var(--primary)] tracking-tight">
            O&apos;Higgins y Las Huertas
          </h1>
          <p className="mt-4 text-lg sm:text-xl text-[var(--foreground)]/90 font-medium">
            Hola{session?.user?.name ? `, ${session.user.name}` : ""}.
          </p>
        </div>

        <div className="bg-[var(--card)] rounded-xl border border-[var(--border)] overflow-hidden shadow-sm">
          <div className="px-4 py-3 border-b border-[var(--border)] flex justify-between items-center bg-[var(--background)]/50">
            <h2 className="font-medium text-[var(--foreground)]">Últimas entradas</h2>
            <Link href="/entradas" className="text-sm text-[var(--primary)] hover:underline">
              Ver todo
            </Link>
          </div>
          <ul className="divide-y divide-[var(--border)] max-h-[320px] overflow-y-auto">
            {entries.length === 0 ? (
              <li className="px-4 py-6 text-center text-[var(--muted)]">No hay entradas aún.</li>
            ) : (
              entries.map((e) => {
                const canEdit =
                  session?.user?.role === "ADMIN" ||
                  (session?.user?.id && session.user.id === e.createdById);
                const content = (
                  <>
                    <div className="min-w-0">
                      <p className="font-medium text-[var(--foreground)]">{e.description}</p>
                      <p className="text-[var(--muted)]">
                        {formatDate(e.date)} · {e.createdBy?.name ?? "—"}
                        {e.category.name ? ` · ${e.category.name}` : ""}
                        {e.fruitType ? ` · ${e.fruitType.name}` : ""}
                        {e.vegetableType ? ` · ${e.vegetableType.name}` : ""}
                      </p>
                      <p className="text-xs text-[var(--muted)] mt-0.5">
                        {e.createdAt ? `Registrado: ${formatDateTime(e.createdAt)}` : null}
                        {e.updatedAt && e.createdAt && e.updatedAt.getTime() > e.createdAt.getTime() && (
                          <> · Editado: {formatDateTime(e.updatedAt)}</>
                        )}
                      </p>
                    </div>
                    <span
                      className={`shrink-0 font-medium ${
                        e.type === "ingreso" ? "text-[var(--ingreso)]" : "text-[var(--gasto)]"
                      }`}
                    >
                      {e.type === "ingreso" ? "+" : "−"} {formatMoney(e.amount, e.currency)}
                    </span>
                  </>
                );
                return (
                  <li key={e.id} className="text-sm">
                    {canEdit ? (
                      <Link
                        href={`/entradas/${e.id}/editar`}
                        className="px-4 py-3 flex justify-between items-start gap-2 hover:bg-[var(--border)]/50 transition-colors"
                        aria-label="Editar entrada"
                      >
                        {content}
                      </Link>
                    ) : (
                      <div className="px-4 py-3 flex justify-between items-start gap-2">
                        {content}
                      </div>
                    )}
                  </li>
                );
              })
            )}
          </ul>
        </div>
      </section>
    </div>
  );
}
