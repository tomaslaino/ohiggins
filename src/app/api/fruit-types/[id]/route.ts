/**
 * API: update (PATCH) and delete (DELETE) a fruit type.
 * On delete, entries that used this fruit type get fruitTypeId set to null.
 */
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  const { id } = await params;
  const existing = await prisma.fruitType.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Tipo de fruta no encontrado" }, { status: 404 });
  }
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Cuerpo inválido" }, { status: 400 });
  }
  const name = typeof (body as { name?: unknown }).name === "string"
    ? (body as { name: string }).name.trim()
    : "";
  if (!name) {
    return NextResponse.json({ error: "El nombre es obligatorio" }, { status: 400 });
  }
  const other = await prisma.fruitType.findUnique({ where: { name } });
  if (other && other.id !== id) {
    return NextResponse.json({ error: "Ya existe un tipo de fruta con ese nombre" }, { status: 400 });
  }
  const fruitType = await prisma.fruitType.update({
    where: { id },
    data: { name },
  });
  return NextResponse.json(fruitType);
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  const { id } = await params;
  const existing = await prisma.fruitType.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Tipo de fruta no encontrado" }, { status: 404 });
  }
  await prisma.fruitType.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
