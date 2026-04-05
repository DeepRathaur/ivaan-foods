"use client";

import { getBestSellersTodayAndMonth, getSalesReport } from "@/app/actions/reports";
import { formatInr } from "@/lib/currency";
import { useCallback, useEffect, useMemo, useState, useTransition } from "react";

function todayISO() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

type BestSnapshot = Awaited<ReturnType<typeof getBestSellersTodayAndMonth>>;

export function ReportsClient() {
  const [from, setFrom] = useState(todayISO);
  const [to, setTo] = useState(todayISO);
  const [pending, startTransition] = useTransition();
  const [err, setErr] = useState<string | null>(null);
  const [data, setData] = useState<Awaited<ReturnType<typeof getSalesReport>> | null>(null);
  const [bests, setBests] = useState<BestSnapshot | null>(null);
  const [bestsErr, setBestsErr] = useState<string | null>(null);
  const [bestsLoading, setBestsLoading] = useState(true);

  const refreshBestSellers = useCallback(async (opts?: { silent?: boolean }) => {
    setBestsErr(null);
    if (!opts?.silent) setBestsLoading(true);
    try {
      const b = await getBestSellersTodayAndMonth();
      setBests(b);
    } catch (e) {
      setBestsErr(e instanceof Error ? e.message : "Could not load best sellers");
    } finally {
      if (!opts?.silent) setBestsLoading(false);
    }
  }, []);

  useEffect(() => {
    void refreshBestSellers();
  }, [refreshBestSellers]);

  const run = () => {
    setErr(null);
    startTransition(async () => {
      try {
        const r = await getSalesReport(from, to);
        setData(r);
        void refreshBestSellers({ silent: true });
      } catch (e) {
        setErr(e instanceof Error ? e.message : "Failed to load report");
      }
    });
  };

  const paymentRows = useMemo(() => {
    if (!data) return [];
    return Object.entries(data.byPayment).sort((a, b) => b[1] - a[1]);
  }, [data]);

  return (
    <div className="space-y-6 pb-24 md:pb-8">
      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-stone-500 dark:text-stone-400">
          Best sellers
        </h2>
        {bestsErr ? <p className="text-sm text-red-600 dark:text-red-400">{bestsErr}</p> : null}
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-amber-200/80 bg-gradient-to-br from-amber-50 to-white p-4 dark:border-amber-900/50 dark:from-amber-950/40 dark:to-stone-900">
            <p className="text-xs font-medium uppercase tracking-wide text-amber-900/80 dark:text-amber-200/90">
              Today
            </p>
            <p className="mt-0.5 text-xs text-stone-500 dark:text-stone-400">
              {bests?.day.label ?? "—"}
            </p>
            {bestsLoading && !bests ? (
              <p className="mt-3 text-sm text-stone-500">Loading…</p>
            ) : bests?.day.best ? (
              <>
                <p className="mt-3 text-lg font-bold text-stone-900 dark:text-stone-50">
                  {bests.day.best.name}
                </p>
                <p className="mt-1 text-sm text-stone-600 dark:text-stone-300">
                  <span className="font-semibold text-amber-800 dark:text-amber-300">
                    {bests.day.best.qty}
                  </span>{" "}
                  sold · {formatInr(bests.day.best.revenue)}
                </p>
              </>
            ) : (
              <p className="mt-3 text-sm text-stone-500 dark:text-stone-400">No sales yet today.</p>
            )}
          </div>
          <div className="rounded-xl border border-stone-200 bg-gradient-to-br from-stone-50 to-white p-4 dark:border-stone-700 dark:from-stone-900 dark:to-stone-950">
            <p className="text-xs font-medium uppercase tracking-wide text-stone-500 dark:text-stone-400">
              This month
            </p>
            <p className="mt-0.5 text-xs text-stone-500 dark:text-stone-400">
              {bests?.month.label ?? "—"}
            </p>
            {bestsLoading && !bests ? (
              <p className="mt-3 text-sm text-stone-500">Loading…</p>
            ) : bests?.month.best ? (
              <>
                <p className="mt-3 text-lg font-bold text-stone-900 dark:text-stone-50">
                  {bests.month.best.name}
                </p>
                <p className="mt-1 text-sm text-stone-600 dark:text-stone-300">
                  <span className="font-semibold text-amber-800 dark:text-amber-300">
                    {bests.month.best.qty}
                  </span>{" "}
                  sold · {formatInr(bests.month.best.revenue)}
                </p>
              </>
            ) : (
              <p className="mt-3 text-sm text-stone-500 dark:text-stone-400">No sales this month yet.</p>
            )}
          </div>
        </div>
      </section>

      <div className="flex flex-wrap items-end gap-3">
        <label className="text-sm font-medium text-stone-700 dark:text-stone-300">
          From
          <input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="mt-1 block rounded-lg border border-stone-200 px-3 py-2 dark:border-stone-700 dark:bg-stone-900"
          />
        </label>
        <label className="text-sm font-medium text-stone-700 dark:text-stone-300">
          To
          <input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="mt-1 block rounded-lg border border-stone-200 px-3 py-2 dark:border-stone-700 dark:bg-stone-900"
          />
        </label>
        <button
          type="button"
          onClick={() => run()}
          disabled={pending}
          className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
        >
          {pending ? "Loading…" : "Run report"}
        </button>
      </div>
      {err ? <p className="text-sm text-red-600">{err}</p> : null}

      {data ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-stone-200 bg-white p-4 dark:border-stone-800 dark:bg-stone-900">
              <p className="text-sm text-stone-500">Total sales</p>
              <p className="text-2xl font-semibold text-stone-900 dark:text-stone-50">
                {formatInr(data.totalSales)}
              </p>
            </div>
            <div className="rounded-xl border border-stone-200 bg-white p-4 dark:border-stone-800 dark:bg-stone-900">
              <p className="text-sm text-stone-500">Orders</p>
              <p className="text-2xl font-semibold text-stone-900 dark:text-stone-50">
                {data.orderCount}
              </p>
            </div>
          </div>

          <section className="rounded-xl border border-stone-200 bg-white p-4 dark:border-stone-800 dark:bg-stone-900">
            <h2 className="text-lg font-semibold text-stone-900 dark:text-stone-50">By payment</h2>
            <ul className="mt-2 space-y-1 text-sm">
              {paymentRows.map(([k, v]) => (
                <li key={k} className="flex justify-between">
                  <span>{k}</span>
                  <span className="font-medium">{formatInr(v)}</span>
                </li>
              ))}
            </ul>
          </section>

          <section className="rounded-xl border border-stone-200 bg-white p-4 dark:border-stone-800 dark:bg-stone-900">
            <h2 className="text-lg font-semibold text-stone-900 dark:text-stone-50">Top items</h2>
            <div className="mt-2 overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-stone-200 dark:border-stone-700">
                    <th className="py-2 pr-4 font-medium">Item</th>
                    <th className="py-2 pr-4 font-medium">Qty</th>
                    <th className="py-2 font-medium">Revenue</th>
                  </tr>
                </thead>
                <tbody>
                  {data.topItems.map((r) => (
                    <tr key={r.name} className="border-b border-stone-100 dark:border-stone-800">
                      <td className="py-2 pr-4">{r.name}</td>
                      <td className="py-2 pr-4">{r.qty}</td>
                      <td className="py-2">{formatInr(r.revenue)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="rounded-xl border border-stone-200 bg-white p-4 dark:border-stone-800 dark:bg-stone-900">
            <h2 className="text-lg font-semibold text-stone-900 dark:text-stone-50">Recent orders</h2>
            <ul className="mt-2 space-y-2 text-sm">
              {data.orders.map((o) => (
                <li key={o.id} className="flex flex-wrap justify-between gap-2 border-b border-stone-100 pb-2 dark:border-stone-800">
                  <span className="font-medium">{o.orderNumber}</span>
                  <span className="text-stone-500">{new Date(o.createdAt).toLocaleString()}</span>
                  <span>
                    {o.paymentMethod} · {formatInr(o.total)}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        </>
      ) : (
        <p className="text-sm text-stone-500">Choose dates and run report.</p>
      )}
    </div>
  );
}
