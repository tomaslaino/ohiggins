/**
 * API: list (GET) and create (POST) fruit types. Any logged-in user can add fruit types.
 */
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  const list = await prisma.fruitType.findMany({
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
  if (!name) {
    return NextResponse.json({ error: "El nombre es obligatorio" }, { status: 400 });
  }
  const existing = await prisma.fruitType.findUnique({ where: { name } });
  if (existing) {
    return NextResponse.json({ error: "Ya existe un tipo de fruta con ese nombre" }, { status: 400 });
  }
  const fruitType = await prisma.fruitType.create({ data: { name } });
  return NextResponse.json(fruitType);
}
