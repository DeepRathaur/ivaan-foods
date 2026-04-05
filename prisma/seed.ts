import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcryptjs";
import pg from "pg";
import { pgPoolConfig } from "../src/lib/pgPoolConfig";
import { MENU_SEED } from "./menu-seed-data";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is not set");
}

const pool = new pg.Pool(pgPoolConfig(connectionString));
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const adminHash = await bcrypt.hash("admin123", 10);
  await prisma.user.upsert({
    where: { email: "admin@ivaanfoods.local" },
    update: { passwordHash: adminHash, role: Role.ADMIN },
    create: {
      email: "admin@ivaanfoods.local",
      passwordHash: adminHash,
      name: "Admin",
      role: Role.ADMIN,
    },
  });

  const deepakHash = await bcrypt.hash("admin@123", 10);
  await prisma.user.upsert({
    where: { email: "deepak@gmail.com" },
    update: { passwordHash: deepakHash, role: Role.ADMIN, name: "Deepak" },
    create: {
      email: "deepak@gmail.com",
      passwordHash: deepakHash,
      name: "Deepak",
      role: Role.ADMIN,
    },
  });

  const cashierHash = await bcrypt.hash("cashier123", 10);
  await prisma.user.upsert({
    where: { email: "cashier@ivaanfoods.local" },
    update: { passwordHash: cashierHash, role: Role.CASHIER },
    create: {
      email: "cashier@ivaanfoods.local",
      passwordHash: cashierHash,
      name: "Cashier",
      role: Role.CASHIER,
    },
  });

  await prisma.storeSettings.upsert({
    where: { id: 1 },
    update: {
      name: "Ivaan Foods",
      address: "RT-02, Ground Floor, UTC, Sector 132, Noida",
      taxRate: 0.05,
      footer: "Thank you — @tasteofivaan | 9873968969",
    },
    create: {
      id: 1,
      name: "Ivaan Foods",
      address: "RT-02, Ground Floor, UTC, Sector 132, Noida",
      taxRate: 0.05,
      footer: "Thank you — @tasteofivaan | 9873968969",
    },
  });

  await prisma.category.deleteMany({});

  for (let i = 0; i < MENU_SEED.length; i++) {
    const cat = MENU_SEED[i];
    await prisma.category.create({
      data: {
        name: cat.name,
        sortOrder: i,
        isActive: true,
        items: {
          create: cat.items.map((item, j) => ({
            name: item.name,
            price: item.price,
            sortOrder: j,
            isActive: true,
            taxable: true,
          })),
        },
      },
    });
  }

  console.log(`Seeded ${MENU_SEED.length} categories from menu PDF.`);
}

main()
  .then(() => {
    console.log("Seed complete.");
  })
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
