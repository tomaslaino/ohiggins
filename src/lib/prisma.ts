/**
 * Single Prisma client instance for the app.
 * Prevents multiple connections in development (hot reload).
 */
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({ log: process.env.NODE_ENV === "development" ? ["error", "warn"] : undefined });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
