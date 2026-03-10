/**
 * Rensar alla entradas (transaktioner) i databasen. Användare, kategorier och typer behålls.
 * Kör en gång inför att sätta igång sajten på riktigt: npm run db:clear-entries
 */
import { config } from "dotenv";
import { resolve } from "path";

config({ path: resolve(process.cwd(), ".env.local") });

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error("Saknar DATABASE_URL i .env.local.");
    process.exit(1);
  }
  const { PrismaClient } = await import("@prisma/client");
  const prisma = new PrismaClient();
  const result = await prisma.entry.deleteMany({});
  console.log(`Rensat: ${result.count} entradas borttagna. Databasen är redo att användas.`);
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
