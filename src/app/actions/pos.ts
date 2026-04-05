"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function getMenuForPos() {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  return prisma.category.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: "asc" },
    include: {
      items: {
        where: { isActive: true },
        orderBy: { sortOrder: "asc" },
      },
    },
  });
}

export async function getStoreSettings() {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");
  return prisma.storeSettings.findUnique({ where: { id: 1 } });
}

async function generateOrderNumber() {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  const count = await prisma.order.count({
    where: { createdAt: { gte: start, lt: end } },
  });
  const y = start.getFullYear();
  const m = String(start.getMonth() + 1).padStart(2, "0");
  const d = String(start.getDate()).padStart(2, "0");
  return `IF-${y}${m}${d}-${String(count + 1).padStart(3, "0")}`;
}

export async function createOrder(input: {
  lines: { menuItemId: string; quantity: number }[];
  paymentMethod: string;
  discount: number;
}) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  if (!input.lines.length) throw new Error("Cart is empty");

  const store = await prisma.storeSettings.findUnique({ where: { id: 1 } });
  const taxRate = store ? Number(store.taxRate) : 0;

  const ids = [...new Set(input.lines.map((l) => l.menuItemId))];
  const items = await prisma.menuItem.findMany({
    where: { id: { in: ids }, isActive: true },
  });
  const byId = new Map(items.map((i) => [i.id, i]));

  let subtotal = 0;
  const lineData: {
    menuItemId: string;
    nameSnap: string;
    unitPrice: number;
    quantity: number;
    lineTotal: number;
    taxable: boolean;
  }[] = [];

  for (const l of input.lines) {
    const item = byId.get(l.menuItemId);
    if (!item) throw new Error("Invalid item");
    const qty = Math.max(1, Math.floor(Number(l.quantity)));
    const unit = Number(item.price);
    const lineTotal = unit * qty;
    subtotal += lineTotal;
    lineData.push({
      menuItemId: item.id,
      nameSnap: item.name,
      unitPrice: unit,
      quantity: qty,
      lineTotal,
      taxable: item.taxable,
    });
  }

  const discount = Math.max(0, Number(input.discount) || 0);
  if (discount > subtotal) throw new Error("Discount cannot exceed subtotal");

  const taxableBase = lineData.filter((l) => l.taxable).reduce((a, l) => a + l.lineTotal, 0);
  const S = subtotal;
  const D = discount;
  const effectiveTaxable = S > 0 ? (taxableBase * (S - D)) / S : 0;
  const tax = effectiveTaxable * taxRate;
  const total = S - D + tax;

  const orderNumber = await generateOrderNumber();

  const order = await prisma.$transaction(async (tx) => {
    return tx.order.create({
      data: {
        orderNumber,
        subtotal: S,
        tax,
        discount: D,
        total,
        paymentMethod: input.paymentMethod,
        createdById: session.user.id,
        lines: {
          create: lineData.map((ld) => ({
            menuItemId: ld.menuItemId,
            nameSnap: ld.nameSnap,
            unitPrice: ld.unitPrice,
            quantity: ld.quantity,
            lineTotal: ld.lineTotal,
          })),
        },
      },
      include: { lines: true },
    });
  });

  revalidatePath("/reports");
  revalidatePath("/pos");

  return {
    order: {
      id: order.id,
      orderNumber: order.orderNumber,
      createdAt: order.createdAt.toISOString(),
      paymentMethod: order.paymentMethod,
      subtotal: Number(order.subtotal),
      tax: Number(order.tax),
      discount: Number(order.discount),
      total: Number(order.total),
      lines: order.lines.map((ln) => ({
        nameSnap: ln.nameSnap,
        quantity: ln.quantity,
        unitPrice: Number(ln.unitPrice),
        lineTotal: Number(ln.lineTotal),
      })),
    },
    store: {
      name: store?.name ?? "Ivaan Foods",
      address: store?.address ?? null,
      footer: store?.footer ?? null,
    },
  };
}
