/**
 * API: list (GET) and create (POST) entries.
 * GET: ?dateFrom=&dateTo=&categoryId=&fruitTypeId=&currency=&type=&q=
 * POST: JSON or multipart/form-data (with optional "image" file).
 */
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { CURRENCIES, ENTRY_TYPES, PAYMENT_METHODS } from "@/lib/constants";
import { saveEntryImage } from "@/lib/entry-image";

const include = {
  createdBy: { select: { name: true } },
  category: { select: { id: true, name: true, type: true } },
  fruitType: { select: { id: true, name: true } },
  vegetableType: { select: { id: true, name: true } },
} as const;

const TYPE_SET = new Set<string>(ENTRY_TYPES.map((t) => t.value));
const PAYMENT_SET = new Set<string>(PAYMENT_METHODS.map((p) => p.value));
const CURRENCY_SET = new Set<string>(CURRENCIES.map((c) => c.value));

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  const { searchParams } = new URL(req.url);
  const dateFrom = searchParams.get("dateFrom");
  const dateTo = searchParams.get("dateTo");
  const categoryId = searchParams.get("categoryId");
  const fruitTypeId = searchParams.get("fruitTypeId");
  const createdById = searchParams.get("createdById");
  const currency = searchParams.get("currency");
  const type = searchParams.get("type");
  const q = searchParams.get("q")?.trim();

  const where: {
    date?: { gte?: Date; lte?: Date };
    categoryId?: string;
    fruitTypeId?: string | null;
    createdById?: string;
    currency?: string;
    type?: string;
    OR?: Array<Record<string, unknown>>;
  } = {};
  if (dateFrom) {
    const d = new Date(dateFrom);
    if (!Number.isNaN(d.getTime())) where.date = { ...where.date, gte: d };
  }
  if (dateTo) {
    const d = new Date(dateTo);
    if (!Number.isNaN(d.getTime())) where.date = { ...where.date, lte: d };
  }
  if (categoryId) where.categoryId = categoryId;
  if (fruitTypeId) where.fruitTypeId = fruitTypeId;
  if (createdById && createdById.trim()) where.createdById = createdById.trim();
  if (currency) where.currency = currency;
  if (type) where.type = type;

  if (q && q.length > 0) {
    where.OR = [
      { description: { contains: q } },
      { category: { name: { contains: q } } },
      { fruitType: { name: { contains: q } } },
      { vegetableType: { name: { contains: q } } },
      { otroDetalle: { contains: q } },
      { createdBy: { name: { contains: q } } },
    ];
  }

  const entries = await prisma.entry.findMany({
    where,
    orderBy: { date: "desc" },
    include: {
      createdBy: { select: { name: true } },
      category: { select: { id: true, name: true, type: true } },
      fruitType: { select: { id: true, name: true } },
      vegetableType: { select: { id: true, name: true } },
    },
  });
  return NextResponse.json(entries);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  const contentType = req.headers.get("content-type") ?? "";
  let date: string | null;
  let type: string | null;
  let categoryId: string | null;
  let fruitTypeId: string | null;
  let vegetableTypeId: string | null;
  let otroDetalle: string | null;
  let currency: string;
  let amount: unknown;
  let description: string | null;
  let notes: string | null;
  let paymentMethod: string | null;
  let imageFile: File | null = null;

  if (contentType.includes("multipart/form-data")) {
    const formData = await req.formData();
    const b: Record<string, unknown> = {};
    formData.forEach((value, key) => {
      if (key !== "image" && typeof value === "string") b[key] = value;
    });
    date = (b.date != null ? String(b.date) : null) as string | null;
    type = b.type != null ? String(b.type) : null;
    categoryId = b.categoryId != null ? String(b.categoryId).trim() : null;
    fruitTypeId = b.fruitTypeId != null ? String(b.fruitTypeId).trim() || null : null;
    vegetableTypeId = b.vegetableTypeId != null ? String(b.vegetableTypeId).trim() || null : null;
    otroDetalle = b.otroDetalle != null ? String(b.otroDetalle).trim() || null : null;
    currency = b.currency != null ? String(b.currency).trim() : "UYU";
    amount = b.amount;
    description = b.description != null ? String(b.description).trim() : null;
    notes = b.notes != null ? String(b.notes).trim() || null : null;
    paymentMethod = b.paymentMethod != null ? String(b.paymentMethod).trim() || null : null;
    const img = formData.get("image");
    if (img instanceof File && img.size > 0) imageFile = img;
  } else {
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Cuerpo inválido" }, { status: 400 });
    }
    const b = body as Record<string, unknown>;
    date = b.date == null ? null : String(b.date);
    type = b.type == null ? null : String(b.type);
    categoryId = b.categoryId == null ? null : String(b.categoryId).trim();
    fruitTypeId = b.fruitTypeId != null ? String(b.fruitTypeId).trim() || null : null;
    vegetableTypeId = b.vegetableTypeId != null ? String(b.vegetableTypeId).trim() || null : null;
    otroDetalle = b.otroDetalle != null ? String(b.otroDetalle).trim() || null : null;
    currency = b.currency != null ? String(b.currency).trim() : "UYU";
    amount = b.amount;
    description = b.description == null ? null : String(b.description).trim();
    notes = b.notes != null ? String(b.notes).trim() || null : null;
    paymentMethod = b.paymentMethod != null ? String(b.paymentMethod).trim() || null : null;
  }

  if (!date || !type || !categoryId || amount == null) {
    return NextResponse.json(
      { error: "Faltan campos: fecha, tipo, categoría, monto" },
      { status: 400 }
    );
  }
  const descriptionStr = (description ?? "").trim();
  if (!TYPE_SET.has(type)) {
    return NextResponse.json({ error: "Tipo inválido" }, { status: 400 });
  }
  if (!CURRENCY_SET.has(currency)) {
    return NextResponse.json({ error: "Moneda inválida (use UYU o USD)" }, { status: 400 });
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
  const numAmount = Number(amount);
  if (Number.isNaN(numAmount) || numAmount < 0) {
    return NextResponse.json({ error: "Monto debe ser un número positivo" }, { status: 400 });
  }
  if (paymentMethod && !PAYMENT_SET.has(paymentMethod)) {
    return NextResponse.json({ error: "Método de pago inválido" }, { status: 400 });
  }

  const dateObj = new Date(date);
  if (Number.isNaN(dateObj.getTime())) {
    return NextResponse.json({ error: "Fecha inválida" }, { status: 400 });
  }

  const entry = await prisma.entry.create({
    data: {
      date: dateObj,
      type,
      categoryId,
      fruitTypeId: fruitTypeId || null,
      vegetableTypeId: vegetableTypeId || null,
      otroDetalle: otroDetalle || null,
      amount: numAmount,
      currency,
      description: descriptionStr,
      notes: notes || null,
      paymentMethod: paymentMethod || null,
      createdById: session.user.id,
    },
    include,
  });

  if (imageFile) {
    try {
      const imagePath = await saveEntryImage(entry.id, imageFile);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await prisma.entry.update({
        where: { id: entry.id },
        data: { imagePath } as any,
        include,
      });
      const updated = await prisma.entry.findUnique({
        where: { id: entry.id },
        include,
      });
      return NextResponse.json(updated ?? entry);
    } catch (e) {
      await prisma.entry.delete({ where: { id: entry.id } }).catch(() => {});
      return NextResponse.json(
        { error: e instanceof Error ? e.message : "Error al guardar la imagen" },
        { status: 400 }
      );
    }
  }
  return NextResponse.json(entry);
}
