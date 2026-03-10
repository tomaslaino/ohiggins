import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center px-4">
      <div className="max-w-md w-full text-center space-y-6">
        <h1 className="text-2xl font-bold text-[var(--foreground)]">
          Página no encontrada
        </h1>
        <p className="text-[var(--muted)]">
          La ruta que buscas no existe o ha sido movida.
        </p>
        <Link
          href="/dashboard"
          className="inline-block py-3 px-5 rounded-lg bg-[var(--primary)] text-white font-medium hover:opacity-90 transition-opacity"
        >
          Ir al inicio
        </Link>
      </div>
    </div>
  );
}
