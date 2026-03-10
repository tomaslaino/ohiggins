/**
 * API: update (PATCH) and delete (DELETE) a category.
 * Delete only allowed if no entries use this category.
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
  const existing = await prisma.category.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Categoría no encontrada" }, { status: 404 });
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
  const type = typeof (body as { type?: unknown }).type === "string"
    ? (body as { type: string }).type.trim().toLowerCase()
    : "";
  if (!name) {
    return NextResponse.json({ error: "El nombre es obligatorio" }, { status: 400 });
  }
  if (!["ingreso", "gasto"].includes(type)) {
    return NextResponse.json({ error: "El tipo debe ser 'ingreso' o 'gasto'" }, { status: 400 });
  }
  const other = await prisma.category.findUnique({ where: { name_type: { name, type } } });
  if (other && other.id !== id) {
    return NextResponse.json({ error: "Ya existe una categoría con ese nombre para ese tipo" }, { status: 400 });
  }
  const category = await prisma.category.update({
    where: { id },
    data: { name, type },
  });
  return NextResponse.json(category);
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
  const existing = await prisma.category.findUnique({
    where: { id },
    include: { _count: { select: { entries: true } } },
  });
  if (!existing) {
    return NextResponse.json({ error: "Categoría no encontrada" }, { status: 404 });
  }
  if (existing._count.entries > 0) {
    return NextResponse.json(
      { error: "No se puede eliminar: hay entradas que usan esta categoría. Cambia o elimina esas entradas primero." },
      { status: 400 }
    );
  }
  await prisma.category.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
