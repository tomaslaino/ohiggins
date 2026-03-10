/**
 * API: upload (POST) or remove (DELETE) image for an entry.
 */
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { saveEntryImage, deleteEntryImage, MAX_ENTRY_IMAGE_BYTES } from "@/lib/entry-image";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  const { id } = await params;
  const entry = await prisma.entry.findUnique({ where: { id } });
  if (!entry) {
    return NextResponse.json({ error: "Entrada no encontrada" }, { status: 404 });
  }
  const formData = await req.formData();
  const file = formData.get("image");
  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json({ error: "No se envió ninguna imagen" }, { status: 400 });
  }
  if (file.size > MAX_ENTRY_IMAGE_BYTES) {
    return NextResponse.json(
      { error: `La imagen no puede superar ${MAX_ENTRY_IMAGE_BYTES / 1024 / 1024} MB` },
      { status: 413 }
    );
  }
  try {
    if (entry.imagePath) {
      await deleteEntryImage(entry.imagePath);
    }
    const imagePath = await saveEntryImage(id, file);
    await prisma.entry.update({
      where: { id },
      data: { imagePath },
    });
    return NextResponse.json({ imagePath });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Error al guardar la imagen" },
      { status: 400 }
    );
  }
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
  const entry = await prisma.entry.findUnique({ where: { id } });
  if (!entry) {
    return NextResponse.json({ error: "Entrada no encontrada" }, { status: 404 });
  }
  if (entry.imagePath) {
    await deleteEntryImage(entry.imagePath);
    await prisma.entry.update({
      where: { id },
      data: { imagePath: null },
    });
  }
  return NextResponse.json({ ok: true });
}
