"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

async function requireAdmin() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    throw new Error("Forbidden");
  }
  return session;
}

export async function listMenuAdmin() {
  await requireAdmin();
  return prisma.category.findMany({
    orderBy: { sortOrder: "asc" },
    include: {
      items: { orderBy: { sortOrder: "asc" } },
    },
  });
}

export async function createCategory(name: string) {
  await requireAdmin();
  const trimmed = name.trim();
  if (!trimmed) throw new Error("Name required");
  const max = await prisma.category.aggregate({ _max: { sortOrder: true } });
  await prisma.category.create({
    data: { name: trimmed, sortOrder: (max._max.sortOrder ?? -1) + 1 },
  });
  revalidatePath("/menu");
  revalidatePath("/pos");
}

export async function createMenuItem(input: {
  categoryId: string;
  name: string;
  price: number;
  taxable?: boolean;
}) {
  await requireAdmin();
  const trimmed = input.name.trim();
  if (!trimmed) throw new Error("Name required");
  if (input.price < 0) throw new Error("Invalid price");
  const max = await prisma.menuItem.aggregate({
    where: { categoryId: input.categoryId },
    _max: { sortOrder: true },
  });
  await prisma.menuItem.create({
    data: {
      categoryId: input.categoryId,
      name: trimmed,
      price: input.price,
      taxable: input.taxable ?? true,
      sortOrder: (max._max.sortOrder ?? -1) + 1,
    },
  });
  revalidatePath("/menu");
  revalidatePath("/pos");
}

export async function updateMenuItem(input: {
  id: string;
  name?: string;
  price?: number;
  taxable?: boolean;
  isActive?: boolean;
}) {
  await requireAdmin();
  const data: Record<string, unknown> = {};
  if (input.name !== undefined) data.name = input.name.trim();
  if (input.price !== undefined) {
    if (input.price < 0) throw new Error("Invalid price");
    data.price = input.price;
  }
  if (input.taxable !== undefined) data.taxable = input.taxable;
  if (input.isActive !== undefined) data.isActive = input.isActive;
  await prisma.menuItem.update({ where: { id: input.id }, data });
  revalidatePath("/menu");
  revalidatePath("/pos");
}

export async function updateCategory(input: { id: string; name?: string; isActive?: boolean }) {
  await requireAdmin();
  const data: Record<string, unknown> = {};
  if (input.name !== undefined) data.name = input.name.trim();
  if (input.isActive !== undefined) data.isActive = input.isActive;
  await prisma.category.update({ where: { id: input.id }, data });
  revalidatePath("/menu");
  revalidatePath("/pos");
}
