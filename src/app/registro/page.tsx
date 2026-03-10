"use client";

import { useState } from "react";
import Link from "next/link";

export default function RegistroPage() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);
    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          email: email.trim().toLowerCase(),
          password,
          confirmPassword,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Error al crear la cuenta.");
      } else {
        const displayName = firstName.trim() || data.name?.split(" ")[0] || "usuario";
        setSuccess(`Cuenta creada. Bienvenido, ${displayName}. Ahora puedes iniciar sesión.`);
        setFirstName("");
        setLastName("");
        setEmail("");
        setPassword("");
        setConfirmPassword("");
      }
    } catch {
      setError("Error de conexión.");
    }
    setLoading(false);
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-[var(--background)]">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-semibold text-[var(--primary)]">
            Crear cuenta de usuario
          </h1>
          <p className="mt-1 text-sm text-[var(--muted)]">
            Solo se crean cuentas tipo <span className="font-semibold">Usuario</span>. Los administradores se configuran aparte.
          </p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4 bg-[var(--card)] p-6 rounded-xl border border-[var(--border)] shadow-sm">
          <div>
            <label htmlFor="firstName" className="block text-sm font-medium text-[var(--foreground)] mb-1">
              Nombre (p. ej. Tomas)
            </label>
            <input
              id="firstName"
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              required
              autoComplete="given-name"
              className="w-full px-4 py-3 rounded-lg border border-[var(--border)] bg-white text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
              placeholder="Tu nombre"
            />
          </div>
          <div>
            <label htmlFor="lastName" className="block text-sm font-medium text-[var(--foreground)] mb-1">
              Apellido (p. ej. García)
            </label>
            <input
              id="lastName"
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              required
              autoComplete="family-name"
              className="w-full px-4 py-3 rounded-lg border border-[var(--border)] bg-white text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
              placeholder="Tu apellido"
            />
          </div>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-[var(--foreground)] mb-1">
              Correo electrónico
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-3 rounded-lg border border-[var(--border)] bg-white text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
              placeholder="tu@ejemplo.com"
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-[var(--foreground)] mb-1">
              Contraseña (mínimo 8 caracteres)
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              className="w-full px-4 py-3 rounded-lg border border-[var(--border)] bg-white text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
            />
          </div>
          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-[var(--foreground)] mb-1">
              Confirmar contraseña
            </label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={8}
              className="w-full px-4 py-3 rounded-lg border border-[var(--border)] bg-white text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
            />
          </div>
          {error && (
            <p className="text-sm text-red-600 bg-red-50 py-2 px-3 rounded-lg">{error}</p>
          )}
          {success && (
            <p className="text-sm text-green-700 bg-green-50 py-2 px-3 rounded-lg">{success}</p>
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 rounded-lg bg-[var(--primary)] text-white font-medium hover:bg-[var(--primary-light)] disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:ring-offset-2"
          >
            {loading ? "Creando…" : "Crear cuenta"}
          </button>
        </form>
        <p className="text-center text-xs text-[var(--muted)]">
          ¿Ya tienes cuenta?{" "}
          <Link href="/login" className="text-[var(--primary)] hover:underline">
            Iniciar sesión
          </Link>
        </p>
      </div>
    </div>
  );
}

