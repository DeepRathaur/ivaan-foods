import { ReportsClient } from "@/components/ReportsClient";

export default function ReportsPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-stone-900 dark:text-stone-50">Reports</h1>
      <p className="mb-6 text-sm text-stone-500 dark:text-stone-400">
        Today and month best sellers load automatically; run a date range for detailed sales (admin only).
      </p>
      <ReportsClient />
    </div>
  );
}
