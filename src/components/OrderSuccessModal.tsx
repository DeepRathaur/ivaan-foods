"use client";

import { formatInr } from "@/lib/currency";
import { useId } from "react";

type Props = {
  open: boolean;
  orderNumber: string;
  total: number;
  onClose: () => void;
};

export function OrderSuccessModal({ open, orderNumber, total, onClose }: Props) {
  const titleId = useId();
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-stone-950/55 p-4"
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="w-full max-w-sm rounded-2xl border border-emerald-200/80 bg-white p-6 text-center shadow-2xl dark:border-emerald-900/50 dark:bg-stone-900"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
          <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 id={titleId} className="mt-4 text-lg font-semibold text-stone-900 dark:text-stone-50">
          Sale completed
        </h2>
        <p className="mt-2 text-sm text-stone-600 dark:text-stone-400">
          Order <span className="font-mono font-medium text-stone-900 dark:text-stone-200">{orderNumber}</span>
        </p>
        <p className="mt-1 text-base font-semibold text-emerald-800 dark:text-emerald-300">{formatInr(total)}</p>
        <p className="mt-3 text-xs text-stone-500 dark:text-stone-500">Thank you — Ivaan Foods</p>
        <button
          type="button"
          onClick={onClose}
          className="mt-6 w-full rounded-xl bg-stone-900 py-3 text-sm font-semibold text-white transition hover:bg-stone-800 dark:bg-amber-600 dark:hover:bg-amber-500"
        >
          Continue selling
        </button>
      </div>
    </div>
  );
}
