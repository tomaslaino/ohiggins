/**
 * Save entry image to public/uploads/entries/{entryId}.{ext}.
 * Returns the public URL path (e.g. /uploads/entries/abc123.jpg).
 */
import { writeFile, mkdir, unlink } from "fs/promises";
import path from "path";

const UPLOAD_DIR = "public/uploads/entries";
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;
/** Max 5 MB per image to avoid abuse and timeouts */
export const MAX_ENTRY_IMAGE_BYTES = 5 * 1024 * 1024;
const EXT_MAP: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
};

function getExt(mime: string): string {
  return EXT_MAP[mime] ?? ".jpg";
}

export async function saveEntryImage(entryId: string, file: File): Promise<string> {
  if (file.size > MAX_ENTRY_IMAGE_BYTES) {
    throw new Error(`La imagen no puede superar ${MAX_ENTRY_IMAGE_BYTES / 1024 / 1024} MB`);
  }
  const mime = file.type;
  if (!ALLOWED_TYPES.includes(mime as (typeof ALLOWED_TYPES)[number])) {
    throw new Error("Tipo de imagen no permitido (use JPEG, PNG o WebP)");
  }
  const ext = getExt(mime);
  const dir = path.join(process.cwd(), UPLOAD_DIR);
  await mkdir(dir, { recursive: true });
  const filename = `${entryId}${ext}`;
  const filepath = path.join(dir, filename);
  const buf = Buffer.from(await file.arrayBuffer());
  await writeFile(filepath, buf);
  return `/uploads/entries/${filename}`;
}

export async function deleteEntryImage(imagePath: string | null): Promise<void> {
  if (!imagePath || !imagePath.startsWith("/uploads/entries/")) return;
  const filepath = path.join(process.cwd(), "public", imagePath);
  try {
    await unlink(filepath);
  } catch {
    // ignore if file already missing
  }
}
