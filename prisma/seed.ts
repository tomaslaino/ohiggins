/**
 * Seed script: fills the database with demo data.
 * Run with: npm run db:seed
 */
import { PrismaClient } from "@prisma/client";
import * as bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const INGRESO_CATEGORIES = ["Ventas", "Fruta", "Verduras", "Otro"];
const GASTO_CATEGORIES = [
  "Fertilizantes orgánicos",
  "Herramientas",
  "Transporte",
  "Riego",
  "Mantenimiento",
  "Sueldos",
  "Otro",
];

const DEFAULT_FRUIT_TYPES = ["Cítricos", "Manzanas", "Otros"];
const DEFAULT_VEGETABLE_TYPES = ["Tomate", "Lechuga", "Zanahoria", "Otros"];

async function main() {
  // Rename old Swedish "Frukt" to Spanish "Fruta" if it exists
  const fruktCat = await prisma.category.findFirst({ where: { name: "Frukt", type: "ingreso" } });
  if (fruktCat) {
    const frutaExists = await prisma.category.findUnique({ where: { name_type: { name: "Fruta", type: "ingreso" } } });
    if (frutaExists) {
      await prisma.entry.updateMany({ where: { categoryId: fruktCat.id }, data: { categoryId: frutaExists.id } });
      await prisma.category.delete({ where: { id: fruktCat.id } });
    } else {
      await prisma.category.update({ where: { id: fruktCat.id }, data: { name: "Fruta" } });
    }
  }

  // Categories by type (ingreso / gasto)
  for (const name of INGRESO_CATEGORIES) {
    await prisma.category.upsert({
      where: { name_type: { name, type: "ingreso" } },
      update: {},
      create: { name, type: "ingreso" },
    });
  }
  for (const name of GASTO_CATEGORIES) {
    await prisma.category.upsert({
      where: { name_type: { name, type: "gasto" } },
      update: {},
      create: { name, type: "gasto" },
    });
  }
  const categories = await prisma.category.findMany();
  const categoryId = (name: string, type: "ingreso" | "gasto") =>
    categories.find((c) => c.name === name && c.type === type)!.id;

  // Fruit types
  for (const name of DEFAULT_FRUIT_TYPES) {
    await prisma.fruitType.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }
  const fruitMap = await prisma.fruitType.findMany().then((list) => Object.fromEntries(list.map((f) => [f.name, f.id])));

  // Vegetable types
  for (const name of DEFAULT_VEGETABLE_TYPES) {
    await prisma.vegetableType.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }
  const vegMap = await prisma.vegetableType.findMany().then((list) => Object.fromEntries(list.map((v) => [v.name, v.id])));

  // Admin user (password: admin123)
  const adminHash = await bcrypt.hash("admin123", 10);
  const admin = await prisma.user.upsert({
    where: { email: "admin@ohiggins.com" },
    update: {},
    create: {
      email: "admin@ohiggins.com",
      password: adminHash,
      name: "Administrador",
      role: "ADMIN",
    },
  });

  // Usuario (password: usuario123)
  const userHash = await bcrypt.hash("usuario123", 10);
  const usuario = await prisma.user.upsert({
    where: { email: "usuario@ohiggins.com" },
    update: {},
    create: {
      email: "usuario@ohiggins.com",
      password: userHash,
      name: "Juan Usuario",
      role: "USUARIO",
    },
  });

  const today = new Date();
  await prisma.entry.createMany({
    data: [
      { date: new Date(today.getFullYear(), today.getMonth(), 1), type: "ingreso", categoryId: categoryId("Ventas", "ingreso"), fruitTypeId: fruitMap["Cítricos"], vegetableTypeId: null, amount: 15000, currency: "UYU", description: "Venta fruta orgánica", notes: "Cliente mayorista", paymentMethod: "transferencia", createdById: admin.id },
      { date: new Date(today.getFullYear(), today.getMonth(), 5), type: "gasto", categoryId: categoryId("Fertilizantes orgánicos", "gasto"), fruitTypeId: null, vegetableTypeId: null, amount: 3200, currency: "UYU", description: "Compost y abono", notes: null, paymentMethod: "efectivo", createdById: usuario.id },
      { date: new Date(today.getFullYear(), today.getMonth(), 8), type: "ingreso", categoryId: categoryId("Ventas", "ingreso"), fruitTypeId: fruitMap["Manzanas"], vegetableTypeId: null, amount: 8500, currency: "UYU", description: "Venta en feria", notes: null, paymentMethod: "efectivo", createdById: usuario.id },
      { date: new Date(today.getFullYear(), today.getMonth(), 10), type: "gasto", categoryId: categoryId("Transporte", "gasto"), fruitTypeId: null, vegetableTypeId: null, amount: 1200, currency: "UYU", description: "Combustible", notes: null, paymentMethod: "tarjeta", createdById: admin.id },
      { date: new Date(today.getFullYear(), today.getMonth(), 12), type: "gasto", categoryId: categoryId("Riego", "gasto"), fruitTypeId: null, vegetableTypeId: null, amount: 800, currency: "UYU", description: "Reparación manguera", notes: null, paymentMethod: "efectivo", createdById: usuario.id },
      { date: new Date(today.getFullYear(), today.getMonth(), 15), type: "gasto", categoryId: categoryId("Herramientas", "gasto"), fruitTypeId: null, vegetableTypeId: null, amount: 450, currency: "UYU", description: "Guantes y tijeras", notes: null, paymentMethod: "efectivo", createdById: usuario.id },
      { date: new Date(today.getFullYear(), today.getMonth(), 3), type: "ingreso", categoryId: categoryId("Ventas", "ingreso"), fruitTypeId: fruitMap["Cítricos"], vegetableTypeId: null, amount: 500, currency: "USD", description: "Venta exportación", notes: null, paymentMethod: "transferencia", createdById: admin.id },
      { date: new Date(today.getFullYear(), today.getMonth(), 7), type: "ingreso", categoryId: categoryId("Verduras", "ingreso"), fruitTypeId: null, vegetableTypeId: vegMap["Tomate"], amount: 2100, currency: "UYU", description: "Venta tomates", notes: null, paymentMethod: "efectivo", createdById: usuario.id },
    ],
  });

  console.log("Seed OK: admin@ohiggins.com (admin123), usuario@ohiggins.com (usuario123), categories (ingreso/gasto), fruit & vegetable types, sample entries.");
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
