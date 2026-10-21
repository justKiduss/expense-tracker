'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Check, ChevronDown } from 'lucide-react';
import { formatCurrency } from '@/lib/format-currency';
import { cn } from '@/lib/utilis';
import type { ReviewGroup } from '@/lib/services/review.service';

type Props = {
  groups: ReviewGroup[];
  categories: { id: string; name: string }[];
};

function when(iso: string) {
  return new Date(iso).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: 'Africa/Addis_Ababa',
  });
}

export default function ReviewList({ groups, categories }: Props) {
  const router = useRouter();
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [doneKeys, setDoneKeys] = useState<string[]>([]);
  const [openKeys, setOpenKeys] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const visible = groups.filter((g) => !doneKeys.includes(g.key));

  function toggle(key: string) {
    setOpenKeys((keys) => (keys.includes(key) ? keys.filter((k) => k !== key) : [...keys, key]));
  }

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
        All caught up. Every payment here has a category.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {error && <p className="text-sm text-rose-400">{error}</p>}
      <p className="text-xs text-neutral-500">{visible.length} to sort</p>

      {visible.map((g) => {
        const open = openKeys.includes(g.key);
        return (
          <div key={g.key} className="rounded-xl border border-line bg-panel">
            <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
              <button
                type="button"
                onClick={() => toggle(g.key)}
                aria-expanded={open}
                className="flex min-w-0 items-start gap-2 text-left"
              >
                <ChevronDown
                  className={cn('mt-0.5 size-4 shrink-0 text-neutral-500 transition-transform', open && 'rotate-180')}
                  aria-hidden="true"
                />
                <span className="min-w-0">
                  <span className="block truncate text-sm font-medium text-neutral-100">{g.label}</span>
                  <span className="block text-xs text-neutral-500">
                    {g.kindLabel} · {g.count} {g.count === 1 ? 'payment' : 'payments'} · ETB{' '}
                    {formatCurrency(g.totalCents)} · last {when(g.lastAt)}
                  </span>
                </span>
              </button>

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

            {open && (
              <ul className="border-t border-line px-4 py-2">
                {g.payments.map((p) => (
                  <li key={p.id} className="flex items-baseline justify-between gap-3 py-1.5 text-sm">
                    <span className="min-w-0 truncate text-neutral-300">
                      {when(p.occurredAt)}
                      {p.note && <span className="ml-2 text-xs text-neutral-500">{p.note}</span>}
                    </span>
                    <span className="shrink-0 text-neutral-100">{formatCurrency(p.totalCents)}</span>
                  </li>
                ))}
                {g.count > g.payments.length && (
                  <li className="py-1.5 text-xs text-neutral-500">
                    Showing the latest {g.payments.length} of {g.count}.
                  </li>
                )}
              </ul>
            )}
          </div>
        );
      })}
    </div>
  );
}