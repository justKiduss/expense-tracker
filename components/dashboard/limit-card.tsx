'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { CardHeader } from '@/components/ui/card-header';
import { cn } from '@/lib/utilis';
import { formatCurrency } from '@/lib/format-currency';

type Props = {
  limitCents: number | null;
  spentCents: number;
  daysLeft: number | null; // null for past months
};

export default function LimitCard({ limitCents, spentCents, daysLeft }: Props) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(limitCents === null ? '' : String(limitCents / 100));
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  function save() {
    const trimmed = value.trim();
    let cents: number | null = null; // empty = remove the limit
    if (trimmed !== '') {
      const n = Number(trimmed.replace(/,/g, ''));
      if (!Number.isFinite(n) || n < 0) return setError('Enter a valid amount');
      cents = Math.round(n * 100);
    }
    setError(null);
    start(async () => {
      const res = await fetch('/api/budget', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ monthlyLimit: cents }),
      });
      if (!res.ok) return setError('Could not save');
      setEditing(false);
      router.refresh();
    });
  }

  const pct = limitCents ? Math.min(100, (spentCents / limitCents) * 100) : 0;
  const over = limitCents !== null && spentCents > limitCents;
  const bar = over ? 'bg-rose-500' : pct >= 80 ? 'bg-amber-400' : 'bg-emerald-500';
  const perDay =
    limitCents !== null && daysLeft !== null && daysLeft > 0
      ? Math.round(Math.max(limitCents - spentCents, 0) / daysLeft)
      : 0;

  return (
    <Card>
      <div className="flex items-start justify-between gap-3">
        <CardHeader title="Monthly limit" />
        {!editing && (
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="text-xs text-emerald-400 hover:text-emerald-300"
          >
            {limitCents === null ? 'Set limit' : 'Edit'}
          </button>
        )}
      </div>

      {editing && (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <input
            value={value}
            onChange={(e) => setValue(e.target.value)}
            inputMode="decimal"
            placeholder="Limit (ETB)"
            aria-label="Monthly limit in birr"
            className="w-36 rounded-lg border border-line bg-app px-3 py-2 text-sm text-neutral-100"
          />
          <button
            type="button"
            onClick={save}
            disabled={pending}
            className="rounded-lg bg-emerald-500 px-3 py-2 text-sm font-medium text-neutral-950 hover:bg-emerald-400 disabled:opacity-50"
          >
            {pending ? '...' : 'Save'}
          </button>
          <button
            type="button"
            onClick={() => setEditing(false)}
            className="rounded-lg border border-line px-3 py-2 text-sm text-neutral-300 hover:bg-panel"
          >
            Cancel
          </button>
          {error && <span className="text-xs text-rose-400">{error}</span>}
        </div>
      )}

      {limitCents === null ? (
        !editing && <p className="mt-3 text-sm text-neutral-500">Set a limit to see how much you can still spend.</p>
      ) : (
        <div className="mt-3">
          <div
            className="h-2 overflow-hidden rounded-full bg-neutral-800"
            role="progressbar"
            aria-valuenow={Math.round(pct)}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Monthly limit used"
          >
            <div className={cn('h-full rounded-full', bar)} style={{ width: `${pct}%` }} />
          </div>

          <p className="mt-2 text-sm text-neutral-300">
            Spent ETB {formatCurrency(spentCents)} of {formatCurrency(limitCents)}
          </p>

          {over ? (
            <p className="mt-1 text-sm text-rose-400">Over the limit by ETB {formatCurrency(spentCents - limitCents)}</p>
          ) : daysLeft !== null ? (
            <p className="mt-1 text-sm text-neutral-400">
              ETB {formatCurrency(limitCents - spentCents)} left.{' '}
              <span className="font-medium text-emerald-400">Safe to spend about ETB {formatCurrency(perDay)} per day</span>{' '}
              for the next {daysLeft} day{daysLeft === 1 ? '' : 's'}.
            </p>
          ) : (
            <p className="mt-1 text-sm text-neutral-400">Under the limit by ETB {formatCurrency(limitCents - spentCents)}</p>
          )}
        </div>
      )}
    </Card>
  );
}