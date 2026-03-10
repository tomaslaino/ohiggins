"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    if (process.env.NODE_ENV === "development") {
      console.error(error);
    }
  }, [error]);

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center px-4">
      <div className="max-w-md w-full text-center space-y-6">
        <h1 className="text-2xl font-bold text-[var(--foreground)]">
          Algo salió mal
        </h1>
        <p className="text-[var(--muted)]">
          Ha ocurrido un error inesperado. Puedes intentar de nuevo o volver al inicio.
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <button
            type="button"
            onClick={reset}
            className="py-3 px-5 rounded-lg bg-[var(--primary)] text-white font-medium hover:opacity-90 transition-opacity"
          >
            Intentar de nuevo
          </button>
          <Link
            href="/dashboard"
            className="py-3 px-5 rounded-lg border border-[var(--border)] bg-[var(--card)] text-[var(--foreground)] font-medium hover:bg-[var(--border)] transition-colors"
          >
            Ir al inicio
          </Link>
        </div>
      </div>
    </div>
  );
}
