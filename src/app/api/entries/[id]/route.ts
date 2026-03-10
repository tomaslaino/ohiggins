/**
 * API: get (GET), update (PATCH), delete (DELETE) a single entry.
 */
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { CURRENCIES, ENTRY_TYPES, PAYMENT_METHODS } from "@/lib/constants";

const TYPE_SET = new Set<string>(ENTRY_TYPES.map((t) => t.value));
const PAYMENT_SET = new Set<string>(PAYMENT_METHODS.map((p) => p.value));
const CURRENCY_SET = new Set<string>(CURRENCIES.map((c) => c.value));

const include = {
  createdBy: { select: { name: true } },
  category: { select: { id: true, name: true, type: true } },
  fruitType: { select: { id: true, name: true } },
  vegetableType: { select: { id: true, name: true } },
} as const;

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  const { id } = await params;
  const entry = await prisma.entry.findUnique({
    where: { id },
    include,
  });
  if (!entry) {
    return NextResponse.json({ error: "Entrada no encontrada" }, { status: 404 });
  }
  return NextResponse.json(entry);
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  const { id } = await params;
  const existing = await prisma.entry.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Entrada no encontrada" }, { status: 404 });
  }
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Cuerpo inválido" }, { status: 400 });
  }
  const b = body as Record<string, unknown>;
  const date = b.date != null ? new Date(String(b.date)) : existing.date;
  const type = b.type != null ? String(b.type) : existing.type;
  const categoryId = b.categoryId != null ? String(b.categoryId).trim() : existing.categoryId;
  const fruitTypeId = b.fruitTypeId != null ? (String(b.fruitTypeId).trim() || null) : existing.fruitTypeId;
  const vegetableTypeId = b.vegetableTypeId !== undefined ? (b.vegetableTypeId != null ? String(b.vegetableTypeId).trim() || null : null) : existing.vegetableTypeId;
  const otroDetalle = b.otroDetalle !== undefined ? (b.otroDetalle != null ? String(b.otroDetalle).trim() || null : null) : existing.otroDetalle;
  const currency = b.currency != null ? String(b.currency).trim() : existing.currency;
  const amount = b.amount != null ? Number(b.amount) : existing.amount;
  const description = b.description != null ? String(b.description).trim() : existing.description;
  const notes = b.notes !== undefined ? (b.notes != null ? String(b.notes).trim() || null : null) : existing.notes;
  const paymentMethod = b.paymentMethod !== undefined ? (b.paymentMethod != null ? String(b.paymentMethod).trim() || null : null) : existing.paymentMethod;

  if (!TYPE_SET.has(type)) {
    return NextResponse.json({ error: "Tipo inválido" }, { status: 400 });
  }
  if (!CURRENCY_SET.has(currency)) {
    return NextResponse.json({ error: "Moneda inválida" }, { status: 400 });
  }
  const categoryExists = await prisma.category.findUnique({ where: { id: categoryId } });
  if (!categoryExists) {
    return NextResponse.json({ error: "Categoría no encontrada" }, { status: 400 });
  }
  if (categoryExists.type !== type) {
    return NextResponse.json(
      { error: "La categoría elegida no corresponde al tipo de entrada (ingreso/gasto)" },
      { status: 400 }
    );
  }
  if (fruitTypeId) {
    const fruitExists = await prisma.fruitType.findUnique({ where: { id: fruitTypeId } });
    if (!fruitExists) {
      return NextResponse.json({ error: "Tipo de fruta no encontrado" }, { status: 400 });
    }
  }
  if (vegetableTypeId) {
    const vegExists = await prisma.vegetableType.findUnique({ where: { id: vegetableTypeId } });
    if (!vegExists) {
      return NextResponse.json({ error: "Tipo de verdura no encontrado" }, { status: 400 });
    }
  }
  if (Number.isNaN(amount) || amount < 0) {
    return NextResponse.json({ error: "Monto debe ser un número positivo" }, { status: 400 });
  }
  if (paymentMethod && !PAYMENT_SET.has(paymentMethod)) {
    return NextResponse.json({ error: "Método de pago inválido" }, { status: 400 });
  }
  if (Number.isNaN(date.getTime())) {
    return NextResponse.json({ error: "Fecha inválida" }, { status: 400 });
  }

  const entry = await prisma.entry.update({
    where: { id },
    data: {
      date,
      type,
      categoryId,
      fruitTypeId,
      vegetableTypeId,
      otroDetalle,
      amount,
      currency,
      description,
      notes,
      paymentMethod,
    },
    include,
  });
  return NextResponse.json(entry);
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
  const existing = await prisma.entry.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Entrada no encontrada" }, { status: 404 });
  }
  await prisma.entry.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
