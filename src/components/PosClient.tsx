"use client";

import { createOrder } from "@/app/actions/pos";
import { formatInr } from "@/lib/currency";
import { buildReceiptLines, linesToEscPos } from "@/lib/receipt";
import { useCallback, useMemo, useState } from "react";
import { OrderSuccessModal } from "@/components/OrderSuccessModal";
import { ReceiptPreviewModal, type ReceiptOrderPayload } from "@/components/ReceiptPreviewModal";

type Item = {
  id: string;
  name: string;
  price: string | number;
  categoryId: string;
};

type Category = {
  id: string;
  name: string;
  items: Item[];
};

type CartLine = { menuItemId: string; name: string; unit: number; qty: number };

const PAYMENTS = ["CASH", "UPI", "CARD"] as const;

type HeldSale = {
  id: string;
  label: string;
  cart: CartLine[];
  payment: (typeof PAYMENTS)[number];
  discount: string;
  savedAt: number;
};

function newHoldLabel(index: number) {
  const t = new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
  return `Hold ${index + 1} · ${t}`;
}

export function PosClient({ categories }: { categories: Category[] }) {
  const [catId, setCatId] = useState<string | null>(categories[0]?.id ?? null);
  const [cart, setCart] = useState<CartLine[]>([]);
  const [payment, setPayment] = useState<(typeof PAYMENTS)[number]>("CASH");
  const [discount, setDiscount] = useState("0");
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [held, setHeld] = useState<HeldSale[]>([]);
  const [receiptOpen, setReceiptOpen] = useState<{
    payload: ReceiptOrderPayload;
    escPosUtf8: string;
  } | null>(null);
  const [success, setSuccess] = useState<{ orderNumber: string; total: number } | null>(null);

  const activeCat = useMemo(
    () => categories.find((c) => c.id === catId) ?? categories[0],
    [categories, catId],
  );

  const subtotal = cart.reduce((a, l) => a + l.unit * l.qty, 0);
  const discountNum = Math.max(0, parseFloat(discount) || 0);

  const addItem = useCallback((item: Item) => {
    setCart((prev) => {
      const i = prev.findIndex((p) => p.menuItemId === item.id);
      if (i >= 0) {
        const next = [...prev];
        next[i] = { ...next[i], qty: next[i].qty + 1 };
        return next;
      }
      return [
        ...prev,
        {
          menuItemId: item.id,
          name: item.name,
          unit: Number(item.price),
          qty: 1,
        },
      ];
    });
  }, []);

  const setQty = useCallback((menuItemId: string, qty: number) => {
    setCart((prev) => {
      if (qty <= 0) return prev.filter((l) => l.menuItemId !== menuItemId);
      return prev.map((l) => (l.menuItemId === menuItemId ? { ...l, qty } : l));
    });
  }, []);

  const holdCurrentSale = useCallback(() => {
    setErr(null);
    if (!cart.length) {
      setErr("Nothing to hold — add items first.");
      return;
    }
    const id =
      typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : `h-${Date.now()}`;
    setHeld((prev) => [
      ...prev,
      {
        id,
        label: newHoldLabel(prev.length),
        cart: cart.map((l) => ({ ...l })),
        payment,
        discount,
        savedAt: Date.now(),
      },
    ]);
    setCart([]);
    setDiscount("0");
  }, [cart, payment, discount]);

  const recallHeld = useCallback(
    (h: HeldSale) => {
      setErr(null);
      if (cart.length) {
        const ok = window.confirm(
          "Replace the current cart with this held sale? Unsaved lines will be lost.",
        );
        if (!ok) return;
      }
      setCart(h.cart.map((l) => ({ ...l })));
      setPayment(h.payment);
      setDiscount(h.discount);
      setHeld((prev) => prev.filter((x) => x.id !== h.id));
    },
    [cart.length],
  );

  const discardHeld = useCallback((id: string) => {
    setHeld((prev) => prev.filter((h) => h.id !== id));
  }, []);

  const heldApproxTotal = useCallback((h: HeldSale) => {
    const s = h.cart.reduce((a, l) => a + l.unit * l.qty, 0);
    const d = Math.max(0, parseFloat(h.discount) || 0);
    return Math.max(0, s - d);
  }, []);

  const finishReceiptFlow = useCallback(() => {
    if (!receiptOpen) return;
    const { total, orderNumber } = receiptOpen.payload.order;
    setSuccess({ orderNumber, total });
    setReceiptOpen(null);
  }, [receiptOpen]);

  const proceedToCheckout = async () => {
    setErr(null);
    if (!cart.length) {
      setErr("Cart is empty.");
      return;
    }
    setBusy(true);
    try {
      const result = await createOrder({
        lines: cart.map((l) => ({ menuItemId: l.menuItemId, quantity: l.qty })),
        paymentMethod: payment,
        discount: discountNum,
      });
      const lines = buildReceiptLines({
        storeName: result.store.name,
        address: result.store.address,
        orderNumber: result.order.orderNumber,
        createdAt: new Date(result.order.createdAt),
        paymentMethod: result.order.paymentMethod,
        rows: result.order.lines.map((ln) => ({
          name: ln.nameSnap,
          qty: ln.quantity,
          unitPrice: ln.unitPrice,
          lineTotal: ln.lineTotal,
        })),
        subtotal: result.order.subtotal,
        tax: result.order.tax,
        discount: result.order.discount,
        total: result.order.total,
        footer: result.store.footer,
      });
      const escPosUtf8 = linesToEscPos(lines);
      const payload: ReceiptOrderPayload = {
        order: result.order,
        store: result.store,
      };
      setReceiptOpen({ payload, escPosUtf8 });
      setCart([]);
      setDiscount("0");
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Checkout failed.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <div className="grid gap-8 pb-28 lg:grid-cols-[1fr_min(420px,100%)] lg:pb-10">
        <section className="min-w-0">
          <div className="flex flex-wrap gap-2 border-b border-stone-200 pb-4 dark:border-stone-800">
            {categories.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setCatId(c.id)}
                className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                  activeCat?.id === c.id
                    ? "bg-amber-600 text-white shadow-md shadow-amber-900/20"
                    : "bg-stone-100 text-stone-700 hover:bg-stone-200 dark:bg-stone-800 dark:text-stone-200 dark:hover:bg-stone-700"
                }`}
              >
                {c.name}
              </button>
            ))}
          </div>
          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {activeCat?.items.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => addItem(item)}
                className="group rounded-2xl border border-stone-200 bg-white p-4 text-left shadow-sm transition hover:border-amber-400/60 hover:shadow-md dark:border-stone-700 dark:bg-stone-900 dark:hover:border-amber-700/50"
              >
                <div className="font-semibold text-stone-900 dark:text-stone-100">{item.name}</div>
                <div className="mt-2 text-sm font-medium text-amber-700 dark:text-amber-400">
                  {formatInr(Number(item.price))}
                </div>
              </button>
            ))}
          </div>
        </section>

        <aside className="flex flex-col rounded-2xl border border-stone-200 bg-gradient-to-b from-white to-stone-50/80 p-5 shadow-lg dark:border-stone-800 dark:from-stone-900 dark:to-stone-950/80 lg:sticky lg:top-4 lg:max-h-[calc(100vh-6rem)]">
          <div className="flex items-start justify-between gap-2">
            <h2 className="text-lg font-bold text-stone-900 dark:text-stone-50">Current sale</h2>
            {held.length > 0 ? (
              <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-900 dark:bg-amber-950 dark:text-amber-200">
                {held.length} held
              </span>
            ) : null}
          </div>

          {held.length > 0 ? (
            <div className="mt-3 space-y-2 rounded-xl border border-amber-200/60 bg-amber-50/50 p-3 dark:border-amber-900/40 dark:bg-amber-950/20">
              <p className="text-xs font-medium uppercase tracking-wide text-amber-900/80 dark:text-amber-200/80">
                Held orders
              </p>
              <ul className="space-y-2">
                {held.map((h) => (
                  <li
                    key={h.id}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-white/90 px-3 py-2 text-sm dark:bg-stone-900/80"
                  >
                    <div className="min-w-0">
                      <p className="font-medium text-stone-900 dark:text-stone-100">{h.label}</p>
                      <p className="text-xs text-stone-500 dark:text-stone-400">
                        {h.cart.reduce((a, l) => a + l.qty, 0)} items · {formatInr(heldApproxTotal(h))}
                      </p>
                    </div>
                    <div className="flex shrink-0 gap-1">
                      <button
                        type="button"
                        onClick={() => recallHeld(h)}
                        className="rounded-lg bg-amber-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-amber-700"
                      >
                        Recall
                      </button>
                      <button
                        type="button"
                        onClick={() => discardHeld(h.id)}
                        className="rounded-lg border border-stone-200 px-2.5 py-1 text-xs font-medium text-stone-600 hover:bg-stone-100 dark:border-stone-600 dark:text-stone-300 dark:hover:bg-stone-800"
                      >
                        Drop
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          <div className="mt-4 flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto">
            {cart.length === 0 ? (
              <p className="py-6 text-center text-sm text-stone-500 dark:text-stone-400">
                Tap items to add to this sale.
              </p>
            ) : (
              cart.map((l) => (
                <div
                  key={l.menuItemId}
                  className="flex items-center justify-between gap-2 rounded-xl border border-stone-100 bg-white px-3 py-2.5 dark:border-stone-800 dark:bg-stone-800/50"
                >
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-medium text-stone-900 dark:text-stone-100">{l.name}</div>
                    <div className="text-xs text-stone-500 dark:text-stone-400">
                      {formatInr(l.unit)} each
                    </div>
                  </div>
                  <input
                    type="number"
                    min={1}
                    className="w-14 rounded-lg border border-stone-200 bg-white px-2 py-1.5 text-center text-sm dark:border-stone-600 dark:bg-stone-900"
                    value={l.qty}
                    onChange={(e) => setQty(l.menuItemId, parseInt(e.target.value, 10) || 0)}
                  />
                </div>
              ))
            )}
          </div>

          <div className="mt-4 space-y-3 border-t border-stone-200 pt-4 dark:border-stone-700">
            <label className="flex items-center justify-between gap-3 text-sm">
              <span className="text-stone-600 dark:text-stone-400">Discount</span>
              <span className="flex items-center gap-1 text-stone-800 dark:text-stone-200">
                <span className="text-xs font-medium text-stone-500">₹</span>
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  className="w-28 rounded-lg border border-stone-200 px-2 py-1.5 text-right dark:border-stone-600 dark:bg-stone-900"
                  value={discount}
                  onChange={(e) => setDiscount(e.target.value)}
                />
              </span>
            </label>
            <div className="flex justify-between text-sm">
              <span className="text-stone-600 dark:text-stone-400">Subtotal</span>
              <span className="font-semibold text-stone-900 dark:text-stone-50">{formatInr(subtotal)}</span>
            </div>
            <label className="block text-sm font-medium text-stone-700 dark:text-stone-300">
              Payment
              <select
                value={payment}
                onChange={(e) => setPayment(e.target.value as (typeof PAYMENTS)[number])}
                className="mt-1.5 w-full rounded-xl border border-stone-200 bg-white px-3 py-2.5 dark:border-stone-600 dark:bg-stone-900"
              >
                {PAYMENTS.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </label>
            {err ? <p className="text-sm text-red-600 dark:text-red-400">{err}</p> : null}

            <div className="flex flex-col gap-2">
              <button
                type="button"
                disabled={busy || !cart.length}
                onClick={holdCurrentSale}
                className="w-full rounded-xl border-2 border-amber-500/40 bg-transparent py-2.5 text-sm font-semibold text-amber-800 transition hover:bg-amber-50 disabled:opacity-40 dark:text-amber-300 dark:hover:bg-amber-950/40"
              >
                Hold sale
              </button>
              <button
                type="button"
                disabled={busy || !cart.length}
                onClick={() => void proceedToCheckout()}
                className="w-full rounded-xl bg-gradient-to-r from-amber-600 to-amber-700 py-3.5 text-sm font-bold text-white shadow-lg shadow-amber-900/25 transition hover:from-amber-500 hover:to-amber-600 disabled:opacity-50"
              >
                {busy ? "Saving…" : "Proceed — review & receipt"}
              </button>
            </div>
          </div>
        </aside>
      </div>

      {receiptOpen ? (
        <ReceiptPreviewModal
          open
          escPosUtf8={receiptOpen.escPosUtf8}
          payload={receiptOpen.payload}
          onFinish={finishReceiptFlow}
        />
      ) : null}

      {success ? (
        <OrderSuccessModal
          open
          orderNumber={success.orderNumber}
          total={success.total}
          onClose={() => setSuccess(null)}
        />
      ) : null}
    </>
  );
}
