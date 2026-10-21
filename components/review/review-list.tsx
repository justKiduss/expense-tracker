'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Check } from 'lucide-react';
import { formatCurrency } from '@/lib/format-currency';
import type { ReviewGroup } from '@/lib/services/review.service';

type Props = {
  groups: ReviewGroup[];
  categories: { id: string; name: string }[];
};

export default function ReviewList({ groups, categories }: Props) {
  const router = useRouter();
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [doneKeys, setDoneKeys] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const visible = groups.filter((g) => !doneKeys.includes(g.key));

  async function choose(group: ReviewGroup, categoryId: string) {
    if (!categoryId) return;
    setBusyKey(group.key);
    setError(null);
    try {
      const res = await fetch(`/api/transactions/${group.sampleId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ categoryId, remember: group.remember }),
      });
      if (!res.ok) throw new Error('save failed');
      // Fill every other uncategorised row that matches the saved rule.
      await fetch('/api/category-rules/apply', { method: 'POST' });
      setDoneKeys((keys) => [...keys, group.key]);
      router.refresh();
    } catch {
      setError('Could not save. Please try again.');
    } finally {
      setBusyKey(null);
    }
  }

  if (visible.length === 0) {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-line bg-panel p-5 text-sm text-emerald-400">
        <Check className="size-5" aria-hidden="true" />
        All caught up. Every payment has a category.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {error && <p className="text-sm text-rose-400">{error}</p>}
      {visible.map((g) => (
        <div
          key={g.key}
          className="flex flex-col gap-3 rounded-xl border border-line bg-panel p-4 sm:flex-row sm:items-center sm:justify-between"
        >
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-neutral-100">{g.label}</p>
            <p className="text-xs text-neutral-500">
              {g.count} {g.count === 1 ? 'payment' : 'payments'} · ETB {formatCurrency(g.totalCents)} · last{' '}
              {new Date(g.lastAt).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                timeZone: 'Africa/Addis_Ababa',
              })}
            </p>
            {g.hint && <p className="truncate text-xs text-neutral-600">{g.hint}</p>}
          </div>

          <select
            defaultValue=""
            disabled={busyKey === g.key}
            onChange={(e) => choose(g, e.target.value)}
            className="rounded-lg border border-line bg-app px-3 py-2 text-sm text-neutral-100 disabled:opacity-50"
            aria-label={`Category for ${g.label}`}
          >
            <option value="" disabled>
              Choose category
            </option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      ))}
    </div>
  );
}