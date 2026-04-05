"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function endOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x;
}

function startOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1, 0, 0, 0, 0);
}

function endOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);
}

export type BestSellerRow = { name: string; qty: number; revenue: number };

function bestSellerFromOrders(
  orders: { lines: { nameSnap: string; quantity: number; lineTotal: unknown }[] }[],
): BestSellerRow | null {
  const itemTotals = new Map<string, { qty: number; revenue: number }>();
  for (const o of orders) {
    for (const ln of o.lines) {
      const cur = itemTotals.get(ln.nameSnap) ?? { qty: 0, revenue: 0 };
      cur.qty += ln.quantity;
      cur.revenue += Number(ln.lineTotal);
      itemTotals.set(ln.nameSnap, cur);
    }
  }
  if (itemTotals.size === 0) return null;
  const ranked = [...itemTotals.entries()].map(([name, v]) => ({ name, ...v }));
  ranked.sort((a, b) => {
    if (b.qty !== a.qty) return b.qty - a.qty;
    return b.revenue - a.revenue;
  });
  return ranked[0] ?? null;
}

/** Best-selling menu line item by units sold (revenue breaks ties). Always uses server local calendar day/month. */
export async function getBestSellersTodayAndMonth() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    throw new Error("Forbidden");
  }

  const now = new Date();
  const dayStart = startOfDay(now);
  const dayEnd = endOfDay(now);
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);

  const [dayOrders, monthOrders] = await Promise.all([
    prisma.order.findMany({
      where: { status: "COMPLETED", createdAt: { gte: dayStart, lte: dayEnd } },
      include: { lines: true },
    }),
    prisma.order.findMany({
      where: { status: "COMPLETED", createdAt: { gte: monthStart, lte: monthEnd } },
      include: { lines: true },
    }),
  ]);

  const dayLabel = now.toLocaleDateString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
  const monthLabel = now.toLocaleDateString("en-IN", { month: "long", year: "numeric" });

  return {
    day: {
      label: dayLabel,
      rangeStart: dayStart.toISOString(),
      rangeEnd: dayEnd.toISOString(),
      best: bestSellerFromOrders(dayOrders),
    },
    month: {
      label: monthLabel,
      rangeStart: monthStart.toISOString(),
      rangeEnd: monthEnd.toISOString(),
      best: bestSellerFromOrders(monthOrders),
    },
  };
}

export async function getSalesReport(fromStr: string, toStr: string) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    throw new Error("Forbidden");
  }

  const from = startOfDay(new Date(fromStr));
  const to = endOfDay(new Date(toStr));
  if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) {
    throw new Error("Invalid date range");
  }

  const orders = await prisma.order.findMany({
    where: {
      status: "COMPLETED",
      createdAt: { gte: from, lte: to },
    },
    include: { lines: true },
    orderBy: { createdAt: "desc" },
  });

  const totalSales = orders.reduce((a, o) => a + Number(o.total), 0);
  const orderCount = orders.length;

  const byPayment: Record<string, number> = {};
  for (const o of orders) {
    const k = o.paymentMethod || "UNKNOWN";
    byPayment[k] = (byPayment[k] ?? 0) + Number(o.total);
  }

  const itemTotals = new Map<string, { qty: number; revenue: number }>();
  for (const o of orders) {
    for (const ln of o.lines) {
      const cur = itemTotals.get(ln.nameSnap) ?? { qty: 0, revenue: 0 };
      cur.qty += ln.quantity;
      cur.revenue += Number(ln.lineTotal);
      itemTotals.set(ln.nameSnap, cur);
    }
  }

  const topItems = [...itemTotals.entries()]
    .map(([name, v]) => ({ name, qty: v.qty, revenue: v.revenue }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 15);

  return {
    from: from.toISOString(),
    to: to.toISOString(),
    totalSales,
    orderCount,
    byPayment,
    topItems,
    orders: orders.slice(0, 50).map((o) => ({
      id: o.id,
      orderNumber: o.orderNumber,
      createdAt: o.createdAt.toISOString(),
      total: Number(o.total),
      paymentMethod: o.paymentMethod,
    })),
  };
}
