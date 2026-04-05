"use client";

import { formatInr } from "@/lib/currency";
import { downloadEscPosFile, printEscPosOverSerial, type PrintResult } from "@/lib/thermalPrint";
import { useCallback, useId, useState } from "react";

export type ReceiptOrderPayload = {
  order: {
    orderNumber: string;
    createdAt: string;
    paymentMethod: string;
    subtotal: number;
    tax: number;
    discount: number;
    total: number;
    lines: { nameSnap: string; quantity: number; unitPrice: number; lineTotal: number }[];
  };
  store: { name: string; address?: string | null; footer?: string | null };
};

type Props = {
  open: boolean;
  escPosUtf8: string;
  payload: ReceiptOrderPayload;
  /** Sale is already saved; call when user is done (print, download, skip, or dismiss). */
  onFinish: () => void;
};

export function ReceiptPreviewModal({ open, escPosUtf8, payload, onFinish }: Props) {
  const titleId = useId();
  const [printHint, setPrintHint] = useState<string | null>(null);
  const [printing, setPrinting] = useState(false);

  const handleSerialPrint = useCallback(async () => {
    setPrintHint(null);
    setPrinting(true);
    try {
      const r: PrintResult = await printEscPosOverSerial(escPosUtf8);
      if (r.ok) {
        onFinish();
        return;
      }
      if (r.method === "cancelled") {
        setPrintHint("Printing cancelled.");
        return;
      }
      setPrintHint(r.message ?? "Could not print.");
    } finally {
      setPrinting(false);
    }
  }, [escPosUtf8, onFinish]);

  const handleDownload = useCallback(() => {
    setPrintHint(null);
    const r = downloadEscPosFile(escPosUtf8, payload.order.orderNumber);
    if (r.ok) {
      onFinish();
    } else {
      setPrintHint(r.message ?? "Download failed.");
    }
  }, [escPosUtf8, payload.order.orderNumber, onFinish]);

  const handleSkip = useCallback(() => {
    setPrintHint(null);
    onFinish();
  }, [onFinish]);

  if (!open) return null;

  const { order, store } = payload;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-stone-950/60 p-4 sm:items-center sm:p-6"
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onFinish();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="flex max-h-[min(90vh,720px)] w-full max-w-md flex-col overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-2xl dark:border-stone-700 dark:bg-stone-900"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="border-b border-stone-200 px-5 py-4 dark:border-stone-700">
          <h2 id={titleId} className="text-lg font-semibold text-stone-900 dark:text-stone-50">
            Receipt preview
          </h2>
          <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">
            Order saved. Review, then print to your thermal printer (USB Serial) or download raw ESC/POS.
          </p>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-4">
          <div
            className="mx-auto max-w-[280px] rounded-lg border border-amber-200/80 bg-[#faf6ef] p-4 font-mono text-[13px] leading-snug text-stone-900 shadow-inner dark:border-amber-900/40 dark:bg-[#2a2618] dark:text-amber-50"
            style={{ fontFeatureSettings: '"tnum"' }}
          >
            <p className="text-center font-bold">{store.name}</p>
            {store.address ? <p className="mt-1 text-center text-stone-600 dark:text-amber-100/80">{store.address}</p> : null}
            <p className="mt-2 text-center text-stone-500 dark:text-amber-200/70">
              {new Date(order.createdAt).toLocaleString("en-IN")}
            </p>
            <hr className="my-3 border-stone-300 dark:border-amber-900/50" />
            <p className="font-semibold">Order: {order.orderNumber}</p>
            <p className="text-stone-600 dark:text-amber-100/85">Payment: {order.paymentMethod}</p>
            <hr className="my-3 border-stone-300 dark:border-amber-900/50" />
            {order.lines.map((ln, i) => (
              <div key={i} className="mb-2 flex flex-col gap-0.5">
                <span className="font-medium">{ln.nameSnap}</span>
                <span className="flex justify-between text-stone-600 dark:text-amber-100/80">
                  <span>
                    {ln.quantity} × {formatInr(ln.unitPrice)}
                  </span>
                  <span>{formatInr(ln.lineTotal)}</span>
                </span>
              </div>
            ))}
            <hr className="my-3 border-stone-300 dark:border-amber-900/50" />
            <div className="space-y-1 text-stone-700 dark:text-amber-50/95">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>{formatInr(order.subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span>Tax</span>
                <span>{formatInr(order.tax)}</span>
              </div>
              <div className="flex justify-between">
                <span>Discount</span>
                <span>{formatInr(order.discount)}</span>
              </div>
              <div className="flex justify-between border-t border-stone-300 pt-2 font-bold dark:border-amber-900/50">
                <span>Total</span>
                <span>{formatInr(order.total)}</span>
              </div>
            </div>
            {store.footer ? (
              <>
                <hr className="my-3 border-stone-300 dark:border-amber-900/50" />
                <p className="text-center text-stone-600 dark:text-amber-100/80">{store.footer}</p>
              </>
            ) : null}
          </div>
        </div>

        {printHint ? (
          <p className="px-5 pb-2 text-center text-sm text-amber-800 dark:text-amber-200">{printHint}</p>
        ) : null}

        <div className="flex flex-col gap-2 border-t border-stone-200 bg-stone-50 p-4 dark:border-stone-700 dark:bg-stone-950/50">
          <button
            type="button"
            disabled={printing}
            onClick={() => void handleSerialPrint()}
            className="w-full rounded-xl bg-amber-600 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-amber-700 disabled:opacity-60"
          >
            {printing ? "Printing…" : "Print to thermal (USB Serial)"}
          </button>
          <button
            type="button"
            disabled={printing}
            onClick={handleDownload}
            className="w-full rounded-xl border border-stone-300 bg-white py-3 text-sm font-semibold text-stone-800 transition hover:bg-stone-100 dark:border-stone-600 dark:bg-stone-800 dark:text-stone-100 dark:hover:bg-stone-700"
          >
            Download ESC/POS file
          </button>
          <button
            type="button"
            disabled={printing}
            onClick={handleSkip}
            className="w-full rounded-xl py-2.5 text-sm font-medium text-stone-600 hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-200"
          >
            Skip print — done
          </button>
        </div>
      </div>
    </div>
  );
}
