import { listMenuAdmin } from "@/app/actions/menu";
import { MenuAdminClient } from "@/components/MenuAdminClient";

export default async function MenuPage() {
  const raw = await listMenuAdmin();
  const initial = raw.map((c) => ({
    id: c.id,
    name: c.name,
    isActive: c.isActive,
    items: c.items.map((i) => ({
      id: i.id,
      name: i.name,
      price: Number(i.price),
      taxable: i.taxable,
      isActive: i.isActive,
    })),
  }));

  return (
    <div>
      <h1 className="text-2xl font-bold text-stone-900 dark:text-stone-50">Menu editor</h1>
      <p className="mb-6 text-sm text-stone-500">Admin only. Changes apply to POS immediately.</p>
      <MenuAdminClient initial={initial} />
    </div>
  );
}
