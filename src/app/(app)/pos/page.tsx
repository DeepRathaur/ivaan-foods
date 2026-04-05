import { getMenuForPos } from "@/app/actions/pos";
import { PosClient } from "@/components/PosClient";

export default async function PosPage() {
  const raw = await getMenuForPos();
  const categories = raw.map((c) => ({
    id: c.id,
    name: c.name,
    items: c.items.map((i) => ({
      id: i.id,
      name: i.name,
      price: Number(i.price),
      categoryId: c.id,
    })),
  }));

  return (
    <div>
      <h1 className="text-2xl font-bold text-stone-900 dark:text-stone-50">POS</h1>
      <p className="mb-4 text-sm text-stone-500 dark:text-stone-400">
        Tap items to build a sale. Use <strong className="text-stone-700 dark:text-stone-300">Hold sale</strong> for a
        waiting customer, then <strong className="text-stone-700 dark:text-stone-300">Proceed</strong> to save, preview
        the receipt, and print (USB Serial or download ESC/POS). Amounts are shown in Indian Rupees (₹).
      </p>
      <PosClient categories={categories} />
    </div>
  );
}
