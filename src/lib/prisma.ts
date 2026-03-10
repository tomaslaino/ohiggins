/**
 * Single Prisma client instance for the app.
 * Prevents multiple connections in development (hot reload).
 */
import { PrismaClient } from "@prisma/client";

const url = process.env.DATABASE_URL;
if (!url || (typeof url === "string" && !/^postgres(ql)?:\/\//i.test(url))) {
  throw new Error(
    "DATABASE_URL no está configurada o no es una URL de PostgreSQL. " +
      "En .env.local añade: DATABASE_URL=\"postgresql://usuario:contraseña@host:5432/base?sslmode=require\" " +
      "(y DIRECT_URL si usas Neon). Ver .env.example."
  );
}

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({ log: process.env.NODE_ENV === "development" ? ["error", "warn"] : undefined });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
