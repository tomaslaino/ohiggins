"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";

type Props = { basePath?: string };

export default function DashboardDateFilter({ basePath = "/dashboard" }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const dateFrom = searchParams.get("dateFrom") ?? "";
  const dateTo = searchParams.get("dateTo") ?? "";

  const update = useCallback(
    (from: string, to: string) => {
      const p = new URLSearchParams(searchParams);
      if (from) p.set("dateFrom", from);
      else p.delete("dateFrom");
      if (to) p.set("dateTo", to);
      else p.delete("dateTo");
      router.push(`${basePath}?${p}`);
    },
    [router, searchParams, basePath]
  );

  return (
    <div className="flex flex-wrap items-end gap-3 mb-4">
      <div>
        <label className="block text-xs font-medium text-[var(--muted)] mb-1">Desde</label>
        <input
          type="date"
          value={dateFrom}
          onChange={(e) => update(e.target.value, dateTo)}
          className="px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--card)] text-sm"
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-[var(--muted)] mb-1">Hasta</label>
        <input
          type="date"
          value={dateTo}
          onChange={(e) => update(dateFrom, e.target.value)}
          className="px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--card)] text-sm"
        />
      </div>
      {(dateFrom || dateTo) && (
        <button
          type="button"
          onClick={() => update("", "")}
          className="py-2 px-3 rounded-lg text-sm text-[var(--muted)] hover:bg-[var(--border)]"
        >
          Ver todo
        </button>
      )}
    </div>
  );
}
