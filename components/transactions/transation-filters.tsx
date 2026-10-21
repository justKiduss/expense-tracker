'use client';

import { useRouter } from 'next/navigation';

export default function TransactionsFilters({ month, category }: { month: string; category: string }) {
  const router = useRouter();
  return (
    <label className="text-xs text-neutral-400">
      <span className="mb-1 block">Month</span>
      <input
        key={month}
        type="month"
        defaultValue={month}
        onChange={(e) => e.target.value && router.push(`/transactions?month=${e.target.value}&category=${category}`)}
        className="rounded-lg border border-line bg-app px-3 py-2 text-sm text-neutral-100"
      />
    </label>
  );
}