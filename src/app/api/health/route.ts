/**
 * Health check for monitoring (e.g. uptime checks).
 * GET /api/health returns 200 if the app is up; checks DB connectivity.
 */
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    await prisma.user.findFirst({ select: { id: true } });
  } catch {
    return NextResponse.json(
      { ok: false, error: "Database unavailable" },
      { status: 503 }
    );
  }
  return NextResponse.json({ ok: true });
}
