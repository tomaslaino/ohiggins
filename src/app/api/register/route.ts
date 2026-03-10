/**
 * API: public registration endpoint for normal users (Usuario).
 * Creates a user with role "USUARIO". It is NOT possible to create admins here.
 */
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import * as bcrypt from "bcryptjs";

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Cuerpo inválido" }, { status: 400 });
  }

  const b = body as Record<string, unknown>;
  const firstName = b.firstName != null ? String(b.firstName).trim() : "";
  const lastName = b.lastName != null ? String(b.lastName).trim() : "";
  const name = [firstName, lastName].filter(Boolean).join(" ") || "";
  const email = b.email != null ? String(b.email).trim().toLowerCase() : "";
  const password = b.password != null ? String(b.password) : "";
  const confirmPassword = b.confirmPassword != null ? String(b.confirmPassword) : "";

  if (!name || !email || !password || !confirmPassword) {
    return NextResponse.json(
      { error: "Nombre, apellido, correo y contraseña son obligatorios." },
      { status: 400 }
    );
  }
  if (!isValidEmail(email)) {
    return NextResponse.json({ error: "Correo inválido." }, { status: 400 });
  }
  if (password.length < 8) {
    return NextResponse.json(
      { error: "La contraseña debe tener al menos 8 caracteres." },
      { status: 400 }
    );
  }
  if (password !== confirmPassword) {
    return NextResponse.json(
      { error: "Las contraseñas no coinciden." },
      { status: 400 }
    );
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json(
      { error: "Ya existe un usuario con este correo." },
      { status: 400 }
    );
  }

  const hashed = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: {
      name,
      email,
      password: hashed,
      role: "USUARIO",
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
    },
  });

  return NextResponse.json(user, { status: 201 });
}

