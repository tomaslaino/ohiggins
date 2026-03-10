/**
 * API: get (GET), update (PATCH), delete (DELETE) current user's account.
 * DELETE: user is removed; their entries remain with createdById = null (admin can still see/edit).
 */
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import * as bcrypt from "bcryptjs";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, email: true, name: true, role: true, createdAt: true },
  });
  if (!user) {
    return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
  }
  return NextResponse.json(user);
}

export async function PATCH(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Cuerpo inválido" }, { status: 400 });
  }
  const b = body as Record<string, unknown>;
  const name = b.name != null ? String(b.name).trim() : null;
  const email = b.email != null ? String(b.email).trim().toLowerCase() : null;
  const password = b.password != null ? String(b.password) : null;

  const updates: { name?: string; email?: string; password?: string } = {};
  if (name !== null) {
    if (!name) {
      return NextResponse.json({ error: "El nombre no puede estar vacío" }, { status: 400 });
    }
    updates.name = name;
  }
  if (email !== null) {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "Correo inválido" }, { status: 400 });
    }
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing && existing.id !== session.user.id) {
      return NextResponse.json({ error: "Ya existe un usuario con este correo" }, { status: 400 });
    }
    updates.email = email;
  }
  if (password !== null && password !== "") {
    if (String(password).length < 8) {
      return NextResponse.json({ error: "La contraseña debe tener al menos 8 caracteres" }, { status: 400 });
    }
    updates.password = await bcrypt.hash(String(password), 10);
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "Nada que actualizar" }, { status: 400 });
  }

  const user = await prisma.user.update({
    where: { id: session.user.id },
    data: updates,
    select: { id: true, email: true, name: true, role: true, createdAt: true },
  });
  return NextResponse.json(user);
}

export async function DELETE() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  await prisma.user.delete({
    where: { id: session.user.id },
  });
  return NextResponse.json({ ok: true });
}
