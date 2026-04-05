"use client";

import {
  createCategory,
  createMenuItem,
  listMenuAdmin,
  updateCategory,
  updateMenuItem,
} from "@/app/actions/menu";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

type Cat = {
  id: string;
  name: string;
  isActive: boolean;
  items: {
    id: string;
    name: string;
    price: number;
    taxable: boolean;
    isActive: boolean;
  }[];
};

export function MenuAdminClient({ initial }: { initial: Cat[] }) {
  const router = useRouter();
  const [cats, setCats] = useState(initial);
  const [newCat, setNewCat] = useState("");
  const [pending, startTransition] = useTransition();
  const [err, setErr] = useState<string | null>(null);

  const refresh = () => {
    startTransition(async () => {
      try {
        const next = await listMenuAdmin();
        setCats(
          next.map((c) => ({
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
          })),
        );
        router.refresh();
      } catch {
        setErr("Could not refresh menu.");
      }
    });
  };

  return (
    <div className="space-y-8 pb-24 md:pb-8">
      <form
        className="flex flex-wrap gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          if (!newCat.trim()) return;
          setErr(null);
          startTransition(async () => {
            try {
              await createCategory(newCat);
              setNewCat("");
              refresh();
            } catch (x) {
              setErr(x instanceof Error ? x.message : "Failed");
            }
          });
        }}
      >
        <input
          placeholder="New category name"
          value={newCat}
          onChange={(e) => setNewCat(e.target.value)}
          className="min-w-[200px] flex-1 rounded-lg border border-stone-200 px-3 py-2 dark:border-stone-700 dark:bg-stone-900"
        />
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
        >
          Add category
        </button>
      </form>
      {err ? <p className="text-sm text-red-600">{err}</p> : null}

      {cats.map((c) => (
        <section
          key={c.id}
          className="rounded-xl border border-stone-200 bg-white p-4 dark:border-stone-800 dark:bg-stone-900"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-lg font-semibold text-stone-900 dark:text-stone-50">{c.name}</h2>
            <label className="flex items-center gap-2 text-sm text-stone-600 dark:text-stone-400">
              <input
                type="checkbox"
                checked={c.isActive}
                onChange={(e) => {
                  startTransition(async () => {
                    await updateCategory({ id: c.id, isActive: e.target.checked });
                    refresh();
                  });
                }}
              />
              Active
            </label>
          </div>
          <ul className="mt-3 space-y-2">
            {c.items.map((i) => (
              <li
                key={i.id}
                className="flex flex-col gap-2 rounded-lg bg-stone-50 p-3 sm:flex-row sm:items-center sm:justify-between dark:bg-stone-800/60"
              >
                <div className="flex flex-1 flex-wrap items-center gap-2">
                  <input
                    defaultValue={i.name}
                    className="min-w-[120px] flex-1 rounded border border-stone-200 px-2 py-1 text-sm dark:border-stone-600 dark:bg-stone-900"
                    onBlur={(e) => {
                      const v = e.target.value.trim();
                      if (!v || v === i.name) return;
                      startTransition(async () => {
                        await updateMenuItem({ id: i.id, name: v });
                        refresh();
                      });
                    }}
                  />
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    defaultValue={i.price}
                    className="w-24 rounded border border-stone-200 px-2 py-1 text-sm dark:border-stone-600 dark:bg-stone-900"
                    onBlur={(e) => {
                      const v = parseFloat(e.target.value);
                      if (Number.isNaN(v) || v === i.price) return;
                      startTransition(async () => {
                        await updateMenuItem({ id: i.id, price: v });
                        refresh();
                      });
                    }}
                  />
                  <label className="flex items-center gap-1 text-xs text-stone-600 dark:text-stone-400">
                    <input
                      type="checkbox"
                      defaultChecked={i.taxable}
                      onChange={(e) => {
                        startTransition(async () => {
                          await updateMenuItem({ id: i.id, taxable: e.target.checked });
                          refresh();
                        });
                      }}
                    />
                    Tax
                  </label>
                  <label className="flex items-center gap-1 text-xs text-stone-600 dark:text-stone-400">
                    <input
                      type="checkbox"
                      checked={i.isActive}
                      onChange={(e) => {
                        startTransition(async () => {
                          await updateMenuItem({ id: i.id, isActive: e.target.checked });
                          refresh();
                        });
                      }}
                    />
                    On menu
                  </label>
                </div>
              </li>
            ))}
          </ul>
          <AddItemForm
            categoryId={c.id}
            onDone={() => {
              refresh();
            }}
            pending={pending}
          />
        </section>
      ))}
    </div>
  );
}

function AddItemForm({
  categoryId,
  onDone,
  pending,
}: {
  categoryId: string;
  onDone: () => void;
  pending: boolean;
}) {
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  return (
    <form
      className="mt-4 flex flex-wrap gap-2 border-t border-stone-200 pt-4 dark:border-stone-700"
      onSubmit={(e) => {
        e.preventDefault();
        const p = parseFloat(price);
        if (!name.trim() || Number.isNaN(p)) return;
        void (async () => {
          await createMenuItem({ categoryId, name, price: p });
          setName("");
          setPrice("");
          onDone();
        })();
      }}
    >
      <input
        placeholder="Item name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="min-w-[140px] flex-1 rounded-lg border border-stone-200 px-3 py-2 text-sm dark:border-stone-700 dark:bg-stone-900"
      />
      <input
        type="number"
        min={0}
        step="0.01"
        placeholder="Price"
        value={price}
        onChange={(e) => setPrice(e.target.value)}
        className="w-28 rounded-lg border border-stone-200 px-3 py-2 text-sm dark:border-stone-700 dark:bg-stone-900"
      />
      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-stone-900 px-3 py-2 text-sm font-medium text-white dark:bg-stone-100 dark:text-stone-900"
      >
        Add item
      </button>
    </form>
  );
}
