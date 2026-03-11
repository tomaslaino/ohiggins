"use client";

import { useState, Suspense } from "react";
import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";

function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [adminCode, setAdminCode] = useState("");
  const [showAdminCode, setShowAdminCode] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/dashboard";
  const registered = searchParams.get("registered") === "1";
  const registeredName = searchParams.get("name") ?? "";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await signIn("credentials", {
        email: email.trim().toLowerCase(),
        password,
        adminCode: adminCode.trim() || undefined,
        redirect: false,
        callbackUrl,
      });
      if (res?.error) {
        setError("Correo o contraseña incorrectos. Si eres administrador, revisa también tu código.");
        setLoading(false);
        return;
      }
      if (res?.url) window.location.href = res.url;
    } catch {
      setError("Error al iniciar sesión.");
    }
    setLoading(false);
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-[var(--background)]">
      <div className="w-full max-w-sm space-y-8">
        <div className="text-center">
          <h1 className="text-2xl font-semibold text-[var(--primary)]">
            O&apos;Higgins y Las Huertas
          </h1>
          <p className="mt-1 text-sm text-[var(--muted)]">
            Contabilidad para la producción ecológica
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 bg-[var(--card)] p-6 rounded-xl border border-[var(--border)] shadow-sm">
          {registered && (
            <p className="text-sm text-green-700 bg-green-50 py-2 px-3 rounded-lg">
              {registeredName
                ? `Cuenta creada. Bienvenido, ${registeredName}. Ahora puedes iniciar sesión.`
                : "Cuenta creada. Ahora puedes iniciar sesión."}
            </p>
          )}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-[var(--foreground)] mb-1">
              Correo electrónico
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-3 rounded-lg border border-[var(--border)] bg-white text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
              placeholder="tu@ejemplo.com"
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-[var(--foreground)] mb-1">
              Contraseña
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-3 rounded-lg border border-[var(--border)] bg-white text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
            />
          </div>
          <div className="space-y-2">
            <button
              type="button"
              onClick={() => setShowAdminCode((v) => !v)}
              className="text-xs text-[var(--primary)] hover:underline"
            >
              {showAdminCode ? "Ocultar campo de código de administrador" : "¿Eres administrador? Mostrar campo de código"}
            </button>
            {showAdminCode && (
              <div>
                <label htmlFor="adminCode" className="block text-sm font-medium text-[var(--foreground)] mb-1">
                  Código de administrador
                </label>
                <input
                  id="adminCode"
                  type="password"
                  autoComplete="off"
                  value={adminCode}
                  onChange={(e) => setAdminCode(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border border-[var(--border)] bg-white text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                  placeholder="Solo si entras como administrador"
                />
                <p className="mt-1 text-xs text-[var(--muted)]">
                  Si no eres administrador, no necesitas rellenar este campo.
                </p>
              </div>
            )}
          </div>
          {error && (
            <p className="text-sm text-red-600 bg-red-50 py-2 px-3 rounded-lg">{error}</p>
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 rounded-lg bg-[var(--primary)] text-white font-medium hover:bg-[var(--primary-light)] disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:ring-offset-2"
          >
            {loading ? "Entrando…" : "Entrar"}
          </button>
        </form>

        <div className="space-y-1 text-center text-xs text-[var(--muted)]">
          <p>
            ¿No tienes cuenta?{" "}
            <a href="/registro" className="text-[var(--primary)] hover:underline">
              Crear cuenta de usuario
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center p-4 text-[var(--muted)]">Cargando…</div>}>
      <LoginForm />
    </Suspense>
  );
}
