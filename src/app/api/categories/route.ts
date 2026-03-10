/**
 * API: list (GET) and create (POST) categories. Any logged-in user can add categories.
 * GET: ?type=ingreso|gasto to filter by category type.
 * POST: name and type (ingreso|gasto) required.
 */
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

const CATEGORY_TYPES = ["ingreso", "gasto"] as const;

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type");
  const where = type && CATEGORY_TYPES.includes(type as (typeof CATEGORY_TYPES)[number])
    ? { type }
    : {};
  const list = await prisma.category.findMany({
    where,
    orderBy: { name: "asc" },
  });
  return NextResponse.json(list);
}

export async function POST(req: Request) {
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
  const name = typeof (body as { name?: unknown }).name === "string"
    ? (body as { name: string }).name.trim()
    : "";
  const type = typeof (body as { type?: unknown }).type === "string"
    ? (body as { type: string }).type.trim().toLowerCase()
    : "";
  if (!name) {
    return NextResponse.json({ error: "El nombre es obligatorio" }, { status: 400 });
  }
  if (!CATEGORY_TYPES.includes(type as (typeof CATEGORY_TYPES)[number])) {
    return NextResponse.json({ error: "El tipo debe ser 'ingreso' o 'gasto'" }, { status: 400 });
  }
  const existing = await prisma.category.findUnique({ where: { name_type: { name, type } } });
  if (existing) {
    return NextResponse.json({ error: "Ya existe una categoría con ese nombre para ese tipo" }, { status: 400 });
  }
  const category = await prisma.category.create({ data: { name, type } });
  return NextResponse.json(category);
}
